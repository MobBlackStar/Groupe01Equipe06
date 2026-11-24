// 💡 Concept & Analogie : Comme le coffre mystère scellé d'un stand de marché dont les dorures dissimulent une sélection gourmande secrète.
// 🔄 Comparaison React / Flutter : En React, la carte adopte le style biscuit Griddle avec badge rareté doré ; en Flutter, `mystery_box_card` adapte les reflets.
// 🎯 À retenir pour la soutenance : "Le panier surprise garantit un taux d'écoulement record chez les artisans de Montfleury grâce au déblocage gamifié de la rareté."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { resolveOfferImage } from '../../lib/offerImages.js';

export default function MysteryBoxCard({ offer, className = '', index = 0 }) {
  if (!offer) return null;

  const id = offer.id || offer._id;
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const rarity = offer.surprise?.rarity || offer.rarity || SURPRISE_RARITY.LEGENDARY;
  const teaser = offer.surprise?.teaser || "Assortiment secret de délices frais cuisinés aujourd'hui.";
  const itemCountHint = offer.surprise?.itemCountHint || 3;

  // Portions restantes
  const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
  const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;

  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM;
  const walkingMin = Number.isFinite(distanceM) ? calculateWalkingMinutes(distanceM) : null;

  // Photo floutée du commerce : on devine, on ne voit pas
  const teaserImage =
    offer.imageUrl ||
    offer.photoUrl ||
    resolveOfferImage({
      category: offer.category || 'MIXTE',
      title: offer.title,
      surpriseContents: offer.surpriseContents,
      description: teaser,
      isSurpriseBasket: true,
    });

  return (
    <Link
      to={`/app/offers/${id}`}
      className={`group cs-card cs-card-hover flex flex-col h-full p-3 !bg-[#FFD000] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#111111] ${className}`}
    >
      {/* Visuel mystère : photo floutée + énorme point d'interrogation */}
      <div className="cs-photo aspect-[4/3] !bg-[#111111]">
        <img src={teaserImage} alt="" aria-hidden="true" className="blur-xl scale-125 opacity-60" loading="lazy" decoding="async" />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
          <span className="font-display text-[8rem] leading-[0.8] text-[#FFD000] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">?</span>
          <span className="mt-2 font-semibold uppercase tracking-wide text-[#FAF3E6] text-base">
            {itemCountHint} délices secrets · {available}/{total} paniers
          </span>
        </div>
        <span className="cs-sticker cs-sticker-red absolute top-3 right-3 z-10 rotate-6">Surprise</span>
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
          <CountdownChip pickupEndAt={pickupEndAt} />
        </div>
      </div>

      <div className="flex flex-col flex-1 px-2.5 pt-5 pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <RarityBadge rarity={rarity} />
          {walkingMin !== null && (
            <span className="inline-flex items-center gap-1 text-[0.9375rem] font-medium uppercase">
              <MapPin className="w-4 h-4" />
              {walkingMin} min à pied
            </span>
          )}
        </div>

        <h3 className="cs-h3 mt-3 line-clamp-2">Panier surprise · {merchantName}</h3>
        <p className="mt-1.5 text-base leading-snug line-clamp-2">{teaser}</p>

        <div className="mt-auto pt-5 flex items-end justify-between gap-3">
          <PriceTicker offer={offer} size="md" />
          <span
            aria-hidden="true"
            className="shrink-0 w-12 h-12 rounded-full bg-[#111111] text-[#FFD000] border-2 border-[#111111] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45"
          >
            <ArrowUpRight className="w-6 h-6" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
