// 💡 Concept & Analogie : Comme une vitrine de boulangerie nettoyée à la fermeture qui invite gentiment le passant à revenir demain matin avec le sourire.
// 🔄 Comparaison React / Flutter : En React, `EmptyState` est un conteneur flex centré ; en Flutter, nous le construisons via un `Column` centré.
// 🎯 À retenir pour la soutenance : "Ce composant guide l'étudiant vers l'étape suivante quand une recherche ne renvoie rien."

import React from 'react';

export default function EmptyState({
  icon = '🥗',
  title = 'Aucun élément trouvé',
  description = "Il n'y a actuellement aucun résultat à afficher pour ces critères.",
  action = null,
  className = '',
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#FAF6EE] border-2 border-dashed border-[#141210] rounded-xl shadow-[3px_3px_0px_#141210] ${className}`}
    >
      <div className="w-16 h-16 rounded-xl bg-white border-2 border-[#141210] flex items-center justify-center text-3xl mb-4 shadow-[2px_2px_0px_#141210]">
        {icon}
      </div>
      <h4 className="text-lg font-black text-[#141210] uppercase tracking-wide mb-1.5">{title}</h4>
      <p className="text-xs text-[#555] max-w-sm mb-6 leading-relaxed font-medium">
        {description}
      </p>
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
