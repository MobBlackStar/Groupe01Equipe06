// 💡 Concept & Analogie : Comme une ancienne prise de courant avec un adaptateur, `AppButton` garde son ancienne forme mais branche tous les écrans sur le bouton Griddle.
// 🔄 Comparaison React / Flutter : Équivalent d'un composant `<Button variant="…">` qui délègue à `.cs-btn` ; ici il délègue à `GButton` (lib/widgets/griddle.dart).
// 🎯 À retenir pour la soutenance : "Un seul style de bouton dans toute l'application : les écrans historiques passent par AppButton, qui n'est plus qu'un adaptateur vers GButton."

import 'package:flutter/material.dart';

import '../app/theme.dart';
import 'griddle.dart';

enum AppButtonVariant { primary, secondary, outline, danger }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final dynamic icon;
  final double height;
  final double? width;
  final Color? backgroundColor;
  final Color? textColor;
  final bool isOutlined;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.height = 50.0,
    this.width = double.infinity,
    this.backgroundColor,
    this.textColor,
    this.isOutlined = false,
  });

  GVariant get _variant {
    final bg = backgroundColor;
    if (bg != null) {
      if (bg == AppTheme.mustard) return GVariant.mustard;
      if (bg == AppTheme.ink) return GVariant.ink;
      if (bg == AppTheme.cream || bg == AppTheme.biscuit) return GVariant.cream;
      return GVariant.red;
    }
    if (isOutlined) return GVariant.cream;
    switch (variant) {
      case AppButtonVariant.primary:
      case AppButtonVariant.danger:
        return GVariant.red;
      case AppButtonVariant.secondary:
      case AppButtonVariant.outline:
        return GVariant.cream;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GButton(
      text,
      onPressed: onPressed,
      variant: _variant,
      icon: icon is IconData ? icon as IconData : null,
      loading: isLoading,
      expand: width == double.infinity,
    );
  }
}
