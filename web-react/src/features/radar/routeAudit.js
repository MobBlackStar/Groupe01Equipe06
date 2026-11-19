// 💡 Concept & Analogie : Comme un huissier qui mesure au mètre près que le tracé du GPS passe bien sur la chaussée et jamais dans un immeuble, cet audit compare chaque itinéraire aux routes et bâtiments que la carte affiche.
// 🔄 Comparaison React / Flutter : Outil de contrôle qualité (hook de développement), comme le test GPU↔CPU de la carte WebGPU : on prouve l'exactitude par un chiffre, pas à l'œil.
// 🎯 À retenir pour la soutenance : "Chaque itinéraire embarqué est vérifié contre les données de la carte : distance à la route la plus proche et longueur traversant des bâtiments."

import PRECOMPUTED from './streetRoutes.data.json';
import { MAP_CONFIG } from './mapStyle.js';
import { loadWorld } from './world/worldLayer.js';

const M_PER_DEG = 111320;
const NON_WALKABLE = new Set(['rail', 'transit', 'ferry', 'aerialway', 'motorway_junction']);

/** Projection locale en mètres autour de l'ESSECT (suffisante sur 2 km). */
function makeProjector() {
  const [lng0, lat0] = MAP_CONFIG.ESSECT_COORDS;
  const k = Math.cos((lat0 * Math.PI) / 180);
  return ([lng, lat]) => [(lng - lng0) * M_PER_DEG * k, (lat - lat0) * M_PER_DEG];
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const CELL = 30; // m : grille de hachage spatial pour les segments de route
const cellKey = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;

function lineParts(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
}

/**
 * Audite les itinéraires embarqués contre les routes et bâtiments chargés par la carte.
 * La carte doit être zoomée (>= 14,5) et centrée sur la zone, tuiles chargées (`idle`).
 * @param {object} map - Instance MapLibre GL
 * @returns {object} rapport chiffré
 */
export async function auditRoutes(map) {
  if (map.getZoom() < 14.5) return { error: 'zoom >= 14.5 requis pour que les bâtiments soient chargés' };
  const proj = makeProjector();

  // ---- routes dessinées par la carte (en mètres), indexées par cellule
  const grid = new Map();
  let roadSegments = 0;
  const addSeg = (a, b) => {
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);
    for (let cx = Math.floor(minX / CELL); cx <= Math.floor(maxX / CELL); cx++) {
      for (let cy = Math.floor(minY / CELL); cy <= Math.floor(maxY / CELL); cy++) {
        const k = `${cx},${cy}`;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push([a[0], a[1], b[0], b[1]]);
      }
    }
    roadSegments += 1;
  };
  const roadPolys = []; // places piétonnes (surfaces) : tout point à l'intérieur est « sur la voie »
  for (const f of map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' })) {
    if (NON_WALKABLE.has(f.properties?.class)) continue;
    const isArea = f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon';
    for (const part of lineParts(f.geometry)) {
      const pts = part.map(proj);
      for (let i = 0; i < pts.length - 1; i++) addSeg(pts[i], pts[i + 1]);
      if (isArea) roadPolys.push(pts);
    }
  }

  // ---- bâtiments (anneaux extérieurs en mètres) + boîte englobante
  // Bâtiments : le monde pré-calculé (Overture, ~11 000 empreintes) ; à défaut, ceux des tuiles de la carte
  const buildings = [];
  let buildingSource = 'tuiles';
  let buildingFeatures = null;
  try {
    buildingFeatures = (await loadWorld()).buildings.features;
    buildingSource = 'monde pré-calculé (Overture)';
  } catch {
    buildingFeatures = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' });
  }
  for (const f of buildingFeatures) {
    const polys = f.geometry?.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry?.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    for (const poly of polys) {
      const ring = poly[0].map(proj);
      const xs = ring.map((p) => p[0]);
      const ys = ring.map((p) => p[1]);
      buildings.push({ ring, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) });
    }
  }
  const insideBuilding = (x, y) => buildings.some((b) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY && pointInRing(x, y, b.ring));

  const distToRoad = (x, y) => {
    if (roadPolys.some((poly) => pointInRing(x, y, poly))) return 0;
    let best = Infinity;
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const s of grid.get(`${cx + dx},${cy + dy}`) || []) best = Math.min(best, distToSegment(x, y, s[0], s[1], s[2], s[3]));
      }
    }
    return best;
  };

  // ---- audit de chaque itinéraire
  const names = Object.entries(PRECOMPUTED.routes);
  let vertexCount = 0;
  let within3 = 0;
  let within6 = 0;
  let maxDist = 0;
  let streetLenM = 0;
  let streetInBuildingM = 0;
  let connectorInBuildingM = 0;
  const offenders = [];

  for (const [key, route] of names) {
    const pts = route.c.map(proj);
    let routeInside = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      // sommets du tracé de rue (le 1er et le dernier point sont les extrémités réelles : raccords)
      const d = distToRoad(pts[i][0], pts[i][1]);
      vertexCount += 1;
      if (d <= 3) within3 += 1;
      if (d <= 6) within6 += 1;
      if (Number.isFinite(d)) maxDist = Math.max(maxDist, d);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(1, Math.round(len / 2));
      let inside = 0;
      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        if (insideBuilding(ax + (bx - ax) * t, ay + (by - ay) * t)) inside += 1;
      }
      const insideM = (inside / steps) * len;
      const isConnector = i === 0 || i === pts.length - 2;
      if (isConnector) connectorInBuildingM += insideM;
      else {
        streetInBuildingM += insideM;
        routeInside += insideM;
      }
      if (!isConnector) streetLenM += len;
    }
    if (routeInside > 1) offenders.push({ route: key.slice(0, 40), metersInsideBuildings: Math.round(routeInside) });
  }

  const pct = (n) => (vertexCount ? Math.round((n / vertexCount) * 1000) / 10 : null);
  return {
    routes: names.length,
    buildingSource,
    buildingsLoaded: buildings.length,
    roadSegmentsLoaded: roadSegments,
    streetVertices: vertexCount,
    pctVerticesWithin3mOfARoad: pct(within3),
    pctVerticesWithin6mOfARoad: pct(within6),
    maxVertexDistanceToRoadM: Math.round(maxDist * 10) / 10,
    streetRouteLengthM: Math.round(streetLenM),
    streetMetersInsideBuildings: Math.round(streetInBuildingM * 10) / 10,
    pctStreetInsideBuildings: streetLenM ? Math.round((streetInBuildingM / streetLenM) * 10000) / 100 : null,
    hiddenConnectorMetersInsideBuildings: Math.round(connectorInBuildingM * 10) / 10,
    routesCrossingBuildings: offenders.length,
    worst: offenders.sort((a, b) => b.metersInsideBuildings - a.metersInsideBuildings).slice(0, 5),
  };
}
