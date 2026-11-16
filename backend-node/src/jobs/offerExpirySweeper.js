// 💡 Concept & Analogie : Comme un boulanger qui retire de l'étalage les produits invendus à l'heure exacte de la fermeture de la boutique, ce robot clôture les offres dont l'heure de retrait est dépassée.
// 🔄 Comparaison React / Flutter : Fait disparaître automatiquement l'offre des cartes interactives et du catalogue sans intervention manuelle du commerçant.
// 🎯 À retenir pour la soutenance : "Ce job planifié bascule automatiquement les offres actives vers le statut `EXPIRED` dès la fin du créneau de retrait."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { OFFER_STATUS } from '../../../shared/constants.js';

let isOfferExpirySweeperRunning = false;

/**
 * Clôture les offres actives dont la date de fin de retrait est passée.
 */
export async function runOfferExpirySweeper() {
  if (isOfferExpirySweeperRunning) return;
  isOfferExpirySweeperRunning = true;

  try {
    const now = new Date();
    const nowMs = now.getTime();

    // Requête sur champ unique d'égalité (évite 9 FAILED_PRECONDITION)
    const activeOffersQuery = await db
      .collection('offers')
      .where('status', '==', OFFER_STATUS.ACTIVE)
      .limit(100)
      .get();

    if (activeOffersQuery.empty) {
      isOfferExpirySweeperRunning = false;
      return;
    }

    // Filtrage temporel en mémoire
    const expiredDocs = activeOffersQuery.docs.filter((doc) => {
      const data = doc.data();
      const endMs = data.pickupEndAt?.toDate
        ? data.pickupEndAt.toDate().getTime()
        : new Date(data.pickupEndAt).getTime();
      return endMs <= nowMs;
    });

    if (expiredDocs.length === 0) {
      isOfferExpirySweeperRunning = false;
      return;
    }

    logger.info(`Sweeper: ${expiredDocs.length} offre(s) expirée(s) trouvée(s)`);

    const batch = db.batch();
    expiredDocs.forEach((doc) => {
      batch.update(doc.ref, {
        status: OFFER_STATUS.EXPIRED,
        updatedAt: now,
      });
    });

    await batch.commit();
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le offerExpirySweeper');
  } finally {
    isOfferExpirySweeperRunning = false;
  }
}

/**
 * Démarre le sweeper d'offres expirées sur un intervalle récurrent non bloquant (.unref()).
 */
export function startOfferExpirySweeper(intervalMs = 60000) {
  const timer = setInterval(() => {
    runOfferExpirySweeper().catch((err) => {
      logger.error({ err: err.message }, 'Erreur planifiée offerExpirySweeper');
    });
  }, intervalMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  return timer;
}
