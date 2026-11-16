// 💡 Concept & Analogie : Comme une case propre et numérotée sur un formulaire administratif d'inscription, ce champ recueille une information textuelle avec validation visuelle instantanée.
// 🔄 Comparaison React / Flutter : En React, `Input` utilise `React.forwardRef` pour s'interfacer nativement avec `react-hook-form` ; en Flutter, nous utilisons `TextFormField` avec un `TextEditingController` et un décorateur d'input.
// 🎯 À retenir pour la soutenance : "Ce champ supporte le forwarding de référence pour une intégration transparente avec la bibliothèque Zod et React Hook Form sans rerenders inutiles."

import React, { forwardRef } from 'react';

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
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[#8A92A6] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#FF5500]">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8A92A6]">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-[#161920] text-white placeholder-[#8A92A6]/60 text-sm rounded-xl px-4 py-3 transition-all duration-200 border ${
            error
              ? 'border-[#FF1744] focus:border-[#FF1744] focus:ring-1 focus:ring-[#FF1744]'
              : 'border-[#262A33] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]'
          } ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} disabled:opacity-50 disabled:cursor-not-allowed outline-none`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#8A92A6]">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#FF1744] font-medium flex items-center gap-1 mt-0.5">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#8A92A6] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
