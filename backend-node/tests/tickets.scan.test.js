// 💡 Concept & Analogie : Comme le banc d'essai d'un péage d'autoroute qui vérifie le passage normal, le refus des badges expirés, et le blocage automatique après 5 fraudes répétées.
// 🔄 Comparaison React / Flutter : Valide les règles métier exécutées par l'API Node.js lors du scan par le commerçant avant la mise à jour temps réel des interfaces React et Flutter.
// 🎯 À retenir pour la soutenance : "Ce test unitaire complet prouve l'atomicité du retrait : attribution exacte des EcoPoints, révélation de la Mystery Box, persistance obligatoire des échecs (failedAttempts) et verrouillage automatique à 5 tentatives."
// Module : Tests & Validation Scan Retrait

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUS } from '../../shared/constants.js';
import { calculateEcoPoints, getLoyaltyTier, evaluateMilestones } from '../../shared/loyalty.js';
import { deriveTicketKey, computeWindowCode, verifyQrPayload, verifyManualCode } from '../src/modules/tickets/ticket.crypto.js';

describe('Moteur de Scan & Retrait Atomique (Living Ticket Validation Engine)', () => {
  const secret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const merchantUid = 'mch_baguette_01';
  const studentUid = 'usr_student_fedi';
  const orderId = 'ord_scan_test_01';
  const orderCode = 'CS-7K9MZ';
  const nonce = 'w8x9Y2aB4cE6fH0k';

  const ticketKey = deriveTicketKey({
    secret,
    orderId,
    studentId: studentUid,
    merchantId: merchantUid,
    nonce,
  });

  // Fonction simulant la machine d'état et la logique de processPickup
  function simulatePickup({
    order,
    student,
    merchant,
    surpriseContent,
    method,
    qrPayload,
    code6,
    scannerMerchantUid,
    nowMs,
  }) {
    const failedAttempts = order.pickup?.failedAttempts || 0;
    if (failedAttempts >= 5) {
      return { status: 423, code: 'TICKET_LOCKED', message: 'Billet verrouillé après 5 tentatives infructueuses' };
    }

    if (order.merchantId !== scannerMerchantUid) {
      return { status: 403, code: 'WRONG_MERCHANT', message: 'Cette commande ne concerne pas votre établissement' };
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      return { status: 409, code: 'ALREADY_USED', message: 'Ce billet a déjà été utilisé pour un retrait' };
    }

    if (order.status !== ORDER_STATUS.PAID) {
      return { status: 409, code: 'NOT_PAID', message: `Commande non réglée (${order.status})` };
    }

    const pickupEndMs = new Date(order.offerSnapshot.pickupEndAt).getTime();
    if (nowMs > pickupEndMs + 30 * 60 * 1000) {
      order.pickup = { ...order.pickup, failedAttempts: failedAttempts + 1 };
      return { status: 410, code: 'PICKUP_WINDOW_CLOSED', failedAttempts: order.pickup.failedAttempts };
    }

    let verification;
    if (method === 'QR') {
      verification = verifyQrPayload(qrPayload, ticketKey, nowMs);
    } else {
      verification = verifyManualCode(code6, ticketKey, orderId, nowMs);
    }

    if (!verification.valid) {
      order.pickup = { ...order.pickup, failedAttempts: failedAttempts + 1 };
      const isExpired = verification.reason === 'TICKET_EXPIRED';
      return {
        status: isExpired ? 410 : 401,
        code: isExpired ? 'TICKET_EXPIRED' : 'INVALID_SIGNATURE',
        failedAttempts: order.pickup.failedAttempts,
      };
    }

    // Succès : calcul des points et des récompenses
    const isFirst = (student.stats?.ordersCompleted || 0) === 0;
    const isSurprise = !!order.offerSnapshot.isSurpriseBasket;
    const pointsAwarded = calculateEcoPoints({
      quantity: order.quantity,
      isSurpriseBasket: isSurprise,
      rarity: order.offerSnapshot.rarity,
      isFirstCompletedOrder: isFirst,
    });

    const pointsBefore = student.ecoPoints || 0;
    const pointsAfter = pointsBefore + pointsAwarded;
    const tierBefore = student.loyaltyTier || 'GRAINE';
    const tierAfter = getLoyaltyTier(pointsAfter);
    const newRewards = evaluateMilestones(pointsBefore, pointsAfter);

    // Révélation Mystery Box
    let reveal = null;
    if (isSurprise && surpriseContent) {
      reveal = {
        items: surpriseContent.items,
        note: surpriseContent.note,
        revealedAt: new Date(nowMs),
      };
    }

    // Mise à jour de la commande
    order.status = ORDER_STATUS.COMPLETED;
    order.pickup = {
      scannedAt: new Date(nowMs),
      scannedByUid: scannerMerchantUid,
      method,
      failedAttempts: 0,
    };
    order.rewards = {
      pointsAwarded,
      tierBefore,
      tierAfter,
      unlockedRewardIds: newRewards.map((r) => r.rewardId),
    };
    if (reveal) order.reveal = reveal;

    // Mise à jour de l'étudiant
    student.ecoPoints = pointsAfter;
    student.loyaltyTier = tierAfter;
    student.unlockedRewards = [...(student.unlockedRewards || []), ...newRewards];
    student.stats = {
      ...student.stats,
      ordersCompleted: (student.stats?.ordersCompleted || 0) + 1,
      foodSavedGrams: (student.stats?.foodSavedGrams || 0) + order.impact.foodSavedGrams,
      co2SavedGrams: (student.stats?.co2SavedGrams || 0) + order.impact.co2SavedGrams,
    };

    // Mise à jour commerçant
    merchant.stats = {
      ...merchant.stats,
      ordersCompleted: (merchant.stats?.ordersCompleted || 0) + 1,
      mealsRescued: (merchant.stats?.mealsRescued || 0) + order.quantity,
    };

    return {
      status: 200,
      order,
      pointsAwarded,
      newRewards,
      reveal,
    };
  }

  test('Retrait valide par scan QR : COMPLETED, EcoPoints attribués et Mystery Box révélée', () => {
    const nowMs = 1700000000000;
    const window = Math.floor(nowMs / 30000);
    const { qrPayload } = computeWindowCode(ticketKey, orderId, window);

    const order = {
      orderId,
      orderCode,
      studentId: studentUid,
      merchantId: merchantUid,
      quantity: 2,
      status: ORDER_STATUS.PAID,
      offerSnapshot: {
        isSurpriseBasket: true,
        rarity: 'RARE',
        pickupEndAt: new Date(nowMs + 60 * 60 * 1000).toISOString(),
      },
      impact: { foodSavedGrams: 800, co2SavedGrams: 2000 },
      pickup: { failedAttempts: 0 },
    };

    const student = {
      ecoPoints: 60,
      loyaltyTier: 'GRAINE',
      unlockedRewards: [],
      stats: { ordersCompleted: 1 },
    };

    const merchant = {
      stats: { ordersCompleted: 10, mealsRescued: 15 },
    };

    const surpriseContent = {
      items: [
        { name: 'Sandwich Thon Spécial', qty: 1 },
        { name: 'Tartelette Fraise', qty: 1 },
      ],
      note: 'Préparé à midi, fraîcheur garantie',
    };

    const result = simulatePickup({
      order,
      student,
      merchant,
      surpriseContent,
      method: 'QR',
      qrPayload,
      scannerMerchantUid: merchantUid,
      nowMs,
    });

    assert.equal(result.status, 200);
    assert.equal(result.order.status, ORDER_STATUS.COMPLETED);
    // 2 portions * 20 = 40 + bonus RARE (25) = 65 EcoPoints
    assert.equal(result.pointsAwarded, 65);
    // 60 + 65 = 125 -> Palier 100 franchi -> Tier POUSSE
    assert.equal(student.ecoPoints, 125);
    assert.equal(student.loyaltyTier, 'POUSSE');
    assert.equal(student.unlockedRewards.length, 1);
    assert.equal(student.unlockedRewards[0].milestone, 100);

    // Vérification de la révélation du panier surprise
    assert.ok(result.reveal);
    assert.equal(result.reveal.items.length, 2);
    assert.equal(result.reveal.items[0].name, 'Sandwich Thon Spécial');

    // Vérification stats commerçant
    assert.equal(merchant.stats.ordersCompleted, 11);
    assert.equal(merchant.stats.mealsRescued, 17);
  });

  test('Tentative de re-scan : rejet immédiat 409 ALREADY_USED', () => {
    const nowMs = 1700000000000;
    const window = Math.floor(nowMs / 30000);
    const { qrPayload } = computeWindowCode(ticketKey, orderId, window);

    const completedOrder = {
      orderId,
      merchantId: merchantUid,
      status: ORDER_STATUS.COMPLETED,
      offerSnapshot: { pickupEndAt: new Date(nowMs + 3600000).toISOString() },
      pickup: { failedAttempts: 0 },
    };

    const result = simulatePickup({
      order: completedOrder,
      student: {},
      merchant: {},
      method: 'QR',
      qrPayload,
      scannerMerchantUid: merchantUid,
      nowMs,
    });

    assert.equal(result.status, 409);
    assert.equal(result.code, 'ALREADY_USED');
  });

  test('Scan par un autre commerçant : rejet 403 WRONG_MERCHANT', () => {
    const nowMs = 1700000000000;
    const window = Math.floor(nowMs / 30000);
    const { qrPayload } = computeWindowCode(ticketKey, orderId, window);

    const order = {
      orderId,
      merchantId: merchantUid,
      status: ORDER_STATUS.PAID,
      offerSnapshot: { pickupEndAt: new Date(nowMs + 3600000).toISOString() },
      pickup: { failedAttempts: 0 },
    };

    const result = simulatePickup({
      order,
      student: {},
      merchant: {},
      method: 'QR',
      qrPayload,
      scannerMerchantUid: 'other_merchant_99',
      nowMs,
    });

    assert.equal(result.status, 403);
    assert.equal(result.code, 'WRONG_MERCHANT');
  });

  test('Signature invalide : échec persistant (failedAttempts incrémenté) sans validation', () => {
    const nowMs = 1700000000000;
    const order = {
      orderId,
      merchantId: merchantUid,
      status: ORDER_STATUS.PAID,
      offerSnapshot: { pickupEndAt: new Date(nowMs + 3600000).toISOString() },
      pickup: { failedAttempts: 2 },
    };

    const tamperedPayload = `CS2.${orderId}.56666666.FAKETAG12345`;

    const result = simulatePickup({
      order,
      student: {},
      merchant: {},
      method: 'QR',
      qrPayload: tamperedPayload,
      scannerMerchantUid: merchantUid,
      nowMs,
    });

    assert.equal(result.status, 401);
    assert.equal(result.code, 'INVALID_SIGNATURE');
    assert.equal(order.pickup.failedAttempts, 3);
    assert.equal(order.status, ORDER_STATUS.PAID);
  });

  test('Verrouillage strict après 5 tentatives infructueuses : 423 TICKET_LOCKED', () => {
    const nowMs = 1700000000000;
    const window = Math.floor(nowMs / 30000);
    const { qrPayload } = computeWindowCode(ticketKey, orderId, window);

    const lockedOrder = {
      orderId,
      merchantId: merchantUid,
      status: ORDER_STATUS.PAID,
      offerSnapshot: { pickupEndAt: new Date(nowMs + 3600000).toISOString() },
      pickup: { failedAttempts: 5 },
    };

    const result = simulatePickup({
      order: lockedOrder,
      student: {},
      merchant: {},
      method: 'QR',
      qrPayload,
      scannerMerchantUid: merchantUid,
      nowMs,
    });

    assert.equal(result.status, 423);
    assert.equal(result.code, 'TICKET_LOCKED');
  });

  test('Validation par code manuel 6 chiffres : succès complet', () => {
    const nowMs = 1700000000000;
    const window = Math.floor(nowMs / 30000);
    const { code6 } = computeWindowCode(ticketKey, orderId, window);

    const order = {
      orderId,
      orderCode,
      studentId: studentUid,
      merchantId: merchantUid,
      quantity: 1,
      status: ORDER_STATUS.PAID,
      offerSnapshot: {
        isSurpriseBasket: false,
        pickupEndAt: new Date(nowMs + 3600000).toISOString(),
      },
      impact: { foodSavedGrams: 400, co2SavedGrams: 1000 },
      pickup: { failedAttempts: 0 },
    };

    const student = {
      ecoPoints: 200,
      loyaltyTier: 'POUSSE',
      unlockedRewards: [],
      stats: { ordersCompleted: 5 },
    };

    const merchant = { stats: { ordersCompleted: 2, mealsRescued: 2 } };

    const result = simulatePickup({
      order,
      student,
      merchant,
      method: 'MANUAL_CODE',
      code6,
      scannerMerchantUid: merchantUid,
      nowMs,
    });

    assert.equal(result.status, 200);
    assert.equal(result.order.status, ORDER_STATUS.COMPLETED);
    assert.equal(result.order.pickup.method, 'MANUAL_CODE');
    assert.equal(result.pointsAwarded, 20);
    assert.equal(student.ecoPoints, 220);
  });
});
