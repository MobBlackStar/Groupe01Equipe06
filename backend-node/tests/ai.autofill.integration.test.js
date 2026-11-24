// 💡 Concept : Suite de tests d'intégration validant de bout en bout l'autocomplétion d'offres (Gemini 2.5 Flash mocké, parseur multilingue FR/EN/derja, schémas Zod et route Express).
// 🎯 Pour la soutenance : "Ces tests prouvent que l'endpoint /ai/offer-autofill appelle Gemini 2.5 Flash avec JSON Schema strict, bascule sur le parseur local en cas de panne réseau, et applique les contrôles RBAC."

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import axios from 'axios';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { parseRawNote } from '../src/modules/ai/fallbackParser.js';
import { aiSuggestionSchema } from '../src/modules/ai/ai.schema.js';
import { aiService } from '../src/modules/ai/ai.service.js';
import { OFFER_CATEGORIES } from '../../shared/constants.js';

describe('Autocomplétion IA — Gemini 2.5 Flash, parseur et intégration HTTP', () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('gère les pluriels français et l heure avec "ferme à 19h30"', () => {
    const s = parseRawNote('3 baguettes farcies croustillantes, ferme à 19h30');
    assert.equal(s.quantityTotal, 3);
    assert.equal(s.category, OFFER_CATEGORIES.SANDWICH);
    assert.equal(s.closingHour, 19);
    assert.equal(s.closingMinute, 30);
    assert.equal(s.suggestedPickupEndAt, '19:30');
    assert.equal(s.suggestedPickupStartAt, '17:30');
    assert.doesNotThrow(() => aiSuggestionSchema.parse(s));
  });

  test('extrait les prix en dinars et déclenche le panier surprise multi-articles', () => {
    const s = parseRawNote('6 croissants et 2 pains au chocolat, prix initial 8dt, ferme à 19h30');
    assert.equal(s.isSurpriseBasket, true);
    assert.equal(s.quantityTotal, 8);
    assert.equal(s.category, OFFER_CATEGORIES.MIXTE);
    assert.equal(s.originalPriceMillimes, 8000);
    assert.equal(s.discountedPriceMillimes, 4800);
    assert.ok(s.startPriceMillimes > s.floorPriceMillimes);
    assert.ok(s.startPriceMillimes <= s.originalPriceMillimes);
    assert.match(s.surpriseContents, /6x Croissant/);
    assert.match(s.surpriseContents, /2x Pain au chocolat/);
    assert.doesNotThrow(() => aiSuggestionSchema.parse(s));
  });

  test('comprend les produits simples en anglais ("eggs", "salad") sans activer le panier surprise', () => {
    const eggs = parseRawNote('eggs');
    assert.equal(eggs.category, OFFER_CATEGORIES.SNACK);
    assert.equal(eggs.isSurpriseBasket, false);
    assert.match(eggs.title, /Œufs/i);

    const salad = parseRawNote('2 fresh salad');
    assert.equal(salad.category, OFFER_CATEGORIES.SALADE);
    assert.equal(salad.isSurpriseBasket, false);
    assert.equal(salad.quantityTotal, 2);
  });

  test('détecte un panier surprise pâtisserie avec quantité suffixée ("5 pièces")', () => {
    const s = parseRawNote('panier surprise pâtisserie 5 pièces');
    assert.equal(s.isSurpriseBasket, true);
    assert.equal(s.quantityTotal, 5);
    assert.equal(s.category, OFFER_CATEGORIES.MIXTE);
    assert.match(s.surpriseContents, /5x Pâtisserie/);
    assert.doesNotThrow(() => aiSuggestionSchema.parse(s));
  });

  test('aiService.autofillOffer appelle Gemini 2.5 Flash quand la clé API est configurée et valide le schéma', async () => {
    const prevProvider = env.AI_PROVIDER;
    const prevKey = env.GEMINI_API_KEY;
    const prevModel = env.AI_MODEL;

    env.AI_PROVIDER = 'gemini';
    env.GEMINI_API_KEY = 'AIzaSyMockedTestKeyForUnitTests';
    env.AI_MODEL = 'gemini-2.5-flash';

    const mockPost = mock.method(axios, 'post', async (url, payload, config) => {
      assert.match(url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent/);
      assert.equal(config.headers['x-goog-api-key'], 'AIzaSyMockedTestKeyForUnitTests');
      assert.equal(payload.generationConfig.responseMimeType, 'application/json');
      assert.ok(payload.generationConfig.responseSchema);

      return {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Boîte de 6 œufs frais fermiers',
                      description: 'Œufs fermiers du jour à sauver avant la fermeture du magasin.',
                      category: 'SNACK',
                      originalPriceMillimes: 4200,
                      discountedPriceMillimes: 2500,
                      pricingMode: 'FIXED',
                      quantityTotal: 2,
                      weightGramsPerUnit: 360,
                      isSurpriseBasket: false,
                      suggestedPickupStartAt: '17:30',
                      suggestedPickupEndAt: '19:30',
                    }),
                  },
                ],
              },
            },
          ],
        },
      };
    });

    try {
      const result = await aiService.autofillOffer('eggs');
      assert.equal(result.source, 'GEMINI');
      assert.equal(result.suggestion.title, 'Boîte de 6 œufs frais fermiers');
      assert.equal(result.suggestion.category, OFFER_CATEGORIES.SNACK);
      assert.equal(result.suggestion.isSurpriseBasket, false);
      assert.equal(result.suggestion.discountedPriceMillimes, 2500);
      assert.equal(mockPost.mock.callCount(), 1);
    } finally {
      mockPost.mock.restore();
      env.AI_PROVIDER = prevProvider;
      env.GEMINI_API_KEY = prevKey;
      env.AI_MODEL = prevModel;
    }
  });

  test('aiService.autofillOffer bascule proprement sur FALLBACK en cas d erreur réseau Gemini', async () => {
    const prevProvider = env.AI_PROVIDER;
    const prevKey = env.GEMINI_API_KEY;

    env.AI_PROVIDER = 'gemini';
    env.GEMINI_API_KEY = 'AIzaSyMockedTestKeyForUnitTests';

    const mockPost = mock.method(axios, 'post', async () => {
      throw new Error('ECONNABORTED timeout exceeded');
    });

    try {
      const result = await aiService.autofillOffer('4 makloub escalope', { closingTime: '20:15' });
      assert.equal(result.source, 'FALLBACK');
      assert.equal(result.suggestion.suggestedPickupEndAt, '20:15');
      assert.equal(result.suggestion.suggestedPickupStartAt, '18:15');
    } finally {
      mockPost.mock.restore();
      env.AI_PROVIDER = prevProvider;
      env.GEMINI_API_KEY = prevKey;
    }
  });

  test('POST /ai/offer-autofill refuse les requêtes non authentifiées (401)', async () => {
    const res = await fetch(`${baseUrl}/ai/offer-autofill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawNote: '4 makloub escalope' }),
    });
    assert.equal(res.status, 401);
  });

  test('POST /ai/offer-autofill interdit le rôle STUDENT (403)', async () => {
    const res = await fetch(`${baseUrl}/ai/offer-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token:student-yassine:STUDENT:etudiant@essect.u-tunis.tn',
      },
      body: JSON.stringify({ rawNote: '4 makloub escalope' }),
    });
    assert.equal(res.status, 403);
  });

  test('POST /ai/offer-autofill rejette une note trop courte (422)', async () => {
    const res = await fetch(`${baseUrl}/ai/offer-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token:m-baguette:MERCHANT:commercant@baguette.tn',
      },
      body: JSON.stringify({ rawNote: 'ab' }),
    });
    assert.equal(res.status, 422);
  });

  test('POST /ai/offer-autofill retourne 200 et une suggestion validée pour un commerçant', async () => {
    const res = await fetch(`${baseUrl}/ai/offer-autofill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token:m-baguette:MERCHANT:commercant@baguette.tn',
      },
      body: JSON.stringify({
        rawNote: '4 makloub escalope + 3 brik, fermeture 17h',
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.source, 'FALLBACK');
    assert.equal(data.suggestion.isSurpriseBasket, true);
    assert.equal(data.suggestion.quantityTotal, 7);
    assert.equal(data.suggestion.suggestedPickupEndAt, '17:00');
    assert.doesNotThrow(() => aiSuggestionSchema.parse(data.suggestion));
  });
});
