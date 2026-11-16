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
  final Widget? icon;
  final double height;
  final double? width;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.height = 50.0,
    this.width = double.infinity,
  });

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color foregroundColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppButtonVariant.primary:
        backgroundColor = AppTheme.limeAccent;
        foregroundColor = Colors.black;
        break;
      case AppButtonVariant.secondary:
        backgroundColor = AppTheme.cardColor;
        foregroundColor = Colors.white;
        borderSide = const BorderSide(color: AppTheme.borderColor);
        break;
      case AppButtonVariant.outline:
        backgroundColor = Colors.transparent;
        foregroundColor = AppTheme.limeAccent;
        borderSide = const BorderSide(color: AppTheme.limeAccent);
        break;
      case AppButtonVariant.danger:
        backgroundColor = AppTheme.redCritical;
        foregroundColor = Colors.white;
        break;
    }

    return SizedBox(
      height: height,
      width: width,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          disabledBackgroundColor: backgroundColor.withOpacity(0.5),
          disabledForegroundColor: foregroundColor.withOpacity(0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: borderSide,
          ),
          elevation: variant == AppButtonVariant.primary ? 4 : 0,
        ),
        child: isLoading
            ? SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: foregroundColor,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
