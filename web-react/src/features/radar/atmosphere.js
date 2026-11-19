// 💡 Concept & Analogie : Comme un décorateur de cinéma qui pose la lumière, les ombres portées et une brume d'horizon pour que le décor ait du relief, ce module habille la carte 3D sans toucher aux données.
// 🔄 Comparaison React / Flutter : Les techniques viennent du rendu WebGPU (ombres recalculées seulement quand la donnée change, assombrissement de contact, brume par distance) adaptées à MapLibre, qui reste un moteur WebGL fermé.
// 🎯 À retenir pour la soutenance : "Les ombres sont de vraies ombres de soleil projetées depuis les empreintes OpenStreetMap, calculées une fois par chargement de tuiles (jamais par image), donc zéro coût au repos."

import { mapSun } from './sun.js';
import { MAP_CONFIG, isMapReady } from './mapStyle.js';
import { WORLD_SRC, WORLD_LAYERS } from './world/worldLayer.js';

const SHADOW_SRC = 'radar-shadows-src';
const SHADOW_LAYER = 'radar-shadows';
const AO_LAYER = 'radar-contact-ao';

const M_PER_DEG = 111320;
const MAX_SHADOW_M = 90; // un gratte-ciel ne projette pas une ombre infinie
const MAX_RADIUS_M = 1800; // autour de l'ESSECT : au-delà, personne ne regarde (= rayon du monde pré-calculé)
const MAX_BUILDINGS = 20000;
const MIN_HEIGHT_M = 3;

const states = new WeakMap();

// ---------------------------------------------------------------------------------------------
// Géométrie
// ---------------------------------------------------------------------------------------------

/** Enveloppe convexe (Andrew, chaîne monotone). Invariante par mise à l'échelle des axes : on reste en degrés. */
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Anneaux extérieurs d'une géométrie Polygon / MultiPolygon. */
function outerRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((poly) => poly[0]);
  return [];
}

/**
 * Ombre portée d'un bâtiment : enveloppe de l'empreinte et de sa copie décalée à l'opposé du soleil.
 * Longueur = hauteur / tan(hauteur du soleil), bornée.
 */
function shadowPolygons(feature, sun) {
  const height = Number(feature.properties?.render_height) || 8;
  if (height < MIN_HEIGHT_M) return [];
  const lengthM = Math.min(height / Math.tan((sun.altitudeDeg * Math.PI) / 180), MAX_SHADOW_M);
  const az = (sun.azimuthDeg * Math.PI) / 180;
  const dxM = -Math.sin(az) * lengthM; // est
  const dyM = -Math.cos(az) * lengthM; // nord

  const out = [];
  for (const ring of outerRings(feature.geometry)) {
    if (!ring || ring.length < 4) continue;
    const latRad = (ring[0][1] * Math.PI) / 180;
    const dLng = dxM / (M_PER_DEG * Math.cos(latRad));
    const dLat = dyM / M_PER_DEG;
    const pts = [];
    for (let i = 0; i < ring.length - 1; i++) {
      pts.push(ring[i], [ring[i][0] + dLng, ring[i][1] + dLat]);
    }
    const hull = convexHull(pts);
    if (hull.length >= 3) out.push([...hull, hull[0]]);
  }
  return out;
}

function featureKey(feature) {
  const ring = outerRings(feature.geometry)[0];
  const c = ring && ring[0] ? `${ring[0][0].toFixed(6)},${ring[0][1].toFixed(6)}` : 'x';
  return `${feature.id ?? ''}|${c}|${feature.properties?.render_height ?? ''}`;
}

function withinRadius(feature) {
  const ring = outerRings(feature.geometry)[0];
  if (!ring || !ring[0]) return false;
  const [lng0, lat0] = MAP_CONFIG.ESSECT_COORDS;
  const dx = (ring[0][0] - lng0) * M_PER_DEG * Math.cos((lat0 * Math.PI) / 180);
  const dy = (ring[0][1] - lat0) * M_PER_DEG;
  return dx * dx + dy * dy <= MAX_RADIUS_M * MAX_RADIUS_M;
}

// ---------------------------------------------------------------------------------------------
// Lumière, ombres, contact
// ---------------------------------------------------------------------------------------------

function applyLight(map, sun) {
  // position = [rayon, azimut (d'où vient la lumière), angle polaire depuis le zénith]
  map.setLight({
    anchor: 'map',
    color: sun.real ? '#FFE7C2' : '#FFDFAE',
    intensity: 0.62,
    position: [1.5, sun.azimuthDeg, 90 - sun.altitudeDeg],
  });
}

function ensureLayers(map, st) {
  const before = map.getLayer(WORLD_LAYERS.buildings) ? WORLD_LAYERS.buildings : map.getLayer('3d-buildings') ? '3d-buildings' : undefined;

  // Contact AO : halo flou au pied de chaque bâtiment (équivalent du « contact darkening » analytique, sans calcul CPU)
  const aoSource = st.world ? WORLD_SRC : 'openmaptiles';
  if (!map.getLayer(AO_LAYER) && map.getSource(aoSource)) {
    const layer = {
      id: AO_LAYER,
      type: 'line',
      source: aoSource,
      minzoom: 14.5,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': '#5E4B31',
        'line-opacity': 0.26,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14.5, 2, 17, 9],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 14.5, 2, 17, 7],
      },
    };
    if (!st.world) layer['source-layer'] = 'building';
    map.addLayer(layer, before);
  }

  // Ombres portées : un polygone par bâtiment, translucide (les routes restent lisibles dessous)
  if (!map.getSource(SHADOW_SRC)) {
    map.addSource(SHADOW_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer(SHADOW_LAYER)) {
    map.addLayer(
      {
        id: SHADOW_LAYER,
        type: 'fill',
        source: SHADOW_SRC,
        layout: { visibility: st.world && st.world.w3dActive ? 'none' : 'visible' }, // le calque WebGL2 projette de vraies ombres
        paint: { 'fill-color': '#4A3A24', 'fill-opacity': 0.22, 'fill-antialias': true },
      },
      before
    );
  }
}

