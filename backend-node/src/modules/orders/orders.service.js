// 💡 Concept & Analogie : Comme la réservation d'un siège de train où le système bloque la place pendant 10 minutes le temps du paiement, ce moteur garantit par transaction atomique qu'aucun stock ne peut être survendu.
// 🔄 Comparaison React / Flutter : Point névralgique orchestrant les commandes déclenchées depuis le bouton "Réserver" sur Web et Mobile.
// 🎯 À retenir pour la soutenance : "L'utilisation de db.runTransaction garantit l'isolation ACID : toutes les lectures de stock précèdent strictement les écritures, rendant le surbooking mathématiquement impossible."
// Module : Commandes & Réservations

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { ORDER_STATUS, OFFER_STATUS, BUSINESS_RULES, REWARD_STATUS } from '../../../../shared/constants.js';
import { computeUnitPrice } from '../../../../shared/pricing.js';
import { rewardKey } from '../../../../shared/loyalty.js';
import { generateOrderCode } from '../../utils/orderCode.js';
import { deriveTicketKey } from '../tickets/ticket.crypto.js';
import { resolveMerchantId } from '../../utils/merchantResolver.js';

export const ordersService = {
  /**
   * Crée une réservation atomique avec décrémentation du stock et verrouillage du prix.
   */
  async createOrder(studentUser, body) {
    const studentId = studentUser.uid;
    const { offerId, quantity, rewardId } = body;

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    const offerRef = db.collection('offers').doc(offerId);
    const userRef = db.collection('users').doc(studentId);

    const now = new Date();
    const nowMs = now.getTime();
    const orderCode = generateOrderCode();
    const reservationExpiresAt = new Date(nowMs + BUSINESS_RULES.RESERVATION_HOLD_MINUTES * 60 * 1000);

    const createdOrder = await db.runTransaction(async (transaction) => {
      // 1. LECTURES ATOMIQUES AVANT TOUTE ÉCRITURE
      const offerDoc = await transaction.get(offerRef);
      if (!offerDoc.exists) {
        throw new AppError('Offre introuvable', 404, 'OFFER_NOT_FOUND');
      }

      const userDoc = await transaction.get(userRef);

      const offer = offerDoc.data();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Vérification du statut de l'utilisateur
      if (userData?.status === 'SUSPENDED') {
        throw new AppError('Compte étudiant suspendu', 403, 'USER_SUSPENDED');
      }

      // Vérification du statut de l'offre et du stock
      const quantityAvailable = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 0;

      if (offer.status === OFFER_STATUS.SOLD_OUT || quantityAvailable <= 0 || quantity > quantityAvailable) {
        throw new AppError(
          `Stock insuffisant : ${quantityAvailable} portion(s) restante(s)`,
          409,
          'OFFER_SOLD_OUT',
          { requested: quantity, available: quantityAvailable }
        );
      }

      if (offer.status !== OFFER_STATUS.ACTIVE) {
        throw new AppError('Cette offre n est plus active', 409, 'OFFER_NOT_ACTIVE');
      }

      // Vérification temporelle : le retrait ne doit pas être déjà expiré
      const pickupEndMs = offer.pickupEndAt?.toDate
        ? offer.pickupEndAt.toDate().getTime()
        : new Date(offer.pickupEndAt).getTime();

      if (nowMs >= pickupEndMs) {
        throw new AppError('Le créneau de retrait de cette offre est expiré', 409, 'OFFER_EXPIRED');
      }

      // 2. CALCUL DU PRIX ET DES RÉDUCTIONS
      const lockedUnitPriceMillimes = computeUnitPrice(offer, nowMs);
      const subtotalMillimes = lockedUnitPriceMillimes * quantity;
      let discountMillimes = 0;
      let rewardSnapshot = null;
      let updatedRewards = null;

      if (rewardId) {
        const unlockedRewards = userData?.unlockedRewards || [];
        const rewardIndex = unlockedRewards.findIndex((r) => rewardKey(r) === rewardId);

        if (rewardIndex === -1) {
          throw new AppError('Récompense introuvable dans votre profil', 422, 'INVALID_REWARD');
        }

        const reward = unlockedRewards[rewardIndex];

        if (reward.status !== REWARD_STATUS.AVAILABLE) {
          throw new AppError('Cette récompense n est plus disponible', 422, 'REWARD_NOT_AVAILABLE');
        }

        // Vérification de validité temporelle
        if (reward.expiresAt) {
          const expMs = reward.expiresAt.toDate ? reward.expiresAt.toDate().getTime() : new Date(reward.expiresAt).getTime();
          if (nowMs > expMs) {
            throw new AppError('Cette récompense est expirée', 422, 'REWARD_EXPIRED');
          }
        }

        // Vérification du type de récompense
        if (reward.type === 'FREE_SURPRISE') {
          if (!offer.isSurpriseBasket || offer.rarity !== 'COMMON') {
            throw new AppError(
              'La récompense Panier Surprise Gratuit s applique exclusivement aux paniers de rareté COMMON',
              422,
              'REWARD_NOT_APPLICABLE'
            );
          }
          // Offre une portion gratuite, plafonnée (plan : cap 4000 millimes)
          discountMillimes = lockedUnitPriceMillimes;
        } else if (reward.type === 'PERCENT_OFF') {
          const percent = reward.percentOff || 10;
          discountMillimes = Math.round((subtotalMillimes * percent) / 100);
        }
        // ALG-LOYALTY : chaque récompense porte un plafond (PERCENT_OFF 2000, FREE_SURPRISE 4000 millimes)
        if (Number.isInteger(reward.maxDiscountMillimes)) {
          discountMillimes = Math.min(discountMillimes, reward.maxDiscountMillimes);
        }

        rewardSnapshot = {
          rewardId: rewardKey(reward),
          type: reward.type,
          discountMillimes,
        };

        // Verrouillage de la récompense dans le document utilisateur
        updatedRewards = [...unlockedRewards];
        updatedRewards[rewardIndex] = {
          ...reward,
          status: REWARD_STATUS.LOCKED,
          lockedAt: now,
          lockedForOrderId: orderId,
        };
      }

      const totalMillimes = Math.max(0, subtotalMillimes - discountMillimes);
      const originalUnitPrice = offer.pricing?.originalPriceMillimes || offer.originalPriceMillimes || lockedUnitPriceMillimes;
      const originalTotal = originalUnitPrice * quantity;
      const savedMillimes = Math.max(0, originalTotal - totalMillimes);

      // Calcul de l'impact écologique
      const weightPerUnit = offer.weightGramsPerUnit || 400;
      const foodSavedGrams = quantity * weightPerUnit;
      const co2SavedGrams = Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD);

      // 3. ÉCRITURES ATOMIQUES
      // Mise à jour de l'offre
      const newAvailable = quantityAvailable - quantity;
      const offerUpdates = {
        quantityAvailable: newAvailable,
        remainingQuantity: newAvailable,
        hasOrders: true,
        updatedAt: now,
      };

      if (newAvailable === 0) {
        offerUpdates.status = OFFER_STATUS.SOLD_OUT;
      }

      transaction.update(offerRef, offerUpdates);

      // Mise à jour de l'utilisateur si une récompense a été verrouillée
      if (updatedRewards) {
        transaction.update(userRef, {
          unlockedRewards: updatedRewards,
          updatedAt: now,
        });
      }

      // Création du document de commande
      const orderData = {
        orderId,
        orderCode,
        studentId,
        studentSnapshot: {
          uid: studentId,
          displayName: userData?.displayName || studentUser.name || 'Étudiant ESSECT',
          filiereId: userData?.filiereId || null,
        },
        merchantId: offer.merchantId,
        merchantSnapshot: {
          id: offer.merchantId,
          name: offer.merchantSnapshot?.name || '',
          location: offer.merchantSnapshot?.location || null,
        },
        offerId,
        offerSnapshot: {
          title: offer.title,
          photoUrl: offer.photoUrl || offer.imageUrl || null,
          category: offer.category,
          isSurpriseBasket: !!offer.isSurpriseBasket,
          rarity: offer.rarity || null,
          pickupStartAt: offer.pickupStartAt,
          pickupEndAt: offer.pickupEndAt,
          weightGramsPerUnit: weightPerUnit,
          co2GramsPerUnit: Math.round(weightPerUnit * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD),
        },
        quantity,
        pricing: {
          mode: offer.pricing?.mode || offer.pricingType || 'FIXED',
          originalUnitPriceMillimes: originalUnitPrice,
          lockedUnitPriceMillimes,
          priceLockedAt: now,
          subtotalMillimes,
          reward: rewardSnapshot,
          totalMillimes,
          savedMillimes,
        },
        status: ORDER_STATUS.RESERVED,
        reservationExpiresAt,
        payment: {
          provider: 'KONNECT',
          status: 'NOT_STARTED',
          attempts: 0,
        },
        impact: {
          foodSavedGrams,
          co2SavedGrams,
        },
        statusHistory: [
          {
            status: ORDER_STATUS.RESERVED,
            timestamp: now,
            note: 'Réservation créée avec blocage de stock 10 minutes',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(orderRef, orderData);

      return orderData;
    });

    return { order: createdOrder };
  },

  /**
   * Annulation d'une réservation temporaire par l'étudiant (avant paiement).
   */
  async cancelOrder(orderId, studentId) {
    const orderRef = db.collection('orders').doc(orderId);
    const now = new Date();

    const cancelledOrder = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
      }

      const order = orderDoc.data();

      if (order.studentId !== studentId) {
        throw new AppError('Accès non autorisé à cette commande', 403, 'FORBIDDEN_RESOURCE');
      }

      if (order.status !== ORDER_STATUS.RESERVED) {
        throw new AppError('Seules les réservations en attente peuvent être annulées', 409, 'CANNOT_CANCEL');
      }

      const offerRef = db.collection('offers').doc(order.offerId);
      const offerDoc = await transaction.get(offerRef);

      // Si une récompense a été verrouillée, la restituer
      let userRef = null;
      let userData = null;
      if (order.pricing?.reward?.rewardId) {
        userRef = db.collection('users').doc(studentId);
        const userDoc = await transaction.get(userRef);
        userData = userDoc.exists ? userDoc.data() : null;
      }

      // Restitution du stock de l'offre
      if (offerDoc.exists) {
        const offer = offerDoc.data();
        const restoredAvailable = (offer.quantityAvailable ?? offer.remainingQuantity ?? 0) + order.quantity;
        const offerUpdates = {
          quantityAvailable: restoredAvailable,
          remainingQuantity: restoredAvailable,
          updatedAt: now,
        };

        const pickupEndMs = offer.pickupEndAt?.toDate
          ? offer.pickupEndAt.toDate().getTime()
          : new Date(offer.pickupEndAt).getTime();

        if (offer.status === OFFER_STATUS.SOLD_OUT && now.getTime() < pickupEndMs) {
          offerUpdates.status = OFFER_STATUS.ACTIVE;
        }

        transaction.update(offerRef, offerUpdates);
      }

      // Déverrouillage de la récompense
      if (userRef && userData?.unlockedRewards) {
        const updatedRewards = userData.unlockedRewards.map((r) => {
          if (rewardKey(r) === order.pricing.reward.rewardId && r.status === REWARD_STATUS.LOCKED) {
            return {
              ...r,
              status: REWARD_STATUS.AVAILABLE,
              lockedAt: null,
              lockedForOrderId: null,
            };
          }
          return r;
        });
        transaction.update(userRef, { unlockedRewards: updatedRewards, updatedAt: now });
      }

      // Mise à jour de la commande
      const history = [...(order.statusHistory || [])];
      history.push({
        status: ORDER_STATUS.CANCELLED,
        timestamp: now,
        note: 'Annulation volontaire par l étudiant',
      });

      const orderUpdates = {
        status: ORDER_STATUS.CANCELLED,
        statusHistory: history,
        updatedAt: now,
      };

      transaction.update(orderRef, orderUpdates);

      return { ...order, ...orderUpdates };
    });

    return { order: cancelledOrder, success: true };
  },

  /**
   * Consultation d'une commande avec contrôle des droits.
   */
  async getOrderById(orderId, currentUser) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
    }

    const order = orderDoc.data();

    const resolvedMerchantId = currentUser.role === 'MERCHANT' ? (currentUser.merchantId || (await resolveMerchantId(currentUser.uid)) || currentUser.uid) : null;
    const isOwner = currentUser.uid === order.studentId;
    const isMerchant = currentUser.uid === order.merchantId || (resolvedMerchantId && resolvedMerchantId === order.merchantId);
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isMerchant && !isAdmin) {
      throw new AppError('Accès non autorisé à cette commande', 403, 'FORBIDDEN_RESOURCE');
    }

    return { order };
  },

  /**
   * Obtient les paramètres cryptographiques pour afficher le Living Ticket (QR dynamique tournant).
   * Règle de sécurité : la clé du ticket n'est jamais persistée en base et est calculée à la volée.
   */
  async getOrderTicket(orderId, currentUser) {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
    }

    const order = orderDoc.data();

    const isOwner = currentUser.uid === order.studentId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Accès non autorisé au billet de cette commande', 403, 'FORBIDDEN_RESOURCE');
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      throw new AppError('Ce billet a déjà été utilisé pour un retrait', 409, 'ALREADY_USED');
    }

    if (order.status !== ORDER_STATUS.PAID) {
      throw new AppError(`Le billet n'est pas disponible pour cette commande (statut : ${order.status})`, 409, 'NOT_PAID');
    }

    if (!order.ticket?.nonce) {
      throw new AppError('Données de sécurité du billet corrompues', 500, 'TICKET_NONCE_MISSING');
    }

    const ticketKeyBuf = deriveTicketKey({
      secret: env.QR_SECRET,
      orderId,
      studentId: order.studentId,
      merchantId: order.merchantId,
      nonce: order.ticket.nonce,
    });

    return {
      ticketKey: ticketKeyBuf.toString('hex'),
      windowSeconds: order.ticket.windowSeconds || 30,
      orderCode: order.orderCode,
      serverTime: Date.now(),
    };
  },

  /**
   * Consultation universelle des commandes pour l'utilisateur connecté (Étudiant, Commerçant ou Admin).
   */
  async listOrders(currentUser) {
    let queryRef = db.collection('orders');

    if (currentUser.role === 'STUDENT') {
      queryRef = queryRef.where('studentId', '==', currentUser.uid);
    } else if (currentUser.role === 'MERCHANT') {
      const merchantId = currentUser.merchantId || (await resolveMerchantId(currentUser.uid)) || currentUser.uid;
      queryRef = queryRef.where('merchantId', '==', merchantId);
    }

    const snapshot = await queryRef.get();
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Tri chronologique en mémoire (évite 9 FAILED_PRECONDITION)
    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return { orders, serverTime: Date.now() };
  },

  /**
   * Liste des commandes passées par l'étudiant connecté.
   */
  async getMyOrders(studentId) {
    const snapshot = await db
      .collection('orders')
      .where('studentId', '==', studentId)
      .get();

    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Tri en mémoire
    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return { orders, serverTime: Date.now() };
  },

  /**
   * Évalue une commande terminée (COMPLETED) avec attribution d'étoiles (1 à 5) et mise à jour atomique de la moyenne du commerce.
   */
  async rateOrder(orderId, studentId, { stars, comment = '' }) {
    const orderRef = db.collection('orders').doc(orderId);

    return await db.runTransaction(async (transaction) => {
      // 1. Lectures atomiques
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new AppError('Commande introuvable', 404, 'ORDER_NOT_FOUND');
      }

      const order = orderDoc.data();
      if (order.studentId !== studentId) {
        throw new AppError('Accès non autorisé à cette commande', 403, 'FORBIDDEN');
      }

      if (order.status !== ORDER_STATUS.COMPLETED) {
        throw new AppError('Seules les commandes terminées peuvent être évaluées', 400, 'ORDER_NOT_COMPLETED');
      }

      if (order.rating) {
        throw new AppError('Cette commande a déjà été évaluée', 409, 'ALREADY_RATED');
      }

      const merchantRef = db.collection('merchants').doc(order.merchantId);
      const merchantDoc = await transaction.get(merchantRef);

      // 2. Écritures atomiques
      const ratedAt = new Date().toISOString();
      const ratingData = {
        stars,
        comment: comment.trim(),
        ratedAt,
      };

      transaction.update(orderRef, {
        rating: ratingData,
        updatedAt: new Date(),
      });

      if (merchantDoc.exists) {
        const merchant = merchantDoc.data() || {};
        const currentCount = merchant.ratingCount || 0;
        const currentSum = merchant.ratingSum ?? (merchant.ratingAvg ? merchant.ratingAvg * currentCount : 0);
        const newCount = currentCount + 1;
        const newSum = currentSum + stars;
        const newAvg = Number((newSum / newCount).toFixed(1));

        transaction.update(merchantRef, {
          ratingCount: newCount,
          ratingSum: newSum,
          ratingAvg: newAvg,
          updatedAt: new Date(),
        });
      }

      return {
        success: true,
        orderId,
        rating: ratingData,
      };
    });
  },
};
