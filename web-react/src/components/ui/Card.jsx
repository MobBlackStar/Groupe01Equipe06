// 💡 Concept & Analogie : Comme les plateaux de service et coupelles d'un diner vintage, ce conteneur isole une unité visuelle sur la toile crème #FAF3E6 avec une douce texture biscuit #EDE6D7.
// 🔄 Comparaison React / Flutter : En React, `Card` utilise des coins adoucis (rounded-2xl) sans bordure agressive ; en Flutter, `AppCard` reproduit cette même élévation ton sur ton.
// 🎯 À retenir pour la soutenance : "La surface chaude #EDE6D7 et le blanc pur #FFFFFF s'harmonisent sans bordure noire agressive pour une ergonomie moderne, tactile et aérée."

import React from 'react';

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-2xl transition-all duration-200 relative';

  const variants = {
    default: 'bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] text-[#111111]',
    hoverable: 'bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] text-[#111111] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)]',
    interactive: 'bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] text-[#111111] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)] cursor-pointer active:translate-y-0.5 active:scale-[0.99]',
    glow: 'bg-[#EDE6D7] border border-[#DA0711]/30 shadow-[0_4px_20px_rgba(218,7,17,0.12)] text-[#111111]',
    glass: 'bg-[#FAF3E6]/90 backdrop-blur-md border border-[#111111]/8 shadow-[0_8px_30px_rgba(17,17,17,0.05)] text-[#111111]',
    white: 'bg-[#FFFFFF] border border-[#111111]/6 shadow-[0_8px_30px_rgba(17,17,17,0.06)] text-[#111111]',
  };

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
