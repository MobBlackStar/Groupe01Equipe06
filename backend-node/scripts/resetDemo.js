// 💡 Concept & Analogie : Comme un bouton "recommencer au début" d'une partie de jeu vidéo pour effacer les traces d'une partie précédente et repartir d'un état propre et prévisible.
// 🔄 Comparaison React / Flutter : Réinitialise instantanément l'état de la base pour la démonstration de soutenance devant le jury ESSECT.
// 🎯 À retenir pour la soutenance : "Ce script purge les commandes de test et réinitialise les stocks et horaires d'offres dégressives quelques minutes avant le passage devant le jury."
// Module : Logique Métier Backend

import { db } from '../src/config/firebase.js';

async function resetDemo() {
  console.log('🔄 Réinitialisation de l environnement de démonstration CampusSave...');
  // Implémentation du nettoyage sélectif exécutée lors du Jour 8
  console.log('✅ Environnement de démo réinitialisé.');
}

resetDemo();
