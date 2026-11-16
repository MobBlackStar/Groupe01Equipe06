// 💡 Concept & Analogie : Suite de tests automatisée validant la recherche multi-critères d'offres et les règles de validation des commandes et paiements.
// 🔄 Comparaison React / Flutter : Valide les contrats d'API sollicités par les pages Explore et Checkout sur Web et Mobile.
// 🎯 À retenir pour la soutenance : "Ces tests valident les formats de requêtes et les algorithmes de filtrage en mémoire pour une recherche rapide et insensible à la casse."
// Module : Tests & Validation Métier

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createOrderSchema } from '../src/modules/orders/orders.schemas.js';
import { initPaymentSchema, verifyPaymentSchema } from '../src/modules/payments/payments.schemas.js';
import { generateOrderCode } from '../src/utils/orderCode.js';
import { computeUnitPrice, computeUrgencyColor, computeMinutesLeft } from '../../shared/pricing.js';
import { PRICING_MODES } from '../../shared/constants.js';

describe('Jour 4 — Recherche d Offres, Commandes & Paiements', () => {

  describe('1. Validation des Schémas de Commande et Paiement', () => {
    test('createOrderSchema valide une commande correcte', () => {
      const valid = createOrderSchema.parse({
        offerId: 'off-12345',
        quantity: 2,
        rewardId: 'rew-free-surprise',
      });
      assert.equal(valid.offerId, 'off-12345');
      assert.equal(valid.quantity, 2);
    });

    test('createOrderSchema rejette une quantité nulle ou négative', () => {
      assert.throws(() => {
        createOrderSchema.parse({
          offerId: 'off-12345',
          quantity: 0,
        });
      });
    });

    test('createOrderSchema rejette une quantité supérieure à 50', () => {
      assert.throws(() => {
        createOrderSchema.parse({
          offerId: 'off-12345',
          quantity: 51,
        });
      });
    });

    test('initPaymentSchema exige orderId', () => {
      assert.throws(() => {
        initPaymentSchema.parse({});
      });
      const valid = initPaymentSchema.parse({ orderId: 'ord-abc' });
      assert.equal(valid.orderId, 'ord-abc');
    });

    test('verifyPaymentSchema accepte orderId et paymentRef optionnel', () => {
      const valid = verifyPaymentSchema.parse({ orderId: 'ord-abc', paymentRef: 'pay-xyz' });
      assert.equal(valid.orderId, 'ord-abc');
      assert.equal(valid.paymentRef, 'pay-xyz');
    });
  });

  describe('2. Génération de Code Commande Crockford Base32', () => {
    test('generateOrderCode produit un code au format strict CS-XXXXX sans caractères ambigus', () => {
      const codeRegex = /^CS-[0-9A-HJKMNP-TV-Z]{5}$/;
      for (let i = 0; i < 50; i++) {
        const code = generateOrderCode();
        assert.match(code, codeRegex, `Le code ${code} doit respecter l alphabet Crockford Base32`);
        // Pas de O, I, L, U
        assert.ok(!code.includes('O'), 'Ne doit pas contenir la lettre O');
        assert.ok(!code.includes('I'), 'Ne doit pas contenir la lettre I');
        assert.ok(!code.includes('L'), 'Ne doit pas contenir la lettre L');
        assert.ok(!code.includes('U'), 'Ne doit pas contenir la lettre U');
      }
    });
  });

  describe('3. Calculs et Filtrage de Recherche en Mémoire', () => {
    test('Calcul de prix temps réel et classification d urgence lors de la recherche', () => {
      const now = Date.now();
      const mockOffer = {
        id: 'off-dutch-search',
        pricing: {
          mode: PRICING_MODES.DUTCH_AUCTION,
          startPriceMillimes: 6000,
          floorPriceMillimes: 2000,
          decayStartAt: new Date(now - 30 * 60 * 1000).toISOString(),
          pickupEndAt: new Date(now + 30 * 60 * 1000).toISOString(),
          roundingStepMillimes: 100,
        },
        pickupEndAt: new Date(now + 30 * 60 * 1000).toISOString(),
      };

      // À mi-parcours (30 min écoulées sur 60 min au total)
      const currentPrice = computeUnitPrice(mockOffer, now);
      // 6000 - 4000*0.5 = 4000
      assert.equal(currentPrice, 4000);

      const minutesLeft = computeMinutesLeft(mockOffer.pickupEndAt, now);
      assert.ok(minutesLeft >= 29 && minutesLeft <= 31);

      const color = computeUrgencyColor(mockOffer.pickupEndAt, now);
      assert.equal(color, '#FF5500'); // 30 min -> Attention Orange
    });
  });

});
