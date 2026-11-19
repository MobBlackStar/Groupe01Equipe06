// Module : Holo-Radar 3D WebGL - Circuit des commerces & navigation piétonne sur les RUES réelles
// Esthétique : trait rouge Griddle avec pointillé crème ; le chemin sélectionné est moutarde cerné d'encre.
// Règle d'or : ZÉRO boucle 60fps de setData ! Chaque tracé est calculé une fois puis confié aux calques GPU MapLibre.
// Règle de justesse : un itinéraire suit les rues (OpenStreetMap, profil piéton). Jamais de ligne droite ni de "L" à travers les bâtiments.

import { MAP_CONFIG, isMapReady } from './mapStyle.js';
import { getKnownStreetRoute, getStreetRoute } from './streetRoutes.js';

const CIRCUIT_SRC = 'radar-circuit-src';
const PATH_SRC = 'walking-path-src';

let circuitToken = 0; // invalide les réponses réseau périmées quand la liste des commerces change
let pathToken = 0; // idem quand l'étudiant change de commerce plus vite que le routeur ne répond

const coordsOf = (m) => [m.location?.lng ?? MAP_CONFIG.ESSECT_COORDS[0], m.location?.lat ?? MAP_CONFIG.ESSECT_COORDS[1]];

/** Segments du circuit : ESSECT → 1 → 2 → … → n → ESSECT (ordre = numéros des pastilles). */
function circuitLegs(merchants) {
  const sorted = [...merchants].sort(
    (a, b) => (a.distanceM || a.distanceFromEssectM || 0) - (b.distanceM || b.distanceFromEssectM || 0)
  );
  const legs = [];
  let prev = MAP_CONFIG.ESSECT_COORDS;
  for (const m of sorted) {
    const c = coordsOf(m);
    legs.push([prev, c]);
    prev = c;
  }
  if (sorted.length >= 2) legs.push([prev, MAP_CONFIG.ESSECT_COORDS]);
  return legs;
}

/**
 * Géométrie à dessiner : on retire le 1er et le dernier point (raccords entre l'adresse réelle, souvent à l'intérieur
 * d'un bâtiment, et la chaussée la plus proche). Le tracé commence et finit donc sur la rue, jamais dans un mur.
 */
function drawnCoordinates(route) {
  const c = route.coordinates;
  return c.length > 3 ? c.slice(1, -1) : c;
}

/** Un segment : trait de rue si l'itinéraire est connu, sinon trait "à vol d'oiseau" explicitement distinct. */
function legFeature(from, to, route) {
  return {
    type: 'Feature',
    properties: { kind: route ? 'street' : 'crow' },
    geometry: { type: 'LineString', coordinates: route ? drawnCoordinates(route) : [from, to] },
  };
}

/**
 * Collection GeoJSON du circuit à partir des itinéraires déjà connus (embarqués / cache).
 * @param {Array<object>} merchants
 * @param {Map<string, object|null>} [resolved] itinéraires obtenus en direct (clé "lng,lat>lng,lat")
 */
export function buildCircuitGeoJson(merchants = [], resolved = new Map()) {
  const features = circuitLegs(merchants).map(([from, to]) => {
    const route = getKnownStreetRoute(from, to) || resolved.get(`${from}>${to}`) || null;
    return legFeature(from, to, route);
  });
  return { type: 'FeatureCollection', features };
}

/**
 * Injecte (ou met à jour) le circuit reliant l'ESSECT aux commerces, sur les rues réelles.
 * Les segments inconnus sont routés en direct, puis la source GeoJSON est mise à jour UNE fois.
 * @param {object} map - Instance MapLibre GL
 * @param {Array<object>} merchants
 */
