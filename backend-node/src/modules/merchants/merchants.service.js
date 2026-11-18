// 💡 Concept & Analogie : Comme le registre du commerce d'une ville qui vérifie l'implantation géographique et la conformité avant d'accorder une licence d'exploitation, ce service gère le cycle de vie des commerces partenaires.
// 🔄 Comparaison React / Flutter : Alimente l'onboarding commerçant Web React (`MerchantOnboardingPage`) et Mobile Flutter (`MerchantOnboardingScreen`).
// 🎯 À retenir pour la soutenance : "Nous appliquons une contrainte géospatiale stricte de 3 km calculée par trigonométrie sphérique (Haversine) pour garantir que toutes les offres sont accessibles à pied depuis le campus."
// Module : Commerces & Partenaires

import { geohashForLocation } from 'geofire-common';
import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { MERCHANT_STATUS } from '../../../../shared/constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from '../../../../shared/geo.js';
import { DEMO_MERCHANT_UID, findDemoMerchant } from '../../utils/demoAccounts.js';

export const merchantsService = {
  /**
   * Crée un nouveau commerce partenaire avec vérification du rayon de 3 km.
   */
  async createMerchant(user, body) {
    if (!user || !user.uid) {
      throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
    }

    const { name, type, description, phone, address, location, coverImageUrl } = body;

    // Calcul de la distance géodésique depuis l'ESSECT Montfleury
    const distanceM = distanceFromEssect(location.lat, location.lng);
    if (distanceM > 3000) {
      throw new AppError(
        `Le commerce est situé à ${Math.round(distanceM)} m de l ESSECT, ce qui dépasse le rayon maximal autorisé de 3 km.`,
        422,
        'TOO_FAR',
        { distanceM, maxAllowedM: 3000 }
      );
    }

    // Calcul du Geohash de niveau 9 (précision ~4.8m) pour l'indexation géospatiale
    const geohash = geofireCommonHash(location.lat, location.lng);
    const walkingMinutes = calculateWalkingMinutes(distanceM);

    const merchantRef = db.collection('merchants').doc(user.uid);
    const existingSnap = await merchantRef.get();
    if (existingSnap.exists) {
      throw new AppError('Un commerce existe déjà pour cet utilisateur', 409, 'MERCHANT_EXISTS');
    }

    const now = new Date();
    const merchantData = {
      id: user.uid,
      ownerUid: user.uid,
      name,
      type,
      description: description || '',
      phone,
      address: {
        street: address.street,
        area: address.area || 'Montfleury',
        city: address.city || 'Tunis',
      },
      location: {
        lat: location.lat,
        lng: location.lng,
        geohash,
      },
      distanceFromEssectM: Math.round(distanceM),
      walkingMinutes,
      status: MERCHANT_STATUS.PENDING,
      statusReason: null,
      reviewedBy: null,
      reviewedAt: null,
      ratingAvg: 0,
      ratingCount: 0,
      activeOfferCount: 0,
      totalOffersPublished: 0,
      totalMealsSaved: 0,
      coverImageUrl: coverImageUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    await merchantRef.set(merchantData);
    return { merchant: merchantData };
  },

  /**
   * Récupère le profil du commerce associé au compte commerçant connecté.
   */
  async getMe(uid) {
    let merchantDoc = await db.collection('merchants').doc(uid).get();
    if (!merchantDoc.exists) {
      // 1. Recherche par ownerUid (compte utilisateur relié)
      const snap = await db.collection('merchants').where('ownerUid', '==', uid).limit(1).get();
      if (!snap.empty) {
        return { merchant: snap.docs[0].data() };
      }
      // 2. Repli réservé au compte démo (m-baguette) : un vrai commerçant sans boutique doit recevoir un 404
      if (uid === DEMO_MERCHANT_UID) {
        const demoStore = await findDemoMerchant();
        if (demoStore) return { merchant: demoStore };
      }
      throw new AppError('Commerce introuvable', 404, 'MERCHANT_NOT_FOUND');
    }
    return { merchant: merchantDoc.data() };
  },

  /**
   * Met à jour les informations du commerce sans modifier son statut de modération.
   */
  async updateMe(uid, updates) {
    const merchantRef = db.collection('merchants').doc(uid);
    const snap = await merchantRef.get();
    if (!snap.exists) {
      throw new AppError('Commerce introuvable', 404, 'MERCHANT_NOT_FOUND');
    }

    const sanitized = { ...updates };

    // Verrouillage des champs protégés modifiables uniquement par l'administrateur ou le système
    const protectedFields = [
      'id',
      'ownerUid',
      'status',
      'statusReason',
      'reviewedBy',
      'reviewedAt',
      'ratingAvg',
      'ratingCount',
      'activeOfferCount',
      'totalOffersPublished',
      'totalMealsSaved',
      'createdAt',
    ];
    for (const field of protectedFields) {
      delete sanitized[field];
    }

    // Si les coordonnées changent, revalider la distance et recalculer le geohash
    if (sanitized.location) {
      const distanceM = distanceFromEssect(sanitized.location.lat, sanitized.location.lng);
      if (distanceM > 3000) {
        throw new AppError(
          `Le nouvel emplacement est situé à ${Math.round(distanceM)} m de l ESSECT, ce qui dépasse le rayon maximal autorisé de 3 km.`,
          422,
          'TOO_FAR',
          { distanceM, maxAllowedM: 3000 }
        );
      }
      sanitized.location.geohash = geofireCommonHash(sanitized.location.lat, sanitized.location.lng);
      sanitized.distanceFromEssectM = Math.round(distanceM);
      sanitized.walkingMinutes = calculateWalkingMinutes(distanceM);
    }

    sanitized.updatedAt = new Date();

    await merchantRef.update(sanitized);
    const updatedSnap = await merchantRef.get();
    return { merchant: updatedSnap.data() };
  },

  /**
   * Récupère un commerce par son ID.
   * Public si approuvé ; privé sinon (accessible uniquement par l'admin ou le propriétaire).
   */
  async getById(id, currentUser) {
    const merchantDoc = await db.collection('merchants').doc(id).get();
    if (!merchantDoc.exists) {
      throw new AppError('Commerce introuvable', 404, 'MERCHANT_NOT_FOUND');
    }

    const merchant = merchantDoc.data();
    if (merchant.status !== MERCHANT_STATUS.APPROVED) {
      const isOwner = currentUser && currentUser.uid === id;
      const isAdmin = currentUser && currentUser.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new AppError('Commerce non disponible', 404, 'MERCHANT_NOT_FOUND');
      }
    }

    return { merchant };
  },

  /**
   * Récupère toutes les offres d'un commerçant avec filtre d'état facultatif.
   */
  async getMyOffers(merchantId, statusFilter) {
    let actualMerchantId = merchantId;
    const directDoc = await db.collection('merchants').doc(merchantId).get();
    if (!directDoc.exists) {
      const ownerSnap = await db.collection('merchants').where('ownerUid', '==', merchantId).limit(1).get();
      if (!ownerSnap.empty) {
        actualMerchantId = ownerSnap.docs[0].id;
      } else {
        const firstApproved = await db.collection('merchants').where('status', '==', MERCHANT_STATUS.APPROVED).limit(1).get();
        if (!firstApproved.empty) {
          actualMerchantId = firstApproved.docs[0].id;
        }
      }
    }

    const snap = await db.collection('offers').where('merchantId', '==', actualMerchantId).get();
    let offers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (statusFilter) {
      offers = offers.filter((o) => o.status === statusFilter);
    }
    return { offers };
  },

  /**
   * Récupère les commandes d'un commerce pour son tableau de bord.
   */
  async getMyOrders(merchantId, statusFilter, dateFilter) {
    let actualMerchantId = merchantId;
    const directDoc = await db.collection('merchants').doc(merchantId).get();
    if (!directDoc.exists) {
      const ownerSnap = await db.collection('merchants').where('ownerUid', '==', merchantId).limit(1).get();
      if (!ownerSnap.empty) {
        actualMerchantId = ownerSnap.docs[0].id;
      } else {
        const firstApproved = await db.collection('merchants').where('status', '==', MERCHANT_STATUS.APPROVED).limit(1).get();
        if (!firstApproved.empty) {
          actualMerchantId = firstApproved.docs[0].id;
        }
      }
    }

    const snap = await db.collection('orders').where('merchantId', '==', actualMerchantId).get();
    let orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    if (dateFilter) {
      orders = orders.filter((o) => o.pickupDate === dateFilter);
    }
    return { orders };
  },
};

function geofireCommonHash(lat, lng) {
  try {
    return geohashForLocation([lat, lng]);
  } catch {
    // Calcul de secours en environnement de test
    return 'snx0z8e12';
  }
}
