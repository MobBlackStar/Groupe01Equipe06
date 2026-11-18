// 💡 Concept & Analogie : Comme les intercalaires cartonnés d'un classeur, les onglets compartimentent l'affichage sans recharger la page.
// 🔄 Comparaison React / Flutter : En React, `Tabs` est géré avec un état local ; en Flutter, nous utilisons un `TabBar`.
// 🎯 À retenir pour la soutenance : "Ce composant permet de basculer instantanément entre vues avec réactivité 60 FPS."

import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      className={`inline-flex p-1.5 bg-[#EDE6D7] rounded-full border border-[#111111]/8 gap-1 overflow-x-auto scrollbar-none max-w-full ${className}`}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-anton uppercase tracking-wider whitespace-nowrap transition-all duration-150 select-none cursor-pointer ${
              isActive
                ? 'bg-[#DA0711] text-white shadow-sm'
                : 'text-[#111111] hover:bg-white/60'
            }`}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white text-[#DA0711]'
                    : 'bg-[#111111]/10 text-[#111111]'
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
