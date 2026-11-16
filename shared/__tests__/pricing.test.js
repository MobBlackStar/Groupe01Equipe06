// 💡 Concept & Analogie : Comme un banc d'essai mécanique qui teste des pièces automobiles avec des charges calibrées, ces tests vérifient que le calcul de prix produit exactement les valeurs attendues.
// 🔄 Comparaison React / Flutter : Ces mêmes vecteurs JSON sont consommés en JavaScript par Jest / Node Test Runner et en Flutter par `pricing_vectors_test.dart` pour garantir 100% de parité.
// 🎯 À retenir pour la soutenance : "Nos tests unitaires automatisés valident le comportement de l'enchère hollandaise sur l'ensemble des cas limites temporels."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeUnitPrice, computeUrgencyColor } from '../pricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vectorsPath = join(__dirname, '../test-vectors/pricing.json');
const vectorsData = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

describe('Algorithme de Calcul de Prix (Smart Decay (Enchère dégressive))', () => {
  for (const tc of vectorsData.testCases) {
    test(`Vecteur ${tc.id}: ${tc.notes}`, () => {
      const calculated = computeUnitPrice(tc.offer, tc.nowMs);
      assert.equal(
        calculated,
        tc.expectedPriceMillimes,
        `Échec sur ${tc.id}: attendu ${tc.expectedPriceMillimes}, obtenu ${calculated}`
      );
    });
  }

  test('Calcul des couleurs d urgence (Urgence visuelle)', () => {
    const baseNow = 1700000000000;
    // Plus de 60 min
    const calmEnd = baseNow + 75 * 60 * 1000;
    assert.equal(computeUrgencyColor(calmEnd, baseNow), '#CCFF00');

    // Entre 20 et 60 min
    const warningEnd = baseNow + 35 * 60 * 1000;
    assert.equal(computeUrgencyColor(warningEnd, baseNow), '#FF5500');

    // Moins de 20 min
    const criticalEnd = baseNow + 10 * 60 * 1000;
    assert.equal(computeUrgencyColor(criticalEnd, baseNow), '#FF1744');
  });
});
