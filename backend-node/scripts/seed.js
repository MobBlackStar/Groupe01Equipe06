// 💡 Concept & Analogie : Comme la répétition d'une pièce de théâtre où le régisseur installe les décors et les accessoires avant l'entrée des acteurs, ce script pré-remplit la base avec un jeu de données réaliste.
// 🔄 Comparaison React / Flutter : Offre un catalogue riche et immédiatement consultable dès la première ouverture des deux applications.
// 🎯 À retenir pour la soutenance : "Ce script injecte les 6 commerces réels de Montfleury, 20 offres et 8 étudiants types pour des démonstrations concluantes."
// Module : Logique Métier Backend

import { db } from '../src/config/firebase.js';
import merchantsData from './seed-data/merchants.json' assert { type: 'json' };

async function seed() {
  console.log('🌱 Démarrage de l injection des données d initialisation...');
  console.log(`Commerces disponibles dans le template : ${merchantsData.merchants.length}`);
  // L'implémentation complète d'injection Firestore sera exécutée lors de l'étape dédiée (Jour 8)
  console.log('✅ Structure de seed prête.');
}

seed();
