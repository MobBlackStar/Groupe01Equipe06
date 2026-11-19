// 💡 Concept & Analogie : Comme un photographe qui attend la « golden hour » pour que les ombres soient longues et lisibles, ce module donne la vraie position du soleil au-dessus de Montfleury, et une lumière de fin d'après-midi quand le soleil est couché.
// 🔄 Comparaison React / Flutter : Calcul astronomique pur (aucune dépendance), identique en Dart ; MapLibre ne connaît que `azimuth` et `hauteur` pour éclairer les façades.
// 🎯 À retenir pour la soutenance : "Les ombres du Holo-Radar sont celles du vrai soleil de Tunis à l'heure courante ; la nuit, une lumière dorée de fin de journée garde la carte lisible."

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397;

const toDays = (date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;

/**
 * Position du soleil (algorithme de Jean Meeus simplifié, précision ~0,1°).
 * @param {Date} date
 * @param {number} lat degrés
 * @param {number} lng degrés
 * @returns {{ azimuthDeg: number, altitudeDeg: number }} azimut mesuré depuis le NORD, sens horaire (0 = nord, 90 = est)
 */
export function sunPosition(date, lat, lng) {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);

  const M = RAD * (357.5291 + 0.98560028 * d); // anomalie moyenne
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI; // longitude écliptique
  const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(OBLIQUITY), Math.cos(L));
  const H = RAD * (280.16 + 360.9856235 * d) - lw - ra; // angle horaire

  const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const azFromSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));

  return {
    azimuthDeg: (azFromSouth / RAD + 180 + 360) % 360,
    altitudeDeg: altitude / RAD,
  };
}

const GOLDEN_HOUR = { azimuthDeg: 232, altitudeDeg: 27 }; // sud-ouest, bas : ombres longues vers le nord-est

/**
 * Soleil utilisé pour éclairer la carte : le vrai s'il est assez haut (>= 9°), sinon une lumière dorée fixe.
 * On borne la hauteur à 12° minimum pour que les ombres restent de longueur raisonnable.
 * @param {Date} [date]
 * @param {number} [lat]
 * @param {number} [lng]
 * @returns {{ azimuthDeg: number, altitudeDeg: number, real: boolean }}
 */
export function mapSun(date = new Date(), lat = 36.7871, lng = 10.1748) {
  const real = sunPosition(date, lat, lng);
  if (real.altitudeDeg >= 9) {
    return { azimuthDeg: real.azimuthDeg, altitudeDeg: Math.max(12, real.altitudeDeg), real: true };
  }
  return { ...GOLDEN_HOUR, real: false };
}
