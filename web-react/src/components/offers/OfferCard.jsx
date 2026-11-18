// 💡 Concept & Analogie : Comme les bons de commande suspendus au-dessus du passe-plat dans un restaurant street-food de nuit (StreetWok), chaque ticket de commande est accroché par une pince métallique et arbore une bordure inférieure déchirée en dents de scie.
// 🔄 Comparaison React / Flutter : En React, `OfferCard` implémente un DepthCard 3D avec bordure déchirée CSS `.ticket-serrated-teeth` ; en Flutter, `offer_card.dart` reproduit le même ticket papier crème (#F5EFE6) avec séparateurs en pointillés.
// 🎯 À retenir pour la soutenance : "Le ticket suspendu StreetWok offre une immersion tactile immédiate : prix dégressif en direct, compte à rebours de fraîcheur et repère géographique précis depuis l'ESSECT."
// Module : Catalogue & Exploration (M4, I1)

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Package, ArrowRight, Flame } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { DepthCard, DepthLayer } from '../common/DepthCard.jsx';
import { computeUrgencyColor } from '@shared/pricing.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { getFramerFoodImage } from '../../lib/framerAssets.js';

// SVG local encodé pour garantir un rendu 100% infaillible sans requête réseau en cas d'erreur
const SAFE_FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23161412'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%23222734'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='36' fill='%23F5C400'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='16' fill='%23FFFFFF'%3ECampusSave Montfleury%3C/text%3E%3Ctext x='50%25' y='76%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2394A3B8'%3ERepas anti-gaspillage frais du jour%3C/text%3E%3C/svg%3E";

export default function OfferCard({ offer, className = '' }) {
  if (!offer) return null;

  // Données normalisées
  const id = offer.id || offer._id;
  const title = offer.title || 'Offre Anti-Gaspi';
  const category = offer.category || 'STREET FOOD';
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const isSurprise = Boolean(offer.isSurpriseBasket || offer.surprise);
  const rarity = offer.surprise?.rarity || offer.rarity || 'COMMON';
  const quantity = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 1;

  // Calcul distance et marche
  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 250;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Urgence et couleur de bordure
  const urgencyColor = pickupEndAt ? computeUrgencyColor(pickupEndAt) : '#F5C400';

  // Image optimisée : Framer harvested asset si applicable ou URL fournie
  const framerFoodImg = getFramerFoodImage(title || category);
  const imageUrl = offer.imageUrl || offer.photoUrl || framerFoodImg;

  return (
    <div className={`relative pt-3 group select-none ${className}`}>
      {/* Pince métallique supérieure de suspension (StreetWok Metal Clip - image8.png) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-gradient-to-b from-stone-300 via-stone-100 to-stone-400 rounded-b-md shadow-md border-x border-b border-black/40 z-30 flex items-center justify-center pointer-events-none"
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
          {/* Zone Photo avec 3D Hover & Puces d'urgence */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#0E0D0C]">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10 shadow-sm">
                <Package className="w-3 h-3 text-[#F5C400]" />
                <span>{quantity} restant{quantity > 1 ? 's' : ''}</span>
              </span>
            </div>

            {/* Badge Promo / Tag */}
            <div className="absolute bottom-2.5 right-3 z-10">
              <span className="px-2 py-0.5 rounded-full bg-[#EE3124] text-white text-[9px] font-oswald uppercase tracking-wider font-bold shadow-sm">
                INVENDU SAUVÉ
              </span>
            </div>
          </div>

          {/* Corps du Ticket Papier Crème (#F6F1E7) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div>
              {/* En-tête ticket : Catégorie & Commerce */}
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-1">
                <span className="text-[#EE3124] font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>{category}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-stone-700 font-bold">
                  <MapPin className="w-3 h-3 text-[#EE3124]" />
                  <span>{distanceM}m (~{walkingMin} min)</span>
                </span>
              </div>

              {/* Titre Condensé en Oswald */}
              <h3 className="font-oswald uppercase text-lg sm:text-xl font-black tracking-wide text-[#161412] line-clamp-1 group-hover:text-[#EE3124] transition-colors">
                {title}
              </h3>

              {/* Nom du commerce */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5 mb-2">
                <Store className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="font-medium truncate">{merchantName}</span>
              </div>

              {/* Description courte */}
              {offer.description && (
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-sans">
                  {offer.description}
                </p>
              )}
            </div>

            {/* Ligne séparatrice en pointillés (Ticket Perforation) */}
            <div className="my-3.5 border-t-2 border-dashed border-[#161412]/20" />

            {/* Bas du Ticket : Prix dégressif & Bouton de commande */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500">
                  PRIX DÉGRESSIF :
                </span>
                <PriceTicker offer={offer} size="md" className="!text-[#161412]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E0D0C] text-[#F6F1E7] font-oswald uppercase tracking-wider text-xs font-bold group-hover:bg-[#EE3124] group-hover:text-white shadow-md transition-all">
                <span>RÉSERVER</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F5C400] group-hover:text-white" />
              </div>
            </div>
          </div>

          {/* Dents de scie inférieures (Serrated zig-zag bottom edge - image8.png) */}
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
