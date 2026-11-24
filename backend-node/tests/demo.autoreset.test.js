// 💡 Concept & Analogie : Le test du commis de nuit : si l'étalage est vide ou périmé, il est remis en place ; s'il est frais, on n'y touche pas.
// 🔄 Comparaison React / Flutter : Vérifie la tâche d'arrière-plan `demoAutoResetSweeper` sur la base en mémoire (jamais sur Firebase).
// 🎯 À retenir pour la soutenance : "Le catalogue de démonstration ne se vide jamais : reset si aucune offre active ou si le dernier reset a plus de 24 h ; désactivé en test et en production sans ALLOW_DEMO_TOKENS."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// GARDE-FOU : base en mémoire uniquement (dotenv n'écrase pas une variable déjà définie)
process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { isFirebaseConfigured, db } = await import('../src/config/firebase.js');
const { runDemoAutoReset, isDemoAutoResetEnabled, countLiveOffers, startDemoAutoResetSweeper } = await import('../src/jobs/demoAutoResetSweeper.js');

describe('Réinitialisation automatique de la démo', { skip: isFirebaseConfigured ? 'refus de toucher une base réelle' : false }, () => {
  test('activation : jamais en test, jamais en production sans ALLOW_DEMO_TOKENS', () => {
    assert.equal(isDemoAutoResetEnabled({ NODE_ENV: 'test' }), false);
    assert.equal(isDemoAutoResetEnabled({ NODE_ENV: 'test', ALLOW_DEMO_TOKENS: 'true' }), false);
    assert.equal(isDemoAutoResetEnabled({ NODE_ENV: 'production' }), false);
    assert.equal(isDemoAutoResetEnabled({ NODE_ENV: 'production', ALLOW_DEMO_TOKENS: 'true' }), true);
    assert.equal(isDemoAutoResetEnabled({ NODE_ENV: 'development' }), true);
    assert.equal(startDemoAutoResetSweeper({ NODE_ENV: 'test' }), null);
  });

  test('données fraîches avec un point de départ déjà enregistré : rien n est touché', async () => {
    await db.collection('platform_meta').doc('demo_state').set({ lastResetAt: new Date() });
    assert.ok((await countLiveOffers()) > 0);
    const result = await runDemoAutoReset();
    assert.equal(result.action, 'skipped');
  });

  test('premier passage sans état mais avec des offres actives : le point de départ est mémorisé sans reset', async () => {
    await db.collection('platform_meta').doc('demo_state').delete();
    const result = await runDemoAutoReset();
    assert.equal(result.action, 'initialized');
    assert.ok((await db.collection('platform_meta').doc('demo_state').get()).exists);
  });

  test('dernier reset il y a plus de 24 h : reset complet, état mis à jour', async () => {
    const old = new Date(Date.now() - 25 * 3600 * 1000);
    await db.collection('platform_meta').doc('demo_state').set({ lastResetAt: old });
    const result = await runDemoAutoReset();
    assert.equal(result.action, 'reset');
    assert.equal(result.reason, 'older-than-24h');
    const state = (await db.collection('platform_meta').doc('demo_state').get()).data();
    assert.ok(new Date(state.lastResetAt).getTime() > old.getTime() + 24 * 3600 * 1000);
    assert.ok((await countLiveOffers()) >= 20);
  });

  test('catalogue vidé (toutes les offres expirées) : reset immédiat qui restaure 20 offres actives', async () => {
    const snap = await db.collection('offers').get();
    for (const d of snap.docs) await d.ref.update({ pickupEndAt: new Date(Date.now() - 60000) });
    assert.equal(await countLiveOffers(), 0);
    const result = await runDemoAutoReset();
    assert.equal(result.action, 'reset');
    assert.equal(result.reason, 'no-live-offers');
    assert.ok((await countLiveOffers()) >= 20);
  });
});
