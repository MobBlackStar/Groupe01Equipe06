// 💡 Concept & Analogie : Comme les bons de commande suspendus au-dessus du passe-plat dans un restaurant street-food de nuit, chaque ticket de commande est accroché par une pince métallique et arbore une bordure inférieure déchirée en dents de scie.
// 🔄 Comparaison React / Flutter : En React, `OfferCard` implémente un DepthCard 3D avec bordure déchirée CSS ; en Flutter, `offer_card.dart` reproduit le même ticket papier crème avec séparateurs en pointillés.
// 🎯 À retenir pour la soutenance : "Le ticket suspendu offre une immersion tactile immédiate : prix dégressif en direct, compte à rebours et repère géographique depuis l'ESSECT."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Package, ArrowRight, Flame } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { DepthCard, DepthLayer } from '../common/DepthCard.jsx';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

const SAFE_FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23FAF6EE'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%23FFD000'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='36' fill='%23141210'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='18' fill='%23141210'%3ECampusSave Montfleury%3C/text%3E%3Ctext x='50%25' y='76%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23666666'%3ERepas frais anti-gaspi du jour%3C/text%3E%3C/svg%3E";

export default function OfferCard({ offer, className = '' }) {
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

  return (
    <div className={`relative pt-3 group select-none ${className}`}>
      {/* Pince métallique supérieure de suspension */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-gradient-to-b from-stone-300 via-stone-100 to-stone-400 rounded-b-md shadow-md border-x border-b border-[#141210] z-30 flex items-center justify-center pointer-events-none"
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
          {/* Zone Photo avec 3D Hover & Puces d'urgence */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#141210] border-b-2 border-[#141210]">
            <DepthLayer depth={15} className="w-full h-full">
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SAFE_FALLBACK_IMG;
                }}
              />
            </DepthLayer>
            
            {/* Dégradé doux */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Puce Compte à rebours en haut à droite */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <CountdownChip pickupEndAt={pickupEndAt} />
            </div>

            {/* Badge Rareté si panier surprise */}
            {isSurprise && (
              <div className="absolute top-2.5 left-2.5 z-10">
                <RarityBadge rarity={rarity} />
              </div>
            )}

            {/* Stock restant en bas à gauche */}
            <div className="absolute bottom-2.5 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF6EE] text-[11px] font-bold text-[#141210] border border-[#141210] shadow-[1.5px_1.5px_0px_#141210]">
                <Package className="w-3.5 h-3.5 text-[#E51C23]" />
                <span>Portions : {available} / {total}</span>
              </span>
            </div>

            {/* Badge Promo / Tag */}
            <div className="absolute bottom-2.5 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md bg-[#E51C23] text-white text-[10px] font-anton uppercase tracking-wider shadow-[1.5px_1.5px_0px_#141210] border border-[#141210]">
                INVENDU SAUVÉ 🔥
              </span>
            </div>
          </div>

          {/* Corps du Ticket Papier Ivoire (#FAF6EE) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* En-tête ticket : Catégorie & Commerce */}
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#666] mb-1">
                <span className="text-[#E51C23] font-black flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{category}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#141210] font-bold">
                  <MapPin className="w-3.5 h-3.5 text-[#E51C23]" />
                  <span>{distanceM}m (~{walkingMin} min)</span>
                </span>
              </div>

              {/* Titre Condensé en Anton */}
              <h3 className="font-anton uppercase text-xl font-black tracking-wide text-[#141210] line-clamp-1 group-hover:text-[#E51C23] transition-colors">
                {title}
              </h3>

              {/* Nom du commerce */}
              <div className="flex items-center gap-1.5 text-xs text-[#555] mt-0.5 mb-2 font-bold">
                <Store className="w-3.5 h-3.5 text-[#888] shrink-0" />
                <span className="truncate">{merchantName}</span>
              </div>

              {/* Description courte */}
              {offer.description && (
                <p className="text-xs text-[#555] line-clamp-2 leading-relaxed font-sans font-medium">
                  {offer.description}
                </p>
              )}
            </div>

            {/* Ligne séparatrice en pointillés (Ticket Perforation) */}
            <div className="my-3.5 border-t-2 border-dashed border-[#141210]/25" />

            {/* Bas du Ticket : Prix dégressif & Bouton de commande */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777]">
                  PRIX DÉGRESSIF :
                </span>
                <PriceTicker offer={offer} size="md" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E51C23] text-white font-anton uppercase tracking-wider text-xs font-bold border-2 border-[#141210] shadow-[2px_2px_0px_#141210] group-hover:bg-[#d1141b] transition-all">
                <span>RÉSERVER</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Dents de scie inférieures (Serrated zig-zag bottom edge) */}
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
