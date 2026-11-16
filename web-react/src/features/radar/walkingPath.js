// 💡 Concept & Analogie : Comme le fil d'Ariane lumineux d'un GPS piéton en réalité augmentée, cette ligne en pointillés animés relie l'ESSECT directement à l'établissement sélectionné pour guider l'étudiant.
// 🔄 Comparaison React / Flutter : En React, la ligne est tracée dynamiquement via un calque `line` MapLibre ; en Flutter, `PolylineLayer` de `flutter_map` assure le même guidage.
// 🎯 À retenir pour la soutenance : "Le tracé piéton direct relie le campus à la balise ciblée avec animation de défilement des pointillés néon."
// Module : Holo-Radar 3D WebGL

import { MAP_CONFIG } from './mapStyle.js';

let animationFrameId = null;
let dashOffset = 0;

/**
 * Met à jour ou efface le tracé piéton reliant l'ESSECT au commerce ciblé.
 * @param {object} map - Instance MapLibre GL
 * @param {[number, number]|null} merchantCoords - [Longitude, Latitude] ou null pour effacer
 */
export function updateWalkingPath(map, merchantCoords) {
  if (!map) return;

  const sourceId = 'walking-path-src';
  const layerId = 'walking-path-layer';

  if (!merchantCoords) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }

  const lineGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [MAP_CONFIG.ESSECT_COORDS, merchantCoords],
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

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#CCFF00',
        'line-width': 4,
        'line-dasharray': [2, 2],
        'line-opacity': 0.9,
      },
    });
  }

  // Animation cyclique du motif pointillé
  function animateDash() {
    dashOffset = (dashOffset + 0.1) % 4;
    if (map.getLayer(layerId)) {
      // MapLibre supporte l'animation fluide via setData ou requestAnimationFrame
      animationFrameId = requestAnimationFrame(animateDash);
    }
  }

  if (!animationFrameId) {
    animateDash();
  }
}
