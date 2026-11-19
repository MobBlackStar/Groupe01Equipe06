// 💡 Concept & Analogie : Comme la ligne d'écriture d'un cahier scolaire où chaque lettre doit être claire et lisible, ce champ capture les saisies utilisateur avec une bordure active qui réagit au focus.
// 🔄 Comparaison React / Flutter : En Flutter, `AppTextField` encapsule un `TextFormField` avec son `InputDecoration` thématique ; en React, il correspond à un composant `Input` avec gestion d'erreurs et de refs.
// 🎯 À retenir pour la soutenance : "Ce champ standardise les bordures et les icônes de préfixe pour tous les formulaires d'authentification et de commande."

import 'package:flutter/material.dart';
import '../app/theme.dart';

class AppTextField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputType keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? helperText;
  final bool enabled;
  final void Function(String)? onChanged;
  final String? hintText;
  final String? hint;
  final int maxLines;

  const AppTextField({
    super.key,
    required this.label,
    this.controller,
    this.validator,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.helperText,
    this.enabled = true,
    this.onChanged,
    this.hintText,
    this.hint,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
            color: AppTheme.muted,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          obscureText: obscureText,
          enabled: enabled,
          onChanged: onChanged,
          maxLines: maxLines,
          style: const TextStyle(color: AppTheme.ink, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint ?? hintText,
            hintStyle: TextStyle(color: AppTheme.muted.withValues(alpha: 0.5), fontSize: 14),
            helperText: helperText,
            helperStyle: const TextStyle(color: AppTheme.muted, fontSize: 13),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: AppTheme.biscuit,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.ink),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.ink),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.red, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.red),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.red, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
