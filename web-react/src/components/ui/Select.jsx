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
          className="text-xs font-bold uppercase tracking-wider text-[#141210] flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-[#E51C23]">*</span>}
          </span>
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full bg-white text-[#141210] text-sm rounded-lg px-4 py-2.5 appearance-none transition-all duration-150 border-2 cursor-pointer font-medium ${
            error
              ? 'border-[#E51C23] shadow-[2px_2px_0px_#E51C23]'
              : 'border-[#141210] shadow-[2px_2px_0px_#141210] focus:border-[#E51C23] focus:shadow-[3px_3px_0px_#141210]'
          } disabled:opacity-50 disabled:cursor-not-allowed outline-none pr-10`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-white text-[#888]">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-white text-[#141210] py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#141210]">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
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

export default Select;
