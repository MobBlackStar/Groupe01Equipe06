// 💡 Concept & Analogie : Comme le géomètre qui lit une adresse GPS collée depuis un autre plan, vérifie qu'elle est dans le périmètre et trouve la porte donnant sur la rue la plus proche, ce module fait trois choses : comprendre des coordonnées, juger leur éligibilité, les accrocher à la rue.
// 🔄 Comparaison React / Flutter : Fonctions pures partagées (aucune dépendance) : le site web (SpotEditor) les importe via `@shared/spot.js` ; elles se portent telles quelles en Dart.
// 🎯 À retenir pour la soutenance : "Le collage de coordonnées Google Maps (lat, lng ou lien @lat,lng) est analysé sans réseau ; la règle des 3 km vient de la constante unique BUSINESS_RULES, jamais d'un nombre écrit en dur."

import { BUSINESS_RULES } from './constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from './geo.js';

const M_PER_DEG_LAT = 111320;
const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)';

const inRange = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Comprend des coordonnées collées : « 36.7875, 10.1758 », « 36.7875 10.1758 », ou un lien Google Maps
 * (`@lat,lng,17z`, `!3dlat!4dlng`, `?q=lat,lng`, `ll=lat,lng`). Renvoie null si rien d'exploitable.
 * @param {string} input
 * @returns {{lat:number, lng:number}|null}
 */
export function parseCoordinates(input) {
  if (typeof input !== 'string') return null;
  let text = input.trim();
  if (!text) return null;
  try {
    text = decodeURIComponent(text);
  } catch {
    /* texte non encodé : on garde tel quel */
  }

  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`), // lien « place » : coordonnées exactes du lieu (prioritaire sur @, qui est la vue)
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(`[?&](?:q|ll|query|center|destination)=${NUM}\\s*,\\s*${NUM}`),
    new RegExp(`^\\s*${NUM}\\s*[,;]\\s*${NUM}\\s*$`),
    new RegExp(`^\\s*${NUM}\\s+${NUM}\\s*$`),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (inRange(lat, lng)) return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }
  return null;
}

/**
 * Jugement d'éligibilité d'un emplacement : distance à l'ESSECT, temps à pied, respect du rayon (3 km).
 * @returns {{distanceM:number, walkingMinutes:number, withinRadius:boolean, maxM:number, overByM:number}}
 */
export function assessSpot(lat, lng) {
  const maxM = BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS;
  const distanceM = Math.round(distanceFromEssect(lat, lng));
  return {
    distanceM,
    walkingMinutes: calculateWalkingMinutes(distanceM),
    withinRadius: distanceM <= maxM,
    maxM,
    overByM: Math.max(0, distanceM - maxM),
  };
}

/**
 * Accroche un point à la voie la plus proche (« porte sur la rue ») parmi les axes de voies pré-calculés.
 * @param {{lat:number, lng:number}} point
 * @param {Array<{k:number, r:number[]}>} roads - axes en décimètres est/nord par rapport à `origin` (voir worldData.json)
 * @param {[number, number]} origin - [lng, lat] de référence des coordonnées de `roads`
 * @param {number} [maxSnapM] - au-delà, aucune voie n'est considérée proche
 * @returns {{lat:number, lng:number, distM:number, roadClass:number}|null}
 */
export function snapToRoads(point, roads, origin, maxSnapM = 250) {
  if (!point || !Array.isArray(roads) || !origin) return null;
  const mLng = M_PER_DEG_LAT * Math.cos((origin[1] * Math.PI) / 180);
  const px = (point.lng - origin[0]) * mLng;
  const py = (point.lat - origin[1]) * M_PER_DEG_LAT;

  let best = null;
  for (const road of roads) {
    const r = road.r;
    for (let i = 0; i + 3 < r.length; i += 2) {
      const ax = r[i] / 10;
      const ay = r[i + 1] / 10;
      const bx = r[i + 2] / 10;
      const by = r[i + 3] / 10;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const cx = ax + t * dx;
      const cy = ay + t * dy;
      const d = Math.hypot(px - cx, py - cy);
      if (!best || d < best.d) best = { d, cx, cy, k: road.k };
    }
  }
  if (!best || best.d > maxSnapM) return null;
  return {
    lat: Number((origin[1] + best.cy / M_PER_DEG_LAT).toFixed(6)),
    lng: Number((origin[0] + best.cx / mLng).toFixed(6)),
    distM: Math.round(best.d),
    roadClass: best.k,
  };
}
