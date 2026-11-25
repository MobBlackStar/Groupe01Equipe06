// 💡 Concept & Analogie : Comme le caissier d'un magasin qui valide le reçu de carte bancaire, ce service synchronise le paiement avec Konnect et applique le principe d'idempotence : même si le webhook et le retour client arrivent en même temps, la confirmation n'est exécutée qu'une seule fois.
// 🔄 Comparaison React / Flutter : Point de passage obligé après la passerelle Konnect pour valider la transition vers le billet électronique Living Ticket.
// 🎯 À retenir pour la soutenance : "Notre fonction confirmPayment(orderId, source) est strictement idempotente : un deuxième appel concurrent écrit un événement ALREADY_CONFIRMED sans jamais doubler les compteurs ni les points."
// Module : Paiements & Konnect

import crypto from 'node:crypto';
import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { konnectClient } from './konnect.client.js';
import { fcmService } from '../notifications/fcm.service.js';
import { ORDER_STATUS, PAYMENT_STATUS, REWARD_STATUS } from '../../../../shared/constants.js';
import { rewardKey } from '../../../../shared/loyalty.js';
import { normalizeOrderItems } from '../../../../shared/orders.js';
import { getTunisDayKey } from '../../utils/tunisTime.js';
import { getMerchantTokens } from '../notifications/fcmTokens.js';
import { logger } from '../../utils/logger.js';

