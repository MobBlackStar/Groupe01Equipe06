// 💡 Concept & Analogie : Comme une horloge d'enchère inversée hollandaise (marché aux fleurs d'Aalsmeer), le prix démarre haut au début du créneau et descend de manière continue et prévisible jusqu'au prix plancher à mesure que l'heure de fermeture approche.
// 🔄 Comparaison React / Flutter : En React, un hook `useLivePrice` recalcule le prix chaque seconde côté client pour l'animation visuelle ; en Flutter, un `StreamBuilder` ou `Timer.periodic` produit le même rendu fluide, pendant que le serveur backend reste le seul juge au moment de la réservation.
// 🎯 À retenir pour la soutenance : "Le Smart Decay applique une décroissance linéaire par pas fixes de 100 millimes entre l'heure de début de l'enchère et la fin du retrait, incitant les étudiants à acheter au juste prix tout en garantissant un prix plancher pour le commerçant."

import { PRICING_MODES } from './constants.js';

/**
 * Calcule le prix unitaire actuel d'une offre en millimes (entier).
 * @param {object} offer - Document d'offre ou configuration tarifaire
 * @param {number|Date} nowInput - Horodatage de référence (ms ou Date)
 * @returns {number} Prix unitaire en millimes (entier strict)
 */
export function computeUnitPrice(offer, nowInput = Date.now()) {
  const nowMs = nowInput instanceof Date ? nowInput.getTime() : Number(nowInput);
  const pricing = offer?.pricing || offer || {};
  const mode = pricing.mode || offer.pricingType || PRICING_MODES.FIXED;

  if (mode === PRICING_MODES.FIXED || mode === 'FIXED') {
    const discounted = pricing.discountedPriceMillimes ?? offer.discountedPriceMillimes ?? offer.targetPriceMillimes ?? 0;
    return Math.round(Number(discounted));
  }

  if (mode === PRICING_MODES.DUTCH_AUCTION || mode === 'DUTCH_AUCTION' || mode === 'DUTCH') {
    const start = Number(pricing.startPriceMillimes ?? offer.startPriceMillimes ?? offer.originalPriceMillimes ?? 0);
    const floor = Number(pricing.floorPriceMillimes ?? offer.floorPriceMillimes ?? offer.targetPriceMillimes ?? 0);
    const step = Math.max(1, Number(pricing.roundingStepMillimes ?? offer.stepMillimes ?? 100));

    const decayStartMs = parseTimestampToMs(pricing.decayStartAt ?? offer.decayStartAt ?? offer.pickupStartAt);
    const pickupEndMs = parseTimestampToMs(pricing.pickupEndAt ?? offer.pickupEndAt);

    // Garde-fous temporels : créneau inexistant ou inversé
    if (!decayStartMs || !pickupEndMs || pickupEndMs <= decayStartMs) {
      return start;
    }

    // Avant le début de l'enchère dégressive
    if (nowMs <= decayStartMs) {
      return start;
    }

    // Après l'expiration du créneau de retrait
    if (nowMs >= pickupEndMs) {
      return floor;
    }

    // Progression linéaire continue
    const progress = (nowMs - decayStartMs) / (pickupEndMs - decayStartMs);
    const rawPrice = start - (start - floor) * progress;
    const steppedPrice = Math.floor(rawPrice / step) * step;

    // Encadrement strict entre le prix plancher et le prix de départ
    return Math.min(start, Math.max(floor, steppedPrice));
  }

  throw new Error(`Mode de tarification inconnu : ${mode}`);
}

/**
 * Calcule la couleur d'urgence visuelle en fonction du temps restant avant la fin du retrait.
 * > 60 min : Vert Lime ("#CCFF00")
 * 20 à 60 min : Orange Intense ("#FF5500")
 * < 20 min : Rouge Fluo clignotant ("#FF1744")
 * @param {number|Date|object} pickupEndInput - Horodatage de fin de retrait
 * @param {number|Date} nowInput - Horodatage de référence
 * @returns {string} Code couleur hexadécimal
 */
export function computeUrgencyColor(pickupEndInput, nowInput = Date.now()) {
  const pickupEndMs = parseTimestampToMs(pickupEndInput);
  const nowMs = nowInput instanceof Date ? nowInput.getTime() : Number(nowInput);

  const minutesLeft = (pickupEndMs - nowMs) / 60000;

  if (minutesLeft > 60) {
    return '#CCFF00'; // Calme / Vert lime
  }
  if (minutesLeft >= 20) {
    return '#FF5500'; // Attention / Orange
  }
  return '#FF1744';   // Urgence critique / Rouge pulsé
}

/**
 * Retourne le nombre de minutes restantes avant la fin du créneau de retrait.
 * @param {number|Date|object} pickupEndInput
 * @param {number|Date} nowInput
 * @returns {number} Minutes entières restantes (0 si expiré)
 */
export function computeMinutesLeft(pickupEndInput, nowInput = Date.now()) {
  const pickupEndMs = parseTimestampToMs(pickupEndInput);
  const nowMs = nowInput instanceof Date ? nowInput.getTime() : Number(nowInput);
  const diffMs = pickupEndMs - nowMs;
  return Math.max(0, Math.floor(diffMs / 60000));
}

/**
 * Helper interne pour extraire les millisecondes depuis un Date, number ou Timestamp Firestore.
 */
function parseTimestampToMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val._seconds === 'number') return val._seconds * 1000;
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  if (typeof val === 'string') return new Date(val).getTime();
  return 0;
}
