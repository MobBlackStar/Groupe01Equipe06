// 💡 Concept & Analogie : Comme un vol de drone de cinéma qui plonge en piqué au-dessus des toits pour cadrer un point d'intérêt précis, cet effet de caméra cinématique offre une immersion 3D spectaculaire.
// 🔄 Comparaison React / Flutter : Utilise la méthode `flyTo` native de MapLibre avec courbes d'accélération bézier ; sur mobile Flutter, un `AnimatedMapController` gère la transition de zoom.
// 🎯 À retenir pour la soutenance : "Le 'Drone Swoop' (zoom 18, pitch 70°, bearing 40°) sublime la démonstration devant le jury en transformant une simple consultation en une expérience visuelle mémorable."
// Module : Holo-Radar 3D WebGL

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
    zoom: 17.8,
    pitch: 70,
    bearing: 42,
    duration: 2200,
    curve: 1.6,
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
    zoom: 16,
    pitch: 60,
    bearing: -20,
    duration: 2000,
    essential: true,
  });
}
