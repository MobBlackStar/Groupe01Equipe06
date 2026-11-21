// 💡 Concept & Analogie : Comme un test d'endurance vérifiant que la mémoire tampon retient bien les pages consultées et s'efface dès qu'un nouvel article arrive en rayon.
// 🔄 Comparaison React / Flutter : Valide que les requêtes fréquentes du web et du mobile bénéficient d'un cache immédiat sans données obsolètes.
// 🎯 À retenir pour la soutenance : "Ce test garantit l'invalidation automatique du cache 30s à chaque commande ou offre créée."
// Module : Performance & Administration

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readCacheMiddleware, clearReadCache, getReadCacheStats } from '../src/middleware/readCache.js';

describe('Performance Backend — Cache 30s & Invalidation Automatique', () => {
  test('Cache en mémoire : stocke la réponse GET et répond avec HIT sur le second appel', () => {
    clearReadCache();

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development'; // Activer le cache pour le test unitaire

    try {
      let sendCalls = 0;
      const fakeBody = JSON.stringify({ ok: true, data: [1, 2, 3] });

      // 1er appel : MISS
      const req1 = { method: 'GET', originalUrl: '/api/v1/offers?page=1', path: '/api/v1/offers' };
      const headers1 = {};
      const res1 = {
        statusCode: 200,
        setHeader: (k, v) => { headers1[k] = v; },
        send: (b) => { sendCalls++; return b; }
      };

      readCacheMiddleware(req1, res1, () => {});
      res1.send(fakeBody);

      assert.equal(headers1['X-Cache'], 'MISS');
      assert.equal(getReadCacheStats().size, 1);

      // 2ème appel : HIT
      let hitBody = null;
      const headers2 = {};
      const res2 = {
        statusCode: 200,
        setHeader: (k, v) => { headers2[k] = v; },
        send: (b) => { hitBody = b; return b; }
      };

      readCacheMiddleware(req1, res2, () => {
        assert.fail('Ne doit pas appeler next() en cas de cache HIT');
      });

      assert.equal(headers2['X-Cache'], 'HIT');
      assert.equal(hitBody, fakeBody);

      // 3ème appel : Mutation POST -> Invalidation automatique
      const reqPost = { method: 'POST', originalUrl: '/api/v1/orders' };
      const finishCallbacks = [];
      const resPost = {
        statusCode: 201,
        on: (evt, cb) => { if (evt === 'finish') finishCallbacks.push(cb); }
      };

      readCacheMiddleware(reqPost, resPost, () => {});
      finishCallbacks.forEach((cb) => cb());

      assert.equal(getReadCacheStats().size, 0, 'Le cache doit être vidé suite à une mutation réussie');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      clearReadCache();
    }
  });

  test('Routes non cachées : les requêtes privées ne sont pas interceptées par le cache', () => {
    clearReadCache();
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      let nextCalled = false;
      const req = { method: 'GET', originalUrl: '/api/v1/users/me', path: '/api/v1/users/me' };
      const res = { statusCode: 200, setHeader: () => {}, send: (b) => b };

      readCacheMiddleware(req, res, () => { nextCalled = true; });
      assert.equal(nextCalled, true);
      assert.equal(getReadCacheStats().size, 0);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      clearReadCache();
    }
  });
});
