// 💡 Concept & Analogie : Comme un chronomètre de billetterie en ligne qui remet les places en vente si le paiement n'est pas finalisé dans les 10 minutes, ce robot annule les réservations expirées et libère le stock.
// 🔄 Comparaison React / Flutter : Dès que le robot libère le stock dans Firestore, les écouteurs temps réel sur React et Flutter réactualisent instantanément la disponibilité affichée.
// 🎯 À retenir pour la soutenance : "Le sweeper de réservation tourne en tâche de fond pour restaurer le stock des offres et débloquer les coupons de réduction si l'étudiant n'a pas finalisé son paiement dans le délai imparti."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { ORDER_STATUS, OFFER_STATUS, REWARD_STATUS } from '../../../shared/constants.js';
import { normalizeOrderItems } from '../../../shared/orders.js';
import { rewardKey } from '../../../shared/loyalty.js';

let isReservationSweeperRunning = false;

/**
 * Exécute un cycle de nettoyage des réservations expirées.
 */
export async function runReservationSweeper() {
  if (isReservationSweeperRunning) return;
  isReservationSweeperRunning = true;

  try {
    const now = new Date();
    const nowMs = now.getTime();

    // Requête sur champ unique d'égalité (évite 9 FAILED_PRECONDITION)
    const ordersQuery = await db
      .collection('orders')
      .where('status', '==', ORDER_STATUS.RESERVED)
      .limit(100)
      .get();

    if (ordersQuery.empty) {
      isReservationSweeperRunning = false;
      return;
    }

    // Filtrage temporel en mémoire
    const expiredDocs = ordersQuery.docs.filter((doc) => {
      const data = doc.data();
      const expiresMs = data.reservationExpiresAt?.toDate
        ? data.reservationExpiresAt.toDate().getTime()
        : new Date(data.reservationExpiresAt).getTime();
      return expiresMs <= nowMs;
    });

    if (expiredDocs.length === 0) {
      isReservationSweeperRunning = false;
      return;
    }

    logger.info(`Sweeper: ${expiredDocs.length} réservation(s) expirée(s) trouvée(s)`);

    for (const orderSnap of expiredDocs) {
      const order = orderSnap.data();
      const orderRef = orderSnap.ref;
      const items = normalizeOrderItems(order);
      const offerRefs = items.map((it) => db.collection('offers').doc(it.offerId));
      const userRef = order.pricing?.reward?.rewardId ? db.collection('users').doc(order.studentId) : null;

      await db.runTransaction(async (transaction) => {
        // 1. TOUTES LES LECTURES ATOMIQUES AVANT TOUTE ÉCRITURE
        const currentOrderSnap = await transaction.get(orderRef);
        if (!currentOrderSnap.exists || currentOrderSnap.data()?.status !== ORDER_STATUS.RESERVED) {
          return;
        }

        const [userDoc, ...offerDocs] = await Promise.all([
          userRef ? transaction.get(userRef) : Promise.resolve(null),
          ...offerRefs.map((ref) => transaction.get(ref)),
        ]);

        // 2. ÉCRITURES ATOMIQUES
        // Clôture de la commande
        const statusHistory = [...(currentOrderSnap.data().statusHistory || [])];
        statusHistory.push({
          status: ORDER_STATUS.EXPIRED,
          timestamp: now,
          note: 'Expiration automatique : délai de réservation de 10 min écoulé',
        });

        transaction.update(orderRef, {
          status: ORDER_STATUS.EXPIRED,
          statusHistory,
          updatedAt: now,
        });

        // Restauration du stock de toutes les offres de la commande
        for (let i = 0; i < items.length; i += 1) {
          const offerDoc = offerDocs[i];
          if (!offerDoc.exists) continue;
          const offer = offerDoc.data();
          const currentAvailable = offer.quantityAvailable ?? offer.remainingQuantity ?? 0;
          const restoredStock = currentAvailable + items[i].quantity;

          const offerUpdates = {
            quantityAvailable: restoredStock,
            remainingQuantity: restoredStock,
            updatedAt: now,
          };

          const pickupEndMs = offer.pickupEndAt?.toDate
            ? offer.pickupEndAt.toDate().getTime()
            : new Date(offer.pickupEndAt).getTime();

          if (offer.status === OFFER_STATUS.SOLD_OUT && now.getTime() < pickupEndMs) {
            offerUpdates.status = OFFER_STATUS.ACTIVE;
          }

          transaction.update(offerRefs[i], offerUpdates);
        }

        // Déverrouillage de la récompense étudiante
        if (userDoc && userDoc.exists) {
          const unlockedRewards = userDoc.data().unlockedRewards || [];
          const updatedRewards = unlockedRewards.map((rw) => {
            if (rewardKey(rw) === order.pricing?.reward?.rewardId && rw.status === REWARD_STATUS.LOCKED) {
              return {
                ...rw,
                status: REWARD_STATUS.AVAILABLE,
                lockedAt: null,
                lockedForOrderId: null,
              };
            }
            return rw;
          });

          transaction.update(userRef, {
            unlockedRewards: updatedRewards,
            updatedAt: now,
          });
        }
      });
    }
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le reservationSweeper');
  } finally {
    isReservationSweeperRunning = false;
  }
}

/**
 * Lance le sweeper de réservations sur un intervalle récurrent non bloquant (.unref()).
 */
export function startReservationSweeper(intervalMs = 30000) {
  const timer = setInterval(() => {
    runReservationSweeper().catch((err) => {
      logger.error({ err: err.message }, 'Erreur planifiée reservationSweeper');
    });
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}
