// 💡 Concept & Analogie : Le champ de formulaire de la carte de visite Griddle : étiquette en capitales au-dessus, bord encre, pastille arrondie.
// 🔄 Comparaison React / Flutter : Équivalent de `<label>` + `.cs-input` du site ; les bordures viennent du `InputDecorationTheme` (app/theme.dart).
// 🎯 À retenir pour la soutenance : "Tous les champs partagent un seul style, défini une fois dans le thème."

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
        Padding(
          padding: const EdgeInsets.only(left: 6),
          child: Text(label.toUpperCase(), style: AppTheme.label()),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          obscureText: obscureText,
          enabled: enabled,
          onChanged: onChanged,
          maxLines: obscureText ? 1 : maxLines,
          style: AppTheme.body(16),
          decoration: InputDecoration(
            hintText: hint ?? hintText,
            helperText: helperText,
            helperStyle: AppTheme.body(13, AppTheme.muted),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}
