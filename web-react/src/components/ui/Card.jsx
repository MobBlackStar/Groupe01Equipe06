// 💡 Concept & Analogie : Comme les plateaux de service et coupelles d'un diner vintage, ce conteneur isole une unité visuelle sur la toile crème #FAF3E6 avec une douce texture biscuit #EDE6D7.
// 🔄 Comparaison React / Flutter : En React, `Card` utilise des coins adoucis (rounded-2xl) sans bordure agressive ; en Flutter, `AppCard` reproduit cette même élévation ton sur ton.
// 🎯 À retenir pour la soutenance : "La surface chaude #EDE6D7 et le blanc pur #FFFFFF s'harmonisent sans bordure noire agressive pour une ergonomie moderne, tactile et aérée."

import React from 'react';

/** Biscuit surface (#EDE6D7, radius 20px) — the Griddle bestseller card. */
export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const variants = {
    default: 'cs-card',
    hoverable: 'cs-card cs-card-hover',
    interactive: 'cs-card cs-card-hover cursor-pointer',
    glow: 'cs-card ring-2 ring-[#DA0711]',
    glass: 'cs-card',
    white: 'cs-card-paper',
    dark: 'cs-card-ink',
  };

  return (
    <div
      onClick={onClick}
      className={`${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
