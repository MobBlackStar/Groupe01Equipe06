// 💡 Concept & Analogie : Comme une assiette de dégustation ou un présentoir sous vitrine, ce conteneur regroupe visuellement les éléments d'une même entité pour former une unité de sens claire.
// 🔄 Comparaison React / Flutter : En React, `Card` est un `div` stylisé avec ombre et bordure Griddle néo-brutaliste ; en Flutter, nous utilisons le widget `Card` ou un `Container` avec `BoxDecoration`.
// 🎯 À retenir pour la soutenance : "La carte offre une surface chaude #FAF6EE sur toile crème #F4EFE6 avec bordure 2px #141210 et ombre portée 4px 4px pour un relief tactile incomparable."

import React from 'react';

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-xl transition-all duration-150 relative';

  const variants = {
    default: 'bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210]',
    hoverable: 'bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#141210]',
    interactive: 'bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#141210] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#141210]',
    glow: 'bg-[#FAF6EE] border-2 border-[#E51C23] shadow-[4px_4px_0px_#E51C23] text-[#141210]',
    glass: 'bg-[#FAF6EE]/95 backdrop-blur-md border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210]',
    white: 'bg-[#FFFFFF] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210]',
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
