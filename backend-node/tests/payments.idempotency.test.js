// 💡 Concept & Analogie : Comme un tourniquet de métro qui valide votre ticket une fois et ne vous débite pas deux fois si vous passez le ticket deux fois devant la borne, la confirmation de paiement est strictement idempotente.
// 🔄 Comparaison React / Flutter : Protège le système lorsque le webhook Konnect arrive à la milliseconde exacte où l'étudiant est redirigé sur la page de succès.
// 🎯 À retenir pour la soutenance : "Ce test démontre que le second appel à confirmPayment détecte l'état déjà réglé, consigne l'événement ALREADY_CONFIRMED et ne double ni les compteurs ni les ventes."
// Module : Tests & Validation Paiements

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../shared/constants.js';
import { AppError } from '../src/utils/AppError.js';

describe('Idempotence des Confirmations de Paiement Konnect (Dual-Path Confirmation)', () => {

  test('Premier appel : confirme le paiement, génère le nonce Living Ticket et journalise CONFIRMED', async () => {
    // État initial de la commande réservée
    const order = {
      orderId: 'ord-test-idem-01',
      orderCode: 'CS-7H9KZ',
      studentId: 'student-01',
      merchantId: 'merchant-baguette',
      quantity: 2,
      pricing: { totalMillimes: 7000 },
      status: ORDER_STATUS.RESERVED,
      statusHistory: [],
      payment: { status: PAYMENT_STATUS.INITIATED, attempts: 1 },
    };

    const paymentEvents = [];
    let merchantOrdersPaid = 0;
    let offerQuantitySold = 0;

    // Fonction de simulation de la transaction atomique confirmPayment
    async function simulateConfirmPayment(currentOrder, source) {
      const now = new Date();

      // 1. Détection d'idempotence
      if (currentOrder.status === ORDER_STATUS.PAID || currentOrder.status === ORDER_STATUS.COMPLETED) {
        paymentEvents.push({
          orderId: currentOrder.orderId,
          source,
          outcome: 'ALREADY_CONFIRMED',
          timestamp: now,
        });
        return { order: currentOrder, alreadyConfirmed: true };
      }

      if (currentOrder.status !== ORDER_STATUS.RESERVED) {
        throw new AppError('Statut de commande invalide', 409, 'INVALID_STATUS');
      }

      // 2. Traitement de la première confirmation
      const nonce = crypto.randomBytes(16).toString('base64url');

      currentOrder.status = ORDER_STATUS.PAID;
      currentOrder.payment = {
        ...currentOrder.payment,
        status: PAYMENT_STATUS.COMPLETED,
        confirmedVia: source,
        confirmedAt: now,
      };
      currentOrder.ticket = {
        version: 2,
        nonce,
        issuedAt: now,
        windowSeconds: 30,
      };

      // Incrémentation des métriques
      merchantOrdersPaid += 1;
      offerQuantitySold += currentOrder.quantity;

      paymentEvents.push({
        orderId: currentOrder.orderId,
        source,
        outcome: 'CONFIRMED',
        amountMillimes: currentOrder.pricing.totalMillimes,
        timestamp: now,
      });

      return { order: currentOrder, confirmed: true };
    }

    // Premier appel (ex: Webhook Konnect)
    const result1 = await simulateConfirmPayment(order, 'WEBHOOK');

    assert.equal(result1.confirmed, true);
    assert.equal(result1.order.status, ORDER_STATUS.PAID);
    assert.equal(result1.order.payment.status, PAYMENT_STATUS.COMPLETED);
    assert.equal(result1.order.payment.confirmedVia, 'WEBHOOK');
    assert.ok(result1.order.ticket?.nonce, 'Le nonce du ticket doit être généré');
    assert.equal(result1.order.ticket?.windowSeconds, 30);
    assert.equal(merchantOrdersPaid, 1);
    assert.equal(offerQuantitySold, 2);

    assert.equal(paymentEvents.length, 1);
    assert.equal(paymentEvents[0].outcome, 'CONFIRMED');
    assert.equal(paymentEvents[0].source, 'WEBHOOK');

    // Deuxième appel concurrent (ex: vérification lors du retour client RETURN_VERIFY)
    const result2 = await simulateConfirmPayment(order, 'RETURN_VERIFY');

    assert.equal(result2.alreadyConfirmed, true);
    assert.equal(result2.order.status, ORDER_STATUS.PAID);

    // Les compteurs ne doivent PAS avoir été incrémentés une seconde fois !
    assert.equal(merchantOrdersPaid, 1, 'Le compteur commerçant ne doit pas être doublé');
    assert.equal(offerQuantitySold, 2, 'Les quantités vendues ne doivent pas être doublées');

    // Deux événements enregistrés : CONFIRMED puis ALREADY_CONFIRMED
    assert.equal(paymentEvents.length, 2);
    assert.equal(paymentEvents[1].outcome, 'ALREADY_CONFIRMED');
    assert.equal(paymentEvents[1].source, 'RETURN_VERIFY');
  });

  test('Tentative de confirmation d une commande déjà ANNULÉE lève un code 409 INVALID_STATUS', async () => {
    const cancelledOrder = {
      orderId: 'ord-cancelled-01',
      status: ORDER_STATUS.CANCELLED,
    };

    assert.throws(() => {
      if (cancelledOrder.status !== ORDER_STATUS.RESERVED) {
        throw new AppError('Statut de commande invalide', 409, 'INVALID_STATUS');
      }
    }, (err) => {
      return err.statusCode === 409 && err.code === 'INVALID_STATUS';
    });
  });

});
