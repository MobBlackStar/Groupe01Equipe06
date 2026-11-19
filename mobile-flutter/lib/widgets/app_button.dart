// 💡 Concept & Analogie : Comme la pédale d'accélérateur d'une automobile, ce bouton déclenche une action décisive avec un retour haptique et visuel immédiat pour l'utilisateur mobile.
// 🔄 Comparaison React / Flutter : En Flutter, `AppButton` enveloppe un `ElevatedButton` ou `OutlinedButton` dans un conteneur stylisé selon `AppTheme` ; en React, il s'agit d'un composant JSX avec des classes Tailwind.
// 🎯 À retenir pour la soutenance : "Nous avons encapsulé la gestion de l'état de chargement asynchrone pour afficher un indicateur circulaire sans modifier la taille du bouton."

import 'package:flutter/material.dart';
import '../app/theme.dart';

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

  @override
  Widget build(BuildContext context) {
    Color effectiveBg;
    Color effectiveFg;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppButtonVariant.primary:
        effectiveBg = AppTheme.red;
        effectiveFg = Colors.black;
        break;
      case AppButtonVariant.secondary:
        effectiveBg = AppTheme.biscuit;
        effectiveFg = AppTheme.ink;
        borderSide = const BorderSide(color: AppTheme.ink);
        break;
      case AppButtonVariant.outline:
        effectiveBg = Colors.transparent;
        effectiveFg = AppTheme.red;
        borderSide = const BorderSide(color: AppTheme.red);
        break;
      case AppButtonVariant.danger:
        effectiveBg = AppTheme.red;
        effectiveFg = AppTheme.ink;
        break;
    }

    if (backgroundColor != null) {
      effectiveBg = backgroundColor!;
    }
    if (textColor != null) {
      effectiveFg = textColor!;
    }
    if (isOutlined) {
      borderSide = BorderSide(color: textColor ?? AppTheme.ink);
    }

    Widget? resolvedIcon;
    if (icon != null) {
      if (icon is IconData) {
        resolvedIcon = Icon(icon as IconData, size: 20, color: effectiveFg);
      } else if (icon is Widget) {
        resolvedIcon = icon as Widget;
      }
    }

    return SizedBox(
      height: height,
      width: width,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: effectiveBg,
          foregroundColor: effectiveFg,
          disabledBackgroundColor: effectiveBg.withValues(alpha: 0.5),
          disabledForegroundColor: effectiveFg.withValues(alpha: 0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: borderSide,
          ),
          elevation: variant == AppButtonVariant.primary && !isOutlined ? 4 : 0,
        ),
        child: isLoading
            ? SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(effectiveFg),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (resolvedIcon != null) ...[
                    resolvedIcon,
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: effectiveFg,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
