// 💡 Concept & Analogie : Comme les intercalaires cartonnés d'un classeur d'étudiant permettant de passer instantanément des cours de Finance aux cours d'E-Business, les onglets compartimentent l'affichage sans recharger la page.
// 🔄 Comparaison React / Flutter : En React, `Tabs` est géré avec un état local ou une URL hash ; en Flutter, nous utilisons un `TabBar` avec un `TabController` et `TabBarView`.
// 🎯 À retenir pour la soutenance : "Ce composant permet de basculer instantanément entre vues (ex: Offres en cours / Offres épuisées) pour une expérience fluide à 60 images par seconde."

import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      className={`inline-flex p-1 bg-[#161920] border border-[#262A33] rounded-xl gap-1 overflow-x-auto scrollbar-none max-w-full ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
              isActive
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-[#8A92A6] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-black/20 text-black'
                    : 'bg-[#262A33] text-[#8A92A6]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
