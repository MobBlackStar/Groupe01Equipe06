// 💡 Concept & Analogie : Comme le tableau de prix dynamique dans un diner vintage, ce composant recalcule en temps réel le cours de l'offre et anime la baisse de prix vers le plancher.
// 🔄 Comparaison React / Flutter : En React, un hook `useEffect` avec un `setInterval` à 1000 ms force le re-rendu localisé ; en Flutter, `LivePriceText` utilise un `Timer.periodic`.
// 🎯 À retenir pour la soutenance : "Optimisation haute performance : seules les offres à enchère dégressive activent l'horloge 1s."

import React, { useState, useEffect, memo } from 'react';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { PRICING_MODES } from '@shared/constants.js';

const SIZES = {
  sm: { price: 'text-[2rem]', old: 'text-base', pct: 'text-sm' },
  md: { price: 'text-[2.6rem]', old: 'text-lg', pct: 'text-base' },
  lg: { price: 'text-[4.25rem] md:text-[5rem]', old: 'text-2xl', pct: 'text-xl' },
};

function PriceTickerComponent({ offer, size = 'md', className = '' }) {
  const mode = offer && (offer.pricing?.mode || offer.pricingType || offer.pricingMode || offer.mode);
  const isDutch = mode === PRICING_MODES.DUTCH_AUCTION || mode === 'DUTCH' || mode === 'DUTCH_AUCTION';

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isDutch) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isDutch]);

  if (!offer) return null;

  const rawPrice = computeUnitPrice(offer, now);
  const currentPrice = Number.isFinite(rawPrice) ? rawPrice : null;
  const originalPrice = Number(offer.originalPriceMillimes || offer.pricing?.originalPriceMillimes || 0);

  const discountPercent = currentPrice !== null && originalPrice > currentPrice && originalPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-end gap-x-3 gap-y-1 flex-wrap">
        <span className={`font-display leading-[0.85] tabular-nums text-[#DA0711] ${s.price}`}>
          {currentPrice !== null ? formatTND(currentPrice) : '—'}
        </span>

        {discountPercent > 0 && (
          <span className="flex items-center gap-2 pb-1">
            <span className={`line-through decoration-2 text-[#5E5850] font-medium tabular-nums ${s.old}`}>
              {formatTND(originalPrice)}
            </span>
            <span className={`font-sticker leading-none px-2.5 py-1 rounded-full bg-[#FFD000] text-[#111111] -rotate-6 ${s.pct}`}>
              -{discountPercent}%
            </span>
          </span>
        )}
      </div>

      {isDutch && (
        <div className="flex items-center gap-2 mt-2 text-[0.875rem] font-semibold uppercase tracking-wide text-[#DA0711]">
          <span className="w-2 h-2 rounded-full bg-[#DA0711] animate-pulse" />
          Smart Decay : le prix baisse en direct
        </div>
      )}
    </div>
  );
}

export default memo(PriceTickerComponent);
