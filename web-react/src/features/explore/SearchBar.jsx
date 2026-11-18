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
      <div className="relative flex items-center bg-white border-2 border-[#141210] shadow-[3px_3px_0px_#141210] rounded-xl overflow-hidden">
        {/* Icône Loupe */}
        <Search className="absolute left-4 w-5 h-5 text-[#141210] pointer-events-none" />

        {/* Input de recherche */}
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-11 py-3 text-[#141210] placeholder-[#777] text-sm focus:outline-none bg-transparent font-medium"
        />

        {/* Bouton Effacer (X) */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-md text-[#141210] hover:bg-[#F4EFE6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
