// 💡 Concept & Analogie : Comme l'interrupteur général du badge « visiteur », cette règle dit si les jetons de démonstration ouvrent des portes ; elle est volontairement isolée de tout import.
// 🔄 Comparaison React / Flutter : Aucun équivalent client : c'est un garde-fou serveur que ni React ni Flutter ne peuvent contourner.
// 🎯 À retenir pour la soutenance : "En production les jetons de démo sont refusés par défaut ; seul ALLOW_DEMO_TOKENS=true explicite les réactive."

/**
 * Les jetons `test-token:` / `mock-token:` / `demo-` (et l'auth mémoire permissive) sont-ils acceptés ?
 * Hors production : oui. En production : non, sauf `ALLOW_DEMO_TOKENS=true`.
 * @param {{ NODE_ENV?: string, ALLOW_DEMO_TOKENS?: string }} envLike
 */
export function demoTokensAllowed(envLike) {
  if (envLike.ALLOW_DEMO_TOKENS === 'true') return true;
  if (envLike.ALLOW_DEMO_TOKENS === 'false') return false;
  return envLike.NODE_ENV !== 'production';
}
