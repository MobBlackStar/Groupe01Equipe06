// 💡 Concept & Analogie : Inspiré des cartes Bestsellers du site Griddle, chaque plat est mis en valeur sur une surface crème douce #EDE6D7 avec un badge sticker rouge et son prix dégressif en direct.
// 🔄 Comparaison React / Flutter : En React, `OfferCard` implémente les micro-interactions Griddle (hover fluide, badge pill) ; en Flutter, `offer_card.dart` adapte ce style avec un `Card` doux.
// 🎯 À retenir pour la soutenance : "Nos cartes abandonnent les contours agressifs pour adopter l'esthétique épurée et appétissante de Griddle, avec prix dégressif dynamique et repère piéton ESSECT."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Package, ArrowRight, Flame } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

const SAFE_FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23EDE6D7'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%23FFD000'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='36' fill='%23111111'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='18' fill='%23111111'%3ECampusSave Montfleury%3C/text%3E%3Ctext x='50%25' y='76%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23666666'%3ERepas frais anti-gaspi du jour%3C/text%3E%3C/svg%3E";

export default function OfferCard({ offer, className = '', index = 0 }) {
  if (!offer) return null;

  // Données normalisées
  const id = offer.id || offer._id;
  const title = offer.title || 'Offre Anti-Gaspi';
  const category = offer.category || 'FAST-FOOD';
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const isSurprise = Boolean(offer.isSurpriseBasket || offer.surprise);
  const rarity = offer.surprise?.rarity || offer.rarity || 'COMMON';

  // Calcul portions
  const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
  const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;

  // Calcul distance et marche
  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 250;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Distinct food image from pool
  const distinctImage = getDistinctGriddleFoodImage(category, id || title);
  const imageUrl = offer.imageUrl || offer.photoUrl || distinctImage;

  // Badge sticker text: #1, HOT, or NEW
  const stickerText = index === 0 ? '#1' : index === 1 ? 'HOT' : index === 2 ? 'NEW' : null;

  return (
    <div className={`relative group select-none transition-all duration-300 hover:-translate-y-1.5 ${className}`}>
      <Link
        to={`/app/offers/${id}`}
        className="block relative rounded-2xl bg-[#EDE6D7] text-[#111111] p-4 sm:p-5 border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] hover:shadow-[0_16px_36px_rgba(17,17,17,0.08)] transition-all overflow-hidden flex flex-col justify-between h-full"
      >
        {/* En-tête : Stickers Griddle & Compte à rebours */}
        <div className="flex items-center justify-between gap-2 mb-3 z-10">
          <div className="flex items-center gap-1.5">
            {stickerText && (
              <span className="w-8 h-8 rounded-full bg-[#DA0711] text-white font-anton text-xs flex items-center justify-center shadow-md">
                {stickerText}
              </span>
            )}
            {isSurprise && (
              <RarityBadge rarity={rarity} />
            )}
            <span className="text-[11px] font-bold text-[#DA0711] bg-[#DA0711]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>{category}</span>
            </span>
          </div>

          <div className="shrink-0">
            <CountdownChip pickupEndAt={pickupEndAt} />
          </div>
        </div>

        {/* Visuel du Plat Découpé (Cutout Food Presentation) */}
        <div className="relative w-full h-44 sm:h-48 flex items-center justify-center my-2 overflow-hidden rounded-xl bg-[#FAF3E6]/60">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = SAFE_FALLBACK_IMG;
            }}
          />
        </div>

        {/* Informations Plat */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="font-anton uppercase text-xl font-black tracking-wide text-[#111111] line-clamp-1 group-hover:text-[#DA0711] transition-colors">
              {title}
            </h3>

            <div className="flex items-center justify-between text-xs text-[#666] mt-1 mb-2 font-medium">
              <span className="flex items-center gap-1 truncate max-w-[60%]">
                <Store className="w-3.5 h-3.5 shrink-0 text-[#888]" />
                <span className="truncate">{merchantName}</span>
              </span>
              <span className="flex items-center gap-1 text-[#111111] font-bold shrink-0">
                <MapPin className="w-3 h-3 text-[#DA0711]" />
                <span>{distanceM}m (~{walkingMin}m)</span>
              </span>
            </div>
          </div>

          {/* Séparateur subtil */}
          <div className="my-2.5 border-t border-[#111111]/8" />

          {/* Pied de Carte : Prix Dégressif + Pill Bouton Réserver */}
          <div className="flex items-end justify-between gap-2 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                PRIX EN DIRECT :
              </span>
              <PriceTicker offer={offer} size="md" />
            </div>

            <div className="btn-griddle-primary text-xs py-2 px-4 shadow-sm group-hover:bg-[#bd060f]">
              <span>RÉSERVER</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
