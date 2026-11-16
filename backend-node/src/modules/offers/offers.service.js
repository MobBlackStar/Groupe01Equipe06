// 💡 Concept & Analogie : Comme le tableau d'affichage des étals de marché où chaque commerçant dispose ses paniers avec leurs horaires de collecte et leurs prix dégressifs, ce service orchestre la publication et la gestion des offres.
// 🔄 Comparaison React / Flutter : Alimente le catalogue exploré par les étudiants et l'espace de publication utilisé par les commerçants.
// 🎯 À retenir pour la soutenance : "Nous appliquons la règle d'immutabilité financière : dès qu'une première commande est passée sur une offre, ses paramètres tarifaires deviennent strictement inaltérables (code HTTP 409 OFFER_LOCKED)."
// Module : Offres & Catalogue

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { PRICING_MODES, OFFER_STATUS } from '../../../../shared/constants.js';
import { computeRarity } from '../../../../shared/rarity.js';
import { computeUnitPrice, computeUrgencyColor, computeMinutesLeft } from '../../../../shared/pricing.js';
import { generateSearchKeywords } from './keywords.js';
import { getTunisDayKey } from '../../utils/tunisTime.js';

export const offersService = {
  /**
   * Publie une nouvelle offre anti-gaspillage alimentaire (Prix Fixe ou Enchère Dégressive Smart Decay).
   */
  async createOffer(merchantData, body) {
    if (!merchantData || !merchantData.id) {
      throw new AppError('Profil commerçant requis', 401, 'UNAUTHORIZED');
    }

    const {
      title,
      description,
      category,
      pricing,
      quantity,
      pickupStartAt,
      pickupEndAt,
      isSurpriseBasket,
      surpriseContents,
      photoUrl,
    } = body;

    // 1. Validation temporelle stricte
    const pickupStartMs = new Date(pickupStartAt).getTime();
    const pickupEndMs = new Date(pickupEndAt).getTime();

    if (isNaN(pickupStartMs) || isNaN(pickupEndMs)) {
      throw new AppError('Dates de retrait invalides', 422, 'INVALID_DATES');
    }

    if (pickupEndMs <= pickupStartMs) {
      throw new AppError('L heure de fin de retrait doit être strictement postérieure à l heure de début', 422, 'INVALID_PICKUP_WINDOW');
    }

    const durationMs = pickupEndMs - pickupStartMs;
    const maxDurationMs = 6 * 3600 * 1000; // 6 heures maximum
    if (durationMs > maxDurationMs) {
      throw new AppError('La fenêtre de retrait ne peut pas excéder 6 heures consécutives', 422, 'WINDOW_TOO_LONG');
    }

    // Même journée selon le fuseau officiel de Tunis
    const startDay = getTunisDayKey(pickupStartMs);
    const endDay = getTunisDayKey(pickupEndMs);
    if (startDay !== endDay) {
      throw new AppError('Le créneau de retrait doit obligatoirement débuter et se terminer sur la même journée (fuseau de Tunis)', 422, 'MULTIDAY_OFFER_FORBIDDEN');
    }

    // 2. Validation tarifaire selon le mode
    let referencePrice = pricing.originalPriceMillimes;
    if (pricing.mode === PRICING_MODES.FIXED) {
      if (typeof pricing.discountedPriceMillimes !== 'number' || pricing.discountedPriceMillimes >= pricing.originalPriceMillimes) {
        throw new AppError('Pour une offre à prix fixe, le prix réduit doit être strictement inférieur au prix d origine', 422, 'INVALID_PRICING');
      }
      referencePrice = pricing.discountedPriceMillimes;
    } else if (pricing.mode === PRICING_MODES.DUTCH_AUCTION) {
      if (typeof pricing.startPriceMillimes !== 'number' || typeof pricing.floorPriceMillimes !== 'number') {
        throw new AppError('Pour une enchère dégressive, les prix de départ et plancher sont obligatoires', 422, 'INVALID_PRICING');
      }
      if (pricing.floorPriceMillimes >= pricing.startPriceMillimes) {
        throw new AppError('Le prix plancher doit être strictement inférieur au prix de départ de l enchère', 422, 'INVALID_PRICING');
      }
      const decayStartMs = pricing.decayStartAt ? new Date(pricing.decayStartAt).getTime() : pickupStartMs;
      if (decayStartMs < pickupStartMs || decayStartMs >= pickupEndMs) {
        throw new AppError('Le début de l enchère dégressive doit se situer dans la fenêtre de retrait', 422, 'INVALID_DECAY_WINDOW');
      }
      referencePrice = pricing.floorPriceMillimes;
    }

    // 3. Calcul de rareté pour panier surprise
    let rarityResult = null;
    if (isSurpriseBasket) {
      rarityResult = computeRarity(
        pricing.originalPriceMillimes,
        referencePrice,
        merchantData.ratingAvg || 4.0
      );
    }

    // 4. Mots-clés de recherche normalisés
    const searchKeywords = generateSearchKeywords({
      title,
      merchantName: merchantData.name,
      category,
    });

    // 5. Snapshot immuable du commerce
    const merchantSnapshot = {
      id: merchantData.id,
      name: merchantData.name,
      type: merchantData.type,
      phone: merchantData.phone,
      location: merchantData.location,
      distanceFromEssectM: merchantData.distanceFromEssectM,
      walkingMinutes: merchantData.walkingMinutes,
      coverImageUrl: merchantData.coverImageUrl || null,
    };

    // 6. Écriture atomique Firestore (Batch)
    const batch = db.batch();
    const offerRef = db.collection('offers').doc();
    const now = new Date();

    const offerData = {
      id: offerRef.id,
      merchantId: merchantData.id,
      merchantSnapshot,
      title,
      description: description || '',
      category,
      pricing: {
        ...pricing,
        roundingStepMillimes: pricing.roundingStepMillimes || 100,
      },
      quantity,
      quantityTotal: quantity,
      quantityAvailable: quantity,
      quantitySold: 0,
      remainingQuantity: quantity,
      hasOrders: false,
      pickupStartAt: new Date(pickupStartMs),
      pickupEndAt: new Date(pickupEndMs),
      pickupDate: startDay,
      isSurpriseBasket: !!isSurpriseBasket,
      rarity: isSurpriseBasket ? rarityResult.rarity : null,
      rarityScore: isSurpriseBasket ? rarityResult.score : null,
      photoUrl: photoUrl || null,
      searchKeywords,
      status: OFFER_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(offerRef, offerData);

    // Si panier surprise, stockage du contenu dans la sous-collection protégée private/contents
    if (isSurpriseBasket && surpriseContents) {
      const privateContentsRef = offerRef.collection('private').doc('contents');
      const items = Array.isArray(surpriseContents)
        ? surpriseContents
        : [surpriseContents];
      batch.set(privateContentsRef, {
        items,
        createdAt: now,
      });
    }

    // Incrémentation atomique des statistiques du commerçant
    const merchantRef = db.collection('merchants').doc(merchantData.id);
    batch.update(merchantRef, {
      activeOfferCount: admin.firestore.FieldValue.increment(1),
      totalOffersPublished: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    await batch.commit();

    return { offer: offerData };
  },

  /**
   * Recherche multi-critères et catalogue public des offres actives avec calcul temps réel des prix.
   */
  async listOffers(queryParams = {}) {
    const {
      q,
      category,
      merchantId,
      minPrice,
      maxPrice,
      surprise,
      sort = 'ending',
      limit = 20,
      cursor,
    } = queryParams;

    const nowMs = Date.now();

    // 1. Requête sur champ unique d'égalité Firestore (évite 9 FAILED_PRECONDITION)
    const snapshot = await db.collection('offers').where('status', '==', OFFER_STATUS.ACTIVE).get();
    let offersList = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (category && data.category !== category) return;
      if (merchantId && data.merchantId !== merchantId) return;
      offersList.push({ id: doc.id, ...data });
    });

    // 2. Filtrage en mémoire et enrichissement dynamique
    const filteredOffers = [];

    const searchTokens = q
      ? q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean)
      : [];

    for (const offer of offersList) {
      // Vérification du créneau de retrait
      const pickupEndMs = offer.pickupEndAt?.toDate
        ? offer.pickupEndAt.toDate().getTime()
        : new Date(offer.pickupEndAt).getTime();

      // Exclure les offres dont l'heure de retrait est passée
      if (pickupEndMs <= nowMs) {
        continue;
      }

      // Vérification du stock restant
      const available = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 0;
      if (available <= 0) {
        continue;
      }

      // Calcul dynamique du prix unitaire courant et de l'urgence
      const currentPriceMillimes = computeUnitPrice(offer, nowMs);
      const minutesLeft = computeMinutesLeft(offer.pickupEndAt, nowMs);
      const urgencyColor = computeUrgencyColor(offer.pickupEndAt, nowMs);

      // Filtre budget min
      if (minPrice !== undefined && minPrice !== '') {
        if (currentPriceMillimes < Number(minPrice)) continue;
      }

      // Filtre budget max
      if (maxPrice !== undefined && maxPrice !== '') {
        if (currentPriceMillimes > Number(maxPrice)) continue;
      }

      // Filtre panier surprise
      if (surprise !== undefined && surprise !== '') {
        const isSurprise = surprise === 'true' || surprise === true;
        if (!!offer.isSurpriseBasket !== isSurprise) continue;
      }

      // Filtre textuel multi-mots-clés (titre, nom commerce, mots-clés normalisés)
      if (searchTokens.length > 0) {
        const keywords = offer.searchKeywords || [];
        const titleNorm = (offer.title || '').toLowerCase();
        const merchantNorm = (offer.merchantSnapshot?.name || '').toLowerCase();
        const categoryNorm = (offer.category || '').toLowerCase();

        const matchesAll = searchTokens.every((token) => {
          return (
            keywords.includes(token) ||
            titleNorm.includes(token) ||
            merchantNorm.includes(token) ||
            categoryNorm.includes(token)
          );
        });

        if (!matchesAll) continue;
      }

      filteredOffers.push({
        ...offer,
        currentPriceMillimes,
        urgency: {
          minutesLeft,
          color: urgencyColor,
          level: minutesLeft > 60 ? 'LOW' : minutesLeft >= 20 ? 'MEDIUM' : 'HIGH',
        },
      });
    }

    // 3. Tri
    filteredOffers.sort((a, b) => {
      if (sort === 'price') {
        return a.currentPriceMillimes - b.currentPriceMillimes;
      }
      if (sort === 'distance') {
        const distA = a.merchantSnapshot?.distanceFromEssectM ?? 99999;
        const distB = b.merchantSnapshot?.distanceFromEssectM ?? 99999;
        return distA - distB;
      }
      // Par défaut : ending (clôture imminente d'abord)
      const endA = a.pickupEndAt?.toDate ? a.pickupEndAt.toDate().getTime() : new Date(a.pickupEndAt).getTime();
      const endB = b.pickupEndAt?.toDate ? b.pickupEndAt.toDate().getTime() : new Date(b.pickupEndAt).getTime();
      return endA - endB;
    });

    // 4. Pagination par curseur / offset
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const pageSize = Math.min(parseInt(limit, 10) || 20, 50);
    const pagedOffers = filteredOffers.slice(offset, offset + pageSize);
    const nextCursor = offset + pageSize < filteredOffers.length ? String(offset + pageSize) : null;

    return {
      offers: pagedOffers,
      total: filteredOffers.length,
      nextCursor,
      serverTime: nowMs,
    };
  },

  /**
   * Consultation d'une offre avec détails et calcul du prix courant.
   */
  async getOfferById(id, currentUser) {
    const offerDoc = await db.collection('offers').doc(id).get();
    if (!offerDoc.exists) {
      throw new AppError('Offre introuvable', 404, 'OFFER_NOT_FOUND');
    }
    const offer = offerDoc.data();
    const nowMs = Date.now();

    const currentPriceMillimes = computeUnitPrice(offer, nowMs);
    const minutesLeft = computeMinutesLeft(offer.pickupEndAt, nowMs);
    const urgencyColor = computeUrgencyColor(offer.pickupEndAt, nowMs);
    const urgency = {
      minutesLeft,
      color: urgencyColor,
      level: minutesLeft > 60 ? 'LOW' : minutesLeft >= 20 ? 'MEDIUM' : 'HIGH',
    };

    // Si panier surprise et utilisateur autorisé (commerçant propriétaire ou admin), adjoindre le contenu privé
    if (offer.isSurpriseBasket && currentUser) {
      const isOwner = currentUser.uid === offer.merchantId;
      const isAdmin = currentUser.role === 'ADMIN';
      if (isOwner || isAdmin) {
        const privateSnap = await db.collection('offers').doc(id).collection('private').doc('contents').get();
        if (privateSnap.exists) {
          offer.privateContents = privateSnap.data().items;
        }
      }
    }

    return {
      offer,
      currentPriceMillimes,
      urgency,
      serverTime: nowMs,
    };
  },

  /**
   * Mise à jour d'une offre avec vérification d'immutabilité financière si déjà commandée.
   */
  async updateOffer(id, merchantId, updates) {
    const offerRef = db.collection('offers').doc(id);
    const snap = await offerRef.get();
    if (!snap.exists) {
      throw new AppError('Offre introuvable', 404, 'OFFER_NOT_FOUND');
    }

    const offer = snap.data();
    if (offer.merchantId !== merchantId) {
      throw new AppError('Accès non autorisé à cette offre', 403, 'FORBIDDEN_RESOURCE');
    }

    // Règle d'immutabilité financière : si l'offre a déjà des commandes enregistrées
    if (offer.hasOrders) {
      if (updates.pricing) {
        throw new AppError('Impossible de modifier le prix d une offre ayant déjà des réservations actives', 409, 'OFFER_LOCKED');
      }
      if (updates.quantity && updates.quantity < offer.quantity) {
        throw new AppError('Impossible de diminuer le stock d une offre ayant déjà des réservations', 409, 'OFFER_LOCKED');
      }
    }

    const sanitized = { ...updates };
    delete sanitized.id;
    delete sanitized.merchantId;
    delete sanitized.merchantSnapshot;
    delete sanitized.hasOrders;
    delete sanitized.createdAt;

    // Si le titre ou la catégorie change, régénérer les mots-clés
    if (sanitized.title || sanitized.category) {
      sanitized.searchKeywords = generateSearchKeywords({
        title: sanitized.title || offer.title,
        merchantName: offer.merchantSnapshot.name,
        category: sanitized.category || offer.category,
      });
    }

    sanitized.updatedAt = new Date();

    await offerRef.update(sanitized);
    const updatedSnap = await offerRef.get();
    return { offer: updatedSnap.data() };
  },

  /**
   * Suppression d'une offre (Hard delete si aucune commande, Soft delete sinon).
   */
  async deleteOffer(id, merchantId) {
    const offerRef = db.collection('offers').doc(id);
    const snap = await offerRef.get();
    if (!snap.exists) {
      throw new AppError('Offre introuvable', 404, 'OFFER_NOT_FOUND');
    }

    const offer = snap.data();
    if (offer.merchantId !== merchantId) {
      throw new AppError('Accès non autorisé à cette offre', 403, 'FORBIDDEN_RESOURCE');
    }

    const wasActive = offer.status === OFFER_STATUS.ACTIVE;

    if (!offer.hasOrders) {
      // Suppression définitive (Hard delete)
      await offerRef.delete();
    } else {
      // Archivage logique (Soft delete) pour préserver l'historique des commandes
      await offerRef.update({
        status: OFFER_STATUS.DELETED,
        updatedAt: new Date(),
      });
    }

    // Décrémenter le compteur d'offres actives du commerçant si elle était active
    if (wasActive) {
      await db.collection('merchants').doc(merchantId).update({
        activeOfferCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: new Date(),
      });
    }

    return { success: true, deleted: true };
  },
};
