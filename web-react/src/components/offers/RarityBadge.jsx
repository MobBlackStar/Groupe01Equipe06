// 💡 Concept & Analogie : Comme les cartes à collectionner ou les trophées de jeux vidéo, ce badge signale instantanément la rareté et le potentiel d'économie d'un panier mystère.
// 🔄 Comparaison React / Flutter : En React, des dégradés CSS et ombres portées créent l'effet lumineux ; en Flutter, `RarityBadge` utilise un `BoxDecoration` avec dégradé linéaire et bordure dorée ou bleutée.
// 🎯 À retenir pour la soutenance : "Trois niveaux de prestige calculés par notre algorithme de rareté : COMMON (argenté), RARE (cyan électrique) et LEGENDARY (doré scintillant)."

import React from 'react';
import { SURPRISE_RARITY } from '@shared/constants.js';

const STYLES = {
  LEGENDARY: { label: 'Légendaire', cls: 'bg-[#FFD000] text-[#111111]', icon: '★' },
  RARE: { label: 'Rare', cls: 'bg-[#DA0711] text-white', icon: '◆' },
  COMMON: { label: 'Commun', cls: 'bg-[#111111] text-[#FAF3E6]', icon: '●' },
};

export default function RarityBadge({ rarity = SURPRISE_RARITY.COMMON, score, className = '' }) {
  const key = rarity === SURPRISE_RARITY.LEGENDARY || rarity === 'LEGENDARY'
    ? 'LEGENDARY'
    : rarity === SURPRISE_RARITY.RARE || rarity === 'RARE'
      ? 'RARE'
      : 'COMMON';
  const s = STYLES[key];
  const pct = Number.isFinite(score) ? Math.round(score * 100) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border-2 border-[#111111] text-[0.875rem] font-semibold uppercase tracking-wide whitespace-nowrap ${s.cls} ${className}`}
    >
      <span aria-hidden="true">{s.icon}</span>
      Panier {s.label}
      {pct !== null && <span className="opacity-75">· {pct}%</span>}
    </span>
  );
}
