// 💡 Concept & Analogie : Comme le contrôleur de billets à bord d'un TGV qui valide le pass dynamique et débloque instantanément les points fidélité et le badge de voyageur, ce service gère le retrait physique avec une transaction atomique totale.
// 🔄 Comparaison React / Flutter : Déclenché par la caméra ou le formulaire de secours du commerçant sur Web ou Mobile ; la mise à jour temps réel Firestore réveille instantanément l'écran de l'étudiant.
// 🎯 À retenir pour la soutenance : "La transaction de validation est le cœur de notre application : elle vérifie la cryptographie HMAC en temps constant, met à jour 5 collections de façon atomique et débloque le contenu mystère."
// Module : Cryptographie & Retrait de Commandes

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { ORDER_STATUS } from '../../../../shared/constants.js';
import { calculateEcoPoints, getLoyaltyTier, getNextRewardMilestone, evaluateMilestones } from '../../../../shared/loyalty.js';
import { getTunisDayKey } from '../../utils/tunisTime.js';
import { deriveTicketKey, verifyQrPayload, verifyManualCode } from './ticket.crypto.js';
import { fcmService } from '../notifications/fcm.service.js';

export const ticketsService = {
  /**
   * Validation d'un retrait par scan de QR code dynamique rotatif 30s.
   */
  async scanTicket(merchantUid, qrPayload) {
    if (!qrPayload || typeof qrPayload !== 'string') {
      throw new AppError('Format de QR code invalide', 400, 'INVALID_QR_FORMAT');
    }

    const parts = qrPayload.split('.');
    if (parts.length !== 4 || parts[0] !== 'CS2') {
      throw new AppError('Version ou format de QR code non supporté', 400, 'UNSUPPORTED_VERSION');
    }

    const orderId = parts[1];
    if (!orderId) {
      throw new AppError('Identifiant de commande manquant dans le QR code', 400, 'INVALID_QR_FORMAT');
    }

    return this.processPickup({
      merchantUid,
      orderId,
      method: 'QR',
      qrPayload,
    });
  },

  /**
   * Validation d'un retrait par saisie de secours du code commande et du code à 6 chiffres.
   */
  async redeemCode(merchantUid, orderCode, code6) {
    const snap = await db
      .collection('orders')
      .where('orderCode', '==', orderCode)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new AppError('Commande introuvable pour ce code', 404, 'ORDER_NOT_FOUND');
    }

    const orderId = snap.docs[0].id;

    return this.processPickup({
      merchantUid,
      orderId,
      method: 'MANUAL_CODE',
      code6,
    });
  },

  /**
   * Cœur transactionnel atomique du retrait (Diagramme de séquence 08).
   * Toutes les lectures précèdent strictement les écritures.
   * En cas de refus, l'incrément de failedAttempts est persisté.
   */
  async processPickup({ merchantUid, orderId, method, qrPayload, code6 }) {
    const orderRef = db.collection('orders').doc(orderId);
    const now = new Date();
    const nowMs = now.getTime();
    const todayKey = getTunisDayKey(nowMs);

    const txResult = await db.runTransaction(async (transaction) => {
      // 1. LECTURE INITIALE DE LA COMMANDE
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
      }

      const order = orderDoc.data();

      // Vérification 1 : Billet verrouillé après 5 tentatives infructueuses
      const failedAttempts = order.pickup?.failedAttempts || 0;
      if (failedAttempts >= 5) {
        throw new AppError('Billet verrouillé après 5 tentatives infructueuses', 423, 'TICKET_LOCKED');
      }

      // Vérification 2 : Appartenance de la commande au commerçant connecté
      let isOwner = order.merchantId === merchantUid;
      if (!isOwner && db) {
        try {
          const mDoc = await transaction.get(db.collection('merchants').doc(order.merchantId));
          if (mDoc.exists && mDoc.data()?.ownerUid === merchantUid) {
            isOwner = true;
          }
        } catch {}
      }
      if (!isOwner) {
        throw new AppError('Cette commande ne concerne pas votre établissement', 403, 'WRONG_MERCHANT');
      }

      // Vérification 3 : Statut de la commande (Usage unique)
      if (order.status === ORDER_STATUS.COMPLETED) {
        throw new AppError('Ce billet a déjà été utilisé pour un retrait', 409, 'ALREADY_USED');
      }

      if (order.status !== ORDER_STATUS.PAID) {
        throw new AppError(`Cette commande n'est pas réglée (statut actuel : ${order.status})`, 409, 'NOT_PAID');
      }

      // Vérification 4 : Créneau de retrait dépassé de plus de 30 minutes
      const pickupEndMs = order.offerSnapshot?.pickupEndAt?.toDate
        ? order.offerSnapshot.pickupEndAt.toDate().getTime()
        : new Date(order.offerSnapshot?.pickupEndAt).getTime();

      if (nowMs > pickupEndMs + 30 * 60 * 1000) {
        transaction.update(orderRef, {
          'pickup.failedAttempts': admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        });
        return {
          refused: true,
          statusCode: 410,
          code: 'PICKUP_WINDOW_CLOSED',
          message: 'Le créneau de retrait est dépassé depuis plus de 30 minutes',
        };
      }

      // 2. LECTURES DES AUTRES DOCUMENTS DE LA TRANSACTION
      const studentRef = db.collection('users').doc(order.studentId);
      const merchantRef = db.collection('merchants').doc(order.merchantId);
      const merchantDailyRef = merchantRef.collection('daily').doc(todayKey);
      const globalImpactRef = db.collection('campus_impact').doc('global');
      const globalDailyRef = globalImpactRef.collection('daily').doc(todayKey);

      const filiereId = order.studentSnapshot?.filiereId;
      const filiereRef = filiereId ? db.collection('filieres').doc(filiereId) : null;

      const isSurprise = !!order.offerSnapshot?.isSurpriseBasket;
      const surpriseContentRef = isSurprise
        ? db.collection('offers').doc(order.offerId).collection('private').doc('contents')
        : null;

      const [
        studentDoc,
        merchantDoc,
        merchantDailyDoc,
        globalImpactDoc,
        globalDailyDoc,
        filiereDoc,
        surpriseContentDoc,
      ] = await Promise.all([
        transaction.get(studentRef),
        transaction.get(merchantRef),
        transaction.get(merchantDailyRef),
        transaction.get(globalImpactRef),
        transaction.get(globalDailyRef),
        filiereRef ? transaction.get(filiereRef) : Promise.resolve(null),
        surpriseContentRef ? transaction.get(surpriseContentRef) : Promise.resolve(null),
      ]);

      // 3. VÉRIFICATION CRYPTOGRAPHIQUE HMAC-SHA256 EN TEMPS CONSTANT
      const ticketKey = deriveTicketKey({
        secret: env.QR_SECRET,
        orderId,
        studentId: order.studentId,
        merchantId: order.merchantId,
        nonce: order.ticket?.nonce,
      });

      let verifyResult;
      if (method === 'QR') {
        verifyResult = verifyQrPayload(qrPayload, ticketKey, nowMs);
      } else {
        verifyResult = verifyManualCode(code6, ticketKey, orderId, nowMs);
      }

      if (!verifyResult.valid) {
        transaction.update(orderRef, {
          'pickup.failedAttempts': admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        });

        const isExpired = verifyResult.reason === 'TICKET_EXPIRED';
        return {
          refused: true,
          statusCode: isExpired ? 410 : 401,
          code: isExpired ? 'TICKET_EXPIRED' : 'INVALID_SIGNATURE',
          message: isExpired
            ? 'Billet expiré : la fenêtre temporelle de 30 secondes a expiré'
            : 'Signature cryptographique invalide',
        };
      }

      // 4. CALCULS MÉTIER : ECOPOINTS, PALIERS ET RÉCOMPENSES
      const studentData = studentDoc.exists ? studentDoc.data() : {};
      const isFirstCompletedOrder = (studentData.stats?.ordersCompleted || 0) === 0;

      const pointsAwarded = calculateEcoPoints({
        quantity: order.quantity || 1,
        isSurpriseBasket: isSurprise,
        rarity: order.offerSnapshot?.rarity,
        isFirstCompletedOrder,
      });

      const pointsBefore = studentData.ecoPoints || 0;
      const pointsAfter = pointsBefore + pointsAwarded;
      const tierBefore = studentData.loyaltyTier || 'GRAINE';
      const tierAfter = getLoyaltyTier(pointsAfter);
      const nextRewardAt = getNextRewardMilestone(pointsAfter);

      const newUnlockedRewards = evaluateMilestones(pointsBefore, pointsAfter).map((r) => ({
        ...r,
        unlockedAt: now,
        expiresAt: new Date(nowMs + 30 * 24 * 60 * 60 * 1000),
      }));

      const updatedUnlockedRewards = [
        ...(studentData.unlockedRewards || []),
        ...newUnlockedRewards,
      ].slice(-20);

      // 5. RÉVÉLATION DU CONTENU MYSTÈRE (PANIER SURPRISE)
      let revealData = null;
      if (isSurprise && surpriseContentDoc?.exists) {
        const contents = surpriseContentDoc.data();
        revealData = {
          items: contents.items || [],
          note: contents.note || '',
          revealedAt: now,
        };
      }

      // 6. ÉCRITURES ATOMIQUES SUR TOUTES LES COLLECTIONS
      // a) Mise à jour de la commande vers COMPLETED
      const history = [...(order.statusHistory || [])];
      history.push({
        status: ORDER_STATUS.COMPLETED,
        timestamp: now,
        note: `Retrait validé avec succès (${method === 'QR' ? 'Scan QR rotatif' : 'Code manuel 6 chiffres'})`,
      });

      const orderUpdates = {
        status: ORDER_STATUS.COMPLETED,
        pickup: {
          scannedAt: now,
          scannedByUid: merchantUid,
          method,
          failedAttempts: 0,
        },
        statusHistory: history,
        rewards: {
          pointsAwarded,
          tierBefore,
          tierAfter,
          unlockedRewardIds: newUnlockedRewards.map((r) => r.rewardId),
        },
        updatedAt: now,
      };

      if (revealData) {
        orderUpdates.reveal = revealData;
      }

      transaction.update(orderRef, orderUpdates);

      // b) Mise à jour du profil étudiant (Points, Palier, Récompenses, Stats)
      const studentUpdates = {
        ecoPoints: pointsAfter,
        loyaltyTier: tierAfter,
        nextRewardAt,
        unlockedRewards: updatedUnlockedRewards,
        totalMealsRescued: admin.firestore.FieldValue.increment(order.quantity || 1),
        'stats.ordersCompleted': admin.firestore.FieldValue.increment(1),
        'stats.totalSpentMillimes': admin.firestore.FieldValue.increment(order.pricing?.totalMillimes || 0),
        'stats.totalSavedMillimes': admin.firestore.FieldValue.increment(order.pricing?.savedMillimes || 0),
        'stats.foodSavedGrams': admin.firestore.FieldValue.increment(order.impact?.foodSavedGrams || 0),
        'stats.co2SavedGrams': admin.firestore.FieldValue.increment(order.impact?.co2SavedGrams || 0),
        updatedAt: now,
      };
      transaction.update(studentRef, studentUpdates);

      // c) Mise à jour des statistiques commerçant (globales et journalières)
      transaction.update(merchantRef, {
        'stats.ordersCompleted': admin.firestore.FieldValue.increment(1),
        'stats.foodSavedGrams': admin.firestore.FieldValue.increment(order.impact?.foodSavedGrams || 0),
        'stats.co2SavedGrams': admin.firestore.FieldValue.increment(order.impact?.co2SavedGrams || 0),
        'stats.mealsRescued': admin.firestore.FieldValue.increment(order.quantity || 1),
        updatedAt: now,
      });

      if (merchantDailyDoc.exists) {
        transaction.update(merchantDailyRef, {
          ordersCompleted: admin.firestore.FieldValue.increment(1),
          foodSavedGrams: admin.firestore.FieldValue.increment(order.impact?.foodSavedGrams || 0),
          mealsRescued: admin.firestore.FieldValue.increment(order.quantity || 1),
          updatedAt: now,
        });
      } else {
        transaction.set(merchantDailyRef, {
          date: todayKey,
          ordersPaid: 0,
          ordersCompleted: 1,
          revenueMillimes: order.pricing?.totalMillimes || 0,
          foodSavedGrams: order.impact?.foodSavedGrams || 0,
          mealsRescued: order.quantity || 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      // d) Mise à jour de l'impact campus global et journalier
      const impactFood = order.impact?.foodSavedGrams || 0;
      const impactCo2 = order.impact?.co2SavedGrams || 0;
      const impactSavings = order.pricing?.savedMillimes || 0;
      const qty = order.quantity || 1;

      if (globalImpactDoc.exists) {
        transaction.update(globalImpactRef, {
          ordersCompleted: admin.firestore.FieldValue.increment(1),
          mealsRescued: admin.firestore.FieldValue.increment(qty),
          foodSavedGrams: admin.firestore.FieldValue.increment(impactFood),
          co2SavedGrams: admin.firestore.FieldValue.increment(impactCo2),
          moneySavedMillimes: admin.firestore.FieldValue.increment(impactSavings),
          updatedAt: now,
        });
      } else {
        transaction.set(globalImpactRef, {
          ordersCompleted: 1,
          mealsRescued: qty,
          foodSavedGrams: impactFood,
          co2SavedGrams: impactCo2,
          moneySavedMillimes: impactSavings,
          studentsParticipating: 1,
          merchantsParticipating: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (globalDailyDoc.exists) {
        transaction.update(globalDailyRef, {
          ordersCompleted: admin.firestore.FieldValue.increment(1),
          mealsRescued: admin.firestore.FieldValue.increment(qty),
          foodSavedGrams: admin.firestore.FieldValue.increment(impactFood),
          co2SavedGrams: admin.firestore.FieldValue.increment(impactCo2),
          moneySavedMillimes: admin.firestore.FieldValue.increment(impactSavings),
          updatedAt: now,
        });
      } else {
        transaction.set(globalDailyRef, {
          date: todayKey,
          ordersCompleted: 1,
          mealsRescued: qty,
          foodSavedGrams: impactFood,
          co2SavedGrams: impactCo2,
          moneySavedMillimes: impactSavings,
          createdAt: now,
          updatedAt: now,
        });
      }

      // e) Mise à jour du classement des filières ESSECT
      if (filiereRef) {
        if (filiereDoc && filiereDoc.exists) {
          transaction.update(filiereRef, {
            ordersCompleted: admin.firestore.FieldValue.increment(1),
            mealsRescued: admin.firestore.FieldValue.increment(qty),
            foodSavedGrams: admin.firestore.FieldValue.increment(impactFood),
            co2SavedGrams: admin.firestore.FieldValue.increment(impactCo2),
            ecoPointsTotal: admin.firestore.FieldValue.increment(pointsAwarded),
            updatedAt: now,
          });
        } else {
          transaction.set(filiereRef, {
            filiereId,
            label: filiereId,
            studentsCount: 1,
            ordersCompleted: 1,
            mealsRescued: qty,
            foodSavedGrams: impactFood,
            co2SavedGrams: impactCo2,
            ecoPointsTotal: pointsAwarded,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return {
        refused: false,
        order: { ...order, ...orderUpdates },
        pointsAwarded,
        isSurprise,
        reveal: revealData,
        newRewards: newUnlockedRewards,
        studentTokens: studentData.fcmTokens || [],
        orderCode: order.orderCode,
      };
    });

    // 7. GESTION DES REFUS PERSISTÉS HORS TRANSACTION
    if (txResult.refused) {
      throw new AppError(txResult.message, txResult.statusCode, txResult.code);
    }

    // 8. EFFETS DE BORD POST-COMMIT : NOTIFICATIONS FCM
    if (txResult.studentTokens.length > 0) {
      fcmService
        .notifyOrderCompleted(txResult.studentTokens, txResult.orderCode, txResult.pointsAwarded)
        .catch(() => {});

      if (txResult.newRewards && txResult.newRewards.length > 0) {
        const rewardDesc =
          txResult.newRewards[0].type === 'FREE_SURPRISE'
            ? 'Panier Surprise Offert'
            : '-20% sur votre prochain repas';
        fcmService.notifyRewardUnlocked(txResult.studentTokens, rewardDesc).catch(() => {});
      }
    }

    return {
      order: txResult.order,
      pointsAwarded: txResult.pointsAwarded,
      isSurprise: txResult.isSurprise,
      reveal: txResult.reveal,
      rewards: txResult.order.rewards,
      serverTime: Date.now(),
    };
  },
};
