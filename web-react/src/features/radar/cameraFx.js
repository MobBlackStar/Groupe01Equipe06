// Module : Holo-Radar 3D WebGL - Effets de Caméra Cinématiques
// Offre un 'Drone Swoop' immersif lors de la sélection d'un restaurant
// avec interpolation fluide sans saccades.

import { MAP_CONFIG } from './mapStyle.js';

/**
 * Déclenche l'effet cinématique 'Drone Swoop' plongeant vers un commerce sélectionné.
 * @param {object} map - Instance MapLibre GL
 * @param {[number, number]} targetCoords - [Longitude, Latitude]
 */
export function droneSwoopToMerchant(map, targetCoords) {
  if (!map) return;

  map.flyTo({
    center: targetCoords,
    zoom: 17.6,
    pitch: 68,
    bearing: 38,
    duration: 2100,
    curve: 1.42,
    essential: true,
  });
}

/**
 * Réinitialise la caméra en vue d'ensemble au-dessus de l'ESSECT Montfleury.
 * @param {object} map - Instance MapLibre GL
 */
export function resetToCampusHome(map) {
  if (!map) return;

  map.flyTo({
    center: MAP_CONFIG.ESSECT_COORDS,
    zoom: MAP_CONFIG.DEFAULT_CAMERA.zoom,
    pitch: MAP_CONFIG.DEFAULT_CAMERA.pitch,
    bearing: MAP_CONFIG.DEFAULT_CAMERA.bearing,
    duration: 1900,
    curve: 1.3,
    essential: true,
  });
}
