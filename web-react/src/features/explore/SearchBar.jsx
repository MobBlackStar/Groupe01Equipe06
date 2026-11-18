// 💡 Concept & Analogie : Comme le projecteur d'un chercheur d'or qui balaie le lit de la rivière, cette barre de recherche scanne les invendus de Montfleury avec un filtre anti-rebond (debounce) de 300 ms.
// 🔄 Comparaison React / Flutter : En React, `useRef` garantit la stabilité de la fonction parente ; en Flutter, nous utilisons un contrôleur d'écoute réactif.
// 🎯 À retenir pour la soutenance : "Anti-freeze guard : découplage strict entre l'état local de saisie et la recherche parente pour éviter tout re-rendu superflu."
// Module : Recherche & Filtres (M4)

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Flame } from 'lucide-react';

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
      <div className="relative flex items-center">
        {/* Icône Loupe */}
        <Search className="absolute left-4 w-5 h-5 text-stone-400 pointer-events-none" />

        {/* Input de recherche */}
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-[#161412] border border-white/15 text-[#F6F1E7] placeholder-stone-500 text-sm focus:outline-none focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/20 transition-all shadow-inner font-sans"
        />

        {/* Bouton Effacer (X) */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
