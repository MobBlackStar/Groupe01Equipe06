// 💡 Concept & Analogie : Comme une vitrine de boulangerie nettoyée à la fermeture qui invite gentiment le passant à revenir demain matin avec le sourire, cet écran informe avec élégance de l'absence de données sans donner l'impression d'une erreur.
// 🔄 Comparaison React / Flutter : En React, `EmptyState` est un conteneur flex centré avec icône et bouton d'action optionnel ; en Flutter, nous le construisons via un `Column` centré dans un `Center`.
// 🎯 À retenir pour la soutenance : "Ce composant guide l'étudiant vers l'étape suivante quand une recherche ne renvoie rien ou quand aucune commande n'a encore été passée."

import React from 'react';

export default function EmptyState({
  icon = '🥗',
  title = 'Aucun élément trouvé',
  description = 'Il n y a actuellement aucun résultat à afficher pour ces critères.',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#161920]/50 border border-[#262A33] border-dashed rounded-2xl ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#0D0F12] border border-[#262A33] flex items-center justify-center text-3xl mb-4 shadow-inner">
        {icon}
      </div>
      <h4 className="text-base font-bold text-white mb-1.5">{title}</h4>
      <p className="text-xs text-[#8A92A6] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="inline-flex">{action}</div>}
    </div>
  );
}
