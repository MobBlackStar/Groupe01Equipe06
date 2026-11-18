// 💡 Concept & Analogie : Comme le cours d'une action cotée en bourse actualisé chaque seconde sur l'écran du trader, ce hook React recalcule le prix dégressif Smart Decay à chaque seconde sans provoquer de re-rendu inutile hors de son composant hôte.
// 🔄 Comparaison React / Flutter : En React, ce hook utilise `setInterval(1000)` et `serverNow()` ; en Flutter, le widget `LivePriceText` utilise `Timer.periodic(Duration(seconds: 1))` et `ServerClock.serverNowMs`.
// 🎯 À retenir pour la soutenance : "Le hook useLivePrice s'appuie sur l'horloge compensée serverNow() pour garantir que l'étudiant voit le même prix que le backend au centime près."
// Module : Hooks Personnalisés React

import { useState, useEffect } from 'react';
import { computeUnitPrice, computeUrgencyColor, computeMinutesLeft } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { serverNow } from '../lib/serverClock.js';

/**
 * Hook personnalisé pour calculer le prix dynamique en temps réel d'une offre.
 * @param {object} offer - Document d'offre Firestore ou Mock
 * @returns {{ currentPriceMillimes: number, formattedPrice: string, discountPercent: number, urgency: { minutesLeft: number, color: string, level: string } }}
 */
export function useLivePrice(offer) {
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    if (!offer) return;

    // Actualisation chaque seconde uniquement pour les enchères dégressives (Dutch Auction),
    // et toutes les 30 secondes pour les offres à prix fixe (pour le compte à rebours d'urgence).
    const isDutch = offer.pricing?.mode === 'DUTCH_AUCTION';
    const intervalMs = isDutch ? 1000 : 30000;

    const interval = setInterval(() => {
      setNow(serverNow());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [offer?.id, offer?.pickupEndAt, offer?.pricing?.mode]);

  if (!offer) {
    return {
      currentPriceMillimes: 0,
      formattedPrice: '0.000 DT',
      discountPercent: 0,
      urgency: { minutesLeft: 0, color: '#15803D', level: 'LOW' },
      now,
    };
  }

  const currentPriceMillimes = computeUnitPrice(offer, now);
  const formattedPrice = formatTND(currentPriceMillimes);

  const originalPrice = offer.pricing?.originalPriceMillimes ||
    offer.originalPriceMillimes ||
    0;

  const discountPercent = originalPrice > currentPriceMillimes && originalPrice > 0
    ? Math.round(((originalPrice - currentPriceMillimes) / originalPrice) * 100)
    : 0;

  const minutesLeft = computeMinutesLeft(offer.pickupEndAt, now);
  const color = computeUrgencyColor(offer.pickupEndAt, now);
  const level = minutesLeft > 60 ? 'LOW' : minutesLeft >= 20 ? 'MEDIUM' : 'HIGH';

  return {
    currentPriceMillimes,
    formattedPrice,
    discountPercent,
    urgency: {
      minutesLeft,
      color,
      level,
    },
    now,
  };
}
