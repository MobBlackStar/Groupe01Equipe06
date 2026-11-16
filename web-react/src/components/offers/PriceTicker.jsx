// 💡 Concept & Analogie : Comme le panneau d'affichage électronique de la bourse qui pulse à chaque seconde, ce composant recalcule en temps réel le cours de l'offre et anime la baisse de prix vers le plancher.
// 🔄 Comparaison React / Flutter : En React, un hook `useEffect` avec un `setInterval` à 1000 ms force le re-rendu localisé (uniquement pour les enchères dégressives) ; en Flutter, `LivePriceText` utilise un `Timer.periodic`.
// 🎯 À retenir pour la soutenance : "Optimisation haute performance : seules les offres à enchère dégressive (Dutch Auction) activent l'intervalle d'horloge 1s, évitant tout gaspillage de cycles CPU sur les prix fixes."

import React, { useState, useEffect, memo } from 'react';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { PRICING_MODES } from '@shared/constants.js';

function PriceTickerComponent({ offer, size = 'md', className = '' }) {
  const isDutch = offer && (
    (offer.pricing?.mode || offer.pricingType || offer.pricingMode || offer.mode) === PRICING_MODES.DUTCH_AUCTION ||
    (offer.pricing?.mode || offer.pricingType || offer.pricingMode || offer.mode) === 'DUTCH' ||
    (offer.pricing?.mode || offer.pricingType || offer.pricingMode || offer.mode) === 'DUTCH_AUCTION'
  );

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Si l'offre est à prix fixe, nul besoin de faire tourner une horloge 1s
    if (!isDutch) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isDutch]);

  if (!offer) return null;

  const currentPrice = computeUnitPrice(offer, now);
  const originalPrice = offer.originalPriceMillimes || offer.pricing?.originalPriceMillimes || 0;

  const discountPercent = originalPrice > currentPrice && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const isLarge = size === 'lg';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Prix actuel en gros */}
        <span
          className={`font-black tracking-tight ${
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
            className={`font-extrabold px-1.5 py-0.5 rounded-md bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 ${
              isLarge ? 'text-sm' : 'text-[10px]'
            }`}
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Indicateur Smart Decay */}
      {isDutch && (
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#CCFF00]/90">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-semibold tracking-wide">Smart Decay actif</span>
        </div>
      )}
    </div>
  );
}

export default memo(PriceTickerComponent);
