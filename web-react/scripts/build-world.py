"""
Bake the 3D world around ESSECT / Montfleury into one compact JSON file.

Source : Overture Maps (open data; buildings merge OpenStreetMap + Microsoft ML + Google Open Buildings; the base theme
         carries land use and ESA WorldCover-derived land cover). Nothing is fetched at runtime.
Output : src/features/radar/world/worldData.json  (coordinates = decimetres east/north of the ESSECT pin)

Usage  : python -m venv .venv && .venv/Scripts/python -m pip install duckdb shapely
         .venv/Scripts/python scripts/build-world.py [release]
Heights: Overture rarely has them here, so they are ESTIMATED deterministically (footprint area + kind + seeded jitter).
         The UI labels the map as stylised accordingly.
"""
import json, math, os, sys, hashlib
import duckdb

REL = sys.argv[1] if len(sys.argv) > 1 else "2026-11-18.0"
LNG0, LAT0 = 10.1748, 36.7871
RADIUS_M = 1800
M_LAT = 111320.0
M_LNG = M_LAT * math.cos(math.radians(LAT0))
dlng, dlat = RADIUS_M / M_LNG, RADIUS_M / M_LAT
W, E, S, N = LNG0 - dlng, LNG0 + dlng, LAT0 - dlat, LAT0 + dlat
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "features", "radar", "world", "worldData.json")

con = duckdb.connect()
con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2'; SET geometry_always_xy=true;")
TOL = 0.0000045  # about 0.5 m simplification


def src(theme, typ):
    return f"read_parquet('s3://overturemaps-us-west-2/release/{REL}/theme={theme}/type={typ}/*', hive_partitioning=1)"


BOX = f"bbox.xmin > {W} AND bbox.xmax < {E} AND bbox.ymin > {S} AND bbox.ymax < {N}"


def to_dm(lng, lat):
    return [round((lng - LNG0) * M_LNG * 10), round((lat - LAT0) * M_LAT * 10)]


def ring_dm(ring):
    out = []
    for x, y in ring:
        p = to_dm(x, y)
        if not out or p != out[-1]:
            out.append(p)
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    return out