export const paymentsService = {
  /**
   * Initialise une session de paiement électronique auprès de Konnect Sandbox.
   */
  async initPayment(orderId, currentUser) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
    }

    const order = orderDoc.data();

    if (order.studentId !== currentUser.uid && currentUser.role !== 'ADMIN') {
      throw new AppError('Accès non autorisé à cette commande', 403, 'FORBIDDEN_RESOURCE');
    }

    if (order.status !== ORDER_STATUS.RESERVED) {
      throw new AppError('Cette commande ne peut plus être payée (statut actuel : ' + order.status + ')', 409, 'ORDER_NOT_PAYABLE');
    }

    // Vérification de validité du créneau de réservation (10 minutes)
    const expiresMs = order.reservationExpiresAt?.toDate
      ? order.reservationExpiresAt.toDate().getTime()
      : new Date(order.reservationExpiresAt).getTime();

    if (Date.now() > expiresMs) {
      throw new AppError('La réservation de 10 minutes a expiré. Veuillez réserver à nouveau.', 410, 'RESERVATION_EXPIRED');
    }

    const totalMillimes = order.pricing?.totalMillimes ?? 0;

    // Cas d'une commande gratuite couverte à 100% par une récompense
    if (totalMillimes === 0) {
      const confirmation = await this.confirmPayment(orderId, 'REWARD');
      return {
        paidWithReward: true,
        order: confirmation.order,
      };
    }

    // Appel à la passerelle Konnect
    const session = await konnectClient.initPayment({
      orderId,
      amountMillimes: totalMillimes,
      description: `Commande ${order.orderCode} - CampusSave`,
      email: currentUser.email,
      phone: currentUser.phone,
    });

    const now = new Date();
    await db.collection('orders').doc(orderId).update({
      'payment.provider': 'KONNECT',
      'payment.status': PAYMENT_STATUS.INITIATED,
      'payment.paymentRef': session.paymentRef,
      'payment.payUrl': session.payUrl,
      'payment.attempts': admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    return {
      payUrl: session.payUrl,
      paymentRef: session.paymentRef,
      orderId,
    };
  },

  /**
   * Confirmation idempotente du paiement (déclenchée par Webhook Konnect, vérification retour client ou récompense).
   */
  async confirmPayment(orderId, source = 'WEBHOOK') {
    const orderRef = db.collection('orders').doc(orderId);
    const now = new Date();
    const todayKey = getTunisDayKey(now.getTime());

    let studentTokens = [];
    let merchantTokens = [];
    let confirmedOrderData = null;

    const result = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
      }

      const order = orderDoc.data();

      // 1. GARANTIE D'IDEMPOTENCE STRICTE
      if (order.status === ORDER_STATUS.PAID || order.status === ORDER_STATUS.COMPLETED) {
        // Enregistrement d'audit pour traçabilité de la tentative redondante
        const eventRef = db.collection('payment_events').doc();
        transaction.set(eventRef, {
          orderId,
          source,
          outcome: 'ALREADY_CONFIRMED',
          currentStatus: order.status,
          timestamp: now,
        });

        return { order, alreadyConfirmed: true };
      }

      if (order.status !== ORDER_STATUS.RESERVED) {
        throw new AppError(
          `Impossible de confirmer la commande : statut invalide (${order.status})`,
          409,
          'INVALID_STATUS'
        );
      }

      // 2. LECTURES DES DOCUMENTS LIÉS DANS LA TRANSACTION
      const items = normalizeOrderItems(order);
      const offerRefs = items.map((it) => db.collection('offers').doc(it.offerId));
      const merchantRef = db.collection('merchants').doc(order.merchantId);
      const merchantDailyRef = merchantRef.collection('daily').doc(todayKey);

      const userRef = order.pricing?.reward?.rewardId ? db.collection('users').doc(order.studentId) : null;
      const [userDoc, ...offerDocs] = await Promise.all([
        userRef ? transaction.get(userRef) : Promise.resolve(null),
        ...offerRefs.map((ref) => transaction.get(ref)),
      ]);

      // 3. GÉNÉRATION DU NONCE CRYPTOGRAPHIQUE POUR LE BILLET (Living Ticket)
      const nonce = crypto.randomBytes(16).toString('base64url');

      // 4. ÉCRITURES ATOMIQUES
      // Mise à jour de la commande
      const history = [...(order.statusHistory || [])];
      history.push({
        status: ORDER_STATUS.PAID,
        timestamp: now,
        note: `Paiement validé avec succès (source : ${source})`,
      });

      const updatedOrder = {
        ...order,
        status: ORDER_STATUS.PAID,
        payment: {
          ...(order.payment || {}),
          status: PAYMENT_STATUS.COMPLETED,
          confirmedVia: source,
          confirmedAt: now,
        },
        ticket: {
          version: 2,
          nonce,
          issuedAt: now,
          windowSeconds: 30,
        },
        statusHistory: history,
        updatedAt: now,
      };

      transaction.update(orderRef, {
        status: ORDER_STATUS.PAID,
        payment: updatedOrder.payment,
        ticket: updatedOrder.ticket,
        statusHistory: history,
        updatedAt: now,
      });

      // Si une récompense a été utilisée, passer son statut à USED
      if (userRef && userDoc?.exists) {
        const userData = userDoc.data();
        const updatedRewards = (userData.unlockedRewards || []).map((r) => {
          if (rewardKey(r) === order.pricing.reward.rewardId) {
            return {
              ...r,
              status: REWARD_STATUS.USED,
              usedAt: now,
              usedInOrderId: orderId,
            };
          }
          return r;
        });
        transaction.update(userRef, { unlockedRewards: updatedRewards, updatedAt: now });
      }

      // Incrémentation des ventes sur toutes les offres de la commande
      for (let i = 0; i < items.length; i += 1) {
        if (offerDocs[i]?.exists) {
          transaction.update(offerRefs[i], {
            quantitySold: admin.firestore.FieldValue.increment(items[i].quantity),
            updatedAt: now,
          });
        }
      }

      // Incrémentation des statistiques du commerçant
      transaction.set(
        merchantRef,
        {
          stats: {
            ordersPaid: admin.firestore.FieldValue.increment(1),
            totalRevenueMillimes: admin.firestore.FieldValue.increment(order.pricing?.totalMillimes || 0),
          },
          updatedAt: now,
        },
        { merge: true }
      );

      transaction.set(
        merchantDailyRef,
        {
          ordersPaid: admin.firestore.FieldValue.increment(1),
          revenueMillimes: admin.firestore.FieldValue.increment(order.pricing?.totalMillimes || 0),
          date: todayKey,
          updatedAt: now,
        },
        { merge: true }
      );

      // Journalisation dans la collection payment_events
      const eventRef = db.collection('payment_events').doc();
      transaction.set(eventRef, {
        orderId,
        source,
        outcome: 'CONFIRMED',
        amountMillimes: order.pricing?.totalMillimes || 0,
        timestamp: now,
      });

      confirmedOrderData = updatedOrder;
      return { order: updatedOrder, confirmed: true };
    });

    // 5. NOTIFICATIONS FCM POST-COMMIT (Hors transaction)
    try {
      if (result.confirmed && !result.alreadyConfirmed) {
        const studentUserDoc = await db.collection('users').doc(result.order.studentId).get();
        if (studentUserDoc.exists) {
          studentTokens = studentUserDoc.data().fcmTokens || [];
        }

        merchantTokens = await getMerchantTokens(result.order.merchantId);

        if (studentTokens.length > 0) {
          await fcmService.notifyTicketReady(studentTokens, result.order.orderCode);
        }
        if (merchantTokens.length > 0) {
          await fcmService.notifyOrderPaid(merchantTokens, result.order.orderCode);
        }
      }
    } catch (pushErr) {
      logger.warn({ err: pushErr.message }, 'Expédition de notification push post-paiement échouée (non bloquante)');
    }

    return result;
  },

  /**
   * Traite le webhook officiel appelé par Konnect.
   */
  async handleWebhook(paymentRef) {
    if (!paymentRef) {
      return { success: false, reason: 'missing_payment_ref' };
    }

    try {
      const paymentDetails = await konnectClient.getPaymentDetails(paymentRef);
      let orderId = paymentDetails.orderId;

      // Si l'orderId n'est pas dans le corps retourné, chercher par paymentRef dans Firestore
      if (!orderId) {
        const snap = await db
          .collection('orders')
          .where('payment.paymentRef', '==', paymentRef)
          .limit(1)
          .get();

        if (!snap.empty) {
          orderId = snap.docs[0].id;
        }
      }

      if (!orderId) {
        logger.warn({ paymentRef }, 'Commande introuvable pour ce webhook Konnect');
        return { success: true, processed: false, reason: 'order_not_found' };
      }

      const status = (paymentDetails.status || '').toLowerCase();
      if (status === 'completed' || status === 'paid' || status === 'success') {
        const result = await this.confirmPayment(orderId, 'WEBHOOK');
        return { success: true, processed: true, ...result };
      } else if (status === 'failed' || status === 'canceled') {
        // En cas d'échec avéré de paiement, libérer le stock
        await this.handlePaymentFailure(orderId, paymentRef, status);
        return { success: true, processed: true, status: 'FAILED' };
      }

      return { success: true, processed: false, status };
    } catch (err) {
      logger.error({ err: err.message, paymentRef }, 'Erreur lors du traitement du webhook Konnect');
      // Le webhook répond toujours 200 pour éviter les retries intempestifs de Konnect
      return { success: true, processed: false, error: err.message };
    }
  },

  /**
   * Vérification de paiement appelée par la page de retour client (`/payment/return`).
   */
  async verifyPayment(orderId, paymentRef) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
    }

    const order = orderDoc.data();

    // Si déjà validée, retour immédiat
    if (order.status === ORDER_STATUS.PAID || order.status === ORDER_STATUS.COMPLETED) {
      return { order, confirmed: true, alreadyConfirmed: true };
    }

    const effectiveRef = paymentRef || order.payment?.paymentRef;
    if (!effectiveRef) {
      throw new AppError('Référence de paiement absente pour cette commande', 400, 'MISSING_PAYMENT_REF');
    }

    const paymentDetails = await konnectClient.getPaymentDetails(effectiveRef);
    const status = (paymentDetails.status || '').toLowerCase();

    if (status === 'completed' || status === 'paid' || status === 'success') {
      const result = await this.confirmPayment(orderId, 'RETURN_VERIFY');
      return { ...result, confirmed: true };
    }

    return {
      order,
      confirmed: false,
      status: paymentDetails.status,
    };
  },

  /**
   * Gestion d'un paiement en échec avec restauration du stock.
   */
  async handlePaymentFailure(orderId, paymentRef, reason) {
    const now = new Date();
    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) return;

      const order = orderDoc.data();
      if (order.status !== ORDER_STATUS.RESERVED) return;

      const offerRef = db.collection('offers').doc(order.offerId);
      const offerDoc = await transaction.get(offerRef);

      // Restituer le stock
      if (offerDoc.exists) {
        const offer = offerDoc.data();
        const restored = (offer.quantityAvailable ?? offer.remainingQuantity ?? 0) + order.quantity;
        transaction.update(offerRef, {
          quantityAvailable: restored,
          remainingQuantity: restored,
          status: offer.status === OFFER_STATUS.SOLD_OUT ? OFFER_STATUS.ACTIVE : offer.status,
          updatedAt: now,
        });
      }

      // Restituer la récompense si verrouillée
      if (order.pricing?.reward?.rewardId) {
        const userRef = db.collection('users').doc(order.studentId);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const updatedRewards = (userDoc.data().unlockedRewards || []).map((r) => {
            if (rewardKey(r) === order.pricing.reward.rewardId && r.status === REWARD_STATUS.LOCKED) {
              return { ...r, status: REWARD_STATUS.AVAILABLE, lockedAt: null };
            }
            return r;
          });
          transaction.update(userRef, { unlockedRewards: updatedRewards, updatedAt: now });
        }
      }

      transaction.update(orderRef, {
        status: ORDER_STATUS.PAYMENT_FAILED,
        'payment.status': PAYMENT_STATUS.FAILED,
        'payment.failureReason': reason,
        statusHistory: [
          ...(order.statusHistory || []),
          { status: ORDER_STATUS.PAYMENT_FAILED, timestamp: now, note: `Échec paiement : ${reason}` },
        ],
        updatedAt: now,
      });
    });
  },
};
