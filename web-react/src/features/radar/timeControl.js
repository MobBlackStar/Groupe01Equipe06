// 💡 Concept & Analogie : Comme le variateur d'un projecteur de théâtre qui commande en même temps la lumière, les ombres et la couleur du ciel, cette fonction applique une heure à toute la scène d'un seul geste.
// 🔄 Comparaison React / Flutter : Un « contrôleur » sans interface : le composant React lui passe l'heure choisie, il met à jour le moteur 3D, la lumière MapLibre et les variables CSS (comme un `ThemeData` Flutter qui change tout l'habillage).
// 🎯 À retenir pour la soutenance : "Une seule source de vérité pour l'heure : le soleil de Tunis calculé astronomiquement ; ombres, air, fenêtres et ciel en découlent."

import { mapSun } from './sun.js';
import { sunAtMinutes, paletteFor } from './world3d/timeOfDay.js';
import { setAtmosphereSun } from './atmosphere.js';
import { getWorld3D } from './world/worldLayer.js';

/**
 * Applique une heure à la carte.
 * @param {object} map - Instance MapLibre GL
 * @param {number|null} minutes - minutes depuis minuit (heure de Tunis), ou null = « maintenant » (lumière dorée lisible la nuit)
 * @returns {{ sun: object, palette: object }|null}
 */
export function applyTimeOfDay(map, minutes) {
  if (!map) return null;
  const sun = minutes == null ? mapSun() : sunAtMinutes(minutes);

  // Lumière MapLibre des volumes restants (balises, barrière) : jamais sous l'horizon, la lune éclaire du côté opposé
  const light =
    sun.altitudeDeg < 0
      ? { azimuthDeg: (sun.azimuthDeg + 180) % 360, altitudeDeg: 38, real: true }
      : { azimuthDeg: sun.azimuthDeg, altitudeDeg: Math.max(12, sun.altitudeDeg), real: sun.real };
  setAtmosphereSun(map, light);

  const w3d = getWorld3D(map);
  const palette = w3d ? w3d.setSun(sun.azimuthDeg, sun.altitudeDeg, sun.real) : paletteFor(sun.altitudeDeg);
  // couleur de la brume d'horizon (CSS) : crème le jour, rose au coucher, bleu nuit
  map.getContainer().style.setProperty('--sky-rgb', palette.sky.join(' '));
  return { sun, palette };
}
