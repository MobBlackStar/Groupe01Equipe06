// 💡 Concept & Analogie : Comme un menu déroulant dans un distributeur automatique qui restreint le choix aux seuls articles en stock, ce composant contraint la sélection utilisateur à des valeurs d'énumérés valides.
// 🔄 Comparaison React / Flutter : En React, `Select` encapsule un élément natif `select` HTML accessible avec style customisé ; en Flutter, il s'agit d'un `DropdownButtonFormField`.
// 🎯 À retenir pour la soutenance : "Ce composant garantit que seules des valeurs conformes aux énumérés stricts (ex: filières ESSECT ou catégories d'offres) peuvent être injectées dans le formulaire."

import React, { forwardRef } from 'react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    options = [],
    id,
    placeholder = 'Sélectionnez une option...',
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold uppercase tracking-wider text-[#8A92A6] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#FF5500]">*</span>}
          </span>
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full bg-[#161920] text-white text-sm rounded-xl px-4 py-3 appearance-none transition-all duration-200 border cursor-pointer ${
            error
              ? 'border-[#FF1744] focus:border-[#FF1744] focus:ring-1 focus:ring-[#FF1744]'
              : 'border-[#262A33] focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]'
          } disabled:opacity-50 disabled:cursor-not-allowed outline-none pr-10`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[#161920] text-[#8A92A6]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-[#161920] text-white py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A92A6]">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
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

export default Select;
