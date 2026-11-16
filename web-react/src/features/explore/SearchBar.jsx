// 💡 Concept & Analogie : Comme un filtre anti-rebond sur un interrupteur physique qui évite d'envoyer 10 signaux électriques quand on tape vite au clavier, le debounce de 300 ms attend que l'utilisateur finisse sa frappe avant de déclencher la recherche.
// 🔄 Comparaison React / Flutter : En React, `useEffect` combiné à `setTimeout` et `clearTimeout` crée l'effet d'attente ; en Flutter, nous utilisons un `Timer` ou un `rxdart` `debounceTime` sur le contrôleur de texte.
// 🎯 À retenir pour la soutenance : "Le debounce de 300 ms protège le serveur contre le martèlement de requêtes inutiles à chaque touche enfoncée par l'étudiant."

import React, { useState, useEffect } from 'react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Rechercher un plat, makloub, chapati, boulangerie...',
  className = '',
}) {
  const [localQuery, setLocalQuery] = useState(value);

  // Synchronisation avec la valeur externe si modifiée ailleurs (ex: reset)
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  // Debounce de 300 ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) {
        onChange(localQuery);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery, onChange]);

  const handleClear = () => {
    setLocalQuery('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        {/* Icône Loupe */}
        <span className="absolute left-4 text-slate-400 text-lg pointer-events-none">
          🔍
        </span>

        {/* Input */}
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#161920] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-all shadow-inner"
        />

        {/* Bouton Effacer (X) */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
