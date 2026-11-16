// 💡 Concept & Analogie : Comme le bouton de réinitialisation d'un stand d'exposition qui remet chaque élément à sa place exacte avant l'arrivée du prochain groupe de visiteurs, ce script remet à zéro l'application en quelques secondes.
// 🔄 Comparaison React / Flutter : Permet d'enchaîner plusieurs passages de soutenance devant le jury sans conserver les commandes de test antérieures.
// 🎯 À retenir pour la soutenance : "Ce script nettoie les commandes temporaires créées pendant la répétition et réexécute le seed officiel pour garantir une démo sans accroc."
// Module : Scripts & Déploiement

import { db } from '../src/config/firebase.js';
import { runSeed } from './seed.js';

export async function resetDemo() {
  console.log('🔄 [RESET DEMO] Démarrage du nettoyage de l environnement de démonstration...');

  // 1. Suppression des commandes existantes
  const ordersSnap = await db.collection('orders').get();
  if (!ordersSnap.empty) {
    const batchOrders = db.batch();
    ordersSnap.docs.forEach((doc) => batchOrders.delete(doc.ref));
    await batchOrders.commit();
    console.log(`🧹 ${ordersSnap.size} commande(s) purgée(s).`);
  }

  // 2. Suppression des événements de paiement Konnect
  const paymentsSnap = await db.collection('payment_events').get();
  if (!paymentsSnap.empty) {
    const batchPayments = db.batch();
    paymentsSnap.docs.forEach((doc) => batchPayments.delete(doc.ref));
    await batchPayments.commit();
    console.log(`🧹 ${paymentsSnap.size} événement(s) de paiement purgé(s).`);
  }

  // 3. Ré-exécution du seed officiel complet
  await runSeed();
  console.log('✨ [RESET DEMO TERMINÉ] Plateforme prête pour la soutenance !');
}

// Exécution directe si invoqué en CLI
if (process.argv[1]?.endsWith('resetDemo.js')) {
  resetDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Échec du reset :', err);
      process.exit(1);
    });
}
