// 💡 Concept & Analogie : Comme le coffre mystère scellé d'un stand de marché dont les dorures et le cachet de cire dissimulent une sélection gourmande secrète.
// 🔄 Comparaison React / Flutter : En React, la carte combine `DepthCard` avec bordure dorée et dents de scie serrated ; en Flutter, `mystery_box_card` adapte les reflets holographiques.
// 🎯 À retenir pour la soutenance : "Le panier surprise garantit un taux d'écoulement record chez les artisans de Montfleury grâce au déblocage gamifié de la rareté (Commun, Rare, Légendaire)."
// Module : Surprise Basket (B2, I3)

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Store, Star, Package, HelpCircle, ArrowRight, Flame } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { DepthCard, DepthLayer } from '../common/DepthCard.jsx';
import { SURPRISE_RARITY } from '@shared/constants.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { FRAMER_ASSETS } from '../../lib/framerAssets.js';

export default function MysteryBoxCard({ offer, className = '' }) {
  if (!offer) return null;

  const id = offer.id || offer._id;
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const rarity = offer.surprise?.rarity || offer.rarity || SURPRISE_RARITY.COMMON;
  const teaser = offer.surprise?.teaser || "Assortiment secret de délices frais cuisinés aujourd'hui.";
  const itemCountHint = offer.surprise?.itemCountHint || 3;
  const rating = offer.merchantRating || offer.merchant?.rating || 4.8;
  const quantity = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 1;

  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Styles selon rareté
  const isLegendary = rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY';
  const isRare = rarity === SURPRISE_RARITY.RARE || rarity === 'RARE';

  return (
    <div className={`relative pt-3 group select-none ${className}`}>
      {/* Pince métallique dorée pour panier surprise */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-gradient-to-b from-amber-300 via-amber-100 to-amber-500 rounded-b-md shadow-md border-x border-b border-black/40 z-30 flex items-center justify-center pointer-events-none"
      >
        <div className="w-4 h-1 bg-black/40 rounded-full" />
      </div>

      <DepthCard
        maxTilt={10}
        scale={1.02}
        className="w-full relative rounded-2xl overflow-visible transition-all duration-300"
      >
        <Link
          to={`/app/offers/${id}`}
          className="block relative rounded-2xl bg-[#F6F1E7] text-[#161412] shadow-xl hover:shadow-2xl transition-all duration-300 pb-4 border border-black/10 overflow-hidden"
        >
          {/* Zone Visuelle Boîte Mystère */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gradient-to-b from-[#161412] via-[#0E0D0C] to-[#161412] flex flex-col items-center justify-center p-4">
            
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
                  src={FRAMER_ASSETS.pastries.boxSurpriseFika?.src || '/assets/framer/pastries/box-assortiment-fika.png'}
                  alt="Panier Mystère"
                  className="w-24 h-24 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="mt-2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/80 border border-[#F5C400]/40 text-[10px] font-mono tracking-widest uppercase text-[#F5C400]">
                <Sparkles className="w-3 h-3 text-[#F5C400] animate-spin-slow" />
                <span>PANIER MYSTÈRE SCELLÉ</span>
              </div>
            </DepthLayer>

            {/* Stock restant en bas à gauche */}
            <div className="absolute bottom-2.5 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10 shadow-sm">
                <Package className="w-3 h-3 text-[#F5C400]" />
                <span>{quantity} restant{quantity > 1 ? 's' : ''}</span>
              </span>
            </div>

            {/* Note marchande */}
            <div className="absolute bottom-2.5 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 text-amber-300 text-[10px] font-bold border border-white/10">
                <Star className="w-3 h-3 fill-amber-300" />
                <span>{rating}</span>
              </span>
            </div>
          </div>

          {/* Corps du Ticket Papier Crème */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* Commerce & Distance */}
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-1">
                <span className="text-amber-600 font-bold flex items-center gap-1 truncate max-w-[150px]">
                  <Store className="w-3 h-3" />
                  <span className="truncate">{merchantName}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-stone-700 font-bold shrink-0">
                  <MapPin className="w-3 h-3 text-[#EE3124]" />
                  <span>{distanceM}m (~{walkingMin} min)</span>
                </span>
              </div>

              {/* Titre du panier */}
              <h3 className="font-oswald uppercase text-lg sm:text-xl font-black tracking-wide text-[#161412] line-clamp-1 group-hover:text-amber-700 transition-colors">
                {offer.title}
              </h3>

              {/* Teaser secret */}
              <p className="mt-1 text-xs text-stone-600 line-clamp-2 italic font-sans leading-relaxed">
                "{teaser}"
              </p>

              {/* Puce d'estimation */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] text-amber-900 font-mono font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Min. {itemCountHint} pièces fraîches artisanales</span>
              </div>
            </div>

            {/* Séparateur en pointillés */}
            <div className="my-3.5 border-t-2 border-dashed border-[#161412]/20" />

            {/* Prix & Bouton Découvrir */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500">
                  PRIX DÉGRESSIF :
                </span>
                <PriceTicker offer={offer} size="md" className="!text-[#161412]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-oswald uppercase tracking-wider text-xs font-black shadow-md hover:opacity-95 transition-all">
                <span>DÉCOUVRIR</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Dents de scie inférieures */}
          <div
            aria-hidden="true"
            className="w-full h-3 bg-repeat-x pointer-events-none mt-1"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' fill='%23F6F1E7'%3E%3Cpolygon points='0,0 8,10 16,0'/%3E%3C/svg%3E")`,
              backgroundSize: '16px 10px',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
            }}
          />
        </Link>
      </DepthCard>
    </div>
  );
}
