// 💡 Concept & Analogie : Comme le bouton tactile en pilule d'une borne vintage, ce composant incarne l'action univoque avec transition physique fluide et réactive.
// 🔄 Comparaison React / Flutter : En React, `Button` est un composant HTML `button` en pilule (rounded-full) inspiré de Griddle ; en Flutter, il correspond à un `FilledButton` ou `OutlinedButton` stylisé.
// 🎯 À retenir pour la soutenance : "Tous les boutons respectent la silhouette iconique en pilule de Griddle, abolissant les angles durs et les bordures agressives."

import React from 'react';
import Spinner from './Spinner.jsx';

/**
 * Griddle pill button — 2px ink outline, Oswald 600 uppercase.
 * Variants map onto the design-system classes in styles/griddleTheme.css.
 */
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
  const variants = {
    primary: 'cs-btn-red',
    danger: 'cs-btn-red',
    secondary: 'cs-btn-cream',
    outline: 'cs-btn-cream',
    yellow: 'cs-btn-mustard',
    dark: 'cs-btn-ink',
    ghost: '!border-transparent !bg-transparent hover:!bg-black/5 hover:!shadow-none',
  };

  const sizes = { sm: 'cs-btn-sm', md: '', lg: 'cs-btn-lg' };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`cs-btn ${variants[variant] || variants.primary} ${sizes[size] ?? ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" variant={variant === 'primary' || variant === 'danger' || variant === 'dark' ? 'white' : 'dark'} />
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
