// 💡 Concept & Analogie : Test du moteur d'analyse de secours sans IA pour s'assurer qu'il comprend fidèlement le jargon de Montfleury.
// 🔄 Comparaison React / Flutter : Côté client, le commerçant voit les champs se pré-remplir même si le réseau externe est coupé.
// 🎯 À retenir pour la soutenance : "Ce banc de test démontre la précision de notre parseur tunisien déterministe sur des phrases réelles du terrain."
// Module : Backend & Infrastructure / Enrichissement : l'équipe UI

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseRawNote } from '../src/modules/ai/fallbackParser.js';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '../../shared/constants.js';

describe('Parseur de Secours Culinaire Tunisien (fallbackParser) — 10 Scénarios Réels', () => {
  // Test 1: Makloub avec horaire standard
  test('1. Extraction Makloub escalope avec fermeture à 17h', () => {
    const result = parseRawNote('4 makloub escalope, fermeture 17h');
    assert.equal(result.quantityTotal, 4);
    assert.equal(result.category, OFFER_CATEGORIES.SANDWICH);
    assert.equal(result.isSurpriseBasket, false);
    assert.equal(result.pricingMode, PRICING_MODES.FIXED);
    assert.equal(result.weightGramsPerUnit, 350);
    assert.match(result.description, /17h00/);
    assert.match(result.title, /Makloub artisanal/);
  });

  // Test 2: Chapati montfleury
  test('2. Extraction Chapati traditionnel pour étudiants ESSECT', () => {
    const result = parseRawNote('3 chapati thon fromage');
    assert.equal(result.quantityTotal, 3);
    assert.equal(result.category, OFFER_CATEGORIES.SANDWICH);
    assert.equal(result.isSurpriseBasket, false);
    assert.equal(result.weightGramsPerUnit, 300);
    assert.equal(result.originalPriceMillimes, 5000);
    assert.equal(result.discountedPriceMillimes, 3000);
  });

  // Test 3: Baguette Farcie avec heure précise (minutes)
  test('3. Extraction Baguette Farcie avec horaire précis 18h30', () => {
    const result = parseRawNote('2 baguette farcie au poulet, fermeture 18h30');
    assert.equal(result.quantityTotal, 2);
    assert.equal(result.category, OFFER_CATEGORIES.SANDWICH);
    assert.equal(result.weightGramsPerUnit, 400);
    assert.match(result.description, /18h30/);
    assert.match(result.title, /Baguette Farcie artisanal/);
  });

  // Test 4: Croissant du matin
  test('4. Extraction viennoiserie matinale (Croissants)', () => {
    const result = parseRawNote('5 croissant pur beurre');
    assert.equal(result.quantityTotal, 5);
    assert.equal(result.category, OFFER_CATEGORIES.VIENNOISERIE);
    assert.equal(result.weightGramsPerUnit, 70);
    assert.equal(result.originalPriceMillimes, 1200);
    assert.equal(result.discountedPriceMillimes, 720);
  });

  // Test 5: Pain au chocolat
  test('5. Extraction viennoiserie (Pains au chocolat)', () => {
    const result = parseRawNote('6 pain au chocolat croustillant');
    assert.equal(result.quantityTotal, 6);
    assert.equal(result.category, OFFER_CATEGORIES.VIENNOISERIE);
    assert.equal(result.weightGramsPerUnit, 80);
    assert.equal(result.originalPriceMillimes, 1500);
    assert.equal(result.discountedPriceMillimes, 900);
  });

  // Test 6: Ojja merguez
  test('6. Extraction plat chaud traditionnel (Ojja)', () => {
    const result = parseRawNote('2 ojja piquante aux merguez, fermeture 14h');
    assert.equal(result.quantityTotal, 2);
    assert.equal(result.category, OFFER_CATEGORIES.PLAT_CHAUD);
    assert.equal(result.weightGramsPerUnit, 400);
    assert.match(result.description, /14h00/);
  });

  // Test 7: Lablabi
  test('7. Extraction plat réconfortant (Lablabi)', () => {
    const result = parseRawNote('3 lablabi chaud avec oeuf');
    assert.equal(result.quantityTotal, 3);
    assert.equal(result.category, OFFER_CATEGORIES.PLAT_CHAUD);
    assert.equal(result.weightGramsPerUnit, 450);
    assert.equal(result.originalPriceMillimes, 5000);
  });

  // Test 8: Kafteji
  test('8. Extraction plat tunisien rapide (Kafteji)', () => {
    const result = parseRawNote('4 kafteji avec frites et foie');
    assert.equal(result.quantityTotal, 4);
    assert.equal(result.category, OFFER_CATEGORIES.PLAT_CHAUD);
    assert.equal(result.weightGramsPerUnit, 350);
    assert.equal(result.originalPriceMillimes, 4500);
  });

  // Test 9: Pizza soirée étudiante avec fermeture tardive
  test('9. Extraction Pizza avec fermeture à 21h45', () => {
    const result = parseRawNote('2 pizza 4 saisons, fermeture 21h45');
    assert.equal(result.quantityTotal, 2);
    assert.equal(result.category, OFFER_CATEGORIES.PIZZA);
    assert.equal(result.weightGramsPerUnit, 500);
    assert.match(result.description, /21h45/);
    assert.equal(result.originalPriceMillimes, 8000);
  });

  // Test 10: Multi-articles Panier Surprise (Chapati + Briks + Boisson)
  test('10. Multiples articles activent automatiquement le Panier Surprise anti-gaspi', () => {
    const result = parseRawNote('2 chapati + 3 briks et 1 boisson');
    assert.equal(result.isSurpriseBasket, true);
    assert.equal(result.category, OFFER_CATEGORIES.MIXTE);
    assert.ok(result.surprise);
    assert.equal(result.surprise.rarity, SURPRISE_RARITY.COMMON);
    assert.equal(result.quantityTotal, 6);
    assert.match(result.title, /Panier Surprise/);
    assert.match(result.title, /Chapati/);
    assert.match(result.title, /Brik/);
    assert.match(result.title, /Boisson/);
  });

  // Robustesse et validation des erreurs
  test('Gestion des erreurs : chaîne vide ou type invalide', () => {
    assert.throws(() => parseRawNote(''), /La note brute doit être une chaîne non vide/);
    assert.throws(() => parseRawNote(null), /La note brute doit être une chaîne non vide/);
  });
});
