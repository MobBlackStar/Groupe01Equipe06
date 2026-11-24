// 💡 Concept : Suite de tests d'intégration validant de bout en bout l'autocomplétion d'offres (parseur dialectal, schémas Zod et route Express sécurisée).
// 🎯 Pour la soutenance : "Ces tests prouvent que l'endpoint /ai/offer-autofill applique les contrôles RBAC, accepte les notes tunisiennes avec pluriels et prix, et garantit un JSON strictement conforme au formulaire."

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { parseRawNote } from '../src/modules/ai/fallbackParser.js';
import { aiSuggestionSchema } from '../src/modules/ai/ai.schema.js';
import { aiService } from '../src/modules/ai/ai.service.js';
import { OFFER_CATEGORIES } from '../../shared/constants.js';

describe('Autocomplétion IA — Parseur avancé et intégration HTTP', () => {
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

  test('détecte un panier surprise pâtisserie avec quantité suffixée ("5 pièces")', () => {
    const s = parseRawNote('panier surprise pâtisserie 5 pièces');
    assert.equal(s.isSurpriseBasket, true);
    assert.equal(s.quantityTotal, 5);
    assert.equal(s.category, OFFER_CATEGORIES.MIXTE);
    assert.match(s.surpriseContents, /5x Pâtisserie/);
    assert.doesNotThrow(() => aiSuggestionSchema.parse(s));
  });

  test('aiService.autofillOffer prend en compte closingTime explicite et bascule en fallback', async () => {
    const result = await aiService.autofillOffer('4 makloub escalope', { closingTime: '20:15' });
    assert.equal(result.source, 'fallback');
    assert.equal(result.suggestion.suggestedPickupEndAt, '20:15');
    assert.equal(result.suggestion.suggestedPickupStartAt, '18:15');
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
    assert.equal(data.source, 'fallback');
    assert.equal(data.suggestion.isSurpriseBasket, true);
    assert.equal(data.suggestion.quantityTotal, 7);
    assert.equal(data.suggestion.suggestedPickupEndAt, '17:00');
    assert.doesNotThrow(() => aiSuggestionSchema.parse(data.suggestion));
  });
});
