// 💡 Concept & Analogie : Le contrôle du standard téléphonique : chaque appareil est bien enregistré, le bon numéro est composé, et le message porte la sonnerie « haute importance ».
// 🔄 Comparaison React / Flutter : Vérifie côté serveur ce que `fcm_service.dart` (mobile) et le service worker (web) attendent : jetons, canal Android, route au toucher.
// 🎯 À retenir pour la soutenance : "Les jetons du compte démo commerçant sont retrouvés par la boutique ; la charge utile contient priorité haute, canal campussave_high_importance et Web Push ; le test d'envoi renvoie un diagnostic."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// GARDE-FOU : base et messagerie en mémoire uniquement
process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { isFirebaseConfigured, messaging } = await import('../src/config/firebase.js');
const { usersService } = await import('../src/modules/users/users.service.js');
const { fcmService, buildFcmMessage, ANDROID_CHANNEL_ID } = await import('../src/modules/notifications/fcm.service.js');
const { getMerchantTokens, getUserTokens } = await import('../src/modules/notifications/fcmTokens.js');

const STUDENT_TOKEN = 'student-device-token-0001';
const MERCHANT_TOKEN = 'merchant-device-token-0002';

describe('Notifications push FCM', { skip: isFirebaseConfigured ? 'refus de toucher une base réelle' : false }, () => {
  test('charge utile : priorité haute Android, canal haute importance, Web Push et route au toucher', () => {
    const msg = buildFcmMessage({ title: 'T', body: 'B', data: { type: 'ORDER_PAID', orderCode: 'CS-1', minutes: 30 } });
    assert.deepEqual(msg.notification, { title: 'T', body: 'B' });
    assert.equal(msg.android.priority, 'high');
    assert.equal(msg.android.notification.channelId, 'campussave_high_importance');
    assert.equal(ANDROID_CHANNEL_ID, 'campussave_high_importance');
    assert.equal(msg.android.notification.sound, 'default');
    assert.equal(msg.webpush.headers.Urgency, 'high');
    assert.equal(msg.data.route, '/merchant/orders');
    for (const v of Object.values(msg.data)) assert.equal(typeof v, 'string', 'FCM exige des valeurs `data` en chaînes');
  });

  test('chaque type d événement du cycle de vie a sa route', () => {
    const routes = Object.fromEntries(['ORDER_PAID', 'TICKET_READY', 'ORDER_COMPLETED', 'REWARD_UNLOCKED', 'MERCHANT_STATUS', 'PICKUP_REMINDER', 'NEW_OFFER'].map((type) => [type, buildFcmMessage({ title: 'x', body: 'y', data: { type } }).data.route]));
    for (const [type, route] of Object.entries(routes)) assert.match(route, /^\//, `route manquante pour ${type}`);
  });

  test('jetons enregistrés pour l étudiant démo et le commerçant démo (alias de la boutique), sans doublon', async () => {
    await usersService.addFcmToken('student-yassine', STUDENT_TOKEN);
    await usersService.addFcmToken('student-yassine', STUDENT_TOKEN);
    await usersService.addFcmToken('m-baguette', MERCHANT_TOKEN);
    assert.deepEqual(await getUserTokens('student-yassine'), [STUDENT_TOKEN]);
    assert.deepEqual(await getMerchantTokens('merchant-baguette-baguette'), [MERCHANT_TOKEN]);
    await usersService.removeFcmToken('student-yassine', STUDENT_TOKEN);
    assert.deepEqual(await getUserTokens('student-yassine'), []);
  });

  test('ORDER_PAID atteint l appareil du commerçant démo avec la charge utile complète', async () => {
    const sent = [];
    const original = messaging.sendEachForMulticast.bind(messaging);
    messaging.sendEachForMulticast = async (message) => {
      sent.push(message);
      return original(message);
    };
    try {
      const tokens = await getMerchantTokens('merchant-baguette-baguette');
      const result = await fcmService.notifyOrderPaid(tokens, 'CS-TEST1');
      assert.equal(result.sentCount, 1);
      assert.deepEqual(sent[0].tokens, [MERCHANT_TOKEN]);
      assert.equal(sent[0].android.notification.channelId, ANDROID_CHANNEL_ID);
      assert.equal(sent[0].data.type, 'ORDER_PAID');
      assert.equal(sent[0].data.orderCode, 'CS-TEST1');
    } finally {
      messaging.sendEachForMulticast = original;
    }
  });

  test('fcm-test : sans appareil -> diagnostic clair ; avec appareil -> compteurs et mode', async () => {
    const none = await usersService.sendFcmTest('student-ines');
    assert.equal(none.ok, false);
    assert.equal(none.tokensCount, 0);
    assert.match(none.diagnostics, /Aucun appareil/);

    const merchant = await usersService.sendFcmTest('m-baguette', 'MERCHANT');
    assert.equal(merchant.tokensCount, 1);
    assert.equal(merchant.sentCount, 1);
    assert.equal(merchant.failedCount, 0);
    assert.equal(merchant.mode, 'memory');
    assert.match(merchant.diagnostics, /mode mémoire/);
  });

  test('un jeton refusé par Firebase est compté en échec avec son code', async () => {
    const original = messaging.sendEachForMulticast;
    messaging.sendEachForMulticast = async (m) => ({
      successCount: 0,
      failureCount: m.tokens.length,
      responses: m.tokens.map(() => ({ success: false, error: { code: 'messaging/registration-token-not-registered' } })),
    });
    try {
      const r = await fcmService.sendToTokens(['dead-token-1234567890'], { title: 'a', body: 'b', data: { type: 'TEST' } });
      assert.equal(r.failedCount, 1);
      assert.equal(r.errors[0].code, 'messaging/registration-token-not-registered');
    } finally {
      messaging.sendEachForMulticast = original;
    }
  });
});
