// 💡 Concept & Analogie : Comme un compteur de calories inversé qui mesure les gaz à effet de serre épargnés à la planète, chaque gramme de nourriture non gaspillé évite la décomposition de matière organique et l'empreinte carbone liée à sa production.
// 🔄 Comparaison React / Flutter : En React, les équivalences écologiques sont affichées sous forme de tuiles dynamiques avec des compteurs animés ; en Flutter, elles s'affichent avec des graphiques `fl_chart` et des jauges écologiques.
// 🎯 À retenir pour la soutenance : "Nous appliquons le ratio scientifique officiel de la FAO de 2.5 g de CO2 évité par gramme d'aliment sauvé, et convertissons ce gain en équivalents compréhensibles (recharges de smartphone et km de voiture évités) selon les métriques de l'EPA."

import { BUSINESS_RULES } from './constants.js';

/**
 * Calcule l'empreinte carbone évitée en grammes de CO2 à partir du poids d'aliments sauvés.
 * Ratio standard FAO (Organisation des Nations Unies pour l'alimentation et l'agriculture) : 2.5 kg CO2e / kg aliment.
 * @param {number} foodGrams - Poids en grammes
 * @returns {{ foodSavedGrams: number, co2SavedGrams: number }}
 */
export function calculateImpact(foodGrams) {
  if (foodGrams < 0) {
    throw new Error('Le poids ne peut pas être négatif');
  }
  const co2SavedGrams = Math.round(foodGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD);
  return {
    foodSavedGrams: Math.round(foodGrams),
    co2SavedGrams,
  };
}

/**
 * Traduit un volume de CO2 évité en équivalents concrets de la vie courante.
 * Facteurs :
 * - Smartphone chargé : ~10 g de CO2 par charge complète (source EPA Greenhouse Gas Equivalencies).
 * - Km en voiture moyenne : ~244 g de CO2 par km (source moyenne EPA / ADEME).
 * @param {number} co2SavedGrams - CO2 épargné en grammes
 * @returns {{ smartphonesCharged: number, kmCarAvoided: number }}
 */
export function calculateEquivalences(co2SavedGrams) {
  const safeCo2 = Math.max(0, co2SavedGrams);
  const smartphonesCharged = Math.round(safeCo2 / BUSINESS_RULES.SMARTPHONE_CO2_GRAMS_PER_CHARGE);
  const kmCarAvoided = Number((safeCo2 / BUSINESS_RULES.CAR_CO2_GRAMS_PER_KM).toFixed(2));

  return {
    smartphonesCharged,
    kmCarAvoided,
  };
}
