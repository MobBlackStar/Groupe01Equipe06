// 💡 Concept & Analogie : Comme le bouton de réinitialisation d'un stand d'exposition qui remet chaque élément à sa place exacte avant l'arrivée du prochain groupe de visiteurs, ce script remet à zéro l'application en quelques secondes.
// 🔄 Comparaison React / Flutter : Permet d'enchaîner plusieurs passages de soutenance devant le jury sans conserver les commandes de test antérieures.
// 🎯 À retenir pour la soutenance : "Ce script nettoie les commandes temporaires créées pendant la répétition et réexécute le seed officiel pour garantir une démo sans accroc."
// Module : Scripts & Déploiement

import { db } from '../src/config/firebase.js';
import { runSeed } from './seed.js';

/**
 * Supprime tous les documents d'une collection par lots de 400 (Firestore refuse plus de 500 opérations par batch :
 * avec beaucoup de commandes de test, un seul batch faisait échouer tout le reset).
 */
async function purgeCollection(name, label) {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`🧹 ${docs.length} ${label} purgé(e)s.`);
  return docs.length;
}

export async function resetDemo() {
  console.log('🔄 [RESET DEMO] Démarrage du nettoyage de l environnement de démonstration...');

  // 1-3. Commandes, événements de paiement Konnect et offres (le seed réinjecte exactement les 20 offres officielles)
  await purgeCollection('orders', 'commande(s)');
  await purgeCollection('payment_events', 'événement(s) de paiement');
  await purgeCollection('offers', 'offre(s)');

  // 4. Ré-exécution du seed officiel complet
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
