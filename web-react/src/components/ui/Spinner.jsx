// 💡 Concept & Analogie : Comme un sablier luminescent qui indique au voyageur que le train arrive, ce composant visuel rassure l'utilisateur pendant les opérations asynchrones (requêtes réseau ou chiffrement).
// 🔄 Comparaison React / Flutter : En React, `Spinner` est une animation SVG fluide animée en CSS (`animate-spin`) ; en Flutter, il s'agit d'un `CircularProgressIndicator` paramétré avec les couleurs du thème.
// 🎯 À retenir pour la soutenance : "Le spinner fournit un feedback visuel immédiat pour toutes les promesses asynchrones, évitant ainsi les doubles soumissions de formulaires ou de paiements."

import React from 'react';

export default function Spinner({ size = 'md', variant = 'red', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  const variants = {
    red: 'border-[#E51C23]/20 border-t-[#E51C23]',
    lime: 'border-[#E51C23]/20 border-t-[#E51C23]', // backward-compat alias
    white: 'border-white/20 border-t-white',
    dark: 'border-[#141210]/20 border-t-[#141210]',
    orange: 'border-[#FF5500]/20 border-t-[#FF5500]',
  };

  return (
    <div
      role="status"
      aria-label="Chargement"
      className={`inline-block rounded-full animate-spin ${sizes[size] || sizes.md} ${variants[variant] || variants.red} ${className}`}
    />
  );
}
