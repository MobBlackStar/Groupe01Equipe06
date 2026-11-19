// 💡 Concept & Analogie : Comme un maquettiste qui pose, sur le plan du quartier, des immeubles, des arbres et des pelouses déjà découpés à l'avance, ce module monte la maquette de Montfleury à partir d'un fichier pré-calculé.
// 🔄 Comparaison React / Flutter : Données figées au build (script `scripts/build-world.py`) puis chargées à la demande (import dynamique, comme un `lazy()` React) : zéro appel réseau en plus à l'exécution.
// 🎯 À retenir pour la soutenance : "Les empreintes de bâtiments viennent d'Overture Maps (données ouvertes) ; les hauteurs sont estimées de façon déterministe, donc la carte est annoncée comme stylisée."

import maplibregl from 'maplibre-gl';
import { MAP_CONFIG, isMapReady, griddleUrgencyColor } from '../mapStyle.js';
import { createWorld3DLayer, WORLD3D_LAYER_ID } from '../world3d/world3dLayer.js';

export const WORLD_SRC = 'world-buildings-src';
const TREES_SRC = 'world-trees-src';
const TRUNKS_SRC = 'world-trunks-src';
const GREEN_SRC = 'world-green-src';

export const WORLD_LAYERS = {
  green: 'world-green',
  buildings: 'world-buildings',
  canopy: 'world-canopy',
  trunks: 'world-trunks',
};

const M_LAT = 111320;
const states = new WeakMap();
let worldPromise = null;

/** Pseudo-aléa déterministe (le même arbre est toujours au même endroit, de la même taille). */
const frac = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Transforme le fichier pré-calculé (décimètres autour de l'ESSECT) en GeoJSON longitude/latitude. */
function buildWorld(data) {
  const [lng0, lat0] = data.origin;
  const mLng = M_LAT * Math.cos((lat0 * Math.PI) / 180);
  const toLL = (xDm, yDm) => [Number((lng0 + xDm / 10 / mLng).toFixed(7)), Number((lat0 + yDm / 10 / M_LAT).toFixed(7))];
  const ringLL = (flat) => {
    const ring = [];
    for (let i = 0; i < flat.length; i += 2) ring.push(toLL(flat[i], flat[i + 1]));
    ring.push(ring[0]);
    return ring;
  };

  const shadowFeatures = [];
  const buildings = data.buildings.map((b, i) => {
    const ring = ringLL(b.r);
    shadowFeatures.push({ id: i, geometry: { type: 'Polygon', coordinates: [ring] }, properties: { render_height: b.h } });
    return { type: 'Feature', id: i, properties: { h: b.h, k: b.k, u: b.u }, geometry: { type: 'Polygon', coordinates: [ring] } };
  });

  const green = data.green.map((g) => ({
    type: 'Feature',
    properties: { k: g.k },
    geometry: { type: 'Polygon', coordinates: [ringLL(g.r)] },
  }));

  const canopies = [];
  const trunks = [];
  const polygonAround = (cxM, cyM, rM, sides, phase) => {
    const ring = [];
    for (let s = 0; s < sides; s++) {
      const a = phase + (s / sides) * Math.PI * 2;
      ring.push(toLL((cxM + rM * Math.cos(a)) * 10, (cyM + rM * Math.sin(a)) * 10));
    }
    ring.push(ring[0]);
    return [ring];
  };
  data.trees.forEach(([xDm, yDm], i) => {
    const cx = xDm / 10;
    const cy = yDm / 10;
    const u = frac(i + xDm * 0.37);
    const radius = 2.8 + 1.9 * u; // 2,8 à 4,7 m
    const height = 6.2 + 4.2 * frac(i * 1.7 + yDm * 0.11);
    canopies.push({
      type: 'Feature',
      properties: { u, top: height, base: 2.4 },
      geometry: { type: 'Polygon', coordinates: polygonAround(cx, cy, radius, 8, u * 3) },
    });
    trunks.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: polygonAround(cx, cy, 0.32, 5, 0) } });
  });

  const fc = (features) => ({ type: 'FeatureCollection', features });
  return {
    raw: data,
    source: data.source,
    heights: data.heights,
    counts: { buildings: buildings.length, trees: canopies.length, green: green.length },
    buildings: fc(buildings),
    green: fc(green),
    canopies: fc(canopies),
    trunks: fc(trunks),
    shadowFeatures,
  };
}