def area_m2(pts_dm):
    a = 0.0
    for i in range(len(pts_dm)):
        x1, y1 = pts_dm[i]
        x2, y2 = pts_dm[(i + 1) % len(pts_dm)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2 / 100.0  # dm^2 -> m^2


def seeded(pts):
    h = hashlib.md5(json.dumps(pts[:3]).encode()).digest()
    return int.from_bytes(h[:4], "big") / 0xFFFFFFFF


def estimate_height(area, subtype, klass, height, floors, u):
    if height:
        return round(float(height), 1), "real"
    if floors:
        return round(float(floors) * 3.2 + 1, 1), "floors"
    jitter = 0.85 + 0.3 * u
    if klass in ("roof", "garage", "shed", "carport", "greenhouse", "parking"):
        base = 3.0
    elif klass == "mosque" or subtype == "religious":
        base = 11.0
    elif subtype in ("education", "medical"):
        base = 12.0
    elif klass == "apartments":
        base = 19.0
    elif klass == "house":
        base = 6.5
    elif area < 35:
        base = 3.4
    elif area < 110:
        base = 6.5
    elif area < 300:
        base = 10.0
    elif area < 800:
        base = 14.5
    else:
        base = 11.0  # very large footprints are usually halls or warehouses, not towers
    return round(max(3.0, base * jitter), 1), "est"


def polys_of(geo):
    return geo["coordinates"] if geo["type"] == "MultiPolygon" else [geo["coordinates"]]


# ---- buildings ---------------------------------------------------------------------------------------
rows = con.execute(
    f"""SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, {TOL})) g, height, num_floors, subtype, class
        FROM {src('buildings', 'building')} WHERE {BOX}"""
).fetchall()
KIND = {"res": 0, "civic": 1, "shed": 2, "other": 3}
buildings, real_h, est_h = [], 0, 0
for g, height, floors, subtype, klass in rows:
    for poly in polys_of(json.loads(g)):
        outer = ring_dm(poly[0])
        if len(outer) < 3:
            continue
        a = area_m2(outer)
        if a < 9:  # slivers nobody will see
            continue
        cx = sum(p[0] for p in outer) / len(outer) / 10
        cy = sum(p[1] for p in outer) / len(outer) / 10
        if cx * cx + cy * cy > RADIUS_M * RADIUS_M:  # bounding-box corners fall outside the circle
            continue
        u = seeded(outer)
        h, how = estimate_height(a, subtype, klass, height, floors, u)
        if how == "est":
            est_h += 1
        else:
            real_h += 1
        if subtype in ("education", "medical", "religious", "civic", "entertainment"):
            kind = KIND["civic"]
        elif klass in ("roof", "garage", "shed", "carport") or h <= 3.6:
            kind = KIND["shed"]
        elif subtype == "residential" or a < 300:
            kind = KIND["res"]
        else:
            kind = KIND["other"]
        buildings.append({"r": [c for p in outer for c in p], "h": h, "k": kind, "u": round(u, 3)})

# ---- roads are authoritative: drop satellite-detected footprints that a mapped road runs through ---------------------
# Overture's ML footprints can sit a few metres off. A building cannot stand on a road, so any footprint crossed by more
# than ROAD_CROSS_M of road centreline is removed. This keeps walking routes (which follow OSM roads) out of walls.
from shapely.geometry import Polygon, Point, LineString
from shapely.strtree import STRtree

IGNORED_ROAD = {"steps", "track", "unknown", "driveway", "parking_aisle", "alley"}
ROAD_CROSS_M = 4.0
seg_rows = con.execute(
    f"""SELECT ST_AsGeoJSON(geometry), class FROM {src('transportation', 'segment')}
        WHERE {BOX} AND subtype = 'road'"""
).fetchall()
road_lines = []
for g, klass in seg_rows:
    if klass in IGNORED_ROAD:
        continue
    geo = json.loads(g)
    parts = geo["coordinates"] if geo["type"] == "MultiLineString" else [geo["coordinates"]]
    for coords in parts:
        pts = [((x - LNG0) * M_LNG, (y - LAT0) * M_LAT) for x, y in coords]
        if len(pts) >= 2:
            road_lines.append(LineString(pts))
road_tree = STRtree(road_lines)
kept, dropped = [], 0
for b in buildings:
    poly = Polygon([(b["r"][i] / 10, b["r"][i + 1] / 10) for i in range(0, len(b["r"]), 2)])
    if not poly.is_valid:
        poly = poly.buffer(0)
    crossed = 0.0
    for idx in road_tree.query(poly):
        crossed += road_lines[idx].intersection(poly).length
    if crossed > ROAD_CROSS_M:
        dropped += 1
    else:
        kept.append(b)
buildings = kept
print(f"road clean-up: dropped {dropped} footprints crossed by a road, kept {len(buildings)}")

# Same rule for the walking routes bundled with the app (src/features/radar/streetRoutes.data.json): routes are drawn from
# OSRM on the OSM road network; a footprint they cross by more than 1 m is a misplaced detection, not a wall.
ROUTES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "features", "radar", "streetRoutes.data.json")
if os.path.exists(ROUTES_FILE):
    with open(ROUTES_FILE, encoding="utf-8") as rf:
        routes = json.load(rf)["routes"]
    route_lines = []
    for r in routes.values():
        pts = [((x - LNG0) * M_LNG, (y - LAT0) * M_LAT) for x, y in r["c"][1:-1]]  # connectors are never drawn
        if len(pts) >= 2:
            route_lines.append(LineString(pts))
    route_tree = STRtree(route_lines)
    kept, dropped_r = [], 0
    for b in buildings:
        poly = Polygon([(b["r"][i] / 10, b["r"][i + 1] / 10) for i in range(0, len(b["r"]), 2)])
        if not poly.is_valid:
            poly = poly.buffer(0)
        crossed = sum(route_lines[idx].intersection(poly).length for idx in route_tree.query(poly))
        if crossed > 1.0:
            dropped_r += 1
        else:
            kept.append(b)
    buildings = kept
    print(f"route clean-up: dropped {dropped_r} footprints crossed by a bundled walking route, kept {len(buildings)}")

# ---- green areas (land use + ESA-derived land cover) -----------------------------------------------------
GREEN_USE = {"park", "garden", "grass", "recreation", "pitch", "village_green", "horticulture", "managed", "playground", "cemetery"}
green = []


def add_green(g, kind):
    for poly in polys_of(json.loads(g)):
        ring = ring_dm(poly[0])
        if len(ring) >= 3 and area_m2(ring) > 40:
            green.append({"r": [c for p in ring for c in p], "k": kind})


for g, subtype, klass in con.execute(
    f"""SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, {TOL})), subtype, class
        FROM {src('base', 'land_use')} WHERE {BOX}"""
).fetchall():
    if subtype in GREEN_USE or klass in GREEN_USE:
        add_green(g, "pitch" if klass == "pitch" else "park")

cover_counts = {}
for g, subtype in con.execute(
    f"""SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, {TOL})), subtype
        FROM {src('base', 'land_cover')} WHERE {BOX}"""
).fetchall():
    cover_counts[subtype] = cover_counts.get(subtype, 0) + 1
    if subtype in ("forest", "shrub", "grass", "wetland", "mangrove"):
        add_green(g, "wood" if subtype in ("forest", "mangrove") else "park")

