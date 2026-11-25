// 💡 Concept & Analogie : Banc d'essai ACID du Sac Mono-Commerçant vérifiant que 1 Sac = 1 Seul Commerce = 1 Transaction Atomique, avec rétrocompatibilité 100 % pour les commandes unitaires existantes.
// 🎯 À retenir pour la soutenance : "Ce test prouve le rejet 422 MIXED_MERCHANTS, le rollback atomique 409 sans perte de stock partielle, l'application exacte de FREE_SURPRISE et le scan multi-lignes avec révélation."
// Module : Tests Sac Mono-Commerçant & Commandes

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { isFirebaseConfigured, db } = await import('../src/config/firebase.js');
const { createOrderSchema } = await import('../src/modules/orders/orders.schemas.js');
const { ordersService } = await import('../src/modules/orders/orders.service.js');
const { paymentsService } = await import('../src/modules/payments/payments.service.js');
const { ticketsService } = await import('../src/modules/tickets/tickets.service.js');
const { generateTicketData, getWindowIndex } = await import('../src/modules/tickets/ticket.crypto.js');
const { runReservationSweeper } = await import('../src/jobs/reservationSweeper.js');
const { normalizeOrderItems } = await import('../../shared/orders.js');
const { OFFER_STATUS, ORDER_STATUS, SURPRISE_RARITY, REWARD_STATUS, REWARD_TYPES } = await import('../../shared/constants.js');

