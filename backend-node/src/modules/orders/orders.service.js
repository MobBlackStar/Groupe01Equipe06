// 💡 Concept & Analogie : Comme la réservation d'un siège de train où le système bloque la place pendant 10 minutes le temps du paiement, ce moteur garantit par transaction atomique qu'aucun stock ne peut être survendu.
// 🔄 Comparaison React / Flutter : Point névralgique orchestrant les commandes déclenchées depuis le bouton "Réserver" sur Web et Mobile.
// 🎯 À retenir pour la soutenance : "L'utilisation de db.runTransaction garantit l'isolation ACID : toutes les lectures de stock précèdent strictement les écritures, rendant le surbooking mathématiquement impossible."
// Module : Commandes & Réservations

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { ORDER_STATUS, OFFER_STATUS, BUSINESS_RULES, REWARD_STATUS, SURPRISE_RARITY } from '../../../../shared/constants.js';
import { computeUnitPrice } from '../../../../shared/pricing.js';
import { rewardKey } from '../../../../shared/loyalty.js';
import { normalizeOrderItems, formatOrderSummaryTitle } from '../../../../shared/orders.js';
import { generateOrderCode } from '../../utils/orderCode.js';
import { deriveTicketKey } from '../tickets/ticket.crypto.js';
import { resolveMerchantId } from '../../utils/merchantResolver.js';

function toEpochMs(v) {
  if (!v) return NaN;
  if (typeof v?.toDate === 'function') return v.toDate().getTime();
  if (v?._seconds) return v._seconds * 1000;
  if (v?.seconds) return v.seconds * 1000;
  return new Date(v).getTime();
}

function mergeRequestedItems(body = {}) {
  const rawList =
    Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : body.offerId
      ? [{ offerId: body.offerId, quantity: body.quantity }]
      : [];

  const merged = new Map();
  for (const row of rawList) {
    const qty = Number(row.quantity) || 0;
    merged.set(row.offerId, (merged.get(row.offerId) || 0) + qty);
  }

  return [...merged.entries()].map(([offerId, quantity]) => ({ offerId, quantity }));
}

