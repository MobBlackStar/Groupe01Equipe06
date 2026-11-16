// 💡 Concept & Analogie : Comme le livret d'épargne écologique de l'étudiant où chaque panier sauvé cumule des points, fait grandir son arbre virtuel et stocke ses bons de réduction prêts à l'emploi.
// 🔄 Comparaison React / Flutter : Alimente l'écran `LoyaltyCardPage.jsx` sous React et `LoyaltyCardScreen` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce service calcule en temps réel le palier atteint, le nombre de tampons actifs (0 à 4 sur 5) et liste les récompenses débloquées."
// Module : Fidélité & Récompenses Backend

import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import {
  getLoyaltyTier,
  getNextRewardMilestone,
  calculateStamps,
} from '../../../../shared/loyalty.js';

export const loyaltyService = {
  /**
   * Récupère le bilan complet de fidélité et récompenses pour l'étudiant connecté.
   * @param {string} studentId - Identifiant de l'étudiant (uid Firebase Auth)
   * @returns {Promise<object>}
   */
  async getStudentLoyalty(studentId) {
    const userDoc = await db.collection('users').doc(studentId).get();
    if (!userDoc.exists) {
      throw new AppError('Profil étudiant introuvable', 404, 'USER_NOT_FOUND');
    }

    const userData = userDoc.data();
    const ecoPoints = userData.ecoPoints || 0;
    const tier = userData.loyaltyTier || getLoyaltyTier(ecoPoints);
    const nextRewardAt = userData.nextRewardAt || getNextRewardMilestone(ecoPoints);
    const stamps = calculateStamps(ecoPoints);
    const unlockedRewards = userData.unlockedRewards || [];

    // Filtrage ou tri des récompenses par date de déblocage décroissante
    const rewards = unlockedRewards.map((rw) => ({
      ...rw,
      id: rw.rewardId || rw.id,
    }));

    return {
      ecoPoints,
      tier,
      loyaltyTier: tier,
      nextRewardAt,
      stamps,
      rewards,
      unlockedRewards: rewards,
      totalMealsRescued: userData.totalMealsRescued || userData.stats?.ordersCompleted || 0,
      stats: userData.stats || {},
      filiereId: userData.filiereId || null,
      displayName: userData.displayName || 'Étudiant ESSECT',
      serverTime: Date.now(),
    };
  },
};
