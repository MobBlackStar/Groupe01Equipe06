// 💡 Concept & Analogie : Comme le bouton tactile en pilule d'une borne vintage, ce composant incarne l'action univoque avec transition physique fluide et réactive.
// 🔄 Comparaison React / Flutter : En React, `Button` est un composant HTML `button` en pilule (rounded-full) inspiré de Griddle ; en Flutter, il correspond à un `FilledButton` ou `OutlinedButton` stylisé.
// 🎯 À retenir pour la soutenance : "Tous les boutons respectent la silhouette iconique en pilule de Griddle, abolissant les angles durs et les bordures agressives."

import React from 'react';
import Spinner from './Spinner.jsx';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-anton uppercase tracking-wider transition-all duration-150 rounded-full select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 cursor-pointer';

  const variants = {
    primary: 'bg-[#DA0711] text-white hover:bg-[#bd060f] shadow-[0_2px_10px_rgba(218,7,17,0.25)] border-none',
    secondary: 'bg-[#EDE6D7] text-[#111111] hover:bg-[#e2d9c7] border border-[#111111]/10',
    yellow: 'bg-[#FFD000] text-[#111111] hover:bg-[#eec200] shadow-[0_2px_10px_rgba(255,208,0,0.3)] border-none',
    outline: 'bg-transparent text-[#111111] border border-[#111111] hover:bg-[#111111]/5',
    danger: 'bg-[#DA0711] text-white hover:bg-[#bd060f] border-none shadow-[0_2px_10px_rgba(218,7,17,0.25)]',
    ghost: 'bg-transparent text-[#666] hover:text-[#111111] hover:bg-black/5 border-none shadow-none font-sans font-bold normal-case tracking-normal',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-5 py-2.5 gap-2 h-10',
    lg: 'text-base px-7 py-3.5 gap-2.5 h-12',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" variant={variant === 'primary' || variant === 'danger' ? 'white' : 'dark'} />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
