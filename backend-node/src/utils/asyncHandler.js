// 💡 Concept & Analogie : Comme un assistant dévoué qui s'occupe de tous les blocs try/catch pour que le chef n'ait pas à répéter la même besogne à chaque recette, `asyncHandler` capture automatiquement les erreurs asynchrones.
// 🔄 Comparaison React / Flutter : Côté Node, il évite les blocs try-catch verbeux dans chaque contrôleur Express.
// 🎯 À retenir pour la soutenance : "Ce wrapper d'ordre supérieur capture automatiquement les rejets de promesses dans nos contrôleurs et les transmet au middleware d'erreur centralisé."
// Module : Architecture & Infrastructure

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
