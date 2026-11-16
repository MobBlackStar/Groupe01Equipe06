// 💡 Concept & Analogie : Comme le panneau d'affichage électronique de la bourse qui pulse à chaque seconde, ce composant recalcule en temps réel le cours de l'offre et anime la baisse de prix vers le plancher.
// 🔄 Comparaison React / Flutter : En React, un hook `useEffect` avec un `setInterval` à 1000 ms force le re-rendu localisé ; en Flutter, `LivePriceText` utilise un `Timer.periodic` ou un `StreamBuilder`.
// 🎯 À retenir pour la soutenance : "Le prix dégressif est calculé à la seconde près côté client pour la fluidité visuelle, tout en restant strictement déterministe avec le calcul backend au moment de la réservation."

import React, { useState, useEffect } from 'react';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { PRICING_MODES } from '@shared/constants.js';

export default function PriceTicker({ offer, size = 'md', className = '' }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Actualisation chaque seconde pour l'animation Smart Decay
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!offer) return null;

  const currentPrice = computeUnitPrice(offer, now);
  const originalPrice = offer.originalPriceMillimes || offer.pricing?.originalPriceMillimes || 0;
  const isDutch = (offer.pricing?.mode || offer.pricingType || offer.pricingMode) === PRICING_MODES.DUTCH_AUCTION ||
                  (offer.pricing?.mode || offer.pricingType || offer.pricingMode) === 'DUTCH' ||
                  (offer.pricing?.mode || offer.pricingType || offer.pricingMode) === 'DUTCH_AUCTION';

  const discountPercent = originalPrice > currentPrice && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const isLarge = size === 'lg';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Prix actuel en gros */}
        <span
          className={`font-black tracking-tight text-white ${
            isLarge ? 'text-3xl md:text-4xl text-[#CCFF00]' : 'text-xl text-[#CCFF00]'
          }`}
        >
          {formatTND(currentPrice)}
        </span>

        {/* Prix d'origine barré */}
        {originalPrice > currentPrice && (
          <span className={`text-slate-400 line-through ${isLarge ? 'text-lg' : 'text-xs'}`}>
            {formatTND(originalPrice)}
          </span>
        )}

        {/* Badge réduction */}
        {discountPercent > 0 && (
          <span
            className={`font-bold px-1.5 py-0.5 rounded bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 ${
              isLarge ? 'text-sm' : 'text-[11px]'
            }`}
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Indicateur Smart Decay */}
      {isDutch && (
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#CCFF00]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-medium tracking-wide">Smart Decay en direct</span>
        </div>
      )}
    </div>
  );
}
