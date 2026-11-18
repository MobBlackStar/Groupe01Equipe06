// 💡 Concept & Analogie : Comme le coffre mystère scellé d'un stand de marché dont les dorures dissimulent une sélection gourmande secrète.
// 🔄 Comparaison React / Flutter : En React, la carte combine `DepthCard` avec bordure dorée et dents de scie serrated ; en Flutter, `mystery_box_card` adapte les reflets holographiques.
// 🎯 À retenir pour la soutenance : "Le panier surprise garantit un taux d'écoulement record chez les artisans de Montfleury grâce au déblocage gamifié de la rareté."

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Store, Star, Package, HelpCircle, ArrowRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { DepthCard, DepthLayer } from '../common/DepthCard.jsx';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { calculateWalkingMinutes } from '@shared/geo.js';

export default function MysteryBoxCard({ offer, className = '' }) {
  if (!offer) return null;

  const id = offer.id || offer._id;
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const rarity = offer.surprise?.rarity || offer.rarity || SURPRISE_RARITY.COMMON;
  const teaser = offer.surprise?.teaser || "Assortiment secret de délices frais cuisinés aujourd'hui.";
  const itemCountHint = offer.surprise?.itemCountHint || 3;
  const rating = offer.merchantRating || offer.merchant?.rating || 4.8;

  // Calcul portions
  const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
  const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;

  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  return (
    <div className={`relative pt-3 group select-none ${className}`}>
      {/* Pince métallique dorée pour panier surprise */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-gradient-to-b from-amber-300 via-amber-100 to-amber-500 rounded-b-md shadow-md border-x border-b border-[#141210] z-30 flex items-center justify-center pointer-events-none"
      >
        <div className="w-4 h-1 bg-[#141210]/60 rounded-full" />
      </div>

      <DepthCard
        maxTilt={8}
        scale={1.02}
        className="w-full relative rounded-xl overflow-visible transition-all duration-200"
      >
        <Link
          to={`/app/offers/${id}`}
          className="block relative rounded-xl bg-[#FAF6EE] text-[#141210] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] hover:shadow-[6px_6px_0px_#141210] hover:-translate-y-0.5 transition-all pb-4 overflow-hidden"
        >
          {/* Zone Visuelle Boîte Mystère */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-b from-[#141210] via-[#221f1d] to-[#141210] flex flex-col items-center justify-center p-4 border-b-2 border-[#141210]">
            
            {/* Puces en haut */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <CountdownChip pickupEndAt={pickupEndAt} />
            </div>
            <div className="absolute top-2.5 left-2.5 z-10">
              <RarityBadge rarity={rarity} />
            </div>

            {/* Illustration 3D Coffre Scellé avec DepthLayer */}
            <DepthLayer depth={25} shadow className="flex flex-col items-center">
              <div className="relative">
                <img
                  src="/assets/griddle/food/box-assortiment-fika.png"
                  alt="Panier Mystère"
                  className="w-24 h-24 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="mt-2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#141210] border border-[#FFD000] text-[10px] font-mono tracking-widest uppercase text-[#FFD000] shadow-[1.5px_1.5px_0px_#FFD000]">
                <Sparkles className="w-3 h-3 text-[#FFD000] animate-spin-slow" />
                <span>PANIER MYSTÈRE SCELLÉ</span>
              </div>
            </DepthLayer>

            {/* Stock restant en bas à gauche */}
            <div className="absolute bottom-2.5 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF6EE] text-[11px] font-bold text-[#141210] border border-[#141210] shadow-[1.5px_1.5px_0px_#141210]">
                <Package className="w-3.5 h-3.5 text-[#E51C23]" />
                <span>Portions : {available} / {total}</span>
              </span>
            </div>

            {/* Note marchande */}
            <div className="absolute bottom-2.5 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFD000] text-[#141210] text-[11px] font-black border border-[#141210] shadow-[1.5px_1.5px_0px_#141210]">
                <Star className="w-3 h-3 fill-[#141210]" />
                <span>{rating}</span>
              </span>
            </div>
          </div>

          {/* Corps du Ticket Papier Ivoire */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Commerce & Distance */}
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#666] mb-1">
                <span className="text-[#C2410C] font-black flex items-center gap-1 truncate max-w-[150px]">
                  <Store className="w-3 h-3" />
                  <span className="truncate">{merchantName}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#141210] font-bold shrink-0">
                  <MapPin className="w-3 h-3 text-[#E51C23]" />
                  <span>{distanceM}m (~{walkingMin} min)</span>
                </span>
              </div>

              {/* Titre du panier */}
              <h3 className="font-anton uppercase text-xl font-black tracking-wide text-[#141210] line-clamp-1 group-hover:text-[#E51C23] transition-colors">
                {offer.title}
              </h3>

              {/* Teaser secret */}
              <p className="mt-1 text-xs text-[#555] line-clamp-2 italic font-sans leading-relaxed font-medium">
                "{teaser}"
              </p>

              {/* Puce d'estimation */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEF08A] border border-[#A16207] text-[10px] text-[#854D0E] font-mono font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-[#854D0E]" />
                <span>Min. {itemCountHint} pièces fraîches du jour</span>
              </div>
            </div>

            {/* Séparateur en pointillés */}
            <div className="my-3.5 border-t-2 border-dashed border-[#141210]/25" />

            {/* Prix & Bouton Découvrir */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                  PRIX DÉGRESSIF :
                </span>
                <PriceTicker offer={offer} size="md" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFD000] text-[#141210] font-anton uppercase tracking-wider text-xs font-black border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#e6bb00] transition-all">
                <span>DÉCOUVRIR</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#141210]" />
              </div>
            </div>
          </div>

          {/* Dents de scie inférieures */}
          <div
            aria-hidden="true"
            className="w-full h-3 bg-repeat-x pointer-events-none mt-1"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' fill='%23FAF6EE'%3E%3Cpolygon points='0,0 8,10 16,0'/%3E%3C/svg%3E")`,
              backgroundSize: '16px 10px',
              filter: 'drop-shadow(0 2px 2px rgba(20,18,16,0.15))',
            }}
          />
        </Link>
      </DepthCard>
    </div>
  );
}
