// 💡 Concept & Analogie : Manipulateur monétaire en millimes entiers pour Flutter, miroir de `shared/money.js`.
// 🔄 Comparaison React / Flutter : Même formatage à 3 décimales ("4,500 DT") pour assurer une parité visuelle totale.
// 🎯 À retenir pour la soutenance : "Nous utilisons exclusivement des entiers en millimes dans Flutter pour interdire les erreurs d'arrondi sur mobile."
// Module : Logique Métier Dart

class Money {
  static String formatTND(int millimes, {bool withCurrency = true}) {
    final sign = millimes < 0 ? '-' : '';
    final abs = millimes.abs();
    final dinars = abs ~/ 1000;
    final remainder = (abs % 1000).toString().padLeft(3, '0');
    final formatted = '$sign$dinars,$remainder';
    return withCurrency ? '$formatted DT' : formatted;
  }

  static double millimesToTND(int millimes) {
    return millimes / 1000.0;
  }

  static int tndToMillimes(double tnd) {
    return (tnd * 1000).round();
  }
}
