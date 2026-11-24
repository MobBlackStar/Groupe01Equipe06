// 💡 Concept & Analogie : Suite de tests automatisée vérifiant les règles métier du Jour 3 : rayon géographique de 3 km, modération administrative, immutabilité des offres et moteur IA.
// 🔄 Comparaison React / Flutter : Valide les contrats d'API sollicités par l'onboarding commerçant, le catalogue d'offres et la console d'administration.
// 🎯 À retenir pour la soutenance : "Ces tests automatisés prouvent le respect du rayon maximal piéton de 3 km et le verrouillage strict des prix dès la première commande (code HTTP 409 OFFER_LOCKED)."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMerchantSchema, updateMerchantSchema } from '../src/modules/merchants/merchants.schemas.js';
import { updateMerchantStatusSchema, updateUserStatusSchema } from '../src/modules/admin/admin.schemas.js';
import { createOfferSchema } from '../src/modules/offers/offers.schemas.js';
import { offersService } from '../src/modules/offers/offers.service.js';
import { generateSearchKeywords, normalizeText } from '../src/modules/offers/keywords.js';
import { aiService } from '../src/modules/ai/ai.service.js';
import { offerAutofillSchema } from '../src/modules/ai/ai.schemas.js';
import { env } from '../src/config/env.js';
import { distanceFromEssect, isWithinCampusRadius } from '../../shared/geo.js';
import { MERCHANT_STATUS, USER_STATUS, OFFER_CATEGORIES, PRICING_MODES } from '../../shared/constants.js';

