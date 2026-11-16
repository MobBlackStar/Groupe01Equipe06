// 💡 Concept & Analogie : Comme la tour de contrôle de l'aéroport de Tunis-Carthage qui balaye le ciel à 360° pour localiser chaque appareil, ce service scanne tous les établissements agréés autour de l'ESSECT et compile leurs paniers disponibles avec leur degré d'urgence.
// 🔄 Comparaison React / Flutter : Alimente l'hologramme 3D WebGL `HoloRadarPage.jsx` sous React et la vue cartographique `RadarScreen` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce service géospatial public intègre le calcul Haversine, le temps de marche à pied urbain et l'algorithme d'urgence pour alimenter directement les balises 3D."
// Module : Radar Géospatial Backend

import { db } from '../../config/firebase.js';
import { ESSECT_COORDINATES, STATUS } from '../../../../shared/constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from '../../../../shared/geo.js';
import { computeUnitPrice } from '../../../../shared/pricing.js';

export const radarService = {
  /**
   * Récupère la liste des commerces agréés dans le rayon d'exploration et leurs offres actives.
   * @param {number} [radiusM=1500] - Rayon en mètres autour de l'ESSECT
   * @returns {Promise<object>} Données géospatiales pour le radar 3D
   */
  async getRadarData(radiusM = 1500) {
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Récupération des commerces agréés
    const merchantsSnapshot = await db
      .collection('merchants')
      .where('status', '==', STATUS.APPROVED)
      .get();

    // 2. Récupération de l'ensemble des offres actives non expirées
    const offersSnapshot = await db
      .collection('offers')
      .where('status', '==', 'ACTIVE')
      .get();

    // Indexation des offres actives par merchantId
    const offersByMerchant = new Map();

    offersSnapshot.forEach((doc) => {
      const offer = { id: doc.id, offerId: doc.id, ...doc.data() };

      const pickupEndMs = offer.pickupEndAt?.toDate
        ? offer.pickupEndAt.toDate().getTime()
        : new Date(offer.pickupEndAt).getTime();

      const quantityAvailable = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantityTotal ?? 0;

      // Filtrage temporel et de stock disponible
      if (pickupEndMs > nowMs && quantityAvailable > 0) {
        const merchantId = offer.merchantId;
        if (!offersByMerchant.has(merchantId)) {
          offersByMerchant.set(merchantId, []);
        }

        // Calcul dynamique du prix unitaire (Smart Decay)
        const currentPriceMillimes = computeUnitPrice(offer, nowMs);

        // Calcul de l'urgence temporelle (Code couleur dynamique)
        const minutesLeft = Math.max(0, Math.round((pickupEndMs - nowMs) / 60000));
        let urgencyColor = '#CCFF00'; // > 60 min (Vert Lime électrique)
        let urgencyLevel = 'LOW';
        if (minutesLeft < 20) {
          urgencyColor = '#FF1744'; // < 20 min (Rouge impulsion critique)
          urgencyLevel = 'CRITICAL';
        } else if (minutesLeft <= 60) {
          urgencyColor = '#FF5500'; // 20 à 60 min (Orange vif)
          urgencyLevel = 'MEDIUM';
        }

        offersByMerchant.get(merchantId).push({
          id: offer.id,
          offerId: offer.id,
          title: offer.title,
          category: offer.category,
          currentPriceMillimes,
          currentPrice: currentPriceMillimes,
          originalPriceMillimes: offer.originalPriceMillimes,
          pickupStartAt: offer.pickupStartAt,
          pickupEndAt: offer.pickupEndAt,
          quantityAvailable,
          isSurprise: !!offer.isSurpriseBasket,
          isSurpriseBasket: !!offer.isSurpriseBasket,
          rarity: offer.surprise?.rarity || offer.rarity || 'COMMON',
          urgency: urgencyColor,
          urgencyColor,
          urgencyLevel,
          minutesLeft,
        });
      }
    });

    // 3. Compilation géospatiale des établissements dans le rayon
    const merchants = [];

    merchantsSnapshot.forEach((doc) => {
      const m = { id: doc.id, merchantId: doc.id, ...doc.data() };

      // Coordonnées géographiques
      const lat = m.location?.lat ?? 36.7871;
      const lng = m.location?.lng ?? 10.1748;

      // Calcul de la distance réelle par rapport à l'ESSECT
      const distanceM = m.distanceFromEssectM || distanceFromEssect(lat, lng);

      if (distanceM <= radiusM) {
        const activeOffers = offersByMerchant.get(m.id) || [];
        const walkingMinutes = calculateWalkingMinutes(distanceM);

        // Détermination de la couleur d'urgence dominante pour la balise 3D
        let beaconUrgencyColor = '#CCFF00';
        if (activeOffers.some((o) => o.urgencyLevel === 'CRITICAL')) {
          beaconUrgencyColor = '#FF1744';
        } else if (activeOffers.some((o) => o.urgencyLevel === 'MEDIUM')) {
          beaconUrgencyColor = '#FF5500';
        }

        merchants.push({
          id: m.id,
          merchantId: m.id,
          name: m.name,
          type: m.type,
          description: m.description || '',
          location: { lat, lng },
          distanceM,
          distanceFromEssectM: distanceM,
          walkingMinutes,
          logoUrl: m.logoUrl || null,
          coverUrl: m.coverUrl || null,
          activeOfferCount: activeOffers.length,
          activeOffers,
          beaconUrgencyColor,
          ratingAvg: m.ratingAvg ?? 4.0,
        });
      }
    });

    // Tri par distance croissante depuis l'ESSECT
    merchants.sort((a, b) => a.distanceM - b.distanceM);

    return {
      home: {
        lat: ESSECT_COORDINATES.lat,
        lng: ESSECT_COORDINATES.lng,
        name: 'ESSECT Montfleury',
        label: 'Campus ESSECT',
      },
      radiusM,
      merchants,
      totalMerchants: merchants.length,
      serverTime: nowMs,
    };
  },
};
