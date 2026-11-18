// Module : Holo-Radar 3D WebGL - Glowing Circuit & Walking Navigation
// Esthétique : Tracé néon orange vibrant (#FF5500) avec halo diffus façon Griddlecar (image6.png)
// Règle d'or : ZÉRO boucle 60fps de setData ! Les calques GPU MapLibre assurent la fluidité sans saturer le bus CPU-GPU.

import { MAP_CONFIG } from './mapStyle.js';

/**
 * Génère un chemin urbain façon grille (Manhattan / rues de Montfleury) entre deux points
 * pour éviter les lignes obliques coupant les pâtés de maisons de manière irréaliste.
 */
function createGridStepPath(start, end) {
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  // Point intermédiaire en angle droit pour suivre les axes de Montfleury
  const midLng = lng2;
  const midLat = lat1;

  return [
    [lng1, lat1],
    [midLng, midLat],
    [lng2, lat2],
  ];
}

/**
 * Construit la collection GeoJSON du circuit complet reliant l'ESSECT à tous les commerces.
 * @param {Array<object>} merchants
 */
export function buildCircuitGeoJson(merchants = []) {
  const essect = MAP_CONFIG.ESSECT_COORDS;
  const lines = [];

  // Trie les commerces par distance pour tracer un circuit cohérent
  const sorted = [...merchants].sort(
    (a, b) => (a.distanceM || a.distanceFromEssectM || 0) - (b.distanceM || b.distanceFromEssectM || 0)
  );

  let prevPoint = essect;
  for (const m of sorted) {
    const coords = [m.location?.lng ?? essect[0], m.location?.lat ?? essect[1]];
    const segment = createGridStepPath(prevPoint, coords);
    lines.push(segment);
    prevPoint = coords;
  }

  // Boucle de fermeture vers l'ESSECT si au moins 2 commerces
  if (sorted.length >= 2) {
    lines.push(createGridStepPath(prevPoint, essect));
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { role: 'circuit-glow' },
        geometry: {
          type: 'MultiLineString',
          coordinates: lines,
        },
      },
    ],
  };
}

/**
 * Configure et injecte les calques du circuit néon orange reliant l'ESSECT aux commerces.
 * @param {object} map - Instance MapLibre GL
 * @param {Array<object>} merchants
 */
export function setupCircuitRoute(map, merchants = []) {
  if (!map || !map.isStyleLoaded()) return;

  const sourceId = 'radar-circuit-src';
  const glowLayerId = 'radar-circuit-glow';
  const coreLayerId = 'radar-circuit-core';
  const dashLayerId = 'radar-circuit-dash';

  const data = buildCircuitGeoJson(merchants);

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data,
  });

  // 1. Halo lumineux diffus orange (#FF5500)
  map.addLayer({
    id: glowLayerId,
    type: 'line',
    source: sourceId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': MAP_CONFIG.COLORS.ROUTE_GLOW,
      'line-width': 10,
      'line-opacity': 0.35,
      'line-blur': 6,
    },
  });

  // 2. Trait néon intermédiaire
  map.addLayer({
    id: coreLayerId,
    type: 'line',
    source: sourceId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': MAP_CONFIG.COLORS.ROUTE_CORE,
      'line-width': 3.5,
      'line-opacity': 0.95,
    },
  });

  // 3. Filet pointillé central pour le look télémétrie de navigation
  map.addLayer({
    id: dashLayerId,
    type: 'line',
    source: sourceId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 1.5,
      'line-dasharray': [1.5, 3],
      'line-opacity': 0.8,
    },
  });
}

/**
 * Trace le chemin piéton ciblé directement vers le commerce sélectionné.
 * @param {object} map - Instance MapLibre GL
 * @param {[number, number]|null} merchantCoords - [Longitude, Latitude] ou null
 */
export function updateWalkingPath(map, merchantCoords) {
  if (!map || !map.isStyleLoaded()) return;

  const sourceId = 'walking-path-src';
  const targetGlowId = 'walking-target-glow';
  const targetCoreId = 'walking-target-core';

  if (!merchantCoords) {
    if (map.getLayer(targetCoreId)) map.removeLayer(targetCoreId);
    if (map.getLayer(targetGlowId)) map.removeLayer(targetGlowId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }

  const pathCoords = createGridStepPath(MAP_CONFIG.ESSECT_COORDS, merchantCoords);

  const lineGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: pathCoords,
        },
      },
    ],
  };

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(lineGeoJson);
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: lineGeoJson,
    });

    // Halo d'accentuation haute intensité
    map.addLayer({
      id: targetGlowId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#FF3300',
        'line-width': 14,
        'line-opacity': 0.5,
        'line-blur': 8,
      },
    });

    // Ligne directrice blanche et or
    map.addLayer({
      id: targetCoreId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#FFD700',
        'line-width': 4,
        'line-opacity': 1.0,
      },
    });
  }
}
