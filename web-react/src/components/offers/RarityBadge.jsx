// 💡 Concept & Analogie : Comme les cartes à collectionner ou les trophées de jeux vidéo, ce badge signale instantanément la rareté et le potentiel d'économie d'un panier mystère.
// 🔄 Comparaison React / Flutter : En React, des dégradés CSS et ombres portées créent l'effet lumineux ; en Flutter, `RarityBadge` utilise un `BoxDecoration` avec dégradé linéaire et bordure dorée ou bleutée.
// 🎯 À retenir pour la soutenance : "Trois niveaux de prestige calculés par notre algorithme de rareté : COMMON (argenté), RARE (cyan électrique) et LEGENDARY (doré scintillant)."

import React from 'react';
import { SURPRISE_RARITY } from '@shared/constants.js';

export default function RarityBadge({ rarity = SURPRISE_RARITY.COMMON, score, className = '' }) {
  let label = 'Commun';
  let badgeClasses = 'from-slate-700 to-slate-800 text-slate-200 border-slate-500/40 shadow-slate-900/40';
  let icon = '🎁';

  if (rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY') {
    label = 'Légendaire';
    badgeClasses = 'from-amber-500/20 to-yellow-600/30 text-yellow-300 border-yellow-400/60 shadow-yellow-500/20';
    icon = '✨';
  } else if (rarity === SURPRISE_RARITY.RARE || rarity === 'RARE') {
    label = 'Rare';
    badgeClasses = 'from-cyan-500/20 to-blue-600/30 text-cyan-300 border-cyan-400/60 shadow-cyan-500/20';
    icon = '💎';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-gradient-to-r shadow-sm backdrop-blur-sm tracking-wide ${badgeClasses} ${className}`}
    >
      <span>{icon}</span>
      <span>Panier {label}</span>
      {score !== undefined && (
        <span className="opacity-70 text-[10px]">({Math.round(score * 100)}%)</span>
      )}
    </div>
  );
}
