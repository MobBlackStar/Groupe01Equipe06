// 💡 Concept & Analogie : Comme un contrôleur de gare qui vérifie les billets non compostés après le départ du train et envoie un rappel avant la fermeture des portes, ce robot gère les rappels de fin de créneau et les bascules en non-présentation.
// 🔄 Comparaison React / Flutter : Dès que le statut d'une commande bascule en `NO_SHOW`, les flux Firestore temps réel sous React et Flutter mettent à jour les tableaux de bord et historiques.
// 🎯 À retenir pour la soutenance : "Ce sweeper s'exécute périodiquement toutes les 5 minutes en tâche de fond (.unref()) pour envoyer le rappel de retrait à H-30min et clôturer en NO_SHOW les commandes abandonnées 30 minutes après la fin du créneau."
// Module : Tâches de Fond & Supervision Automatisée

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { ORDER_STATUS } from '../../../shared/constants.js';
import { fcmService } from '../modules/notifications/fcm.service.js';
import pkg from 'firebase-admin';
const { firestore } = pkg;

let isNoShowSweeperRunning = false;
let noShowSweeperInterval = null;

/**
 * Exécute un cycle de supervision des rappels et des commandes non réclamées.
 */
export async function runNoShowSweeper() {
  if (isNoShowSweeperRunning) return;
  isNoShowSweeperRunning = true;

  try {
    const now = new Date();
    const nowMs = now.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;
    const thirtyMinutesAgo = new Date(nowMs - thirtyMinutesMs);

    // =========================================================================
    // 1. RAPPEL DE RETRAIT (PICKUP_REMINDER) : Fin de créneau dans moins de 30 min
    // =========================================================================
    try {
      const pendingRemindersSnap = await db
        .collection('orders')
        .where('status', '==', ORDER_STATUS.PAID)
        .where('reminderSent', '!=', true)
        .limit(30)
        .get();

      if (!pendingRemindersSnap.empty) {
        for (const doc of pendingRemindersSnap.docs) {
          const order = doc.data();
          const pickupEnd = order.offerSnapshot?.pickupEndAt?.toDate
            ? order.offerSnapshot.pickupEndAt.toDate()
            : new Date(order.offerSnapshot?.pickupEndAt);

          const timeLeftMs = pickupEnd.getTime() - nowMs;

          // Si le créneau expire dans les 30 prochaines minutes et n'est pas encore dépassé
          if (timeLeftMs > 0 && timeLeftMs <= thirtyMinutesMs) {
            const minutesLeft = Math.max(1, Math.round(timeLeftMs / 60000));

            // Récupération des jetons FCM de l'étudiant
            const studentDoc = await db.collection('users').doc(order.studentId).get();
            const fcmTokens = studentDoc.data()?.fcmTokens || [];

            await fcmService.notifyPickupReminder(fcmTokens, order.orderCode, minutesLeft, order.studentId);

            await doc.ref.update({
              reminderSent: true,
              updatedAt: new Date(),
            });
          }
        }
      }
    } catch (reminderErr) {
      logger.warn({ err: reminderErr.message }, 'Erreur lors du cycle de rappels de retrait');
    }

    // =========================================================================
    // 2. CONVERSION EN NO_SHOW : Commandes payées non réclamées 30 min après la fin
    // =========================================================================
    const expiredPaidQuery = await db
      .collection('orders')
      .where('status', '==', ORDER_STATUS.PAID)
      .where('offerSnapshot.pickupEndAt', '<=', thirtyMinutesAgo)
      .limit(50)
      .get();

    if (expiredPaidQuery.empty) {
      isNoShowSweeperRunning = false;
      return;
    }

    logger.info(`Sweeper: ${expiredPaidQuery.size} commande(s) non réclamée(s) basculée(s) en NO_SHOW`);

    for (const doc of expiredPaidQuery.docs) {
      const order = doc.data();
      const orderRef = doc.ref;
      const studentRef = db.collection('users').doc(order.studentId);
      const merchantRef = db.collection('merchants').doc(order.merchantId);

      await db.runTransaction(async (transaction) => {
        const freshOrder = await transaction.get(orderRef);
        if (!freshOrder.exists || freshOrder.data()?.status !== ORDER_STATUS.PAID) {
          return;
        }

        const nowIso = new Date().toISOString();
        const historyEntry = {
          status: ORDER_STATUS.NO_SHOW,
          at: nowIso,
          by: 'system',
        };

        // Mise à jour de la commande
        transaction.update(orderRef, {
          status: ORDER_STATUS.NO_SHOW,
          statusHistory: firestore.FieldValue.arrayUnion(historyEntry),
          updatedAt: new Date(),
        });

        // Incrémentation du compteur de no-shows de l'étudiant
        transaction.set(
          studentRef,
          {
            stats: { noShows: firestore.FieldValue.increment(1) },
            updatedAt: new Date(),
          },
          { merge: true }
        );

        // Incrémentation du compteur de no-shows du commerçant
        transaction.set(
          merchantRef,
          {
            stats: { noShows: firestore.FieldValue.increment(1) },
            updatedAt: new Date(),
          },
          { merge: true }
        );
      });
    }
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le noShowSweeper');
  } finally {
    isNoShowSweeperRunning = false;
  }
}

/**
 * Démarre le sweeper périodique des non-présentations.
 * @param {number} intervalMs - Fréquence de vérification (5 minutes par défaut)
 */
export function startNoShowSweeper(intervalMs = 5 * 60 * 1000) {
  if (noShowSweeperInterval) return;

  noShowSweeperInterval = setInterval(runNoShowSweeper, intervalMs);
  if (typeof noShowSweeperInterval.unref === 'function') {
    noShowSweeperInterval.unref();
  }

  logger.info(`Robot No-Show actif (intervalle : ${intervalMs / 1000}s)`);
}

/**
 * Arrête le sweeper (utilisé pour les tests unitaires et le nettoyage gracieux).
 */
export function stopNoShowSweeper() {
  if (noShowSweeperInterval) {
    clearInterval(noShowSweeperInterval);
    noShowSweeperInterval = null;
  }
  isNoShowSweeperRunning = false;
}
