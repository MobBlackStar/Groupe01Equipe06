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
    <div className={`cs-card w-full flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-[#FAF3E6] flex items-center justify-center text-4xl mb-6 -rotate-6">
        {icon}
      </div>
      <h4 className="cs-title mb-3">{title}</h4>
      <p className="cs-body text-[#5E5850] max-w-md mb-8">{description}</p>
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
