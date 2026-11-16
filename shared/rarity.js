// 💡 Concept & Analogie : Comme dans un jeu vidéo de type RPG (Gacha) où les coffres ont des raretés (Commun, Rare, Légendaire), la valeur mystère d'un panier dépend mathématiquement du pourcentage de réduction accordé et de la réputation gastronomique du commerçant.
// 🔄 Comparaison React / Flutter : En React, la rareté applique des bordures et reflets métalliques animés en CSS/Framer Motion ; en Flutter, elle déclenche un halo coloré et des retours haptiques personnalisés.
// 🎯 À retenir pour la soutenance : "L'algorithme de rareté combine 70% de profondeur de réduction et 30% de note qualité du restaurant pour classer objectivement les paniers surprises en Commun, Rare ou Légendaire."

import { SURPRISE_RARITY } from './constants.js';

/**
 * Calcule le niveau de rareté et le score d'un panier surprise.
 * @param {number} originalPriceMillimes - Prix initial du panier
 * @param {number} referencePriceMillimes - Prix réduit de référence (ou prix de départ Dutch)
 * @param {number} merchantRatingAvg - Note moyenne du commerçant (sur 5)
 * @returns {{ rarity: string, score: number, depth: number }}
 */
export function computeRarity(originalPriceMillimes, referencePriceMillimes, merchantRatingAvg = 4.0) {
  if (originalPriceMillimes <= 0) {
    throw new Error('Le prix initial doit être strictement positif');
  }

  const depth = 1 - referencePriceMillimes / originalPriceMillimes;
  const normalizedRating = Math.min(5, Math.max(0, merchantRatingAvg)) / 5;

  const rawScore = 0.7 * depth + 0.3 * normalizedRating;
  const score = Math.round(rawScore * 100) / 100;

  let rarity = SURPRISE_RARITY.COMMON;
  if (score >= 0.75) {
    rarity = SURPRISE_RARITY.LEGENDARY;
  } else if (score >= 0.55) {
    rarity = SURPRISE_RARITY.RARE;
  }

  return {
    rarity,
    score,
    depth: Math.round(depth * 100) / 100,
  };
}
