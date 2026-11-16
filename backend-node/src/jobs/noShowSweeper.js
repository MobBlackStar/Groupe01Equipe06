// 💡 Concept & Analogie : Comme un passager qui a acheté son billet mais n'est jamais monté à bord du train avant son départ, ce robot détecte les commandes payées mais non récupérées après la fin du créneau.
// 🔄 Comparaison React / Flutter : Met à jour les historiques de commandes de l'étudiant et du commerçant vers le statut `NO_SHOW`.
// 🎯 À retenir pour la soutenance : "Le noShowSweeper bascule les commandes payées non réclamées 30 minutes après la clôture vers l'état NO_SHOW pour alimenter les indicateurs de fiabilité."
// Module : Logique Métier Backend

import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { ORDER_STATUS } from '../../../shared/constants.js';

export async function runNoShowSweeper() {
  try {
    // Clôture 30 minutes après la fin du créneau de retrait
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const paidOrdersQuery = await db
      .collection('orders')
      .where('status', '==', ORDER_STATUS.PAID)
      .where('offerSnapshot.pickupEndAt', '<=', thirtyMinutesAgo)
      .limit(50)
      .get();

    if (paidOrdersQuery.empty) return;

    logger.info(`Sweeper: ${paidOrdersQuery.size} commande(s) non réclamée(s) (NO_SHOW)`);

    const batch = db.batch();
    paidOrdersQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: ORDER_STATUS.NO_SHOW,
        updatedAt: new Date(),
      });
    });

    await batch.commit();
  } catch (error) {
    logger.error({ err: error.message }, 'Erreur dans le noShowSweeper');
  }
}
