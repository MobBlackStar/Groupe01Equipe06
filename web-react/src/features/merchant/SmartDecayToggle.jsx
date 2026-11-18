// 💡 Concept & Analogie : Comme la pente douce d'un toboggan qui guide le prix vers le bas au fur et à mesure que l'heure tourne, ce sélecteur permet au commerçant de choisir entre un prix fixe traditionnel et une enchère dégressive dynamique.
// 🔄 Comparaison React / Flutter : En React, la courbe SVG est redessinée en temps réel via des coordonnées SVG calculées par `@shared/pricing.js` ; en Flutter, nous dessinons la même trajectoire via un `CustomPainter`.
// 🎯 À retenir pour la soutenance : "Ce module de prévisualisation matérialise la formule déterministe de décroissance linéaire par pas de 100 millimes, permettant au commerçant de visualiser immédiatement son prix de départ, son palier médian et son prix plancher."

import React from 'react';
import { PRICING_MODES } from '@shared/constants.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';

export default function SmartDecayToggle({
  pricingMode = PRICING_MODES.DUTCH_AUCTION,
  onModeChange,
  startPriceMillimes = 5500,
  floorPriceMillimes = 3000,
  fixedPriceMillimes = 4000,
  originalPriceMillimes = 7500,
  onPriceChange,
  className = '',
}) {
  const isDutch = pricingMode === PRICING_MODES.DUTCH_AUCTION;

  // Simulation d'une fenêtre de 90 minutes pour la courbe visuelle
  const now = Date.now();
  const decayStartMs = now;
  const pickupEndMs = now + 90 * 60 * 1000;
  const midPointMs = now + 45 * 60 * 1000;

  const mockOffer = {
    pricing: {
      mode: PRICING_MODES.DUTCH_AUCTION,
      startPriceMillimes: Number(startPriceMillimes) || 5500,
      floorPriceMillimes: Number(floorPriceMillimes) || 3000,
      decayStartAt: decayStartMs,
      pickupEndAt: pickupEndMs,
      roundingStepMillimes: 100,
    },
    pickupEndAt: pickupEndMs,
  };

  const currentCalculatedPrice = computeUnitPrice(mockOffer, now);
  const midCalculatedPrice = computeUnitPrice(mockOffer, midPointMs);
  const floorCalculatedPrice = computeUnitPrice(mockOffer, pickupEndMs);

  return (
    <div className={`p-5 rounded-2xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-5 ${className}`}>
      {/* Switcher tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-anton uppercase text-base text-[#141210] flex items-center gap-2 tracking-wide">
            <span>⚡ Mode de Tarification</span>
            {isDutch ? (
              <Badge variant="griddle" size="sm" dot>ENCHÈRE DÉGRESSIVE</Badge>
            ) : (
              <Badge variant="yellow" size="sm">PRIX FIXE</Badge>
            )}
          </h4>
          <p className="text-xs text-[#141210]/70 mt-0.5 font-sans">
            Choisissez la méthode de fixation du prix pour cet article anti-gaspi.
          </p>
        </div>

        <div className="inline-flex p-1 bg-white border-2 border-[#141210] rounded-xl gap-1 shadow-[2px_2px_0px_#141210]">
          <button
            type="button"
            onClick={() => onModeChange(PRICING_MODES.FIXED)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              !isDutch
                ? 'bg-[#FFD000] text-[#141210] shadow-sm'
                : 'text-[#141210]/60 hover:text-[#141210]'
            }`}
          >
            🏷️ Prix Fixe
          </button>
          <button
            type="button"
            onClick={() => onModeChange(PRICING_MODES.DUTCH_AUCTION)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              isDutch
                ? 'bg-[#E51C23] text-white shadow-sm'
                : 'text-[#141210]/60 hover:text-[#141210]'
            }`}
          >
            ⚡ Smart Decay (Dégressif)
          </button>
        </div>
      </div>

      {/* CAS 1 : PRIX FIXE */}
      {!isDutch ? (
        <div className="p-4 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] space-y-4">
          <Input
            label="Prix Réduit Solidaire (en Dinars ou Millimes)"
            required
            placeholder="ex: 4.500 DT ou 4500"
            value={fixedPriceMillimes ? fixedPriceMillimes / 1000 : ''}
            onChange={(e) => onPriceChange('fixed', Number(e.target.value) * 1000)}
            helperText={`Prix fixe affiché aux étudiants : ${formatTND(Number(fixedPriceMillimes) || 0)}`}
          />
        </div>
      ) : (
        /* CAS 2 : SMART DECAY (ENCHÈRE DÉGRESSIVE) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prix de Départ Enchère (Millimes)"
              required
              placeholder="ex: 5500"
              value={startPriceMillimes}
              onChange={(e) => onPriceChange('start', Number(e.target.value))}
              helperText={`Prix d'ouverture : ${formatTND(Number(startPriceMillimes) || 0)}`}
            />

            <Input
              label="Prix Plancher Minimum (Millimes)"
              required
              placeholder="ex: 3000"
              value={floorPriceMillimes}
              onChange={(e) => onPriceChange('floor', Number(e.target.value))}
              helperText={`Prix garanti minimum : ${formatTND(Number(floorPriceMillimes) || 0)}`}
            />
          </div>

          {/* VISUALISATION DE LA COURBE SVG EN DIRECT */}
          <div className="p-4 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#141210] flex items-center gap-1.5 uppercase font-mono">
                <span>📉</span> Prévisualisation de la Courbe Dégressive
              </span>
              <span className="text-[#E51C23] font-black font-mono">Pas : 100 millimes</span>
            </div>

            {/* SVG Interactive Curve */}
            <div className="w-full h-36 bg-[#F4EFE6] rounded-xl p-2 relative border border-[#141210]/20">
              <svg viewBox="0 0 500 120" className="w-full h-full">
                {/* Lignes de repère */}
                <line x1="40" y1="20" x2="460" y2="20" stroke="#141210" strokeDasharray="3,3" strokeOpacity="0.2" />
                <line x1="40" y1="60" x2="460" y2="60" stroke="#141210" strokeDasharray="3,3" strokeOpacity="0.2" />
                <line x1="40" y1="100" x2="460" y2="100" stroke="#141210" strokeOpacity="0.4" />

                {/* Polygone de surface */}
                <polygon
                  points="50,20 250,60 450,100 450,100 50,100"
                  fill="rgba(229, 28, 35, 0.15)"
                />

                {/* Trajectoire de prix */}
                <polyline
                  points="50,20 250,60 450,100"
                  fill="none"
                  stroke="#E51C23"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Points jalons */}
                <circle cx="50" cy="20" r="5" fill="#E51C23" stroke="#141210" strokeWidth="2" />
                <circle cx="250" cy="60" r="5" fill="#FFD000" stroke="#141210" strokeWidth="2" />
                <circle cx="450" cy="100" r="5" fill="#15803D" stroke="#141210" strokeWidth="2" />

                {/* Textes indicateurs */}
                <text x="50" y="14" fill="#E51C23" fontSize="10" fontWeight="bold">
                  Départ : {formatTND(currentCalculatedPrice)}
                </text>
                <text x="250" y="52" fill="#141210" fontSize="10" textAnchor="middle" fontWeight="bold">
                  Mi-créneau : {formatTND(midCalculatedPrice)}
                </text>
                <text x="450" y="94" fill="#15803D" fontSize="10" textAnchor="end" fontWeight="bold">
                  Plancher : {formatTND(floorCalculatedPrice)}
                </text>
              </svg>
            </div>

            <p className="text-[11px] text-[#141210]/70 font-sans leading-relaxed">
              Le prix s'ajustera automatiquement à chaque seconde sur les téléphones des étudiants sans nécessiter aucune action de votre part.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}