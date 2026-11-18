// 💡 Concept & Analogie : Comme le bouton physique de démarrage d'une voiture de sport, ce composant est le point de contact tactile principal qui déclenche une action univoque et réactive avec un retour visuel immédiat.
// 🔄 Comparaison React / Flutter : En React, `Button` est un composant HTML `button` stylisé avec Tailwind CSS et transitions CSS ; en Flutter, il correspond à un `ElevatedButton` ou `OutlinedButton` enveloppé dans un widget personnalisé `AppButton`.
// 🎯 À retenir pour la soutenance : "Nous avons encapsulé tous les états d'interaction (survol, chargement, désactivation) dans ce composant atomique pour garantir une cohérence visuelle stricte sur les 18 écrans de l'application."

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
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-150 rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer';

  const variants = {
    primary: 'bg-[#E51C23] text-white border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#d1141b] hover:shadow-[4px_4px_0px_#141210]',
    secondary: 'bg-[#FAF6EE] text-[#141210] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#F4EFE6] hover:shadow-[4px_4px_0px_#141210]',
    yellow: 'bg-[#FFD000] text-[#141210] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#e6bb00] hover:shadow-[4px_4px_0px_#141210]',
    outline: 'bg-transparent text-[#141210] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#FAF6EE]',
    danger: 'bg-[#E51C23] text-white border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#b8141a]',
    ghost: 'bg-transparent text-[#666] hover:text-[#141210] hover:bg-black/5 border-none shadow-none',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-base px-6 py-3 gap-2.5 h-12',
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
