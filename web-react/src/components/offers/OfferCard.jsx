// 💡 Concept & Analogie : Comme la vitrine alléchante d'une boulangerie de quartier où chaque produit affiche clairement son heure de sortie du four, son prix dégressif et sa distance à pied.
// 🔄 Comparaison React / Flutter : En React, la carte utilise un `Link` React Router et des transitions d'échelle au hover (`hover:scale-[1.02]`) ; en Flutter, `OfferCard` enveloppe le tout dans un `InkWell` tactile avec effet d'ondulation.
// 🎯 À retenir pour la soutenance : "La carte d'offre centralise toutes les informations vitales pour l'étudiant en un coup d'œil : prix dégressif en direct, temps de marche depuis l'ESSECT et jauge d'urgence visuelle."

import React from 'react';
import { Link } from 'react-router-dom';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { computeUrgencyColor } from '@shared/pricing.js';
import { calculateWalkingMinutes } from '@shared/geo.js';

export default function OfferCard({ offer, className = '' }) {
  if (!offer) return null;

  // Données normalisées
  const id = offer.id || offer._id;
  const title = offer.title || 'Offre Anti-Gaspi';
  const merchantName = offer.merchantName || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const isSurprise = Boolean(offer.isSurpriseBasket || offer.surprise);
  const rarity = offer.surprise?.rarity || offer.rarity || 'COMMON';
  const quantity = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 1;

  // Calcul distance et marche
  const distanceM = offer.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 250;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Urgence et couleur de bordure
  const urgencyColor = pickupEndAt ? computeUrgencyColor(pickupEndAt) : '#CCFF00';

  // Image fallback si absente
  const defaultImage = isSurprise
    ? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80';
  const imageUrl = offer.imageUrl || offer.photoUrl || defaultImage;

  return (
    <Link
      to={`/app/offers/${id}`}
      style={{
        borderColor: `${urgencyColor}40`,
      }}
      className={`group relative flex flex-col rounded-2xl bg-[#161920] border overflow-hidden transition-all duration-300 hover:border-[#CCFF00] hover:shadow-lg hover:shadow-[#CCFF00]/10 hover:-translate-y-1 ${className}`}
    >
      {/* Zone Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161920] via-transparent to-black/40" />

        {/* Puce Compte à rebours en haut à droite */}
        <div className="absolute top-3 right-3 z-10">
          <CountdownChip pickupEndAt={pickupEndAt} />
        </div>

        {/* Badge Rareté si panier surprise en haut à gauche */}
        {isSurprise && (
          <div className="absolute top-3 left-3 z-10">
            <RarityBadge rarity={rarity} />
          </div>
        )}

        {/* Stock restant en bas à gauche sur l'image */}
        <div className="absolute bottom-2 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-medium text-white border border-white/10">
            📦 {quantity} restant{quantity > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contenu textuel */}
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div>
          {/* Nom du restaurant & distance */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="truncate max-w-[160px] font-medium text-slate-300">
              🏪 {merchantName}
            </span>
            <span className="inline-flex items-center gap-1 text-[#CCFF00]/90">
              📍 {distanceM}m (~{walkingMin} min)
            </span>
          </div>

          {/* Titre de l'offre */}
          <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-[#CCFF00] transition-colors">
            {title}
          </h3>

          {/* Description courte */}
          {offer.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              {offer.description}
            </p>
          )}
        </div>

        {/* Zone Prix & Action */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between">
          <PriceTicker offer={offer} size="md" />

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] active:scale-95 transition-all shadow-md shadow-[#CCFF00]/10"
          >
            Réserver
          </button>
        </div>
      </div>
    </Link>
  );
}
