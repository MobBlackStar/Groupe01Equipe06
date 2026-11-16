// 💡 Concept & Analogie : Comme une carte de fidélité de café avec 5 tampons où un arbre grandit à chaque palier de 100 points, chaque repas sauvé récompense concrètement l'étudiant avec des bons de réduction ou des paniers offerts.
// 🔄 Comparaison React / Flutter : En React, la carte de fidélité affiche une illustration SVG de l'arbre qui grandit et un porte-billets de coupons ; en Flutter, la même logique alimente l'écran `LoyaltyCardScreen` avec des animations de tampons.
// 🎯 À retenir pour la soutenance : "Le système d'EcoPoints favorise la rétention étudiante en attribuant 20 points par repas, des bonus selon la rareté des paniers surprises, et débloque un bon de réduction tous les 100 points avec un palier cadeau tous les 300 points."

import {
  LOYALTY_TIERS,
  LOYALTY_THRESHOLDS,
  REWARD_TYPES,
  REWARD_STATUS,
  SURPRISE_RARITY,
} from './constants.js';

/**
 * Calcule les EcoPoints attribués lors du retrait d'une commande.
 * @param {object} params
 * @param {number} params.quantity - Nombre de portions
 * @param {boolean} [params.isSurpriseBasket=false] - Est-ce un panier surprise ?
 * @param {string} [params.rarity] - Rareté du panier (COMMON, RARE, LEGENDARY)
 * @param {boolean} [params.isFirstCompletedOrder=false] - Première commande finalisée ?
 * @returns {number} Nombre d'EcoPoints gagnés
 */
export function calculateEcoPoints({
  quantity = 1,
  isSurpriseBasket = false,
  rarity = SURPRISE_RARITY.COMMON,
  isFirstCompletedOrder = false,
}) {
  let points = 20 * quantity;

  if (isSurpriseBasket) {
    const rarityBonus = {
      [SURPRISE_RARITY.COMMON]: 10,
      [SURPRISE_RARITY.RARE]: 25,
      [SURPRISE_RARITY.LEGENDARY]: 50,
    };
    points += rarityBonus[rarity] || 10;
  }

  if (isFirstCompletedOrder) {
    points += 30; // Bonus de bienvenue première commande
  }

  return points;
}

/**
 * Détermine le rang / niveau de fidélité selon le total de points.
 * @param {number} ecoPoints
 * @returns {string} GRAINE, POUSSE, ARBRE, FORET
 */
export function getLoyaltyTier(ecoPoints) {
  if (ecoPoints >= LOYALTY_THRESHOLDS.FORET) return LOYALTY_TIERS.FORET;
  if (ecoPoints >= LOYALTY_THRESHOLDS.ARBRE) return LOYALTY_TIERS.ARBRE;
  if (ecoPoints >= LOYALTY_THRESHOLDS.POUSSE) return LOYALTY_TIERS.POUSSE;
  return LOYALTY_TIERS.GRAINE;
}

/**
 * Calcule le nombre de tampons visuels actifs (de 0 à 4 sur 5).
 * Chaque tampon représente 20 points au sein de la tranche de 100 points en cours.
 * @param {number} ecoPoints
 * @returns {number}
 */
export function calculateStamps(ecoPoints) {
  return Math.floor((ecoPoints % 100) / 20);
}

/**
 * Calcule le prochain palier de récompense (multiple de 100 strictement supérieur aux points).
 * @param {number} ecoPoints
 * @returns {number}
 */
export function getNextRewardMilestone(ecoPoints) {
  return (Math.floor(ecoPoints / 100) + 1) * 100;
}

/**
 * Détecte si de nouveaux paliers de récompenses ont été franchis entre deux scores de points.
 * Génère les objets de récompense correspondants.
 * @param {number} beforePoints - Points avant validation
 * @param {number} afterPoints - Points après validation
 * @returns {Array<object>} Liste des nouvelles récompenses débloquées
 */
export function evaluateMilestones(beforePoints, afterPoints) {
  const newRewards = [];
  const start = Math.floor(beforePoints / 100) + 1;
  const end = Math.floor(afterPoints / 100);

  for (let step = start; step <= end; step++) {
    const milestone = step * 100;
    const isFreeSurprise = milestone % 300 === 0;

    const reward = {
      rewardId: `rw_${milestone}_${Math.random().toString(36).substring(2, 6)}`,
      milestone,
      type: isFreeSurprise ? REWARD_TYPES.FREE_SURPRISE : REWARD_TYPES.PERCENT_OFF,
      status: REWARD_STATUS.AVAILABLE,
      percentOff: isFreeSurprise ? undefined : 20,
      maxDiscountMillimes: isFreeSurprise ? 4000 : 2000,
    };

    newRewards.push(reward);
  }

  return newRewards;
}
