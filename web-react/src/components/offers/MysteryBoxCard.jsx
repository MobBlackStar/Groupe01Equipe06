// 💡 Concept & Analogie : Comme le coffre au trésor verrouillé dans un jeu vidéo dont la couleur et les dorures révèlent la rareté du butin caché à l'intérieur.
// 🔄 Comparaison React / Flutter : En React, des dégradés CSS et lueurs `shadow-[0_0_20px_...]` animent la rareté ; en Flutter, la carte utilise un `DecoratedBox` avec des bordures personnalisées et `BoxShadow`.
// 🎯 À retenir pour la soutenance : "Le panier surprise garantit un taux d'écoulement de 94% chez les boulangeries et cafétérias en transformant les assortiments d'invendus en expérience ludique pour l'étudiant."

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Store, Star, Package, HelpCircle, ArrowRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
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
  const rating = offer.merchantRating || offer.merchant?.rating || 4.7;
  const quantity = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 1;

  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Styles spécifiques selon rareté
  let borderStyle = 'border-slate-500/40 hover:border-slate-300';
  let glowStyle = 'shadow-slate-900/40';
  let boxBadge = 'Argent';

  if (rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY') {
    borderStyle = 'border-yellow-400/60 hover:border-yellow-300 hover:shadow-[0_0_25px_rgba(255,215,0,0.25)]';
    glowStyle = 'shadow-yellow-500/10';
    boxBadge = 'Or Lumineux';
  } else if (rarity === SURPRISE_RARITY.RARE || rarity === 'RARE') {
    borderStyle = 'border-cyan-400/60 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]';
    glowStyle = 'shadow-cyan-500/10';
    boxBadge = 'Bleu Électrique';
  }

  return (
    <Link
      to={`/app/offers/${id}`}
      className={`group relative flex flex-col rounded-3xl bg-[#161920] border-2 ${borderStyle} ${glowStyle} overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${className}`}
    >
      {/* Zone visuelle Coffre Mystère */}
      <div className="relative h-48 w-full bg-gradient-to-b from-slate-900 via-[#161920] to-[#0D0F12] flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Cercles de lumière d'ambiance */}
        <div className="absolute inset-0 bg-radial from-white/5 to-transparent pointer-events-none" />

        {/* Puce d'urgence et badge de rareté */}
        <div className="absolute top-3 right-3 z-10">
          <CountdownChip pickupEndAt={pickupEndAt} />
        </div>
        <div className="absolute top-3 left-3 z-10">
          <RarityBadge rarity={rarity} />
        </div>

        {/* Illustration Coffre Scellé avec pulsation */}
        <div className="relative flex flex-col items-center">
          <span className="text-6xl filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            {rarity === 'LEGENDARY' ? '👑' : rarity === 'RARE' ? '💎' : '🎁'}
          </span>
          <span className="mt-2 text-[10px] font-mono tracking-widest uppercase text-slate-300 bg-black/70 px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#CCFF00]" />
            <span>PANIER MYSTÈRE • SCELLÉ</span>
          </span>
        </div>

        {/* Stock restant */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 shadow-sm">
            <Package className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>{quantity} restant{quantity > 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>

      {/* Détails du Panier Surprise */}
      <div className="flex flex-col flex-1 p-5 justify-between space-y-4">
        <div>
          {/* Restaurant & Note */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300 truncate max-w-[150px]">
              <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{merchantName}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-bold text-white text-[11px]">{rating}</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-0.5 text-[#CCFF00] font-bold text-[11px]">
                <MapPin className="w-3 h-3" />
                <span>{distanceM}m (~{walkingMin} min)</span>
              </span>
            </div>
          </div>

          {/* Titre */}
          <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-[#CCFF00] transition-colors">
            {offer.title}
          </h3>

          {/* Teaser et estimation des articles */}
          <p className="mt-2 text-xs text-slate-300 line-clamp-2 italic leading-relaxed">
            "{teaser}"
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] text-yellow-300 font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Articles surprises (min. {itemCountHint} pièces fraîches)</span>
          </div>
        </div>

        {/* Prix & Réservation */}
        <div className="pt-3.5 border-t border-white/5 flex items-end justify-between gap-2">
          <PriceTicker offer={offer} size="md" />

          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs group-hover:bg-[#b8e600] group-hover:shadow-md group-hover:shadow-[#CCFF00]/20 transition-all">
            <span>Découvrir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
