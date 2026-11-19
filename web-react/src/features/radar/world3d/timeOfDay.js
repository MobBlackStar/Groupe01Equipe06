// 💡 Concept & Analogie : Comme un éclairagiste de théâtre qui fait glisser le soleil du matin au soir en changeant la couleur des projecteurs, ce module transforme une heure (« 18:30 ») en direction du soleil et en palette de lumière (aube rose, midi doré, nuit bleue).
// 🔄 Comparaison React / Flutter : Fonctions pures sans état, comme un `ColorTween` Flutter : on lui donne une valeur (la hauteur du soleil) et il renvoie des couleurs interpolées.
// 🎯 À retenir pour la soutenance : "Le sélecteur d'heure déplace le vrai soleil de Tunis : les ombres, la couleur de l'air et les fenêtres allumées suivent, sans aucune image."

import { sunPosition } from '../sun.js';

const LAT = 36.7871;
const LNG = 10.1748;
const TUNIS_UTC_OFFSET_H = 1; // Tunisie : UTC+1 toute l'année

/**
 * Soleil réel de Tunis à l'heure locale choisie (aujourd'hui).
 * @param {number} minutes - minutes depuis minuit, heure de Tunis (0..1439)
 * @param {Date} [day]
 * @returns {{ azimuthDeg: number, altitudeDeg: number, real: true }}
 */
export function sunAtMinutes(minutes, day = new Date()) {
  const date = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, minutes - TUNIS_UTC_OFFSET_H * 60));
  const s = sunPosition(date, LAT, LNG);
  return { azimuthDeg: s.azimuthDeg, altitudeDeg: s.altitudeDeg, real: true };
}

/** Minutes locales (Tunis) de l'instant présent. */
export function nowMinutes(date = new Date()) {
  return (date.getUTCHours() * 60 + date.getUTCMinutes() + TUNIS_UTC_OFFSET_H * 60 + 1440) % 1440;
}

export function formatClock(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Points clés selon la hauteur du soleil (degrés) : nuit, crépuscule, coucher/lever, heure dorée, plein jour.
// sun = lumière directe (linéaire) ; amb = ciel ; ground = rebond ; fog = brume ; tint = filtre multiplicatif du fond de carte ;
// sky = couleur CSS de la brume d'horizon.
const KEYS = [
  { alt: -9, sun: [0.07, 0.10, 0.24], amb: [0.045, 0.06, 0.15], ground: [0.04, 0.045, 0.08], fog: [0.040, 0.050, 0.110], tint: [0.30, 0.36, 0.60], sky: [30, 40, 78] },
  { alt: -2, sun: [0.55, 0.28, 0.30], amb: [0.15, 0.13, 0.26], ground: [0.16, 0.11, 0.14], fog: [0.40, 0.27, 0.31], tint: [0.78, 0.66, 0.74], sky: [226, 164, 152] },
  { alt: 5, sun: [1.05, 0.52, 0.28], amb: [0.22, 0.22, 0.34], ground: [0.30, 0.21, 0.16], fog: [0.80, 0.55, 0.42], tint: [1.0, 0.86, 0.78], sky: [250, 206, 172] },
  { alt: 14, sun: [1.16, 0.82, 0.54], amb: [0.28, 0.31, 0.44], ground: [0.36, 0.27, 0.19], fog: [0.92, 0.77, 0.62], tint: [1.0, 0.95, 0.88], sky: [252, 228, 196] },
  { alt: 38, sun: [1.10, 0.95, 0.76], amb: [0.30, 0.37, 0.50], ground: [0.36, 0.30, 0.22], fog: [0.956, 0.893, 0.79], tint: [1, 1, 1], sky: [250, 243, 230] },
];

const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Palette de lumière pour une hauteur de soleil.
 * @param {number} altitudeDeg
 */
export function paletteFor(altitudeDeg) {
  const a = Math.max(KEYS[0].alt, Math.min(KEYS[KEYS.length - 1].alt, altitudeDeg));
  let i = 0;
  while (i < KEYS.length - 2 && a > KEYS[i + 1].alt) i++;
  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const t = smooth(0, 1, (a - k0.alt) / (k1.alt - k0.alt));
  return {
    sun: mix3(k0.sun, k1.sun, t),
    amb: mix3(k0.amb, k1.amb, t),
    ground: mix3(k0.ground, k1.ground, t),
    fog: mix3(k0.fog, k1.fog, t),
    tint: mix3(k0.tint, k1.tint, t),
    sky: mix3(k0.sky, k1.sky, t).map(Math.round),
    night: smooth(6, -3, altitudeDeg), // fenêtres allumées : 0 le jour, 1 la nuit
    dayness: smooth(-4, 14, altitudeDeg),
  };
}

/**
 * Direction de la lumière qui projette les ombres : le soleil, ou la lune (opposée, haute) quand le soleil est couché.
 * La hauteur est bornée à 9° au minimum pour que les ombres du matin et du soir restent de longueur raisonnable.
 */
export function lightDirection(sun) {
  const alt = sun.altitudeDeg;
  const moon = alt < 0;
  const az = ((moon ? sun.azimuthDeg + 180 : sun.azimuthDeg) * Math.PI) / 180;
  const el = ((moon ? 38 : Math.max(9, alt)) * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.cos(az) * Math.cos(el), Math.sin(el)];
}

/**
 * Moments clés du jour pour la date donnée (lever, midi solaire, coucher), cherchés sur le vrai soleil de Tunis.
 * Les raccourcis du sélecteur en découlent : « Doré » est toujours une heure de lumière rasante, en novembre comme en juillet.
 * @returns {{ sunrise: number, noon: number, sunset: number, presets: Array<{label:string, minutes:number}> }}
 */
export function daySchedule(day = new Date()) {
  let sunrise = 6 * 60;
  let sunset = 18 * 60;
  let noon = 13 * 60;
  let best = -90;
  let prev = sunAtMinutes(0, day).altitudeDeg;
  for (let m = 5; m < 1440; m += 5) {
    const alt = sunAtMinutes(m, day).altitudeDeg;
    if (prev <= 0 && alt > 0) sunrise = m;
    if (prev > 0 && alt <= 0) sunset = m;
    if (alt > best) {
      best = alt;
      noon = m;
    }
    prev = alt;
  }
  const clampDay = (v) => Math.max(0, Math.min(1439, v));
  return {
    sunrise,
    noon,
    sunset,
    presets: [
      { label: 'Aube', minutes: clampDay(sunrise + 25) },
      { label: 'Midi', minutes: noon },
      { label: 'Doré', minutes: clampDay(sunset - 55) },
      { label: 'Nuit', minutes: clampDay(sunset + 110) },
    ],
  };
}
