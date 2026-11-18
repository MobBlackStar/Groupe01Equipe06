// 💡 Concept & Analogie : Comme la pente douce d'un toboggan qui guide le prix vers le bas au fur et à mesure que l'heure tourne, ce sélecteur permet au commerçant de choisir entre un prix fixe traditionnel et une enchère dégressive dynamique.
// 🔄 Comparaison React / Flutter : En React, la courbe SVG est redessinée en temps réel via des coordonnées SVG calculées par `@shared/pricing.js` ; en Flutter, nous dessinons la même trajectoire via un `CustomPainter`.
// 🎯 À retenir pour la soutenance : "Ce module de prévisualisation matérialise la formule déterministe de décroissance linéaire par pas de 100 millimes, permettant au commerçant de visualiser immédiatement son prix de départ, son palier médian et son prix plancher."

import React from 'react';
import { PRICING_MODES } from '@shared/constants.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import Input from '../../components/ui/Input.jsx';

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

  const safe = (v) => {
    const n = Number(v);
    return v != null && Number.isFinite(n) && n > 0 ? formatTND(n) : '—';
  };

  return (
    <div className={`cs-card p-6 sm:p-8 space-y-6 ${className}`}>
      {/* En-tête + bascule */}
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="cs-h3">Mode de tarification</h3>
          <p className="text-base text-[#5E5850] mt-1">
            {isDutch
              ? 'Smart Decay : le prix baisse tout seul jusqu\'à la fin du créneau, pour tout écouler.'
              : 'Prix fixe : le même prix réduit pendant tout le créneau de retrait.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Mode de tarification">
          <button
            type="button"
            aria-pressed={!isDutch}
            onClick={() => onModeChange(PRICING_MODES.FIXED)}
            className="cs-chip"
          >
            🏷️ Prix fixe
          </button>
          <button
            type="button"
            aria-pressed={isDutch}
            onClick={() => onModeChange(PRICING_MODES.DUTCH_AUCTION)}
            className="cs-chip"
          >
            ⚡ Smart Decay
          </button>
        </div>
      </div>

      {/* CAS 1 : PRIX FIXE */}
      {!isDutch ? (
        <Input
          label="Prix réduit étudiant (en DT)"
          required
          placeholder="ex : 4.5"
          value={fixedPriceMillimes ? fixedPriceMillimes / 1000 : ''}
          onChange={(e) => onPriceChange('fixed', Number(e.target.value) * 1000)}
          helperText={`Prix affiché aux étudiants : ${safe(fixedPriceMillimes)}`}
        />
      ) : (
        /* CAS 2 : SMART DECAY (ENCHÈRE DÉGRESSIVE) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Prix de départ (millimes)"
              required
              placeholder="ex : 5500"
              value={startPriceMillimes}
              onChange={(e) => onPriceChange('start', Number(e.target.value))}
              helperText={`Ouverture : ${safe(startPriceMillimes)}`}
            />

            <Input
              label="Prix plancher (millimes)"
              required
              placeholder="ex : 3000"
              value={floorPriceMillimes}
              onChange={(e) => onPriceChange('floor', Number(e.target.value))}
              helperText={`Minimum garanti : ${safe(floorPriceMillimes)}`}
            />
          </div>

          {/* MINI COURBE DE DÉCROISSANCE */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="cs-label">Courbe de prix sur 90 min</span>
              <span className="cs-label !text-[#DA0711]">Pas de 100 millimes</span>
            </div>

            <div className="rounded-2xl bg-[#FAF3E6] px-4 pt-5 pb-3">
              <svg viewBox="0 0 400 110" className="w-full h-24 sm:h-28" preserveAspectRatio="none" aria-hidden="true">
                <line x1="0" y1="100" x2="400" y2="100" stroke="#111111" strokeWidth="2" />
                <polygon points="12,14 200,57 388,100 12,100" fill="rgba(218, 7, 17, 0.12)" />
                <polyline
                  points="12,14 200,57 388,100"
                  fill="none"
                  stroke="#DA0711"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="flex justify-between -mt-1 px-1" aria-hidden="true">
                <span className="w-3.5 h-3.5 rounded-full bg-[#DA0711] border-2 border-[#111111]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFD000] border-2 border-[#111111]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#1F7A3A] border-2 border-[#111111]" />
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <dt className="cs-label">Départ</dt>
                <dd className="cs-figure text-[28px] sm:text-[34px] text-[#DA0711] mt-1">{safe(currentCalculatedPrice)}</dd>
              </div>
              <div className="text-center">
                <dt className="cs-label">Mi-créneau</dt>
                <dd className="cs-figure text-[28px] sm:text-[34px] mt-1">{safe(midCalculatedPrice)}</dd>
              </div>
              <div className="text-right">
                <dt className="cs-label">Plancher</dt>
                <dd className="cs-figure text-[28px] sm:text-[34px] text-[#1F7A3A] mt-1">{safe(floorCalculatedPrice)}</dd>
              </div>
            </dl>

            <p className="text-base text-[#5E5850] mt-4 leading-relaxed">
              Le prix se met à jour chaque seconde sur les téléphones des étudiants, sans aucune action de votre part.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
