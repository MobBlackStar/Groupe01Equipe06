// 💡 Concept & Analogie : Calculs de points de fidélité, paliers et tampons en Dart pour l'application mobile.
// 🔄 Comparaison React / Flutter : Miroir exact de `shared/loyalty.js`.
// 🎯 À retenir pour la soutenance : "Ce module Dart permet à l'écran de fidélité Flutter de calculer instantanément le niveau et les tampons de l'étudiant."
// Module : Logique Métier Dart

class Loyalty {
  static const String tierGraine = 'GRAINE';
  static const String tierPousse = 'POUSSE';
  static const String tierArbre = 'ARBRE';
  static const String tierForet = 'FORET';

  static String getTier(int ecoPoints) {
    if (ecoPoints >= 600) return tierForet;
    if (ecoPoints >= 300) return tierArbre;
    if (ecoPoints >= 100) return tierPousse;
    return tierGraine;
  }

  static int calculateStamps(int ecoPoints) {
    return (ecoPoints % 100) ~/ 20;
  }

  static int getNextMilestone(int ecoPoints) {
    return ((ecoPoints ~/ 100) + 1) * 100;
  }
}