/** Charge (une seule fois) le monde pré-calculé. Chunk séparé : le téléchargement n'a lieu qu'à l'ouverture du radar. */
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = import('./worldData.json').then((m) => buildWorld(m.default)).catch((e) => {
      worldPromise = null;
      throw e;
    });
  }
  return worldPromise;
}

const palette = (a, b) => ['interpolate', ['linear'], ['get', 'u'], 0, a, 1, b];

function firstLayerIdWhere(map, predicate) {
  const layers = map.getStyle().layers || [];
  const hit = layers.find(predicate);
  return hit ? hit.id : undefined;
}

function addLayers(map, world) {
  const labelId = firstLayerIdWhere(map, (l) => l.type === 'symbol' && l.layout && l.layout['text-field']);
  const roadId = firstLayerIdWhere(map, (l) => l['source-layer'] === 'transportation');

  if (!map.getSource(GREEN_SRC)) map.addSource(GREEN_SRC, { type: 'geojson', data: world.green });
  if (!map.getSource(WORLD_SRC)) map.addSource(WORLD_SRC, { type: 'geojson', data: world.buildings });
  if (!map.getSource(TREES_SRC)) map.addSource(TREES_SRC, { type: 'geojson', data: world.canopies });
  if (!map.getSource(TRUNKS_SRC)) map.addSource(TRUNKS_SRC, { type: 'geojson', data: world.trunks });

  // Pelouses et bois : SOUS les routes pour que les chaussées restent lisibles
  if (!map.getLayer(WORLD_LAYERS.green)) {
    map.addLayer(
      {
        id: WORLD_LAYERS.green,
        type: 'fill',
        source: GREEN_SRC,
        paint: {
          'fill-color': ['match', ['get', 'k'], 'wood', '#C3D79B', 'pitch', '#CFE3B4', '#DCE6BC'],
          'fill-opacity': 0.9,
        },
      },
      roadId
    );
  }

  if (!map.getLayer(WORLD_LAYERS.buildings)) {
    map.addLayer(
      {
        id: WORLD_LAYERS.buildings,
        type: 'fill-extrusion',
        source: WORLD_SRC,
        minzoom: 14,
        paint: {
          // Teinte par catégorie (habitat sable, institutions terre cuite, annexes grisées) + variation par bâtiment
          'fill-extrusion-color': [
            'match',
            ['get', 'k'],
            0, palette('#FFF6E3', '#F5E2BE'),
            1, palette('#F6D2BC', '#EBB39A'),
            2, palette('#EDE5D3', '#DFD3BB'),
            palette('#F6E9CF', '#E6D1A9'),
          ],
          'fill-extrusion-vertical-gradient': true,
          'fill-extrusion-opacity': 0.97,
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.2, ['get', 'h']],
          'fill-extrusion-base': 0,
        },
      },
      labelId
    );
  }

  if (!map.getLayer(WORLD_LAYERS.trunks)) {
    map.addLayer(
      {
        id: WORLD_LAYERS.trunks,
        type: 'fill-extrusion',
        source: TRUNKS_SRC,
        minzoom: 16.3,
        paint: { 'fill-extrusion-color': '#7C5D3B', 'fill-extrusion-height': 2.6, 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.95 },
      },
      labelId
    );
  }

  if (!map.getLayer(WORLD_LAYERS.canopy)) {
    map.addLayer(
      {
        id: WORLD_LAYERS.canopy,
        type: 'fill-extrusion',
        source: TREES_SRC,
        minzoom: 15.4,
        paint: {
          'fill-extrusion-color': palette('#8DB06B', '#B9CB7E'),
          'fill-extrusion-vertical-gradient': true,
          'fill-extrusion-height': ['get', 'top'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0.96,
        },
      },
      labelId
    );
  }

  // La couche de bâtiments des tuiles (hauteurs OSM rares) cède la place au monde pré-calculé
  if (map.getLayer('3d-buildings')) map.setLayoutProperty('3d-buildings', 'visibility', 'none');
}

/**
 * Remplace les volumes simples (extrusions MapLibre) par le calque WebGL2 : façades, feuillage, oiseaux, balises.
 * Si WebGL2 ou les shaders échouent, les volumes simples restent affichés.
 */
