// 💡 Concept & Analogie : Le jour de l'ouverture du magasin : on remplit les rayons avec exactement les mêmes marchandises que sur le plan, ni plus ni moins.
// 🔄 Comparaison React / Flutter : Écrit dans Firestore le jeu de données de `seed-data/demoDataset.js`, le même que celui du mode mémoire : le web et le mobile affichent donc des chiffres identiques et cohérents.
// 🎯 À retenir pour la soutenance : "Un seul générateur produit 12 commerces, 20 offres actives, 8 étudiants, leur historique de commandes et tous les agrégats qui en découlent ; les écritures passent par lots de 400 (limite Firestore : 500)."
// Module : Scripts & Déploiement

import { db } from '../src/config/firebase.js';
import { buildDemoDataset } from './seed-data/demoDataset.js';

/** Convertit un chemin « collection/doc/sous-collection/doc » en référence de document. */
function refFromPath(path) {
  const parts = path.split('/');
  let ref = db.collection(parts[0]).doc(parts[1]);
  for (let i = 2; i < parts.length; i += 2) {
    ref = ref.collection(parts[i]).doc(parts[i + 1]);
  }
  return ref;
}

export async function runSeed(nowMs = Date.now()) {
  console.log('🌱 [SEED] Démarrage du peuplement officiel CampusSave pour la soutenance...');

  const { entries, summary } = buildDemoDataset(nowMs);

  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch();
    entries.slice(i, i + 400).forEach(({ path, data }) => batch.set(refFromPath(path), data));
    await batch.commit();
  }

  console.log(`✅ ${summary.merchants} Commerces configurés (${summary.approvedMerchants} APPROVED, ${summary.merchants - summary.approvedMerchants} PENDING pour la démo admin).`);
  console.log(`✅ ${summary.offers} Offres actives enregistrées (créneaux de 2 h à 24 h, dont ${summary.surpriseBaskets} paniers surprises scellés).`);
  console.log(`✅ ${summary.students} Comptes étudiants et ${summary.orders} commandes historiques cohérentes (Yassine : 90 EcoPoints + 1 coupon disponible).`);
  console.log(`✅ ${summary.days} Jours de séries commerçants, campus et filières calculés à partir des commandes.`);
  console.log('🌟 [SEED TERMINÉ] Base Firestore initialisée avec succès !');
}

// Exécution directe si invoqué en CLI
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Échec du seed :', err);
      process.exit(1);
    });
}
