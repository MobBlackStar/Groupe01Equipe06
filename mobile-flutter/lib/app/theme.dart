// 💡 Concept & Analogie : Comme le nuancier officiel d'un magasin (cinq peintures, trois polices, des règles de tailles), ce fichier est la seule source des couleurs, des textes et des formes de l'application ; un écran n'invente jamais une couleur, il pioche ici.
// 🔄 Comparaison React / Flutter : Équivalent de `tailwind.config.js` + `griddleTheme.css` du site web : mêmes valeurs hexadécimales, mêmes polices, mêmes règles (texte >= 13 px, contours encre épais, boutons en pilule).
// 🎯 À retenir pour la soutenance : "Le mobile et le web partagent exactement la même charte Griddle : crème #FAF3E6, encre #111111, rouge #DA0711, moutarde #FFD000 ; aucune couleur sombre ni néon."

import 'package:flutter/material.dart';

/// Charte Griddle de CampusSave : identique au site web (voir `web-react/src/styles/README.md`).
class AppTheme {
  AppTheme._();

  // --- Palette (mêmes valeurs que le web) ---
  static const Color cream = Color(0xFFFAF3E6); // fond de page (jamais blanc)
  static const Color biscuit = Color(0xFFEDE6D7); // cartes, tuiles
  static const Color sand = Color(0xFFE2D8C5); // séparateurs, état pressé
  static const Color ink = Color(0xFF111111); // texte, contours 2 px, panneaux sombres
  static const Color muted = Color(0xFF5E5850); // texte secondaire (sur crème / biscuit uniquement)
  static const Color red = Color(0xFFDA0711); // action principale, prix
  static const Color redDark = Color(0xFFB5050D);
  static const Color mustard = Color(0xFFFFD000); // autocollants, points, surbrillance
  static const Color orange = Color(0xFFFF8A00); // urgence moyenne (20-60 min)
  static const Color leaf = Color(0xFF1F7A3A); // succès / éco uniquement
  static const Color paper = Color(0xFFFFFFFF); // papier (champs, tickets, QR)

  // --- Polices (embarquées dans assets/fonts, déclarées dans pubspec.yaml) ---
  static const String fontBody = 'Oswald';
  static const String fontDisplay = 'LeagueGothic';
  static const String fontTitle = 'BowlbyOneSC';
  static const String fontSticker = 'Knewave';
  static const String fontMono = 'SpaceMono';

  /// Plancher de lisibilité : rien en dessous de 13 px.
  static const double minText = 13;

  // --- Styles de texte (équivalents de cs-display, cs-title, cs-h3, cs-body, cs-label, cs-figure) ---
  static TextStyle display([double size = 56, Color color = ink]) =>
      TextStyle(fontFamily: fontDisplay, fontSize: size, height: 0.95, color: color, letterSpacing: 0.2);

  static TextStyle title([double size = 26, Color color = ink]) =>
      TextStyle(fontFamily: fontTitle, fontSize: size, height: 1.05, color: color);

  static TextStyle h3([double size = 22, Color color = ink]) =>
      TextStyle(fontFamily: fontBody, fontSize: size, fontWeight: FontWeight.w700, height: 1.1, color: color);

  static TextStyle body([double size = 16, Color color = ink]) =>
      TextStyle(fontFamily: fontBody, fontSize: size < minText ? minText : size, fontWeight: FontWeight.w400, height: 1.35, color: color);

  static TextStyle label([Color color = muted]) =>
      TextStyle(fontFamily: fontBody, fontSize: minText, fontWeight: FontWeight.w600, letterSpacing: 0.8, color: color);

  static TextStyle eyebrow([Color color = red]) =>
      TextStyle(fontFamily: fontBody, fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 1.0, color: color);

  static TextStyle figure(double size, [Color color = ink]) =>
      TextStyle(fontFamily: fontDisplay, fontSize: size, height: 0.95, color: color);

  static TextStyle mono([double size = 14, Color color = ink]) =>
      TextStyle(fontFamily: fontMono, fontSize: size < minText ? minText : size, color: color);

  // --- Surfaces (équivalents de cs-card, cs-card-paper, cs-card-ink) ---
  static BoxDecoration card({Color color = biscuit, double radius = 20}) =>
      BoxDecoration(color: color, borderRadius: BorderRadius.circular(radius));