export function setupCircuitRoute(map, merchants = []) {
  if (!isMapReady(map)) return;

  const token = ++circuitToken;
  const resolved = new Map();
  const data = buildCircuitGeoJson(merchants, resolved);

  if (map.getSource(CIRCUIT_SRC)) {
    map.getSource(CIRCUIT_SRC).setData(data);
  } else {
    map.addSource(CIRCUIT_SRC, { type: 'geojson', data });

    const street = ['==', ['get', 'kind'], 'street'];
    const crow = ['==', ['get', 'kind'], 'crow'];
    const roundLine = { 'line-join': 'round', 'line-cap': 'round' };

    map.addLayer({
      id: 'radar-circuit-glow',
      type: 'line',
      source: CIRCUIT_SRC,
      filter: street,
      layout: roundLine,
      paint: { 'line-color': MAP_CONFIG.COLORS.ROUTE_GLOW, 'line-width': 10, 'line-opacity': 0.22, 'line-blur': 5 },
    });
    map.addLayer({
      id: 'radar-circuit-core',
      type: 'line',
      source: CIRCUIT_SRC,
      filter: street,
      layout: roundLine,
      paint: { 'line-color': MAP_CONFIG.COLORS.ROUTE_CORE, 'line-width': 3.5, 'line-opacity': 0.95 },
    });
    map.addLayer({
      id: 'radar-circuit-dash',
      type: 'line',
      source: CIRCUIT_SRC,
      filter: street,
      layout: roundLine,
      paint: { 'line-color': '#FAF3E6', 'line-width': 1.4, 'line-dasharray': [1.5, 3], 'line-opacity': 0.9 },
    });
    // Repli honnête : trait fin pointillé encre « à vol d'oiseau », visuellement distinct d'un vrai itinéraire
    map.addLayer({
      id: 'radar-circuit-crow',
      type: 'line',
      source: CIRCUIT_SRC,
      filter: crow,
      layout: roundLine,
      paint: { 'line-color': '#5E5850', 'line-width': 1.6, 'line-dasharray': [0.6, 2.4], 'line-opacity': 0.8 },
    });
  }

  // Segments pas encore connus : routage en direct, puis une seule mise à jour de la source
  const pending = circuitLegs(merchants).filter(([f, t]) => !getKnownStreetRoute(f, t));
  if (pending.length === 0) return;

  Promise.all(
    pending.map(async ([f, t]) => {
      resolved.set(`${f}>${t}`, await getStreetRoute(f, t));
    })
  ).then(() => {
    if (token !== circuitToken || !map.getSource(CIRCUIT_SRC)) return; // liste de commerces changée entre-temps
    map.getSource(CIRCUIT_SRC).setData(buildCircuitGeoJson(merchants, resolved));
  });
}

/**
 * Trace le chemin piéton réel (par les rues) de l'ESSECT vers le commerce sélectionné.
 * @param {object} map - Instance MapLibre GL
 * @param {[number, number]|null} merchantCoords - [Longitude, Latitude] ou null pour effacer
 * @returns {Promise<{distanceM:number, durationS:number, source:string}|null>} infos de trajet réelles (ou null)
 */
export async function updateWalkingPath(map, merchantCoords) {
  if (!isMapReady(map)) return null;

  const targetGlowId = 'walking-target-glow';
  const targetCaseId = 'walking-target-case';
  const targetCoreId = 'walking-target-core';
  const token = ++pathToken;

  if (!merchantCoords) {
    [targetCoreId, targetCaseId, targetGlowId].forEach((id) => map.getLayer(id) && map.removeLayer(id));
    if (map.getSource(PATH_SRC)) map.removeSource(PATH_SRC);
    return null;
  }

  const from = MAP_CONFIG.ESSECT_COORDS;
  const route = getKnownStreetRoute(from, merchantCoords) || (await getStreetRoute(from, merchantCoords));
  if (token !== pathToken) return null; // un autre commerce a été choisi pendant le calcul

  const data = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { kind: route ? 'street' : 'crow' },
        geometry: { type: 'LineString', coordinates: route ? drawnCoordinates(route) : [from, merchantCoords] },
      },
    ],
  };

  if (map.getSource(PATH_SRC)) {
    map.getSource(PATH_SRC).setData(data);
  } else {
    map.addSource(PATH_SRC, { type: 'geojson', data });
    const roundLine = { 'line-join': 'round', 'line-cap': 'round' };
    map.addLayer({
      id: targetGlowId,
      type: 'line',
      source: PATH_SRC,
      layout: roundLine,
      paint: { 'line-color': MAP_CONFIG.COLORS.ROUTE_GLOW, 'line-width': 16, 'line-opacity': 0.28, 'line-blur': 8 },
    });
    // Cerne encre + cœur moutarde : lisible sur la carte crème et dans le même langage que les stickers
    map.addLayer({
      id: targetCaseId,
      type: 'line',
      source: PATH_SRC,
      layout: roundLine,
      paint: { 'line-color': '#111111', 'line-width': 9 },
    });
    map.addLayer({
      id: targetCoreId,
      type: 'line',
      source: PATH_SRC,
      layout: roundLine,
      paint: { 'line-color': '#FFD000', 'line-width': 5 },
    });
  }

  return route ? { distanceM: route.distanceM, durationS: route.durationS, source: route.source } : null;
}

/**
 * Tracé de rue (sans les raccords dans les bâtiments) de l'ESSECT vers un commerce, pour le mode Marcher.
 * @param {[number, number]} merchantCoords - [Longitude, Latitude]
 * @returns {Promise<{coordinates: Array<[number, number]>, distanceM: number|null, durationS: number|null}|null>}
 */
export async function getWalkRoute(merchantCoords) {
  const from = MAP_CONFIG.ESSECT_COORDS;
  const route = getKnownStreetRoute(from, merchantCoords) || (await getStreetRoute(from, merchantCoords));
  if (!route || !route.coordinates || route.coordinates.length < 2) return null;
  return { coordinates: drawnCoordinates(route), distanceM: route.distanceM ?? null, durationS: route.durationS ?? null };
}