export const ordersService = {
  /**
   * Crée une réservation atomique (mono-offre ou sac multi-lignes du même commerce) avec décrémentation des stocks et verrouillage des prix.
   */
  async createOrder(studentUser, body) {
    const studentId = studentUser.uid;
    const requestedItems = mergeRequestedItems(body);
    if (requestedItems.length === 0 || requestedItems.length > 10) {
      throw new AppError('Le sac doit contenir entre 1 et 10 articles distincts', 422, 'INVALID_ORDER_ITEMS');
    }
    const { rewardId } = body;

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    const userRef = db.collection('users').doc(studentId);
    const offerRefs = requestedItems.map((row) => db.collection('offers').doc(row.offerId));

    const now = new Date();
    const nowMs = now.getTime();
    const orderCode = generateOrderCode();
    const reservationExpiresAt = new Date(nowMs + BUSINESS_RULES.RESERVATION_HOLD_MINUTES * 60 * 1000);

    const createdOrder = await db.runTransaction(async (transaction) => {
      // 1. LECTURES ATOMIQUES AVANT TOUTE ÉCRITURE (règle stricte Firestore)
      const [userDoc, ...offerDocs] = await Promise.all([
        transaction.get(userRef),
        ...offerRefs.map((ref) => transaction.get(ref)),
      ]);

      const userData = userDoc.exists ? userDoc.data() : null;
      if (userData?.status === 'SUSPENDED') {
        throw new AppError('Compte étudiant suspendu', 403, 'USER_SUSPENDED');
      }

      // 2. VALIDATIONS MULTI-ARTICLES & RÈGLE MONO-COMMERÇANT
      let sharedMerchantId = null;
      let sharedMerchantSnapshot = null;
      const lineRecords = [];

      for (let i = 0; i < requestedItems.length; i += 1) {
        const { offerId, quantity } = requestedItems[i];
        const offerDoc = offerDocs[i];
        if (!offerDoc.exists) {
          throw new AppError('Offre introuvable', 404, 'OFFER_NOT_FOUND');
        }

        const offer = offerDoc.data();
        if (!sharedMerchantId) {
          sharedMerchantId = offer.merchantId;
          sharedMerchantSnapshot = {
            id: offer.merchantId,
            name: offer.merchantSnapshot?.name || '',
            location: offer.merchantSnapshot?.location || null,
          };
        } else if (offer.merchantId !== sharedMerchantId) {
          throw new AppError(
            "Un sac ne peut contenir que des offres d'un seul commerce",
            422,
            'MIXED_MERCHANTS'
          );
        }

        if (quantity < 1 || quantity > 50) {
          throw new AppError(`Quantité invalide pour "${offer.title}"`, 422, 'INVALID_QUANTITY');
        }

        const quantityAvailable = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 0;
        if (offer.status === OFFER_STATUS.SOLD_OUT || quantityAvailable <= 0 || quantity > quantityAvailable) {
          throw new AppError(
            `Stock insuffisant pour "${offer.title}" : ${quantityAvailable} portion(s) restante(s)`,
            409,
            'OFFER_SOLD_OUT',
            { offerId, offerTitle: offer.title, requested: quantity, available: quantityAvailable }
          );
        }

        if (Number.isInteger(offer.maxPerOrder) && offer.maxPerOrder > 0 && quantity > offer.maxPerOrder) {
          throw new AppError(
            `Maximum ${offer.maxPerOrder} portion(s) autorisée(s) pour "${offer.title}"`,
            422,
            'MAX_PER_ORDER_EXCEEDED',
            { offerId, maxPerOrder: offer.maxPerOrder, requested: quantity }
          );
        }

        if (offer.status !== OFFER_STATUS.ACTIVE) {
          throw new AppError(`L'offre "${offer.title}" n'est plus active`, 409, 'OFFER_NOT_ACTIVE');
        }

        const pickupEndMs = toEpochMs(offer.pickupEndAt);
        if (nowMs >= pickupEndMs) {
          throw new AppError(`Le créneau de retrait de "${offer.title}" est expiré`, 409, 'OFFER_EXPIRED');
        }

        const lockedUnitPriceMillimes = computeUnitPrice(offer, nowMs);
        const originalUnitPriceMillimes =
          offer.pricing?.originalPriceMillimes || offer.originalPriceMillimes || lockedUnitPriceMillimes;
        const weightPerUnit = offer.weightGramsPerUnit || 400;
        const lineSubtotalMillimes = lockedUnitPriceMillimes * quantity;
        const foodSavedGrams = quantity * weightPerUnit;
        const co2SavedGrams = Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD);

        lineRecords.push({
          offerRef: offerRefs[i],
          offer,
          quantityAvailable,
          item: {
            offerId,
            title: offer.title,
            photoUrl: offer.photoUrl || offer.imageUrl || null,
            category: offer.category,
            quantity,
            unitPriceMillimes: lockedUnitPriceMillimes,
            originalUnitPriceMillimes,
            lineSubtotalMillimes,
            isSurpriseBasket: !!offer.isSurpriseBasket,
            rarity: offer.rarity || null,
            pickupStartAt: offer.pickupStartAt,
            pickupEndAt: offer.pickupEndAt,
            weightGramsPerUnit: weightPerUnit,
            foodSavedGrams,
            co2SavedGrams,
            pricingMode: offer.pricing?.mode || offer.pricingType || 'FIXED',
          },
        });
      }

      // 3. CALCUL GLOBAL DU PRIX, DES RÉCOMPENSES & DE L'IMPACT
      const items = lineRecords.map((r) => r.item);
      const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
      const subtotalMillimes = items.reduce((s, it) => s + it.lineSubtotalMillimes, 0);
      const originalTotal = items.reduce((s, it) => s + it.originalUnitPriceMillimes * it.quantity, 0);
      const foodSavedGrams = items.reduce((s, it) => s + it.foodSavedGrams, 0);
      const co2SavedGrams = Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD);

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

        if (reward.expiresAt) {
          const expMs = toEpochMs(reward.expiresAt);
          if (nowMs > expMs) {
            throw new AppError('Cette récompense est expirée', 422, 'REWARD_EXPIRED');
          }
        }

        if (reward.type === 'FREE_SURPRISE') {
          const freeSurpriseLine = items.find((it) => it.isSurpriseBasket && it.rarity === SURPRISE_RARITY.COMMON);
          if (!freeSurpriseLine) {
            throw new AppError(
              'La récompense Panier Surprise Gratuit nécessite au moins un panier surprise de rareté COMMON dans votre sac',
              422,
              'REWARD_UNAVAILABLE'
            );
          }
          // Déduit uniquement la valeur de 1 unité du panier surprise COMMON (plafonnée)
          discountMillimes = freeSurpriseLine.unitPriceMillimes;
        } else if (reward.type === 'PERCENT_OFF') {
          const percent = reward.percentOff || 10;
          discountMillimes = Math.round((subtotalMillimes * percent) / 100);
        }

        if (Number.isInteger(reward.maxDiscountMillimes)) {
          discountMillimes = Math.min(discountMillimes, reward.maxDiscountMillimes);
        }

        rewardSnapshot = {
          rewardId: rewardKey(reward),
          type: reward.type,
          discountMillimes,
        };

        updatedRewards = [...unlockedRewards];
        updatedRewards[rewardIndex] = {
          ...reward,
          status: REWARD_STATUS.LOCKED,
          lockedAt: now,
          lockedForOrderId: orderId,
        };
      }

      const totalMillimes = Math.max(0, subtotalMillimes - discountMillimes);
      const savedMillimes = Math.max(0, originalTotal - totalMillimes);

      // Fenêtre horaire englobante sur toutes les lignes du sac
      const startCandidates = items.map((it) => ({ raw: it.pickupStartAt, ms: toEpochMs(it.pickupStartAt) })).filter((x) => Number.isFinite(x.ms));
      const endCandidates = items.map((it) => ({ raw: it.pickupEndAt, ms: toEpochMs(it.pickupEndAt) })).filter((x) => Number.isFinite(x.ms));
      startCandidates.sort((a, b) => a.ms - b.ms);
      endCandidates.sort((a, b) => b.ms - a.ms);
      const encompassingStartAt = startCandidates[0]?.raw ?? items[0].pickupStartAt;
      const encompassingEndAt = endCandidates[0]?.raw ?? items[0].pickupEndAt;

      const primaryItem = items[0];
      const surpriseItem = items.find((it) => it.isSurpriseBasket);
      const avgWeightPerUnit = Math.round(foodSavedGrams / Math.max(1, totalQuantity));

      // 4. ÉCRITURES ATOMIQUES
      for (const line of lineRecords) {
        const newAvailable = line.quantityAvailable - line.item.quantity;
        const offerUpdates = {
          quantityAvailable: newAvailable,
          remainingQuantity: newAvailable,
          hasOrders: true,
          updatedAt: now,
        };
        if (newAvailable === 0) {
          offerUpdates.status = OFFER_STATUS.SOLD_OUT;
        }
        transaction.update(line.offerRef, offerUpdates);
      }

      if (updatedRewards) {
        transaction.update(userRef, {
          unlockedRewards: updatedRewards,
          updatedAt: now,
        });
      }

      const orderData = {
        orderId,
        orderCode,
        studentId,
        studentSnapshot: {
          uid: studentId,
          displayName: userData?.displayName || studentUser.name || 'Étudiant ESSECT',
          filiereId: userData?.filiereId || null,
        },
        merchantId: sharedMerchantId,
        merchantSnapshot: sharedMerchantSnapshot,
        offerId: primaryItem.offerId,
        items,
        offerSnapshot: {
          title: formatOrderSummaryTitle(items),
          photoUrl: primaryItem.photoUrl || null,
          category: items.length === 1 ? primaryItem.category : 'MIXTE',
          isSurpriseBasket: Boolean(surpriseItem),
          rarity: surpriseItem?.rarity || null,
          pickupStartAt: encompassingStartAt,
          pickupEndAt: encompassingEndAt,
          weightGramsPerUnit: avgWeightPerUnit,
          co2GramsPerUnit: Math.round(avgWeightPerUnit * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD),
        },
        quantity: totalQuantity,
        pricing: {
          mode: items.length === 1 ? primaryItem.pricingMode : 'FIXED',
          originalUnitPriceMillimes:
            items.length === 1
              ? primaryItem.originalUnitPriceMillimes
              : Math.round(originalTotal / Math.max(1, totalQuantity)),
          lockedUnitPriceMillimes:
            items.length === 1
              ? primaryItem.unitPriceMillimes
              : Math.round(subtotalMillimes / Math.max(1, totalQuantity)),
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
            note: `Réservation créée (${items.length} article${items.length > 1 ? 's' : ''}) avec blocage de stock 10 minutes`,
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

      const items = normalizeOrderItems(order);
      const offerRefs = items.map((it) => db.collection('offers').doc(it.offerId));
      const userRef = order.pricing?.reward?.rewardId ? db.collection('users').doc(studentId) : null;

      // Lectures avant écritures
      const [userDoc, ...offerDocs] = await Promise.all([
        userRef ? transaction.get(userRef) : Promise.resolve(null),
        ...offerRefs.map((ref) => transaction.get(ref)),
      ]);
      const userData = userDoc?.exists ? userDoc.data() : null;

      // Restitution du stock sur toutes les offres de la commande
      for (let i = 0; i < items.length; i += 1) {
        const offerDoc = offerDocs[i];
        if (!offerDoc.exists) continue;
        const offer = offerDoc.data();
        const restoredAvailable = (offer.quantityAvailable ?? offer.remainingQuantity ?? 0) + items[i].quantity;
        const offerUpdates = {
          quantityAvailable: restoredAvailable,
          remainingQuantity: restoredAvailable,
          updatedAt: now,
        };
        const pickupEndMs = toEpochMs(offer.pickupEndAt);
        if (offer.status === OFFER_STATUS.SOLD_OUT && now.getTime() < pickupEndMs) {
          offerUpdates.status = OFFER_STATUS.ACTIVE;
        }
        transaction.update(offerRefs[i], offerUpdates);
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
