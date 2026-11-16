// 💡 Concept & Analogie : Horloge compensée synchronisée avec le serveur backend pour calculer l'heure officielle sans dépendre de l'horloge potentiellement décalée du smartphone ou PC de l'utilisateur.
// 🔄 Comparaison React / Flutter : Même logique portée en Dart dans `core/time/server_clock.dart`.
// 🎯 À retenir pour la soutenance : "Nous calculons un offset de dérive à chaque réponse HTTP pour garantir que l'enchère dégressive tourne sur l'heure exacte du serveur."
// Module : Infrastructure

let serverOffsetMs = 0;

/**
 * Met à jour l'écart temporel avec l'horloge officielle du serveur Node.js.
 * @param {number|string|Date} serverTime
 */
export function updateServerOffset(serverTime) {
  if (!serverTime) return;
  const timeMs = serverTime instanceof Date
    ? serverTime.getTime()
    : typeof serverTime === 'string'
      ? new Date(serverTime).getTime()
      : Number(serverTime);

  if (!isNaN(timeMs)) {
    serverOffsetMs = timeMs - Date.now();
  }
}

/**
 * Retourne l'horodatage courant synchronisé en millisecondes.
 */
export function getServerNow() {
  return Date.now() + serverOffsetMs;
}

/**
 * Alias pour getServerNow()
 */
export function serverNow() {
  return getServerNow();
}

/**
 * Retourne l'écart courant en millisecondes entre le client et le serveur.
 */
export function getServerOffset() {
  return serverOffsetMs;
}
