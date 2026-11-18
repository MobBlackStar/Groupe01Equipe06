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
          className="text-xs font-bold uppercase tracking-wider text-[#141210] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#E51C23]">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#555]">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-white text-[#141210] placeholder-[#888] text-sm rounded-lg px-4 py-2.5 transition-all duration-150 border-2 ${
            error
              ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]'
              : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23] focus:shadow-[3px_3px_0px_#141210]'
          } ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} disabled:opacity-50 disabled:cursor-not-allowed outline-none font-medium`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#555]">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[#E51C23] font-bold flex items-center gap-1 mt-0.5">
          <span>⚠️</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#666] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
