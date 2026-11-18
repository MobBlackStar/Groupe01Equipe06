// 💡 Concept & Analogie : Comme le projecteur d'un chercheur d'or, cette barre de recherche scanne les invendus avec un debounce de 300 ms.
// 🔄 Comparaison React / Flutter : En React, `useRef` garantit la stabilité de la fonction parente ; en Flutter, nous utilisons un contrôleur d'écoute réactif.
// 🎯 À retenir pour la soutenance : "Anti-freeze guard : découplage strict entre l'état local de saisie et la recherche parente."

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Rechercher un plat, makloub, baguette farcie, restaurant...',
  className = '',
}) {
  const [localQuery, setLocalQuery] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isFirstMount = useRef(true);

  // Synchronisation avec la valeur externe
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  // Debounce 300 ms
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onChangeRef.current?.(localQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery]);

  const handleClear = () => {
    setLocalQuery('');
    onChangeRef.current?.('');
  };

  return (
    <div className={`relative w-full ${className}`}>
      <label htmlFor="offer-search" className="sr-only">Rechercher une offre</label>
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none" strokeWidth={2.5} />
      <input
        id="offer-search"
        type="search"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder={placeholder}
        className="cs-input !min-h-[4rem] !pl-16 !pr-16 !text-xl"
      />
      {localQuery && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#EDE6D7] transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