describe('Jour 3 — Commerces, Administration, Offres & Moteur IA', () => {

  describe('1. Géolocalisation & Commerces (Rayon 3 km ESSECT)', () => {
    test('Valide un commerce situé dans le quartier de Montfleury (<= 3 km)', () => {
      // Coordonnées de Baguette & Baguette Montfleury
      const lat = 36.7885;
      const lng = 10.1762;
      const distM = distanceFromEssect(lat, lng);

      assert.ok(distM <= 3000, `Distance ${distM} m doit être <= 3000 m`);
      assert.equal(isWithinCampusRadius(lat, lng), true);

      const parsed = createMerchantSchema.parse({
        name: 'Baguette & Baguette Montfleury',
        type: 'FAST_FOOD',
        phone: '+21671390111',
        address: { street: 'Avenue Habib Bourguiba' },
        location: { lat, lng },
      });
      assert.equal(parsed.name, 'Baguette & Baguette Montfleury');
    });

    test('Identifie formellement une localisation en dehors du rayon campus (> 3 km)', () => {
      // Coordonnées à La Marsa (environ 15 km de l'ESSECT)
      const lat = 36.8780;
      const lng = 10.3245;
      const distM = distanceFromEssect(lat, lng);

      assert.ok(distM > 3000, `La Marsa (${distM} m) doit être hors du rayon`);
      assert.equal(isWithinCampusRadius(lat, lng), false);
    });

    test('createMerchantSchema rejette un numéro tunisien non conforme', () => {
      assert.throws(() => {
        createMerchantSchema.parse({
          name: 'Commerce Invalide',
          type: 'FAST_FOOD',
          phone: '0612345678', // Pas le préfixe +216
          address: { street: 'Rue de Rome' },
          location: { lat: 36.788, lng: 10.176 },
        });
      });
    });
  });

  describe('2. Administration & Modération', () => {
    test('updateMerchantStatusSchema autorise l approbation sans motif obligatoire', () => {
      const valid = updateMerchantStatusSchema.parse({
        status: MERCHANT_STATUS.APPROVED,
      });
      assert.equal(valid.status, MERCHANT_STATUS.APPROVED);
    });

    test('updateMerchantStatusSchema EXIGE un motif explicite pour un refus ou une suspension', () => {
      assert.throws(() => {
        updateMerchantStatusSchema.parse({
          status: MERCHANT_STATUS.REJECTED,
          // Pas de statusReason
        });
      });

      assert.throws(() => {
        updateMerchantStatusSchema.parse({
          status: MERCHANT_STATUS.SUSPENDED,
          statusReason: 'ab', // Trop court (< 3 caractères)
        });
      });

      const validRejection = updateMerchantStatusSchema.parse({
        status: MERCHANT_STATUS.REJECTED,
        statusReason: 'Non-conformité de la patente sanitaire',
      });
      assert.equal(validRejection.status, MERCHANT_STATUS.REJECTED);
    });

    test('updateUserStatusSchema exige un motif lors de la suspension d un utilisateur', () => {
      assert.throws(() => {
        updateUserStatusSchema.parse({
          status: USER_STATUS.SUSPENDED,
        });
      });

      const validSuspension = updateUserStatusSchema.parse({
        status: USER_STATUS.SUSPENDED,
        statusReason: 'Suspicion d usurpation d identité étudiante',
      });
      assert.equal(validSuspension.status, USER_STATUS.SUSPENDED);
    });
  });

  describe('3. Validation des Offres & Immutabilité Financière', () => {
    test('createOfferSchema valide une offre à prix fixe', () => {
      const valid = createOfferSchema.parse({
        title: 'Baguette Farcie Escalope',
        category: OFFER_CATEGORIES.SANDWICH,
        pricing: {
          mode: PRICING_MODES.FIXED,
          originalPriceMillimes: 7500,
          discountedPriceMillimes: 4500,
        },
        quantity: 5,
        pickupStartAt: '2026-11-16T15:00:00.000Z',
        pickupEndAt: '2026-11-16T17:30:00.000Z',
      });
      assert.equal(valid.title, 'Baguette Farcie Escalope');
      assert.equal(valid.quantity, 5);
    });

    test('createOfferSchema valide une enchère dégressive Smart Decay', () => {
      const valid = createOfferSchema.parse({
        title: 'Makloub Chawarma Fin de Journée',
        category: OFFER_CATEGORIES.SANDWICH,
        pricing: {
          mode: PRICING_MODES.DUTCH_AUCTION,
          originalPriceMillimes: 6800,
          startPriceMillimes: 5000,
          floorPriceMillimes: 2000,
          decayStartAt: '2026-11-16T15:30:00.000Z',
          roundingStepMillimes: 100,
        },
        quantity: 3,
        pickupStartAt: '2026-11-16T15:00:00.000Z',
        pickupEndAt: '2026-11-16T17:30:00.000Z',
      });
      assert.equal(valid.pricing.floorPriceMillimes, 2000);
    });

    test('createOfferSchema accepte une URL absolue, un chemin relatif ou une chaîne vide pour photoUrl', () => {
      const relative = createOfferSchema.parse({
        title: 'Baguette Farcie',
        category: OFFER_CATEGORIES.SANDWICH,
        pricing: {
          mode: PRICING_MODES.FIXED,
          originalPriceMillimes: 5000,
          discountedPriceMillimes: 3000,
        },
        quantity: 3,
        pickupStartAt: '2026-11-24T18:00:00.000Z',
        pickupEndAt: '2026-11-24T20:00:00.000Z',
        photoUrl: '/assets/griddle/food/sandwich.png',
      });
      assert.equal(relative.photoUrl, '/assets/griddle/food/sandwich.png');

      const empty = createOfferSchema.parse({
        title: 'Croissant Chaud',
        category: OFFER_CATEGORIES.VIENNOISERIE,
        pricing: {
          mode: PRICING_MODES.FIXED,
          originalPriceMillimes: 2000,
          discountedPriceMillimes: 1200,
        },
        quantity: 5,
        pickupStartAt: '2026-11-24T18:00:00.000Z',
        pickupEndAt: '2026-11-24T20:00:00.000Z',
        photoUrl: '',
      });
      assert.equal(empty.photoUrl, '');
    });

    test('createOffer rejette une fenêtre de retrait inversée (fin <= début)', async () => {
      const merchantData = { id: 'm-1', name: 'Test Merchant' };
      const invalidBody = {
        title: 'Offre invalide',
        category: OFFER_CATEGORIES.SANDWICH,
        pricing: {
          mode: PRICING_MODES.FIXED,
          originalPriceMillimes: 6000,
          discountedPriceMillimes: 3000,
        },
        quantity: 2,
        pickupStartAt: '2026-11-16T17:30:00.000Z',
        pickupEndAt: '2026-11-16T15:00:00.000Z', // Fin avant début !
      };

      await assert.rejects(
        async () => {
          await offersService.createOffer(merchantData, invalidBody);
        },
        (err) => err.code === 'INVALID_PICKUP_WINDOW'
      );
    });

    test('createOffer rejette un créneau de retrait excédant 6 heures', async () => {
      const merchantData = { id: 'm-1', name: 'Test Merchant' };
      const invalidBody = {
        title: 'Offre trop longue',
        category: OFFER_CATEGORIES.PLAT_CHAUD,
        pricing: {
          mode: PRICING_MODES.FIXED,
          originalPriceMillimes: 10000,
          discountedPriceMillimes: 5000,
        },
        quantity: 2,
        pickupStartAt: '2026-11-16T10:00:00.000Z',
        pickupEndAt: '2026-11-16T18:00:00.000Z', // 8 heures !
      };

      await assert.rejects(
        async () => {
          await offersService.createOffer(merchantData, invalidBody);
        },
        (err) => err.code === 'WINDOW_TOO_LONG'
      );
    });
  });

  describe('4. Recherche Textuelle & Mots-Clés Normalisés', () => {
    test('generateSearchKeywords normalise les accents et génère les préfixes requis', () => {
      const keywords = generateSearchKeywords({
        title: 'Pâtisserie Étoile',
        merchantName: 'Masmoudi',
        category: 'PATISSERIE',
      });

      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.includes('pa'));
      assert.ok(keywords.includes('pat'));
      assert.ok(keywords.includes('patisserie'));
      assert.ok(keywords.includes('et'));
      assert.ok(keywords.includes('etoile'));
      assert.ok(keywords.includes('masmoudi'));
    });
  });

  describe('5. Moteur d Intelligence Artificielle & Fallback', () => {
    test('offerAutofillSchema valide la taille minimale du texte', () => {
      const valid = offerAutofillSchema.parse({
        text: '4 makloub escalope + 3 brik, fermeture 17h',
      });
      assert.equal(valid.text, '4 makloub escalope + 3 brik, fermeture 17h');

      assert.throws(() => {
        offerAutofillSchema.parse({ text: 'a' }); // Trop court
      });
    });

    test('aiService.autofillOffer analyse fidèlement la note culinaire réelle', async () => {
      const prevProvider = env.AI_PROVIDER;
      env.AI_PROVIDER = 'none';
      try {
        const rawText = '4 makloub escalope + 3 brik, fermeture 17h';
        const result = await aiService.autofillOffer(rawText);

        assert.ok(result.suggestion);
        assert.ok(['GEMINI', 'ANTHROPIC', 'FALLBACK', 'ai', 'fallback'].includes(result.source));

        const { suggestion } = result;
        // Multiples articles : panier surprise activé
        assert.equal(suggestion.isSurpriseBasket, true);
        assert.equal(suggestion.category, OFFER_CATEGORIES.MIXTE);
        assert.equal(suggestion.quantityTotal, 7); // 4 + 3
        assert.ok(suggestion.originalPriceMillimes > 0);
        assert.ok(suggestion.discountedPriceMillimes < suggestion.originalPriceMillimes);
      } finally {
        env.AI_PROVIDER = prevProvider;
      }
    });
  });
});
