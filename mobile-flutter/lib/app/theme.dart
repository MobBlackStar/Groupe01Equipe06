// 💡 Concept & Analogie : Charte graphique unifiée pour l'application mobile harmonisée avec les identités Street Market & Framer.
// 🔄 Comparaison React / Flutter : Équivalent direct des classes Tailwind CSS définies dans `web-react/tailwind.config.js`.
// 🎯 À retenir pour la soutenance : "Nous appliquons une charte graphique cohérente combinant papier chaud (#F5EFE6), encre espresso (#161412), carbone nocturne (#0E0D0C) et touches street red (#EE3124) / mustard gold (#F5C400)."

import 'package:flutter/material.dart';

/// Charte graphique unifiée pour CampusSave Mobile (Harmonisée Street Market & Framer).
class AppTheme {
  // --- Palette Principale Harmonisée ---
  static const Color warmCream = Color(0xFFF5EFE6);
  static const Color nightCarbon = Color(0xFF0E0D0C);
  static const Color deepEspresso = Color(0xFF161412);
  static const Color streetFlameRed = Color(0xFFEE3124);
  static const Color mustardGold = Color(0xFFF5C400);
  static const Color matchaEmerald = Color(0xFF2E6F40);

  // --- Surfaces & Papiers ---
  static const Color darkBackground = nightCarbon;
  static const Color cardColor = Color(0xFF1A1816);
  static const Color surfaceCard = Color(0xFF1A1816);
  static const Color paperCream = warmCream;
  static const Color paperInk = deepEspresso;
  static const Color borderColor = Color(0xFF2A2724);

  // --- Accents & Rétro-compatibilité ---
  static const Color limeAccent = mustardGold; // Harmonisé vers Mustard Gold Street Market
  static const Color orangeUrgent = streetFlameRed; // Harmonisé vers Street Flame Red
  static const Color redCritical = streetFlameRed;
  static const Color textMuted = Color(0xFF9E988F);
  static const Color textLight = warmCream;
  static const Color textDark = deepEspresso;

  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBackground,
    primaryColor: mustardGold,
    cardColor: cardColor,
    colorScheme: const ColorScheme.dark(
      primary: mustardGold,
      secondary: streetFlameRed,
      surface: surfaceCard,
      onPrimary: deepEspresso,
      onSurface: warmCream,
      error: streetFlameRed,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkBackground,
      foregroundColor: warmCream,
      elevation: 0,
      iconTheme: IconThemeData(color: warmCream),
      titleTextStyle: TextStyle(
        color: warmCream,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    ),
  );
}
