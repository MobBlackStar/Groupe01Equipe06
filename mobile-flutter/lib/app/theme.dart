// 💡 Concept & Analogie : Charte graphique Griddle Neo-Brutaliste pour l'application mobile.
// 🔄 Comparaison React / Flutter : Équivalent direct des classes Tailwind CSS Griddle (Warm Cream #F4EFE6, Warm Ivory #FAF6EE, Deep Ink #141210, Griddle Red #E51C23, Mustard Yellow #FFD000).
// 🎯 À retenir pour la soutenance : "Design néo-brutaliste percutant combinant cartes crème/ivoire, bordures franches 2px et ombres dures portées à 45° sans flou."

import 'package:flutter/material.dart';

/// Charte graphique Griddle pour CampusSave Mobile.
class AppTheme {
  // --- Palette Principale Griddle ---
  static const Color warmCream = Color(0xFFF4EFE6);
  static const Color warmIvory = Color(0xFFFAF6EE);
  static const Color deepInk = Color(0xFF141210);
  static const Color griddleRed = Color(0xFFE51C23);
  static const Color mustardYellow = Color(0xFFFFD000);
  static const Color matchaEmerald = Color(0xFF2E6F40);

  // --- Surfaces & Rétro-compatibilité ---
  static const Color darkBackground = Color(0xFF141210);
  static const Color cardColor = Color(0xFF1E1B18);
  static const Color surfaceCard = Color(0xFF1E1B18);
  static const Color paperCream = warmCream;
  static const Color paperIvory = warmIvory;
  static const Color paperInk = deepInk;
  static const Color borderColor = deepInk;

  // --- Accents & Typographie ---
  static const Color limeAccent = mustardYellow;
  static const Color orangeUrgent = griddleRed;
  static const Color redCritical = griddleRed;
  static const Color textMuted = Color(0xFF8C857B);
  static const Color textLight = warmCream;
  static const Color textDark = deepInk;

  // --- Helpers Néo-Brutalistes (Bordures 2px + Ombres dures décalées) ---
  static BoxDecoration neoBrutalCard({
    Color backgroundColor = warmIvory,
    Color borderColor = deepInk,
    double borderWidth = 2.0,
    double radius = 16.0,
    Offset shadowOffset = const Offset(4, 4),
  }) {
    return BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: borderWidth),
      boxShadow: [
        BoxShadow(
          color: deepInk,
          offset: shadowOffset,
          blurRadius: 0,
        ),
      ],
    );
  }

  static BoxDecoration neoBrutalButton({
    Color backgroundColor = griddleRed,
    Color borderColor = deepInk,
    double borderWidth = 2.0,
    double radius = 10.0,
    Offset shadowOffset = const Offset(3, 3),
  }) {
    return BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: borderWidth),
      boxShadow: [
        BoxShadow(
          color: deepInk,
          offset: shadowOffset,
          blurRadius: 0,
        ),
      ],
    );
  }

  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBackground,
    primaryColor: griddleRed,
    cardColor: cardColor,
    colorScheme: const ColorScheme.dark(
      primary: griddleRed,
      secondary: mustardYellow,
      surface: surfaceCard,
      onPrimary: Colors.white,
      onSurface: warmCream,
      error: griddleRed,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkBackground,
      foregroundColor: warmCream,
      elevation: 0,
      iconTheme: IconThemeData(color: warmCream),
      titleTextStyle: TextStyle(
        color: warmCream,
        fontSize: 18,
        fontWeight: FontWeight.w900,
        letterSpacing: 0.5,
      ),
    ),
  );
}
