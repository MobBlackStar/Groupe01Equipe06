// 💡 Concept & Analogie : Comme le coffre mystère scellé d'un stand de marché dont les dorures dissimulent une sélection gourmande secrète.
// 🔄 Comparaison React / Flutter : En React, la carte adopte le style biscuit Griddle avec badge rareté doré ; en Flutter, `mystery_box_card` adapte les reflets.
// 🎯 À retenir pour la soutenance : "Le panier surprise garantit un taux d'écoulement record chez les artisans de Montfleury grâce au déblocage gamifié de la rareté."

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Store, Star, Package, ArrowRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { calculateWalkingMinutes } from '@shared/geo.js';

export default function MysteryBoxCard({ offer, className = '', index = 0 }) {
  if (!offer) return null;

  const id = offer.id || offer._id;
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const rarity = offer.surprise?.rarity || offer.rarity || SURPRISE_RARITY.LEGENDARY;
  const teaser = offer.surprise?.teaser || "Assortiment secret de délices frais cuisinés aujourd'hui.";
  const itemCountHint = offer.surprise?.itemCountHint || 3;

  // Calcul portions
  const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
  const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;

  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  return (
    <div className={`relative group select-none transition-all duration-300 hover:-translate-y-1.5 ${className}`}>
      <Link
        to={`/app/offers/${id}`}
        className="block relative rounded-2xl bg-[#EDE6D7] text-[#111111] p-4 sm:p-5 border border-[#FFD000]/40 shadow-[0_4px_20px_rgba(255,208,0,0.1)] hover:shadow-[0_16px_36px_rgba(255,208,0,0.2)] transition-all overflow-hidden flex flex-col justify-between h-full"
      >
        {/* En-tête : Badges & Compte à rebours */}
        <div className="flex items-center justify-between gap-2 mb-3 z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-8 h-8 rounded-full bg-[#FFD000] text-[#111111] font-anton text-xs flex items-center justify-center shadow-md">
              🎁
            </span>
            <RarityBadge rarity={rarity} />
          </div>

          <div className="shrink-0">
            <CountdownChip pickupEndAt={pickupEndAt} />
          </div>
        </div>

        {/* Visuel Boîte Mystère Stylisée */}
        <div className="relative w-full h-44 sm:h-48 flex flex-col items-center justify-center my-2 overflow-hidden rounded-xl bg-gradient-to-br from-[#FAF3E6] to-[#E5DEC9] border border-[#FFD000]/30">
          <div className="w-16 h-16 rounded-full bg-[#FFD000]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-9 h-9 text-[#854D0E] animate-pulse" />
          </div>
          <p className="font-anton uppercase text-sm tracking-wider text-[#854D0E]">
            {itemCountHint} Délices Secrets Inclus
          </p>
          <span className="text-[10px] font-bold text-[#888] font-mono mt-0.5">
            Portions : {available} / {total}
          </span>
        </div>

        {/* Informations Panier */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="font-anton uppercase text-xl font-black tracking-wide text-[#111111] line-clamp-1 group-hover:text-[#DA0711] transition-colors">
              Panier Surprise Montfleury
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

            <p className="text-xs text-[#555] line-clamp-2 leading-relaxed font-sans font-medium">
              {teaser}
            </p>
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

            <div className="btn-griddle-yellow text-xs py-2 px-4 shadow-sm group-hover:bg-[#eec200]">
              <span>RÉSERVER</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#111111]" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
