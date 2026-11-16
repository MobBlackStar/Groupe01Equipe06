// 💡 Concept & Analogie : Comme la vitrine alléchante d'une boulangerie de quartier où chaque produit affiche clairement son heure de sortie du four, son prix dégressif et sa distance à pied.
// 🔄 Comparaison React / Flutter : En React, la carte utilise un `Link` React Router et des transitions d'échelle au hover (`hover:scale-[1.02]`) ; en Flutter, `OfferCard` enveloppe le tout dans un `InkWell` tactile avec effet d'ondulation.
// 🎯 À retenir pour la soutenance : "La carte d'offre centralise toutes les informations vitales pour l'étudiant en un coup d'œil : prix dégressif en direct, temps de marche depuis l'ESSECT et jauge d'urgence visuelle."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Package, ArrowRight } from 'lucide-react';
import PriceTicker from './PriceTicker.jsx';
import CountdownChip from './CountdownChip.jsx';
import RarityBadge from './RarityBadge.jsx';
import { computeUrgencyColor } from '@shared/pricing.js';
import { calculateWalkingMinutes } from '@shared/geo.js';

// SVG local encodé pour garantir un rendu 100% infaillible sans requête réseau en cas d'erreur
const SAFE_FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23161920'/%3E%3Ccircle cx='300' cy='180' r='60' fill='%23222734'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='36' fill='%23CCFF00'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='16' fill='%23FFFFFF'%3ECampusSave Montfleury%3C/text%3E%3Ctext x='50%25' y='76%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2394A3B8'%3ERepas anti-gaspillage frais du jour%3C/text%3E%3C/svg%3E";

export default function OfferCard({ offer, className = '' }) {
  if (!offer) return null;

  // Données normalisées
  const id = offer.id || offer._id;
  const title = offer.title || 'Offre Anti-Gaspi';
  const merchantName = offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || 'Commerce Montfleury';
  const pickupEndAt = offer.pickupEndAt || offer.pricing?.pickupEndAt;
  const isSurprise = Boolean(offer.isSurpriseBasket || offer.surprise);
  const rarity = offer.surprise?.rarity || offer.rarity || 'COMMON';
  const quantity = offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 1;

  // Calcul distance et marche
  const distanceM = offer.distanceFromEssectM ?? offer.merchantSnapshot?.distanceFromEssectM ?? offer.merchant?.distanceFromEssectM ?? 250;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Urgence et couleur de bordure
  const urgencyColor = pickupEndAt ? computeUrgencyColor(pickupEndAt) : '#CCFF00';

  // Image d'illustration
  const imageUrl = offer.imageUrl || offer.photoUrl || (isSurprise
    ? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80');

  return (
    <Link
      to={`/app/offers/${id}`}
      style={{
        borderColor: `${urgencyColor}33`,
      }}
      className={`group relative flex flex-col rounded-3xl bg-[#161920] border overflow-hidden transition-all duration-300 hover:border-[#CCFF00] hover:shadow-xl hover:shadow-[#CCFF00]/10 hover:-translate-y-1.5 ${className}`}
    >
      {/* Zone Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Empêche strictement toute boucle infinie de rechargement
            e.currentTarget.onerror = null;
            e.currentTarget.src = SAFE_FALLBACK_IMG;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161920] via-transparent to-black/50" />

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
        <div className="absolute bottom-2.5 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 shadow-sm">
            <Package className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span>{quantity} restant{quantity > 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>

      {/* Contenu textuel */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div className="space-y-2">
          {/* Nom du restaurant & distance */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 truncate max-w-[170px] font-semibold text-slate-300">
              <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{merchantName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[#CCFF00] font-bold shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span>{distanceM}m (~{walkingMin} min)</span>
            </span>
          </div>

          {/* Titre de l'offre */}
          <h3 className="font-extrabold text-white text-base leading-snug line-clamp-1 group-hover:text-[#CCFF00] transition-colors">
            {title}
          </h3>

          {/* Description courte */}
          {offer.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {offer.description}
            </p>
          )}
        </div>

        {/* Zone Prix & Action */}
        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-end justify-between gap-2">
          <PriceTicker offer={offer} size="md" />

          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs group-hover:bg-[#b8e600] group-hover:shadow-md group-hover:shadow-[#CCFF00]/20 transition-all">
            <span>Réserver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
