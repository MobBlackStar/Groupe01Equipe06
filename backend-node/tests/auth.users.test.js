// 💡 Concept & Analogie : Suite de tests automatisée vérifiant l'étanchéité de nos middlewares d'authentification et de validation Zod.
// 🔄 Comparaison React / Flutter : Valide les contrats serveur que les clients Web et Mobile sollicitent lors de la connexion et du profil.
// 🎯 À retenir pour la soutenance : "Ces tests garantissent que toute tentative d'usurpation de rôle ou de payload invalide est immédiatement rejetée avec le code HTTP adéquat."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate } from '../src/middleware/authenticate.js';
import { requireRole } from '../src/middleware/requireRole.js';
import { requireApprovedMerchant } from '../src/middleware/requireApprovedMerchant.js';
import { validate } from '../src/middleware/validate.js';
import { serverTimeMiddleware } from '../src/middleware/serverTime.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { registerProfileSchema } from '../src/modules/auth/auth.schemas.js';
import { updateProfileSchema, fcmTokenSchema } from '../src/modules/users/users.schemas.js';
import { ROLES, FILIERES } from '../../shared/constants.js';

describe('Jour 2 — Authentification & Middlewares de Sécurité', () => {

  describe('Middleware authenticate', () => {
    test('Rejette les requêtes sans header Authorization', async () => {
      const req = { headers: {} };
      let capturedError = null;
      await authenticate(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 401);
      assert.equal(capturedError.code, 'UNAUTHORIZED');
    });

    test('Rejette les tokens malformés (sans Bearer)', async () => {
      const req = { headers: { authorization: 'Basic 123456' } };
      let capturedError = null;
      await authenticate(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 401);
    });

    test('Accepte et décode un jeton de test valide en environnement test', async () => {
      const req = {
        headers: {
          authorization: 'Bearer test-token:usr-student-42:STUDENT:yassine@essect.u-tunis.tn',
        },
      };
      let nextCalled = false;
      await authenticate(req, {}, (err) => {
        if (!err) nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.ok(req.user);
      assert.equal(req.user.uid, 'usr-student-42');
      assert.equal(req.user.role, 'STUDENT');
      assert.equal(req.user.email, 'yassine@essect.u-tunis.tn');
    });
  });

  describe('Middleware requireRole', () => {
    test('Bloque un utilisateur non authentifié', () => {
      const req = {};
      const middleware = requireRole(ROLES.STUDENT);
      let capturedError = null;
      middleware(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 401);
    });

    test('Bloque un utilisateur dont le rôle n est pas dans la liste autorisée', () => {
      const req = { user: { uid: 'usr-1', role: ROLES.STUDENT } };
      const middleware = requireRole(ROLES.MERCHANT, ROLES.ADMIN);
      let capturedError = null;
      middleware(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 403);
      assert.equal(capturedError.code, 'FORBIDDEN_ROLE');
    });

    test('Autorise un utilisateur possédant le rôle adéquat', () => {
      const req = { user: { uid: 'usr-1', role: ROLES.STUDENT } };
      const middleware = requireRole(ROLES.STUDENT);
      let nextCalled = false;
      middleware(req, {}, (err) => {
        if (!err) nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe('Middleware requireApprovedMerchant', () => {
    test('Bloque un étudiant tentant d accéder à une route commerçant', async () => {
      const req = { user: { uid: 'usr-student-1', role: ROLES.STUDENT } };
      let capturedError = null;
      await requireApprovedMerchant(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 403);
      assert.equal(capturedError.code, 'FORBIDDEN_ROLE');
    });
  });

  describe('Middleware validate (Zod)', () => {
    test('Rejette un corps de requête non conforme avec code 422 et détails', () => {
      const schema = registerProfileSchema;
      const middleware = validate({ body: schema });
      const req = {
        body: {
          role: 'INVALID_ROLE',
          displayName: 'A', // trop court
          phone: '12345', // pas le format tunisien +216
        },
      };
      let capturedError = null;
      middleware(req, {}, (err) => { capturedError = err; });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 422);
      assert.equal(capturedError.code, 'VALIDATION_ERROR');
      assert.ok(Array.isArray(capturedError.details));
      assert.ok(capturedError.details.length >= 2);
    });

    test('Accepte un corps de requête parfaitement valide', () => {
      const schema = registerProfileSchema;
      const middleware = validate({ body: schema });
      const req = {
        body: {
          role: ROLES.STUDENT,
          displayName: 'Yassine Trabelsi',
          phone: '+21698123456',
          filiereId: FILIERES.EBUS,
        },
      };
      let nextCalled = false;
      middleware(req, {}, (err) => {
        if (!err) nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe('Middleware serverTime', () => {
    test('Injecte automatiquement l horodatage serveur dans les réponses JSON', () => {
      let sentBody = null;
      const res = {
        json(body) {
          sentBody = body;
          return this;
        },
      };
      serverTimeMiddleware({}, res, () => {});
      res.json({ success: true, data: [1, 2, 3] });

      assert.ok(sentBody);
      assert.equal(sentBody.success, true);
      assert.equal(typeof sentBody.serverTime, 'number');
      assert.ok(sentBody.serverTime > 0);
    });
  });

  describe('Middleware errorHandler', () => {
    test('Produit une enveloppe d erreur uniforme { error: { code, message, details }, serverTime }', () => {
      const customErr = {
        statusCode: 409,
        code: 'PROFILE_EXISTS',
        message: 'Un profil existe déjà',
        details: null,
      };
      let responseStatus = null;
      let responseJson = null;

      const res = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(payload) {
          responseJson = payload;
          return this;
        },
      };

      errorHandler(customErr, { originalUrl: '/api/v1/auth/register-profile', method: 'POST' }, res, () => {});

      assert.equal(responseStatus, 409);
      assert.ok(responseJson.error);
      assert.equal(responseJson.error.code, 'PROFILE_EXISTS');
      assert.equal(responseJson.error.message, 'Un profil existe déjà');
      assert.ok(responseJson.serverTime);
    });
  });

  describe('Validation des schémas Zod Auth & Users', () => {
    test('registerProfileSchema interdit strictement le rôle ADMIN', () => {
      assert.throws(() => {
        registerProfileSchema.parse({
          role: 'ADMIN',
          displayName: 'Hacker Attempt',
        });
      });
    });

    test('updateProfileSchema valide le téléphone tunisien au format +216XXXXXXXX', () => {
      const valid = updateProfileSchema.parse({
        displayName: 'Fedi Touati',
        phone: '+21622345678',
      });
      assert.equal(valid.phone, '+21622345678');

      assert.throws(() => {
        updateProfileSchema.parse({ phone: '0612345678' });
      });
    });

    test('fcmTokenSchema requiert un jeton d au moins 10 caractères', () => {
      const valid = fcmTokenSchema.parse({ token: 'fcm_token_abcdef_123456' });
      assert.equal(valid.token, 'fcm_token_abcdef_123456');

      assert.throws(() => {
        fcmTokenSchema.parse({ token: 'court' });
      });
    });
  });
});
