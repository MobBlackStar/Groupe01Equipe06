// 💡 Concept & Analogie : Comme les intercalaires cartonnés d'un classeur, les onglets compartimentent l'affichage sans recharger la page.
// 🔄 Comparaison React / Flutter : En React, `Tabs` est géré avec un état local ; en Flutter, nous utilisons un `TabBar`.
// 🎯 À retenir pour la soutenance : "Ce composant permet de basculer instantanément entre vues avec réactivité 60 FPS."

import React from 'react';

/** Row of outlined chips; the active tab is filled ink. */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className="cs-chip"
          >
            {tab.icon && <span className="inline-flex">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && <span className="cs-chip-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
