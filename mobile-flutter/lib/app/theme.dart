// 💡 Concept & Analogie : Charte graphique unifiée pour l'application mobile traduisant fidèlement la palette sombre (#0D0F12) et les touches vert lime (#CCFF00).
// 🔄 Comparaison React / Flutter : Équivalent direct des classes Tailwind CSS définies dans `web-react/tailwind.config.js`.
// 🎯 À retenir pour la soutenance : "Nous appliquons une charte graphique dark-mode cohérente entre Web et Mobile avec des contrastes certifiés WCAG AA."
// TODO (UI) : Finaliser l'intégration de l'écran selon la maquette

import 'package:flutter/material.dart';

class AppTheme {
  static const Color darkBackground = Color(0xFF0D0F12);
  static const Color cardColor = Color(0xFF16191E);
  static const Color borderColor = Color(0xFF262A33);
  static const Color limeAccent = Color(0xFFCCFF00);
  static const Color orangeUrgent = Color(0xFFFF5500);
  static const Color redCritical = Color(0xFFFF1744);
  static const Color textMuted = Color(0xFF8A92A6);

  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBackground,
    primaryColor: limeAccent,
    cardColor: cardColor,
    colorScheme: const ColorScheme.dark(
      primary: limeAccent,
      secondary: orangeUrgent,
      surface: cardColor,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkBackground,
      elevation: 0,
    ),
  );
}