function addWorld3D(map, world, st) {
  // Sous les piliers de balises et sous les textes (les piliers sont posés avant que ce calque asynchrone n'arrive)
  const labelId = firstLayerIdWhere(
    map,
    (l) => l.id === 'essect-pillar-layer' || l.id === 'merchant-beacons-layer' || (l.type === 'symbol' && l.layout && l.layout['text-field'])
  );
  const w3d = createWorld3DLayer(maplibregl, world.raw);
  try {
    map.addLayer(w3d.layer, labelId);
  } catch (e) {
    console.warn('[Radar] Ajout du calque 3D impossible :', e);
    return;
  }
  if (!w3d.ok) {
    if (map.getLayer(WORLD3D_LAYER_ID)) map.removeLayer(WORLD3D_LAYER_ID);
    return;
  }
  st.w3d = w3d;
  world.w3dActive = true; // atmosphere.js : plus d'ombres en polygones, la carte d'ombres GPU prend le relais
  map.getContainer().classList.add('cs-w3d'); // le calque porte sa propre brume : le voile CSS s'allège
  softenPillars(map);
  [WORLD_LAYERS.buildings, WORLD_LAYERS.canopy, WORLD_LAYERS.trunks].forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
  });
  if (st.pendingBeacons) w3d.setBeacons(st.pendingBeacons);
}

/**
 * Les piliers « boîtes » de MapLibre deviennent quasi invisibles (mais restent cliquables) : les colonnes de lumière du
 * calque WebGL2 prennent le relais.
 */
function softenPillars(map) {
  ['essect-pillar-layer', 'merchant-beacons-layer'].forEach((id) => {
    if (map.getLayer(id)) map.setPaintProperty(id, 'fill-extrusion-opacity', 0.02);
  });
}

/** Balises lumineuses des commerces (appelable avant que le calque soit prêt). */
export function setWorldBeacons(map, merchants) {
  const st = states.get(map);
  if (!st) return;
  const list = (merchants || [])
    .filter((m) => m.location && Number.isFinite(m.location.lng) && Number.isFinite(m.location.lat))
    .map((m) => ({ lng: m.location.lng, lat: m.location.lat, color: griddleUrgencyColor(m.beaconUrgencyColor), height: 85 }));
  // Le campus : colonne rouge Griddle, plus haute (repère de la scène)
  list.unshift({ lng: MAP_CONFIG.ESSECT_COORDS[0], lat: MAP_CONFIG.ESSECT_COORDS[1], color: '#DA0711', height: 120 });
  st.pendingBeacons = list;
  if (st.w3d) {
    st.w3d.setBeacons(list);
    softenPillars(map);
  }
}

/**
 * Pose le monde pré-calculé sur la carte (idempotent, asynchrone).
 * @param {object} map - Instance MapLibre GL (style chargé)
 * @returns {Promise<object|null>} le monde chargé, ou null si indisponible (la carte garde alors les bâtiments des tuiles)
 */
export function applyWorld(map) {
  if (!isMapReady(map)) return Promise.resolve(null);
  let st = states.get(map);
  if (st && st.promise) return st.promise;
  st = { promise: null, world: null };
  states.set(map, st);
  st.promise = loadWorld()
    .then((world) => {
      if (!isMapReady(map)) return null; // carte détruite entre-temps
      addLayers(map, world);
      addWorld3D(map, world, st);
      st.world = world;
      return world;
    })
    .catch((e) => {
      console.warn('[Radar] Monde 3D pré-calculé indisponible, bâtiments des tuiles conservés :', e);
      states.delete(map);
      return null;
    });
  return st.promise;
}

/** Pour le contrôle qualité : volumes posés sur la carte. */
export function worldStats(map) {
  const st = states.get(map);
  if (!st || !st.world) return null;
  return { ...st.world.counts, heights: st.world.heights, source: st.world.source, renderer: st.w3d ? st.w3d.stats() : 'extrusions MapLibre' };
}

/** Le calque WebGL2 de cette carte (ou null s'il n'est pas actif). */
export function getWorld3D(map) {
  const st = states.get(map);
  return st && st.w3d ? st.w3d : null;
}
