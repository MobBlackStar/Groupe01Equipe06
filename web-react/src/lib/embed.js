// 💡 Concept & Analogie : Comme une fenêtre de guichet entre deux bureaux (l'application mobile et la page web), ce module permet à la page de signaler « je suis prête » ou « ouvre cette offre » à l'application qui l'héberge.
// 🔄 Comparaison React / Flutter : Côté Flutter, le canal `CampusBridge` (JavaScriptChannel de `webview_flutter`) reçoit ces messages ; ici on les envoie avec `window.CampusBridge.postMessage`.
// 🎯 À retenir pour la soutenance : "Le radar 3D WebGL tourne dans l'application mobile via une WebView : le mode `?embed=1` masque la navigation web, et les actions (ouvrir une offre) sont renvoyées à l'écran natif Flutter."

const KEY = 'cs.embed';

/** La page est-elle affichée dans l'application mobile ? (`?embed=1`, mémorisé pour la session de l'onglet) */
export function isEmbedded() {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
      sessionStorage.setItem(KEY, '1');
      return true;
    }
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Envoie un message JSON à l'application hôte (silencieux si aucune n'écoute : navigateur normal). */
export function postToHost(message) {
  try {
    const bridge = typeof window !== 'undefined' ? window.CampusBridge : null;
    if (bridge && typeof bridge.postMessage === 'function') bridge.postMessage(JSON.stringify(message));
  } catch {
    /* pas d'hôte : on ignore */
  }
}
