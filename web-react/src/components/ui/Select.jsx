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
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="cs-field-label">
          {label} {required && <span className="text-[#DA0711]">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        className="cs-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="cs-error-text">{error}</p>
      ) : helperText ? (
        <p className="cs-help-text">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
