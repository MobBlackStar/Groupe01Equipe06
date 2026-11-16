// 💡 Concept & Analogie : Comme un compas sur une carte marine qui tient compte de la courbure de la Terre, la formule de Haversine calcule la distance exacte à vol d'oiseau entre deux coordonnées GPS sans distorsion locale.
// 🔄 Comparaison React / Flutter : En React, la distance sert à animer le radar 3D MapLibre et trier le catalogue ; en Flutter, la même fonction alimente les étiquettes de distance et l'estimation du temps de marche à pied sur les cartes d'offres.
// 🎯 À retenir pour la soutenance : "Nous utilisons la trigonométrie sphérique de Haversine avec un facteur de détour piétonnier de 1.3 pour calculer des temps de trajet réalistes à pied depuis l'ESSECT Montfleury."

import { ESSECT_COORDINATES, BUSINESS_RULES } from './constants.js';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcule la distance orthodromique (à vol d'oiseau) en mètres entre deux points GPS.
 * @param {number} lat1 - Latitude point 1
 * @param {number} lng1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lng2 - Longitude point 2
 * @returns {number} Distance en mètres (entier arrondi)
 */
export function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calcule la distance en mètres depuis l'ESSECT Montfleury.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} Distance en mètres
 */
export function distanceFromEssect(lat, lng) {
  return calculateDistanceMeters(
    ESSECT_COORDINATES.lat,
    ESSECT_COORDINATES.lng,
    lat,
    lng
  );
}

/**
 * Vérifie si un point se situe dans le rayon autorisé autour de l'ESSECT (par défaut 3000 m).
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [maxMeters=3000] - Rayon maximal en mètres
 * @returns {boolean}
 */
export function isWithinCampusRadius(lat, lng, maxMeters = BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS) {
  return distanceFromEssect(lat, lng) <= maxMeters;
}

/**
 * Estime le temps de marche à pied en minutes pour une distance donnée.
 * Vitesse moyenne : 5 km/h (≈83.33 m/min) avec un coefficient de détour urbain de 1.3.
 * @param {number} meters - Distance à vol d'oiseau en mètres
 * @returns {number} Durée estimée en minutes (au moins 1 minute)
 */
export function calculateWalkingMinutes(meters) {
  if (meters <= 0) return 0;
  const urbanMeters = meters * 1.3;
  const metersPerMinute = 5000 / 60;
  return Math.max(1, Math.round(urbanMeters / metersPerMinute));
}
