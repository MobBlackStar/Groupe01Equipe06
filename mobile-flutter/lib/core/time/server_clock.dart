// 💡 Concept & Analogie : Horloge temps réel synchronisée en Dart pour Flutter, miroir de `web-react/src/lib/serverClock.js`.
// 🔄 Comparaison React / Flutter : Permet à Flutter de synchroniser ses tickers d'animation sur l'horloge du backend.
// 🎯 À retenir pour la soutenance : "Ce composant assure l'alignement temporel des comptes à rebours de l'application mobile."
// Module : Infrastructure Mobile

class ServerClock {
  static int _serverOffsetMs = 0;

  static void updateServerOffset(int serverTimeMs) {
    _serverOffsetMs = serverTimeMs - DateTime.now().millisecondsSinceEpoch;
  }

  static int get serverNowMs {
    return DateTime.now().millisecondsSinceEpoch + _serverOffsetMs;
  }

  static DateTime get serverNow {
    return DateTime.fromMillisecondsSinceEpoch(serverNowMs);
  }
}
