// 💡 Concept & Analogie : Inspiré des cartes Bestsellers du site Griddle, chaque plat est mis en valeur sur une surface crème douce #EDE6D7 avec un badge sticker rouge et son prix dégressif en direct.
// 🔄 Comparaison React / Flutter : En React, `OfferCard` implémente les micro-interactions Griddle (hover fluide, badge pill) ; en Flutter, `offer_card.dart` adapte ce style avec un `Card` doux.
// 🎯 À retenir pour la soutenance : "Nos cartes abandonnent les contours agressifs pour adopter l'esthétique épurée et appétissante de Griddle, avec prix dégressif dynamique et repère piéton ESSECT."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

const SAFE_FALLBACK_IMG = '/assets/griddle/food/takeaway-counter.webp';

const STICKERS = [
  { text: '#1', cls: 'cs-sticker-red' },
  { text: 'Hot', cls: 'cs-sticker-mustard' },
  { text: 'New', cls: 'cs-sticker-ink' },
];

const CATEGORY_LABELS = {
  'FAST-FOOD': 'Fast-food',
  FAST_FOOD: 'Fast-food',
  SANDWICH: 'Sandwich',
  PATISSERIE: 'Pâtisserie',
  VIENNOISERIE: 'Viennoiserie',
  PLAT: 'Plat chaud',
  PLAT_CHAUD: 'Plat chaud',
  PIZZA: 'Pizza',
  SALADE: 'Salade',
  SNACK: 'Snack',
  BOISSON: 'Boisson',
  DESSERT: 'Dessert',
};

export function formatCategory(category) {
  if (!category) return 'Anti-gaspi';
  const key = String(category).toUpperCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  const s = String(category).replace(/[_-]+/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function OfferCard({ offer, className = '', index = 0 }) {
  if (!offer) return null;

  // Données normalisées
  const id = offer.id || offer._id;
  const title = offer.title || 'Offre anti-gaspi';
  const category = offer.category || 'FAST-FOOD';
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const isSurprise = Boolean(offer.isSurpriseBasket || offer.surprise);
  const rarity = offer.surprise?.rarity || offer.rarity || 'COMMON';

  // Portions restantes
  const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
  const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;
  const lowStock = Number.isFinite(available) && available > 0 && available <= 2;

  // Distance et marche depuis l'ESSECT
  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM;
  const walkingMin = Number.isFinite(distanceM) ? calculateWalkingMinutes(distanceM) : null;

  const imageUrl = offer.imageUrl || offer.photoUrl || getDistinctGriddleFoodImage(category, id || title);
  const sticker = STICKERS[index] || null;

  return (
    <Link
      to={`/app/offers/${id}`}
      className={`group cs-card cs-card-hover flex flex-col h-full p-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FFD000] ${className}`}
    >
      {/* Photo plein cadre */}
      <div className="cs-photo cs-photo-zoom aspect-[4/3]">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = SAFE_FALLBACK_IMG;
          }}
        />
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <span className="cs-pill">{formatCategory(category)}</span>
          {sticker && <span className={`cs-sticker ${sticker.cls} !text-lg rotate-6`}>{sticker.text}</span>}
        </div>
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
          <CountdownChip pickupEndAt={pickupEndAt} />
          {isSurprise && <RarityBadge rarity={rarity} />}
        </div>
      </div>

      {/* Infos */}
      <div className="flex flex-col flex-1 px-2.5 pt-5 pb-2">
        <p className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[0.9375rem] text-[#5E5850] uppercase font-medium tracking-wide">
          <span className="line-clamp-1">{merchantName}</span>
          {walkingMin !== null && (
            <span className="inline-flex items-center gap-1 text-[#111111] shrink-0">
              <MapPin className="w-4 h-4 text-[#DA0711]" />
              {walkingMin} min à pied
            </span>
          )}
        </p>

        <h3 className="cs-h3 mt-2 line-clamp-2 group-hover:text-[#DA0711] transition-colors">{title}</h3>

        {lowStock && (
          <p className="mt-2 text-[0.9375rem] font-semibold uppercase text-[#DA0711]">
            Plus que {available} portion{available > 1 ? 's' : ''} !
          </p>
        )}

        <div className="mt-auto pt-5 flex items-end justify-between gap-3">
          <PriceTicker offer={offer} size="md" />
          <span
            aria-hidden="true"
            className="shrink-0 w-12 h-12 rounded-full bg-[#DA0711] text-white border-2 border-[#111111] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45"
          >
            <ArrowUpRight className="w-6 h-6" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
