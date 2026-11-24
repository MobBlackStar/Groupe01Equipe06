// 💡 Concept & Analogie : Une seule horloge murale dans la salle plutôt qu'un réveil sur chaque table : tous les compteurs lisent le même battement d'une seconde.
// 🔄 Comparaison React / Flutter : Équivalent d'un hook `useNow()` partagé (un seul `setInterval` pour tous les composants).
// 🎯 À retenir pour la soutenance : "Au lieu d'un Timer par carte d'offre (40 timers sur l'écran Explorer), un seul Timer alimente tous les prix et décomptes ; il s'arrête quand plus aucun écran n'écoute."

import 'dart:async';

import 'package:flutter/foundation.dart';

/// Battement partagé d'une seconde. Le Timer ne tourne que s'il y a au moins un auditeur.
class SecondTicker extends ChangeNotifier {
  SecondTicker._();

  static final SecondTicker instance = SecondTicker._();

  Timer? _timer;

  @override
  void addListener(VoidCallback listener) {
    super.addListener(listener);
    _timer ??= Timer.periodic(const Duration(seconds: 1), (_) => notifyListeners());
  }

  @override
  void removeListener(VoidCallback listener) {
    super.removeListener(listener);
    if (!hasListeners) {
      _timer?.cancel();
      _timer = null;
    }
  }
}
