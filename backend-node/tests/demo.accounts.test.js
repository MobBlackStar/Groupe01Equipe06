// 💡 Concept & Analogie : Comme le contrôle du badge « visiteur » à l'accueil, ces tests vérifient que les jetons de démo ne servent jamais de passe-partout en production.
// 🔄 Comparaison React / Flutter : Garantit côté serveur ce que le web (AuthContext) et le mobile (auth_service.dart) ne peuvent pas garantir seuls : un jeton fabriqué ne donne aucun rôle réel en production.
// 🎯 À retenir pour la soutenance : "Hors développement, `test-token:x:ADMIN` est refusé : l'invariant INV-13 (jamais d'admin par l'API) et la sécurité par rôle (C3) ne dépendent pas de la discipline de déploiement."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { demoTokensAllowed } from '../src/utils/demoAccounts.js';

describe('Jetons de démonstration — garde de production', () => {
  test('autorisés en développement et en test', () => {
    assert.equal(demoTokensAllowed({ NODE_ENV: 'development' }), true);
    assert.equal(demoTokensAllowed({ NODE_ENV: 'test' }), true);
  });

  test('refusés par défaut en production', () => {
    assert.equal(demoTokensAllowed({ NODE_ENV: 'production' }), false);
  });

  test('réactivables en production uniquement par ALLOW_DEMO_TOKENS=true explicite', () => {
    assert.equal(demoTokensAllowed({ NODE_ENV: 'production', ALLOW_DEMO_TOKENS: 'true' }), true);
    assert.equal(demoTokensAllowed({ NODE_ENV: 'development', ALLOW_DEMO_TOKENS: 'false' }), false);
  });
});
