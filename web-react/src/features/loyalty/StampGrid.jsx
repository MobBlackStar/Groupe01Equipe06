// 💡 Concept & Analogie : Comme la carte à tampons carton BOWL CLUB / CAMPUSSAVE CLUB de StreetWok (image9.png), avec ses emplacements circulaires pointillés, ses tampons rouge vermillon en forme de bol fumant et son 10ème emplacement "FREE BOWL".
// 🔄 Comparaison React / Flutter : En React, la grille utilise 10 cercles pointillés en 2 rangées avec tampons vectoriels et inclinaison -2deg ; en Flutter, `loyalty_card_screen.dart` adapte la même grille tactile.
// 🎯 À retenir pour la soutenance : "La mécanique de 10 tampons (1 repas = 1 tampon) déclenche un palier à 100% de complétion avec déblocage immédiat d'un coupon détachable de réduction."
// Module : Gamification & Fidélité (B3, I4)

import React from 'react';
import { calculateStamps } from '@shared/loyalty.js';
import { Flame } from 'lucide-react';

export default function StampGrid({ ecoPoints = 0, className = '' }) {
  // Calcul du nombre de tampons (sur 10 pour le CLUB)
  const safePoints = Number.isFinite(Number(ecoPoints)) ? Math.max(0, Number(ecoPoints)) : 0;
  const currentCyclePoints = safePoints % 200; // Cycle de 10 repas x 20 pts = 200 pts
  const activeStamps = Math.min(10, Math.floor(currentCyclePoints / 20));
  const pointsToNext = 20 - (currentCyclePoints % 20);

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
            1 repas sauvé = 1 tampon rouge. Le 10e est offert par le club.
          </p>
          <div className="text-right shrink-0">
            <span className="cs-figure block text-[48px] sm:text-[60px] text-[#DA0711]">
              {activeStamps}
              <span className="text-[#111111]">/10</span>
            </span>
            <span className="cs-label">Tampons</span>
          </div>
        </div>

        {/* Grille des 10 tampons circulaires (2 rangées de 5) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 py-7">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
            const isStamped = slot <= activeStamps;
            const isFinal = slot === 10;
            const tilt = ((slot * 37) % 25) - 12; // inclinaison « coup de tampon » pseudo-aléatoire stable

            if (isFinal && !isStamped) {
              /* 10ème emplacement : récompense moutarde */
              return (
                <div
                  key={slot}
                  className="relative aspect-square rounded-full bg-[#FFD000] border-2 border-[#111111] flex flex-col items-center justify-center text-center rotate-[-8deg]"
                  aria-label="10e tampon : repas offert"
                >
                  <span className="hidden sm:block font-sticker text-lg leading-none text-[#DA0711]">OFFERT</span>
                  <span className="text-2xl sm:text-xl leading-none sm:mt-0.5" aria-hidden="true">🎁</span>
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
