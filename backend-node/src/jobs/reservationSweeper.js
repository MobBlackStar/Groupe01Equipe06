// 💡 Concept & Analogie : Comme un chronomètre de billetterie en ligne qui remet les places en vente si le paiement n'est pas finalisé dans les 10 minutes, ce robot annule les réservations expirées et libère le stock.
// 🔄 Comparaison React / Flutter : Dès que le robot libère le stock dans Firestore, les écouteurs temps réel sur React et Flutter réactualisent instantanément la disponibilité affichée.
// 🎯 À retenir pour la soutenance : "Le sweeper de réservation tourne en tâche de fond pour restaurer le stock des offres et débloquer les coupons de réduction si l'étudiant n'a pas finalisé son paiement dans le délai imparti."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { ORDER_STATUS, REWARD_STATUS } from '../../../shared/constants.js';

export async function runReservationSweeper() {
  try {
    const now = new Date();
    const expiredOrdersQuery = await db
      .collection('orders')
      .where('status', '==', ORDER_STATUS.RESERVED)
      .where('reservationExpiresAt', '<=', now)
      .limit(50)
      .get();

    if (expiredOrdersQuery.empty) return;

    logger.info(`Sweeper: ${expiredOrdersQuery.size} réservation(s) expirée(s) trouvée(s)`);

    for (const doc of expiredOrdersQuery.docs) {
      const order = doc.data();

      await db.runTransaction(async (transaction) => {
        const orderRef = doc.ref;
        const offerRef = db.collection('offers').doc(order.offerId);

        const currentOrder = await transaction.get(orderRef);
        if (currentOrder.data()?.status !== ORDER_STATUS.RESERVED) return;

        // 1. Marquer la commande EXPIRED
        transaction.update(orderRef, {
          status: ORDER_STATUS.EXPIRED,
          updatedAt: new Date(),
        });

        // 2. Restaurer le stock de l'offre
        const offerDoc = await transaction.get(offerRef);
        if (offerDoc.exists) {
          const currentStock = offerDoc.data().quantityAvailable || 0;
          transaction.update(offerRef, {
            quantityAvailable: currentStock + order.quantity,
            updatedAt: new Date(),
          });
        }

        // 3. Débloquer la récompense étudiante si applicable
        if (order.pricing?.reward?.rewardId) {
          const userRef = db.collection('users').doc(order.studentId);
          const userDoc = await transaction.get(userRef);
          if (userDoc.exists) {
            const unlockedRewards = userDoc.data().unlockedRewards || [];
            const updated = unlockedRewards.map((rw) =>
              rw.rewardId === order.pricing.reward.rewardId ? { ...rw, status: REWARD_STATUS.AVAILABLE } : rw
            );
            transaction.update(userRef, { unlockedRewards: updated });
          }
        }
      });
    }
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le reservationSweeper');
  }
}
