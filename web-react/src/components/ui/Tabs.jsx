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
      className={`inline-flex p-1 bg-[#FAF6EE] border-2 border-[#141210] rounded-xl shadow-[3px_3px_0px_#141210] gap-1 overflow-x-auto scrollbar-none max-w-full ${className}`}
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 select-none cursor-pointer ${
              isActive
                ? 'bg-[#E51C23] text-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210]'
                : 'text-[#141210] hover:bg-[#F4EFE6] border-2 border-transparent'
            }`}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-white text-[#E51C23]'
                    : 'bg-[#141210] text-white'
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
