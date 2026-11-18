// 💡 Concept & Analogie : Comme la carte à tampons carton d'un snack de quartier, 5 emplacements circulaires dont le dernier est un coupon détachable : 4 tampons rouges, puis -20 %.
// 🔄 Comparaison React / Flutter : En React, la grille de 5 cercles utilise `calculateStamps` de `shared/loyalty.js` ; en Flutter, `loyalty_card_screen.dart` appelle la même règle.  
// 🎯 À retenir pour la soutenance : "Selon ALG-LOYALTY, tampons = floor((EcoPoints mod 100) / 20) sur 5 ; chaque palier de 100 points débloque un coupon -20 % (plafonné à 2 DT)."
// Module : Gamification & Fidélité (B3, I4)

import React from 'react';
import { calculateStamps } from '@shared/loyalty.js';
import { Flame } from 'lucide-react';

export default function StampGrid({ ecoPoints = 0, className = '' }) {
  // ALG-LOYALTY (plan) : tampons = floor((ecoPoints mod 100) / 20) sur 5 ; le 5e emplacement est le coupon -20 % débloqué à chaque palier de 100 pts
  const safePoints = Number.isFinite(Number(ecoPoints)) ? Math.max(0, Number(ecoPoints)) : 0;
  const activeStamps = calculateStamps(safePoints);
  const pointsToNext = 20 - (safePoints % 20);

  return (
    <div
      className={`relative overflow-hidden select-none rounded-[1.25rem] border-2 border-[#111111] bg-[#FFFDF8] text-[#111111] shadow-[0_30px_60px_-28px_rgba(17,17,17,0.4)] ${className}`}
    >
      {/* Bandeau rouge du club */}
      <div className="bg-[#DA0711] text-[#FAF3E6] px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
        <h3 className="font-title text-[20px] sm:text-[30px] leading-none tracking-tight">CAMPUSSAVE CLUB</h3>
        <span className="hidden sm:block shrink-0">
          <span className="cs-sticker cs-sticker-mustard !text-base !px-3 !py-1.5">ESSECT 2026</span>
        </span>
      </div>

      <div className="px-4 sm:px-8 pt-6 pb-6 sm:pb-8">
        {/* En-tête de la carte : règle + compteur */}
        <div className="flex items-end justify-between gap-4">
          <p className="text-base sm:text-lg leading-snug max-w-[18rem]">
            20 points = 1 tampon rouge. Au 5e, le club t'offre −20 %.
          </p>
          <div className="text-right shrink-0">
            <span className="cs-figure block text-[48px] sm:text-[60px] text-[#DA0711]">
              {activeStamps}
              <span className="text-[#111111]">/5</span>
            </span>
            <span className="cs-label">Tampons</span>
          </div>
        </div>

        {/* Grille des 5 emplacements : 4 tampons + le coupon -20 % */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 py-7">
          {[1, 2, 3, 4, 5].map((slot) => {
            const isStamped = slot <= activeStamps;
            const isFinal = slot === 5;
            const tilt = ((slot * 37) % 25) - 12; // inclinaison « coup de tampon » pseudo-aléatoire stable

            if (isFinal && !isStamped) {
              /* 5ème emplacement : coupon moutarde */
              return (
                <div
                  key={slot}
                  className="relative aspect-square rounded-full bg-[#FFD000] border-2 border-[#111111] flex flex-col items-center justify-center text-center rotate-[-8deg]"
                  aria-label="5e emplacement : coupon -20 %"
                >
                  <span className="hidden sm:block font-sticker text-lg leading-none text-[#DA0711]">-20 %</span>
                  <span className="text-2xl sm:text-xl leading-none sm:mt-0.5" aria-hidden="true">🎟️</span>
                </div>
              );
            }

            return (
              <div
                key={slot}
                className={`relative aspect-square rounded-full flex items-center justify-center ${
                  isStamped
                    ? 'border-[3px] border-[#DA0711] bg-[#DA0711]/[0.07]'
                    : 'border-2 border-dashed border-[#111111]/30'
                }`}
                aria-label={isStamped ? `Tampon ${slot} : repas sauvé` : `Emplacement ${slot} vide`}
              >
                {isStamped ? (
                  /* Tampon rouge encreur */
                  <span
                    className="font-sticker text-[13px] sm:text-xl leading-none text-[#DA0711] whitespace-nowrap animate-fadeIn"
                    style={{ transform: `rotate(${tilt}deg)` }}
                  >
                    SAUVÉ
                  </span>
                ) : (
                  /* Slot vide numéroté */
                  <span className="cs-mono text-base sm:text-lg font-bold text-[#111111]/35">{slot}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Pied de carte perforé */}
        <div className="pt-5 border-t-2 border-dashed border-[#111111]/25 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 cs-mono text-[14px]">
          <span className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#DA0711] shrink-0" aria-hidden="true" />
            <span>
              Plus que <strong className="text-[#DA0711]">{pointsToNext} pts</strong> pour le prochain tampon
            </span>
          </span>
          <span className="font-bold text-[#5E5850]">{safePoints} EcoPoints</span>
        </div>
      </div>
    </div>
  );
}
