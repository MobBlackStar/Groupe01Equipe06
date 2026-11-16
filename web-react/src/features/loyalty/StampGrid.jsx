// 💡 Concept & Analogie : Comme la carte de fidélité en carton de la pizzeria avec 5 tampons à encre violette, modernisée en version éco-numérique où chaque repas tamponne une feuille verte sur la carte.
// 🔄 Comparaison React / Flutter : En React, la grille de 5 tampons utilise flexbox avec bordures pointillées et animations d'apparition ; en Flutter, nous composons une `Row` de conteneurs circulaires avec icônes `Icons.eco`.
// 🎯 À retenir pour la soutenance : "Une boucle de gratification ultra-courte de 5 repas (100 EcoPoints) pour fidéliser immédiatement l'étudiant et déclencher un nouvel avantage."

import React from 'react';
import { calculateStamps } from '@shared/loyalty.js';

export default function StampGrid({ ecoPoints = 0, className = '' }) {
  const activeStamps = calculateStamps(ecoPoints); // 0 à 4
  const pointsInCycle = ecoPoints % 100;
  const pointsToNext = 100 - pointsInCycle;

  return (
    <div className={`p-5 rounded-2xl bg-[#0D0F12] border border-white/10 space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span>🌱</span>
          <span>Cycle de Sauvetage en Cours</span>
        </span>
        <span className="text-[#CCFF00] font-mono font-bold text-[11px]">
          {activeStamps} / 5 tampons
        </span>
      </div>

      {/* Rangée des 5 tampons */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
        {[1, 2, 3, 4, 5].map((index) => {
          const isStamped = index <= activeStamps;
          const isFinalReward = index === 5;

          return (
            <div
              key={index}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 aspect-square ${
                isStamped
                  ? 'bg-[#CCFF00]/15 border-[#CCFF00] shadow-md shadow-[#CCFF00]/20 scale-[1.03]'
                  : isFinalReward
                  ? 'bg-amber-500/10 border-amber-400/40 border-dashed animate-pulse'
                  : 'bg-white/5 border-white/10 border-dashed text-slate-500'
              }`}
            >
              {isStamped ? (
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-2xl filter drop-shadow">🌱</span>
                  <span className="text-[9px] font-bold text-[#CCFF00] mt-0.5 font-mono">
                    VALIDÉ
                  </span>
                </div>
              ) : isFinalReward ? (
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-2xl">🎁</span>
                  <span className="text-[9px] font-bold text-amber-300 mt-0.5 font-mono">
                    CADEAU
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <span className="text-lg font-mono font-bold">{index}</span>
                  <span className="text-[8px] tracking-wider mt-0.5">20 pts</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
        <span>1 repas sauvé = 1 tampon (20 pts)</span>
        <span className="text-[#CCFF00] font-medium">
          Plus que {pointsToNext} pts pour le prochain coupon !
        </span>
      </div>
    </div>
  );
}
