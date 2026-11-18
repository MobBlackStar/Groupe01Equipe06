// 💡 Concept & Analogie : Comme un menu déroulant dans un distributeur automatique qui restreint le choix aux seuls articles en stock, ce composant contraint la sélection utilisateur à des valeurs valides.
// 🔄 Comparaison React / Flutter : En React, `Select` encapsule un élément natif `select` HTML accessible avec style customisé ; en Flutter, il s'agit d'un `DropdownButtonFormField`.
// 🎯 À retenir pour la soutenance : "Ce composant garantit que seules des valeurs conformes aux énumérés stricts peuvent être injectées dans le formulaire."

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
          className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between font-mono"
        >
          <span>
            {label} {required && <span className="text-[#DA0711]">*</span>}
          </span>
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full bg-[#FAF3E6] text-[#111111] text-sm rounded-2xl px-4 py-3 appearance-none transition-all duration-150 border cursor-pointer font-medium shadow-sm ${
            error
              ? 'border-[#DA0711] ring-1 ring-[#DA0711]'
              : 'border-[#111111]/15 focus:border-[#111111] focus:ring-1 focus:ring-[#111111]'
          } disabled:opacity-50 disabled:cursor-not-allowed outline-none pr-10`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[#FAF3E6] text-[#111111]/40">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-[#FAF3E6] text-[#111111] py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#111111]/60">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
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

export default Select;
