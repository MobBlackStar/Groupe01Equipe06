// 💡 Concept & Analogie : Comme une étiquette autocollante 'Offre Flash' ou 'Certifié Bio' sur un paquet en rayon, le badge attire immédiatement le regard sur un statut clé.
// 🔄 Comparaison React / Flutter : En React, `Badge` est un `span` stylisé en flexbox inline ; en Flutter, il correspond au widget `Chip` ou à un `Container` compact.
// 🎯 À retenir pour la soutenance : "Nous utilisons un code couleur tactile : Vert pour actif/écologie, Jaune Griddle pour le Smart Decay et Rouge pour les alertes ou expirations."

import React from 'react';

/** Flat status pill. Colour code: leaf = actif/éco, mustard = Smart Decay, red = alerte. */
export default function Badge({
  children,
  variant = 'green',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  const variants = {
    green: 'cs-pill-leaf',
    lime: 'cs-pill-leaf',
    emerald: 'cs-pill-leaf',
    yellow: 'cs-pill-mustard',
    griddle: 'cs-pill-mustard',
    orange: 'cs-pill-mustard',
    red: 'cs-pill-red',
    cyan: 'cs-pill-ink',
    purple: 'cs-pill-ink',
    ink: 'cs-pill-ink',
    muted: 'cs-pill-outline',
  };

  const dotColors = {
    green: 'bg-[#1F7A3A]', lime: 'bg-[#1F7A3A]', emerald: 'bg-[#1F7A3A]',
    red: 'bg-white', cyan: 'bg-[#FFD000]', purple: 'bg-[#FFD000]', ink: 'bg-[#FFD000]',
  };

  const sizes = { sm: '!text-[0.8125rem] !min-h-[1.6rem] !px-2.5', md: '', lg: '!text-base !min-h-[2.25rem] !px-4' };

  return (
    <span className={`cs-pill ${variants[variant] || variants.green} ${sizes[size] ?? ''} ${className}`} {...props}>
      {dot && <span className={`w-2 h-2 rounded-full animate-pulse ${dotColors[variant] || 'bg-[#111111]'}`} />}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
