// 💡 Concept & Analogie : Comme un boulanger qui retire de l'étalage les produits invendus à l'heure exacte de la fermeture de la boutique, ce robot clôture les offres dont l'heure de retrait est dépassée.
// 🔄 Comparaison React / Flutter : Fait disparaître automatiquement l'offre des cartes interactives et du catalogue sans intervention manuelle du commerçant.
// 🎯 À retenir pour la soutenance : "Ce job planifié bascule automatiquement les offres actives vers le statut `EXPIRED` dès la fin du créneau de retrait."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { OFFER_STATUS } from '../../../shared/constants.js';

export async function runOfferExpirySweeper() {
  try {
    const now = new Date();
    const expiredOffersQuery = await db
      .collection('offers')
      .where('status', '==', OFFER_STATUS.ACTIVE)
      .where('pickupEndAt', '<=', now)
      .limit(50)
      .get();

    if (expiredOffersQuery.empty) return;

    logger.info(`Sweeper: ${expiredOffersQuery.size} offre(s) expirée(s) trouvée(s)`);

    const batch = db.batch();
    expiredOffersQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: OFFER_STATUS.EXPIRED,
        updatedAt: now,
      });
    });

    await batch.commit();
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le offerExpirySweeper');
  }
}