# ---- individually mapped trees (rare) ---------------------------------------------------------------------
trees = []
for g, subtype in con.execute(
    f"SELECT ST_AsGeoJSON(geometry), subtype FROM {src('base', 'land')} WHERE {BOX} AND subtype = 'tree'"
).fetchall():
    geo = json.loads(g)
    if geo["type"] == "Point":
        trees.append(to_dm(*geo["coordinates"]))
    elif geo["type"] == "LineString":
        trees.extend(to_dm(x, y) for x, y in geo["coordinates"])

# ---- street trees (procedural, deterministic) ---------------------------------------------------------------
# Real tree data is almost absent here, so trees are planted along streets and inside green areas. Seeded by position:
# the same run always yields the same trees. Never placed inside a building.
SIDE_CLASSES = {"residential": 15, "tertiary": 13, "secondary": 13, "primary": 14, "unclassified": 16, "living_street": 14,
                "pedestrian": 18, "service": 0, "footway": 0}
MAX_TREES = 9000
bpolys = [Polygon([(r["r"][i] / 10, r["r"][i + 1] / 10) for i in range(0, len(r["r"]), 2)]).buffer(1.5) for r in buildings]
bpolys = [p for p in bpolys if p.is_valid and not p.is_empty]
btree = STRtree(bpolys)


def free(x, y):
    pt = Point(x, y)
    return not any(bpolys[i].contains(pt) for i in btree.query(pt))


def hash01(x, y, salt):
    return int.from_bytes(hashlib.md5(f"{round(x)}:{round(y)}:{salt}".encode()).digest()[:4], "big") / 0xFFFFFFFF


auto_trees = []
for g, klass in seg_rows:
    spacing = SIDE_CLASSES.get(klass, 0)
    if not spacing:
        continue
    geo = json.loads(g)
    lines = geo["coordinates"] if geo["type"] == "MultiLineString" else [geo["coordinates"]]
    for coords in lines:
        pts = [((x - LNG0) * M_LNG, (y - LAT0) * M_LAT) for x, y in coords]
        line = LineString(pts)
        if line.length < 12:
            continue
        d, side = spacing / 2.0, 1
        while d < line.length - 3:
            a, b = line.interpolate(d), line.interpolate(min(line.length, d + 1))
            dx, dy = b.x - a.x, b.y - a.y
            n = math.hypot(dx, dy) or 1.0
            off = 5.5 + 2.0 * hash01(a.x, a.y, "off")
            x, y = a.x - dy / n * off * side, a.y + dx / n * off * side
            if hash01(x, y, "keep") < 0.78 and free(x, y) and x * x + y * y < RADIUS_M * RADIUS_M:
                auto_trees.append([round(x * 10), round(y * 10)])
            d += spacing * (0.85 + 0.3 * hash01(a.x, a.y, "gap"))
            side = -side

# trees inside green areas: jittered grid, ~one per 90 m2
for gr in green:
    pts = [(gr["r"][i] / 10, gr["r"][i + 1] / 10) for i in range(0, len(gr["r"]), 2)]
    poly = Polygon(pts)
    if not poly.is_valid or poly.is_empty or gr["k"] == "pitch":
        continue
    minx, miny, maxx, maxy = poly.bounds
    gx = minx
    while gx < maxx:
        gy = miny
        while gy < maxy:
            x, y = gx + 4 * hash01(gx, gy, "jx"), gy + 4 * hash01(gx, gy, "jy")
            if poly.contains(Point(x, y)) and free(x, y) and hash01(x, y, "gk") < (0.7 if gr["k"] == "wood" else 0.35):
                auto_trees.append([round(x * 10), round(y * 10)])
            gy += 9.5
        gx += 9.5

if len(auto_trees) > MAX_TREES:  # keep a stable, evenly spread subset
    auto_trees = sorted(auto_trees, key=lambda p: hash01(p[0], p[1], "cap"))[:MAX_TREES]
trees.extend(auto_trees)

data = {
    "origin": [LNG0, LAT0],
    "radiusM": RADIUS_M,
    "source": f"Overture Maps {REL} (open data: OpenStreetMap, Microsoft ML Buildings, Google Open Buildings, ESA WorldCover)",
    "unit": "decimetres east/north of origin",
    "heights": {"real": real_h, "estimated": est_h},
    "buildings": buildings,
    "green": green,
    "trees": trees,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, separators=(",", ":"))
print(
    f"buildings={len(buildings)} (real/floor heights {real_h}, estimated {est_h}) green={len(green)} "
    f"mappedTrees={len(trees)} landCover={cover_counts} -> {os.path.getsize(OUT) / 1024:.0f} KB"
)
