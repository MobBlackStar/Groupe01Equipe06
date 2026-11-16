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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0F12] select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#CCFF00] text-black hover:bg-[#b8e600] focus:ring-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.25)] font-semibold',
    secondary: 'bg-[#161920] text-white border border-[#262A33] hover:bg-[#20252e] hover:border-[#383e4c] focus:ring-[#383e4c]',
    outline: 'bg-transparent text-[#CCFF00] border border-[#CCFF00] hover:bg-[#CCFF00]/10 focus:ring-[#CCFF00]',
    danger: 'bg-[#FF1744] text-white hover:bg-[#d5002b] focus:ring-[#FF1744] shadow-[0_0_20px_rgba(255,23,68,0.25)]',
    ghost: 'bg-transparent text-[#8A92A6] hover:text-white hover:bg-white/5 focus:ring-white/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2.5 gap-2 h-11',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-13',
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
          <Spinner size="sm" variant={variant === 'primary' ? 'dark' : 'lime'} />
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