  static BoxDecoration paperCard({double radius = 20}) => BoxDecoration(
        color: paper,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: ink, width: 2),
      );

  static BoxDecoration inkCard({double radius = 20}) =>
      BoxDecoration(color: ink, borderRadius: BorderRadius.circular(radius));

  /// Pastille / autocollant : fond plein, contour encre.
  static BoxDecoration pill({Color color = mustard}) => BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: ink, width: 2),
      );

  /// Texte lisible sur un fond donné : crème sur rouge / encre / feuille, encre sur le reste.
  static Color onColor(Color bg) {
    if (bg == red || bg == redDark || bg == ink || bg == leaf) return cream;
    return ink;
  }

  /// Couleurs d'urgence du radar (l'API émet du néon ; on le traduit à l'affichage, comme sur le web).
  static Color urgencyFromApi(String? hex) {
    switch ((hex ?? '').toUpperCase()) {
      case '#CCFF00':
        return mustard; // > 60 min
      case '#FF5500':
        return orange; // 20-60 min
      case '#FF1744':
        return red; // < 20 min
    }
    return red;
  }

  // --- Thème Material ---
  static ThemeData get theme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: fontBody,
      scaffoldBackgroundColor: cream,
      canvasColor: cream,
      colorScheme: const ColorScheme.light(
        primary: red,
        onPrimary: cream,
        secondary: mustard,
        onSecondary: ink,
        surface: cream,
        onSurface: ink,
        surfaceContainerHighest: biscuit,
        error: red,
        onError: cream,
        outline: ink,
      ),
    );

    const pillShape = StadiumBorder(side: BorderSide(color: ink, width: 2));

    return base.copyWith(
      textTheme: base.textTheme.apply(fontFamily: fontBody, bodyColor: ink, displayColor: ink),
      iconTheme: const IconThemeData(color: ink),
      splashFactory: InkRipple.splashFactory,
      dividerTheme: const DividerThemeData(color: sand, thickness: 1.5, space: 1.5),
      appBarTheme: AppBarTheme(
        backgroundColor: cream,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: ink),
        titleTextStyle: display(32),
        shape: const Border(bottom: BorderSide(color: ink, width: 2)),
      ),
      cardTheme: CardThemeData(
        color: biscuit,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: red,
          foregroundColor: cream,
          minimumSize: const Size(64, 52),
          elevation: 0,
          shape: pillShape,
          textStyle: const TextStyle(fontFamily: fontBody, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: red,
          foregroundColor: cream,
          minimumSize: const Size(64, 52),
          shape: pillShape,
          textStyle: const TextStyle(fontFamily: fontBody, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.6),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: cream,
          foregroundColor: ink,
          minimumSize: const Size(64, 52),
          shape: pillShape,
          side: const BorderSide(color: ink, width: 2),
          textStyle: const TextStyle(fontFamily: fontBody, fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.6),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: red,
          textStyle: const TextStyle(fontFamily: fontBody, fontSize: 15, fontWeight: FontWeight.w700, decoration: TextDecoration.underline),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: paper,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        hintStyle: body(16, muted),
        labelStyle: label(),
        floatingLabelStyle: label(red),
        errorStyle: const TextStyle(fontFamily: fontBody, fontSize: minText, color: red, fontWeight: FontWeight.w600),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: const BorderSide(color: ink, width: 2)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: const BorderSide(color: ink, width: 2)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: const BorderSide(color: red, width: 2.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: const BorderSide(color: red, width: 2)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: const BorderSide(color: red, width: 2.5)),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: cream,
        selectedColor: mustard,
        side: const BorderSide(color: ink, width: 2),
        shape: const StadiumBorder(),
        labelStyle: const TextStyle(fontFamily: fontBody, fontSize: 14, fontWeight: FontWeight.w600, color: ink),
        checkmarkColor: ink,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: cream,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: cream,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          side: BorderSide(color: ink, width: 2),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: cream,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: const BorderSide(color: ink, width: 2)),
        titleTextStyle: display(30),
        contentTextStyle: body(16),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: ink,
        contentTextStyle: body(15, cream),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: ink,
        unselectedLabelColor: muted,
        indicatorColor: red,
        dividerColor: sand,
        labelStyle: const TextStyle(fontFamily: fontBody, fontSize: 15, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontFamily: fontBody, fontSize: 15, fontWeight: FontWeight.w500),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: cream,
        indicatorColor: mustard,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.all(const TextStyle(fontFamily: fontBody, fontSize: minText, fontWeight: FontWeight.w700, color: ink)),
        iconTheme: WidgetStateProperty.all(const IconThemeData(color: ink)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: red, circularTrackColor: sand, linearTrackColor: sand),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? cream : ink),
        trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? red : sand),
        trackOutlineColor: WidgetStateProperty.all(ink),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? red : cream),
        checkColor: WidgetStateProperty.all(cream),
        side: const BorderSide(color: ink, width: 2),
      ),
      listTileTheme: const ListTileThemeData(iconColor: ink, textColor: ink),
    );
  }
}
