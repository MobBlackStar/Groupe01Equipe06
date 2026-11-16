// 💡 Concept & Analogie : Comme un filtre anti-rebond sur un interrupteur physique qui évite d'envoyer 10 signaux électriques quand on tape vite au clavier, le debounce de 300 ms attend que l'utilisateur finisse sa frappe avant de déclencher la recherche.
// 🔄 Comparaison React / Flutter : En React, `useRef` et `setTimeout` assurent la stabilité sans déclencher de boucle de re-rendu parent-enfant ; en Flutter, nous utilisons un `Timer` ou un `rxdart` `debounceTime` sur le contrôleur de texte.
// 🎯 À retenir pour la soutenance : "Le composant SearchBar utilise une référence mutable useRef pour le callback parent afin de découpler le debounce des rendus parents et prévenir toute boucle infinie."

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Rechercher un plat, makloub, chapati, boulangerie...',
  className = '',
}) {
  const [localQuery, setLocalQuery] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isFirstMount = useRef(true);

  // Synchronisation avec la valeur externe sans déclencher d'effet rétroactif
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  // Debounce de 300 ms déclenché uniquement sur saisie de l'utilisateur
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
        {/* Icône Loupe SVG */}
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />

        {/* Input de recherche */}
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#161920] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all shadow-inner"
        />

        {/* Bouton Effacer (X) */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