describe('Sac Mono-Commerçant — Transactions Atomiques & Compatibilité Legacy', { skip: isFirebaseConfigured ? 'refus de toucher une base réelle' : false }, () => {
  const merchantA = 'm-bag-test-a';
  const merchantB = 'm-bag-test-b';
  const studentUid = 'usr-bag-student-01';
  const studentUser = { uid: studentUid, name: 'Yassine Bag Test', role: 'STUDENT' };

  async function seedBagScenario() {
    const now = Date.now();
    const start = new Date(now - 30 * 60 * 1000).toISOString();
    const endShort = new Date(now + 120 * 60 * 1000).toISOString();
    const endLong = new Date(now + 240 * 60 * 1000).toISOString();

    await db.collection('merchants').doc(merchantA).set({
      id: merchantA,
      name: 'Baguette Test Montfleury',
      ownerUid: merchantA,
      stats: { ordersPaid: 0, ordersCompleted: 0, revenueMillimes: 0, totalRevenueMillimes: 0, foodSavedGrams: 0, co2SavedGrams: 0, mealsRescued: 0 },
    });

    await db.collection('offers').doc('bag-off-makloub').set({
      id: 'bag-off-makloub',
      merchantId: merchantA,
      merchantSnapshot: { id: merchantA, name: 'Baguette Test Montfleury' },
      title: 'Makloub Escalope',
      category: 'SANDWICH',
      status: OFFER_STATUS.ACTIVE,
      isSurpriseBasket: false,
      quantityAvailable: 5,
      remainingQuantity: 5,
      quantitySold: 0,
      weightGramsPerUnit: 350,
      pickupStartAt: start,
      pickupEndAt: endShort,
      pricing: { mode: 'FIXED', originalPriceMillimes: 7000, discountedPriceMillimes: 3500 },
    });

    await db.collection('offers').doc('bag-off-brik').set({
      id: 'bag-off-brik',
      merchantId: merchantA,
      merchantSnapshot: { id: merchantA, name: 'Baguette Test Montfleury' },
      title: 'Brik Croustillante',
      category: 'PLAT_CHAUD',
      status: OFFER_STATUS.ACTIVE,
      isSurpriseBasket: false,
      quantityAvailable: 2,
      remainingQuantity: 2,
      quantitySold: 0,
      weightGramsPerUnit: 150,
      pickupStartAt: start,
      pickupEndAt: endLong,
      pricing: { mode: 'FIXED', originalPriceMillimes: 3000, discountedPriceMillimes: 1500 },
    });

    await db.collection('offers').doc('bag-off-surprise-common').set({
      id: 'bag-off-surprise-common',
      merchantId: merchantA,
      merchantSnapshot: { id: merchantA, name: 'Baguette Test Montfleury' },
      title: 'Panier Surprise Matin',
      category: 'MIXTE',
      status: OFFER_STATUS.ACTIVE,
      isSurpriseBasket: true,
      rarity: SURPRISE_RARITY.COMMON,
      quantityAvailable: 3,
      remainingQuantity: 3,
      quantitySold: 0,
      weightGramsPerUnit: 400,
      pickupStartAt: start,
      pickupEndAt: endLong,
      pricing: { mode: 'FIXED', originalPriceMillimes: 6000, discountedPriceMillimes: 3000 },
    });

    await db
      .collection('offers')
      .doc('bag-off-surprise-common')
      .collection('private')
      .doc('contents')
      .set({
        items: [
          { name: 'Croissant beurre', quantity: 2 },
          { name: 'Pain au chocolat', quantity: 1 },
        ],
        note: 'Assortiment chaud du matin',
      });

    await db.collection('offers').doc('bag-off-other-merchant').set({
      id: 'bag-off-other-merchant',
      merchantId: merchantB,
      merchantSnapshot: { id: merchantB, name: 'Autre Commerce' },
      title: 'Pizza Reine',
      category: 'PIZZA',
      status: OFFER_STATUS.ACTIVE,
      isSurpriseBasket: false,
      quantityAvailable: 4,
      remainingQuantity: 4,
      weightGramsPerUnit: 500,
      pickupStartAt: start,
      pickupEndAt: endShort,
      pricing: { mode: 'FIXED', originalPriceMillimes: 9000, discountedPriceMillimes: 4500 },
    });

    await db.collection('users').doc(studentUid).set({
      uid: studentUid,
      displayName: 'Yassine Bag Test',
      role: 'STUDENT',
      ecoPoints: 100,
      totalMealsRescued: 0,
      stats: { ordersCompleted: 0, totalSpentMillimes: 0, totalSavedMillimes: 0, foodSavedGrams: 0, co2SavedGrams: 0 },
      unlockedRewards: [
        {
          rewardId: 'rw-bag-percent-20',
          type: REWARD_TYPES.PERCENT_OFF,
          percentOff: 20,
          maxDiscountMillimes: 2000,
          status: REWARD_STATUS.AVAILABLE,
        },
        {
          rewardId: 'rw-bag-free-surprise',
          type: REWARD_TYPES.FREE_SURPRISE,
          maxDiscountMillimes: 4000,
          status: REWARD_STATUS.AVAILABLE,
        },
      ],
    });
  }

  test('1. Rétrocompatibilité schema + createOrder avec format unitaire legacy', async () => {
    await seedBagScenario();
    const parsed = createOrderSchema.parse({ offerId: 'bag-off-makloub', quantity: 2 });
    assert.deepEqual(parsed.items, [{ offerId: 'bag-off-makloub', quantity: 2 }]);

    const { order } = await ordersService.createOrder(studentUser, parsed);
    assert.equal(order.offerId, 'bag-off-makloub');
    assert.equal(order.quantity, 2);
    assert.equal(order.items.length, 1);
    assert.equal(order.pricing.totalMillimes, 7000);
    assert.equal(normalizeOrderItems(order).length, 1);

    const offSnap = await db.collection('offers').doc('bag-off-makloub').get();
    assert.equal(offSnap.data().quantityAvailable, 3);
  });

  test('2. Création multi-offres même commerce avec fusion des doublons et champs racine compatibles', async () => {
    await seedBagScenario();
    const parsed = createOrderSchema.parse({
      items: [
        { offerId: 'bag-off-makloub', quantity: 1 },
        { offerId: 'bag-off-makloub', quantity: 1 },
        { offerId: 'bag-off-brik', quantity: 2 },
      ],
      rewardId: 'rw-bag-percent-20',
    });

    const { order } = await ordersService.createOrder(studentUser, parsed);
    assert.equal(order.items.length, 2);
    assert.equal(order.quantity, 4); // 2 Makloub + 2 Brik
    // Sous-total = 2 * 3500 + 2 * 1500 = 10000 ; 20% = 2000 -> total = 8000
    assert.equal(order.pricing.subtotalMillimes, 10000);
    assert.equal(order.pricing.reward.discountMillimes, 2000);
    assert.equal(order.pricing.totalMillimes, 8000);
    assert.match(order.offerSnapshot.title, /Makloub Escalope \(\+1 article\)/);

    const brikSnap = await db.collection('offers').doc('bag-off-brik').get();
    assert.equal(brikSnap.data().quantityAvailable, 0);
    assert.equal(brikSnap.data().status, OFFER_STATUS.SOLD_OUT);
  });

  test('3. Rejet 422 MIXED_MERCHANTS sans décrémenter aucune offre', async () => {
    await seedBagScenario();
    const parsed = createOrderSchema.parse({
      items: [
        { offerId: 'bag-off-makloub', quantity: 1 },
        { offerId: 'bag-off-other-merchant', quantity: 1 },
      ],
    });

    await assert.rejects(
      () => ordersService.createOrder(studentUser, parsed),
      (err) => err.statusCode === 422 && err.code === 'MIXED_MERCHANTS'
    );

    const makSnap = await db.collection('offers').doc('bag-off-makloub').get();
    const pizzaSnap = await db.collection('offers').doc('bag-off-other-merchant').get();
    assert.equal(makSnap.data().quantityAvailable, 5);
    assert.equal(pizzaSnap.data().quantityAvailable, 4);
  });

  test('4. Rollback complet atomique en 409 OFFER_SOLD_OUT si la 2e offre manque de stock', async () => {
    await seedBagScenario();
    const parsed = createOrderSchema.parse({
      items: [
        { offerId: 'bag-off-makloub', quantity: 2 },
        { offerId: 'bag-off-brik', quantity: 10 }, // stock = 2 seulement
      ],
    });

    await assert.rejects(
      () => ordersService.createOrder(studentUser, parsed),
      (err) => err.statusCode === 409 && err.code === 'OFFER_SOLD_OUT' && /Brik Croustillante/.test(err.message)
    );

    // Le stock de la 1ère offre reste strictement intact
    const makSnap = await db.collection('offers').doc('bag-off-makloub').get();
    assert.equal(makSnap.data().quantityAvailable, 5);
  });

  test('5. Application exacte de FREE_SURPRISE dans un sac mixte + rejet 422 REWARD_UNAVAILABLE sans panier COMMON', async () => {
    await seedBagScenario();

    // Sans panier surprise COMMON -> rejet 422 REWARD_UNAVAILABLE
    await assert.rejects(
      () =>
        ordersService.createOrder(
          studentUser,
          createOrderSchema.parse({
            items: [{ offerId: 'bag-off-makloub', quantity: 1 }],
            rewardId: 'rw-bag-free-surprise',
          })
        ),
      (err) => err.statusCode === 422 && err.code === 'REWARD_UNAVAILABLE'
    );

    // Avec un panier surprise COMMON + makloub -> déduit uniquement 1 unité du panier COMMON (3000 millimes)
    const { order } = await ordersService.createOrder(
      studentUser,
      createOrderSchema.parse({
        items: [
          { offerId: 'bag-off-makloub', quantity: 1 },
          { offerId: 'bag-off-surprise-common', quantity: 2 },
        ],
        rewardId: 'rw-bag-free-surprise',
      })
    );

    // Sous-total = 3500 + 2 * 3000 = 9500 ; remise = 3000 -> total = 6500
    assert.equal(order.pricing.subtotalMillimes, 9500);
    assert.equal(order.pricing.reward.discountMillimes, 3000);
    assert.equal(order.pricing.totalMillimes, 6500);
  });

  test('6. Annulation et Sweeper restaurent toutes les offres du sac et réactivent SOLD_OUT -> ACTIVE', async () => {
    await seedBagScenario();

    // Commande qui épuise bag-off-brik (stock 2 -> 0 SOLD_OUT)
    const { order: cancelledTarget } = await ordersService.createOrder(
      studentUser,
      createOrderSchema.parse({
        items: [
          { offerId: 'bag-off-makloub', quantity: 1 },
          { offerId: 'bag-off-brik', quantity: 2 },
        ],
        rewardId: 'rw-bag-percent-20',
      })
    );

    await ordersService.cancelOrder(cancelledTarget.orderId, studentUid);
    assert.equal((await db.collection('offers').doc('bag-off-makloub').get()).data().quantityAvailable, 5);
    assert.equal((await db.collection('offers').doc('bag-off-brik').get()).data().quantityAvailable, 2);
    assert.equal((await db.collection('offers').doc('bag-off-brik').get()).data().status, OFFER_STATUS.ACTIVE);

    // Test sweeper sur une commande expirée multi-offres
    const { order: expiredTarget } = await ordersService.createOrder(
      studentUser,
      createOrderSchema.parse({
        items: [
          { offerId: 'bag-off-makloub', quantity: 2 },
          { offerId: 'bag-off-brik', quantity: 2 },
        ],
        rewardId: 'rw-bag-percent-20',
      })
    );
    await db.collection('orders').doc(expiredTarget.orderId).update({
      reservationExpiresAt: new Date(Date.now() - 60000),
    });

    await runReservationSweeper();

    const sweptOrder = (await db.collection('orders').doc(expiredTarget.orderId).get()).data();
    assert.equal(sweptOrder.status, ORDER_STATUS.EXPIRED);
    assert.equal((await db.collection('offers').doc('bag-off-makloub').get()).data().quantityAvailable, 5);
    assert.equal((await db.collection('offers').doc('bag-off-brik').get()).data().quantityAvailable, 2);
    assert.equal((await db.collection('offers').doc('bag-off-brik').get()).data().status, OFFER_STATUS.ACTIVE);

    const userData = (await db.collection('users').doc(studentUid).get()).data();
    const rw = userData.unlockedRewards.find((r) => r.rewardId === 'rw-bag-percent-20');
    assert.equal(rw.status, REWARD_STATUS.AVAILABLE);
  });

  test('7. Paiement + Scan QR multi-lignes incrémente quantitySold par offre, révèle le panier surprise et crédite les EcoPoints', async () => {
    await seedBagScenario();
    const { order } = await ordersService.createOrder(
      studentUser,
      createOrderSchema.parse({
        items: [
          { offerId: 'bag-off-makloub', quantity: 1 },
          { offerId: 'bag-off-surprise-common', quantity: 1 },
        ],
      })
    );

    await paymentsService.confirmPayment(order.orderId, 'WEBHOOK');

    assert.equal((await db.collection('offers').doc('bag-off-makloub').get()).data().quantitySold, 1);
    assert.equal((await db.collection('offers').doc('bag-off-surprise-common').get()).data().quantitySold, 1);

    const { ticketKey } = await ordersService.getOrderTicket(order.orderId, studentUser);
    const qr = generateTicketData(ticketKey, order.orderId, getWindowIndex());
    const scanRes = await ticketsService.scanTicket(merchantA, qr.qrPayload);

    assert.equal(scanRes.order.status, ORDER_STATUS.COMPLETED);
    // 2 portions * 20 + bonus surprise COMMON 10 + bonus première commande 30 = 80 EcoPoints
    assert.equal(scanRes.pointsAwarded, 80);
    assert.ok(Array.isArray(scanRes.reveal?.items) && scanRes.reveal.items.length === 2);
  });
});
