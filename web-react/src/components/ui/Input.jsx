// 💡 Concept & Analogie : Comme une case propre et numérotée sur un bon de commande de restaurant, ce champ recueille une information textuelle avec validation visuelle instantanée.
// 🔄 Comparaison React / Flutter : En React, `Input` utilise `React.forwardRef` pour s'interfacer nativement avec `react-hook-form` ; en Flutter, nous utilisons `TextFormField` avec un `TextEditingController`.
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
          className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between font-mono"
        >
          <span>
            {label} {required && <span className="text-[#DA0711]">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#111111]/50">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-[#FAF3E6] text-[#111111] placeholder-[#111111]/40 text-sm rounded-2xl px-4 py-3 transition-all duration-150 border ${
            error
              ? 'border-[#DA0711] ring-1 ring-[#DA0711]'
              : 'border-[#111111]/15 focus:border-[#111111] focus:ring-1 focus:ring-[#111111]'
          } ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} disabled:opacity-50 disabled:cursor-not-allowed outline-none font-medium shadow-sm`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#111111]/50">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#DA0711] font-bold flex items-center gap-1 mt-0.5">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#111111]/60 mt-0.5 font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
