// 💡 Concept & Analogie : Comme une étiquette autocollante 'Offre Flash' ou 'Certifié Bio' sur un paquet en rayon, le badge attire immédiatement le regard sur un statut clé.
// 🔄 Comparaison React / Flutter : En React, `Badge` est un `span` stylisé en flexbox inline ; en Flutter, il correspond au widget `Chip` ou à un `Container` compact.
// 🎯 À retenir pour la soutenance : "Nous utilisons un code couleur tactile : Vert pour actif/écologie, Jaune Griddle pour le Smart Decay et Rouge pour les alertes ou expirations."

import React from 'react';

export default function Badge({
  children,
  variant = 'green',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-bold uppercase tracking-wider rounded-full select-none text-xs';

  const variants = {
    green: 'bg-[#DCFCE7] text-[#15803D] border border-[#166534]/20',
    lime: 'bg-[#DCFCE7] text-[#15803D] border border-[#166534]/20',
    emerald: 'bg-[#DCFCE7] text-[#15803D] border border-[#166534]/20',
    yellow: 'bg-[#FEF08A] text-[#854D0E] border border-[#A16207]/20',
    griddle: 'bg-[#FFD000] text-[#111111] border border-[#111111]/15',
    orange: 'bg-[#FFEDD5] text-[#C2410C] border border-[#EA580C]/20',
    red: 'bg-[#FEE2E2] text-[#DA0711] border border-[#DA0711]/20',
    cyan: 'bg-[#E0F2FE] text-[#0369A1] border border-[#0284C7]/20',
    purple: 'bg-[#F3E8FF] text-[#7E22CE] border border-[#9333EA]/20',
    muted: 'bg-[#EDE6D7] text-[#666] border border-[#111111]/10',
  };

  const dotColors = {
    green: 'bg-[#15803D]',
    lime: 'bg-[#15803D]',
    emerald: 'bg-[#15803D]',
    yellow: 'bg-[#854D0E]',
    griddle: 'bg-[#111111]',
    orange: 'bg-[#C2410C]',
    red: 'bg-[#B91C1C]',
    cyan: 'bg-[#0369A1]',
    purple: 'bg-[#7E22CE]',
    muted: 'bg-[#666]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.green} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            dotColors[variant] || dotColors.green
          }`}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
