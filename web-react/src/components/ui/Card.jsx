// 💡 Concept & Analogie : Comme une assiette de dégustation ou un présentoir sous vitrine, ce conteneur regroupe visuellement les éléments d'une même entité pour former une unité de sens claire.
// 🔄 Comparaison React / Flutter : En React, `Card` est un `div` stylisé avec ombre et bordure subtile Tailwind ; en Flutter, nous utilisons le widget `Card` ou un `Container` avec `BoxDecoration` et `BorderRadius`.
// 🎯 À retenir pour la soutenance : "La carte offre une surface en retrait `#161920` sur fond sombre `#0D0F12` qui hiérarchise l'information sans surcharger l'œil de l'utilisateur."

import React from 'react';

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variants = {
    default: 'bg-[#161920] border border-[#262A33] text-white',
    hoverable: 'bg-[#161920] border border-[#262A33] text-white hover:border-[#383e4c] hover:shadow-xl hover:-translate-y-0.5',
    interactive: 'bg-[#161920] border border-[#262A33] text-white hover:border-[#CCFF00] hover:shadow-[0_0_25px_rgba(204,255,0,0.12)] cursor-pointer active:scale-[0.99]',
    glow: 'bg-[#161920] border border-[#CCFF00]/40 text-white shadow-[0_0_30px_rgba(204,255,0,0.15)]',
    glass: 'bg-[#161920]/80 backdrop-blur-md border border-white/10 text-white shadow-2xl',
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
