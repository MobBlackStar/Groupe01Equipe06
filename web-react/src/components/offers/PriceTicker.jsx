// 💡 Concept & Analogie : Comme le tableau de prix dynamique dans un diner vintage, ce composant recalcule en temps réel le cours de l'offre et anime la baisse de prix vers le plancher.
// 🔄 Comparaison React / Flutter : En React, un hook `useEffect` avec un `setInterval` à 1000 ms force le re-rendu localisé ; en Flutter, `LivePriceText` utilise un `Timer.periodic`.
// 🎯 À retenir pour la soutenance : "Optimisation haute performance : seules les offres à enchère dégressive activent l'horloge 1s."

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
          className={`font-anton tracking-tight text-[#E51C23] ${
            isLarge ? 'text-3xl md:text-4xl' : 'text-2xl'
          }`}
        >
          {formatTND(currentPrice)}
        </span>

        {/* Prix d'origine barré */}
        {originalPrice > currentPrice && (
          <span className={`text-[#777] line-through font-mono font-bold ${isLarge ? 'text-lg' : 'text-xs'}`}>
            {formatTND(originalPrice)}
          </span>
        )}

        {/* Badge réduction */}
        {discountPercent > 0 && (
          <span
            className={`font-anton px-1.5 py-0.5 rounded-md bg-[#FFD000] text-[#141210] border border-[#141210] shadow-[1.5px_1.5px_0px_#141210] ${
              isLarge ? 'text-sm' : 'text-[11px]'
            }`}
          >
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Indicateur Smart Decay */}
      {isDutch && (
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#C2410C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E51C23] animate-pulse" />
          <span className="font-bold tracking-wide uppercase">Smart Decay actif</span>
        </div>
      )}
    </div>
  );
}

export default memo(PriceTickerComponent);
