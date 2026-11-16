// 💡 Concept & Analogie : Horloge compensée synchronisée avec le serveur backend pour calculer l'heure officielle sans dépendre de l'horloge potentiellement décalée du smartphone ou PC de l'utilisateur.
// 🔄 Comparaison React / Flutter : Même logique portée en Dart dans `core/time/server_clock.dart`.
// 🎯 À retenir pour la soutenance : "Nous calculons un offset de dérive à chaque réponse HTTP pour garantir que l'enchère dégressive tourne sur l'heure exacte du serveur."
// Module : Infrastructure

let serverOffsetMs = 0;

export function updateServerOffset(serverTimeMs) {
  serverOffsetMs = serverTimeMs - Date.now();
}

export function getServerNow() {
  return Date.now() + serverOffsetMs;
}

export function getServerOffset() {
  return serverOffsetMs;
}