/** Calcule les ombres des bâtiments nouvellement chargés (cache : un bâtiment n'est traité qu'une fois). */
function refreshShadows(map, st) {
  if (st.world && st.world.w3dActive) return; // ombres calculées par la carte d'ombres GPU : rien à faire ici
  if (!map.getSource(SHADOW_SRC)) return;
  if (st.world && st.worldDone) return; // données pré-calculées : une seule passe suffit
  if (!st.world && (!map.getSource('openmaptiles') || map.getZoom() < 14.5)) return;

  let added = 0;
  const features = st.world ? st.world.shadowFeatures : map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' });
  for (const f of features) {
    if (st.cache.size >= MAX_BUILDINGS) break;
    if (f.properties?.hide_3d === true || f.properties?.hide_3d === 'true') continue;
    const key = featureKey(f);
    if (st.cache.has(key)) continue;
    if (!withinRadius(f)) {
      st.cache.set(key, []); // mémorisé : inutile de le retester
      continue;
    }
    st.cache.set(key, shadowPolygons(f, st.sun));
    added += 1;
  }

  if (added > 0 || st.dirty) {
    const polys = [];
    st.cache.forEach((list) => list.forEach((ring) => polys.push(ring)));
    map.getSource(SHADOW_SRC).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'MultiPolygon', coordinates: polys.map((ring) => [ring]) },
    });
    st.dirty = false;
    st.shadowCount = polys.length;
  }
  if (st.world) st.worldDone = true;
}

// ---------------------------------------------------------------------------------------------
// Brume d'horizon + lueur du soleil (calque HTML, mis à jour uniquement quand la caméra tourne/penche)
// ---------------------------------------------------------------------------------------------

function mountHaze(map, st) {
  const el = document.createElement('div');
  el.className = 'cs-map-haze';
  el.setAttribute('aria-hidden', 'true');
  map.getContainer().appendChild(el);

  const update = () => {
    const pitch = map.getPitch();
    const tilt = Math.min(1, pitch / 62);
    // Écart entre la direction du soleil et la direction du regard : 0 = soleil en face
    const rel = ((st.sun.azimuthDeg - map.getBearing() + 540) % 360) - 180;
    const glowX = 50 + Math.max(-65, Math.min(65, rel * 0.9));
    const glowO = Math.max(0, 1 - Math.abs(rel) / 115) * tilt;
    el.style.setProperty('--haze', (0.3 + 0.7 * tilt).toFixed(3));
    el.style.setProperty('--glow-x', `${glowX.toFixed(1)}%`);
    el.style.setProperty('--glow-o', glowO.toFixed(3));
  };
  map.on('pitch', update);
  map.on('rotate', update);
  update();
  st.hazeEl = el;
  st.updateHaze = update;
}

// ---------------------------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------------------------

/**
 * Habille la carte : lumière du soleil, ombres portées, contact darkening, brume. Idempotent.
 * @param {object} map - Instance MapLibre GL (style chargé)
 * @param {object} [world] - Monde pré-calculé (worldLayer) : ombres et contact calculés dessus plutôt que sur les tuiles
 */
export function applyAtmosphere(map, world) {
  if (!isMapReady(map)) return;

  let st = states.get(map);
  if (!st) {
    st = { sun: mapSun(), cache: new Map(), dirty: true, timer: null, shadowCount: 0, hazeEl: null, world: null, worldDone: false };
    states.set(map, st);

    const schedule = () => {
      clearTimeout(st.timer);
      st.timer = setTimeout(() => refreshShadows(map, st), 350); // regroupe les rafales d'événements de tuiles
    };
    map.on('moveend', schedule);
    map.on('sourcedata', (e) => {
      if (e.sourceId === 'openmaptiles' && e.isSourceLoaded) schedule();
    });
    mountHaze(map, st);
  }

  if (world && !st.world) {
    st.world = world;
    st.cache.clear(); // ombres des tuiles remplacées par celles du monde pré-calculé
    st.dirty = true;
  }
  applyLight(map, st.sun);
  ensureLayers(map, st);
  refreshShadows(map, st);
}

/** Pour le contrôle qualité (hook dev) : état courant de l'atmosphère. */
export function atmosphereStats(map) {
  const st = states.get(map);
  return st ? { sun: st.sun, shadows: st.shadowCount, cached: st.cache.size } : null;
}

/**
 * Change le soleil après coup (sélecteur d'heure) : lumière MapLibre des volumes restants et lueur de la brume.
 * @param {object} map
 * @param {{azimuthDeg:number, altitudeDeg:number, real:boolean}} sun - déjà borné (jamais sous l'horizon)
 */
export function setAtmosphereSun(map, sun) {
  const st = states.get(map);
  if (!st) return;
  st.sun = sun;
  try {
    applyLight(map, sun);
  } catch {
    /* style pas encore prêt : la lumière sera posée au prochain applyAtmosphere */
  }
  if (st.updateHaze) st.updateHaze();
}
