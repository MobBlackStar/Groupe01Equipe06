// 💡 Concept & Analogie : Test du moteur d'analyse de secours sans IA pour s'assurer qu'il comprend fidèlement le jargon de Montfleury.
// 🔄 Comparaison React / Flutter : Côté client, le commerçant voit les champs se pré-remplir même si le réseau externe est coupé.
// 🎯 À retenir pour la soutenance : "Ce banc de test démontre la précision de notre parseur tunisien déterministe sur des phrases réelles du terrain."
// Module : Backend & Infrastructure / Enrichissement : l'équipe UI

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseRawNote } from '../src/modules/ai/fallbackParser.js';
import { OFFER_CATEGORIES } from '../../shared/constants.js';

describe('Parseur de Secours Culinaire Tunisien (fallbackParser)', () => {
  test('Extraction plat unique et horaire de fermeture', () => {
    const result = parseRawNote('4 makloub escalope, fermeture 17h');
    assert.equal(result.quantityTotal, 4);
    assert.equal(result.category, OFFER_CATEGORIES.SANDWICH);
    assert.equal(result.isSurpriseBasket, false);
    assert.match(result.description, /17h00/);
  });

  test('Multiples articles activent automatiquement le panier surprise', () => {
    const result = parseRawNote('2 chapati + 3 briks et 1 soda');
    assert.equal(result.isSurpriseBasket, true);
    assert.equal(result.category, OFFER_CATEGORIES.MIXTE);
    assert.ok(result.surprise);
    assert.equal(result.quantityTotal, 6);
  });
});
