// 💡 Concept & Analogie : Comme une étiquette autocollante fluo 'Offre Flash' ou 'Certifié Bio' sur un paquet en rayon, le badge attire immédiatement le regard sur un statut clé ou une caractéristique notable.
// 🔄 Comparaison React / Flutter : En React, `Badge` est un `span` stylisé en flexbox inline ; en Flutter, il correspond au widget `Chip` ou à un `Container` compact avec padding réduit.
// 🎯 À retenir pour la soutenance : "Nous utilisons un code couleur sémantique strict : Vert Lime pour l'actif/écologie, Ambre Urgent pour le Smart Decay et Cramoisi pour les alertes ou annulations."

import React from 'react';

export default function Badge({
  children,
  variant = 'lime',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-semibold uppercase tracking-wider rounded-full select-none';

  const variants = {
    lime: 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30',
    orange: 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30',
    red: 'bg-[#FF1744]/15 text-[#FF1744] border border-[#FF1744]/30',
    cyan: 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30',
    purple: 'bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/30',
    muted: 'bg-[#262A33] text-[#8A92A6] border border-[#383e4c]',
  };

  const dotColors = {
    lime: 'bg-[#CCFF00]',
    orange: 'bg-[#FF5500]',
    red: 'bg-[#FF1744]',
    cyan: 'bg-[#38bdf8]',
    purple: 'bg-[#c084fc]',
    muted: 'bg-[#8A92A6]',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.lime} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            dotColors[variant] || dotColors.lime
          }`}
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
