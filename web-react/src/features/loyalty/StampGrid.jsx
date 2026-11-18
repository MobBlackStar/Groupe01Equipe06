// 💡 Concept & Analogie : Comme la carte à tampons carton BOWL CLUB de StreetWok (image9.png), avec ses emplacements circulaires pointillés, ses tampons rouge vermillon en forme de bol fumant et son 10ème emplacement "FREE BOWL".
// 🔄 Comparaison React / Flutter : En React, la grille utilise 10 cercles pointillés en 2 rangées avec tampons vectoriels et inclinaison -2deg ; en Flutter, `loyalty_card_screen.dart` adapte la même grille tactile.
// 🎯 À retenir pour la soutenance : "La mécanique de 10 tampons (1 repas = 1 tampon) déclenche un palier à 100% de complétion avec déblocage immédiat d'un coupon détachable de réduction."
// Module : Gamification & Fidélité (B3, I4)

import React from 'react';
import { calculateStamps } from '@shared/loyalty.js';
import { Flame, Sparkles, Check, Utensils } from 'lucide-react';

export default function StampGrid({ ecoPoints = 0, className = '' }) {
  // Calcul du nombre de tampons (sur 10 pour le BOWL CLUB)
  const currentCyclePoints = ecoPoints % 200; // Cycle de 10 repas x 20 pts = 200 pts
  const activeStamps = Math.min(10, Math.floor(currentCyclePoints / 20));
  const pointsToNext = 20 - (currentCyclePoints % 20);

  return (
    <div className={`p-6 sm:p-8 rounded-3xl bg-[#F6F1E7] text-[#161412] shadow-2xl border border-black/10 relative overflow-hidden select-none ${className}`}>
      
      {/* En-tête de la Carte Tampons BOWL CLUB (image9.png) */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-dashed border-[#161412]/20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-oswald uppercase text-2xl sm:text-3xl font-black tracking-wider text-[#161412]">
              BOWL CLUB
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#161412] text-[#F5C400] text-[9px] font-mono font-bold">
              ESSECT 2026
            </span>
          </div>
          <p className="text-xs text-stone-600 font-sans mt-0.5">
            1 repas sauvé = 1 tampon rouge. Le 10ème est offert par le club.
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-sm sm:text-base font-black text-[#EE3124] tracking-wider block">
            {activeStamps}/10 STAMPED
          </span>
          <span className="text-[10px] text-stone-500 font-mono">
            {ecoPoints} EcoPoints Cumulés
          </span>
        </div>
      </div>

      {/* Grille des 10 tampons circulaires (2 rangées de 5) (image9.png) */}
      <div className="grid grid-cols-5 gap-2.5 sm:gap-4 py-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
          const isStamped = slot <= activeStamps;
          const isFinal = slot === 10;

          return (
            <div
              key={slot}
              className={`relative aspect-square rounded-full flex flex-col items-center justify-center p-1 transition-all duration-300 ${
                isStamped
                  ? 'border-2 border-dashed border-[#EE3124] bg-[#EE3124]/5 scale-[1.03] shadow-sm'
                  : isFinal
                  ? 'border-2 border-dashed border-[#EE3124] bg-amber-500/5'
                  : 'border-2 border-dashed border-stone-400/70 bg-transparent'
              }`}
            >
              {isStamped ? (
                /* Tampon Rouge StreetWok Bol Fumant */
                <div className="flex flex-col items-center animate-fadeIn">
                  <div className="relative text-[#EE3124]">
                    {/* Icône bol stylisé avec fumée */}
                    <div className="flex justify-center gap-0.5 mb-0.5 text-[8px] font-black text-[#EE3124] animate-pulse">
                      <span>(</span><span>(</span><span>(</span>
                    </div>
                    <div className="w-6 h-3 sm:w-8 sm:h-4 bg-[#EE3124] rounded-b-full relative flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-0.5 bg-white rounded-full opacity-60" />
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-black text-[#EE3124] tracking-tighter mt-1">
                    SAUVÉ
                  </span>
                </div>
              ) : isFinal ? (
                /* 10ème Slot : FREE BOWL */
                <div className="flex flex-col items-center text-center p-1">
                  <span className="font-oswald text-[10px] sm:text-xs font-black text-[#EE3124] uppercase leading-tight">
                    FREE BOWL
                  </span>
                  <span className="text-[7px] font-mono text-[#EE3124] mt-0.5">OFFERT</span>
                </div>
              ) : (
                /* Slot vide numéroté */
                <div className="text-center opacity-40">
                  <span className="font-mono text-xs sm:text-sm font-bold text-stone-500">{slot}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pied de carte avec perforation et astuce */}
      <div className="pt-3 border-t-2 border-dashed border-[#161412]/20 flex items-center justify-between text-xs text-stone-600 font-mono">
        <span className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#EE3124]" />
          <span>Chaque tampon valide 20 EcoPoints pour la filière</span>
        </span>
        <span className="text-[#EE3124] font-bold">
          Plus que {pointsToNext} pts pour le prochain tampon !
        </span>
      </div>
    </div>
  );
}
