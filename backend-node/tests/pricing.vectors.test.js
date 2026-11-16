// 💡 Concept & Analogie : Test de non-régression validant que l'API backend produit exactement les mêmes résultats de prix que le module partagé.
// 🔄 Comparaison React / Flutter : Garantit que le prix affiché dans l'interface et le prix validé lors de la réservation concordent parfaitement.
// 🎯 À retenir pour la soutenance : "Ce test garantit que le moteur de prix du backend respecte rigoureusement les vecteurs officiels."
// Module : Logique Métier Backend

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeUnitPrice } from '../../shared/pricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vectorsData = JSON.parse(
  readFileSync(join(__dirname, '../../shared/test-vectors/pricing.json'), 'utf-8')
);

describe('Backend - Non-régression des vecteurs de prix', () => {
  for (const tc of vectorsData.testCases) {
    test(`Vecteur ${tc.id}`, () => {
      const price = computeUnitPrice(tc.offer, tc.nowMs);
      assert.equal(price, tc.expectedPriceMillimes);
    });
  }
});
