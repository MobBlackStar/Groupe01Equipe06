// 💡 Concept & Analogie : Comme une case propre et numérotée sur un bon de commande de restaurant, ce champ recueille une information textuelle avec validation visuelle instantanée.
// 🔄 Comparaison React / Flutter : En React, `Input` utilise `React.forwardRef` pour s'interfacer nativement avec `react-hook-form` ; en Flutter, nous utilisons `TextFormField` avec un `TextEditingController`.
// 🎯 À retenir pour la soutenance : "Ce champ supporte le forwarding de référence pour une intégration transparente avec la bibliothèque Zod et React Hook Form sans rerenders inutiles."

import React, { forwardRef } from 'react';

/** Pill text field — white fill, 2px ink outline, mustard focus ring. */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="cs-field-label">
          {label} {required && <span className="text-[#DA0711]">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-5 flex items-center pointer-events-none text-[#111111]/55">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          className={`cs-input ${leftIcon ? '!pl-12' : ''} ${rightIcon ? '!pr-12' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-5 flex items-center text-[#111111]/55">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="cs-error-text">{error}</p>
      ) : helperText ? (
        <p className="cs-help-text">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
