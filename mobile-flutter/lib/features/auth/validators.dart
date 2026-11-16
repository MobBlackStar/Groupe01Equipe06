// 💡 Concept & Analogie : Comme le gabarit de contrôle à l'entrée d'un avion qui vérifie les dimensions exactes d'un bagage cabine, ce module centralise les règles de validation syntaxique pour tous les formulaires mobiles.
// 🔄 Comparaison React / Flutter : En Flutter, ces fonctions retournent un message d'erreur `String?` consommé par les `TextFormField` ; en React, les mêmes contraintes sont formulées via des schémas Zod.
// 🎯 À retenir pour la soutenance : "Nous avons aligné les validateurs Dart sur les schémas Zod backend pour garantir qu'aucune donnée rejetée par le serveur ne puisse franchir la validation cliente."

class Validators {
  static final RegExp _emailRegExp = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  static final RegExp _phoneRegExp = RegExp(
    r'^\+216[2-9]\d{7}$',
  );

  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return "L'adresse email est obligatoire";
    }
    if (!_emailRegExp.hasMatch(value.trim())) {
      return 'Format d adresse email invalide';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Le mot de passe est obligatoire';
    }
    if (value.length < 8) {
      return 'Le mot de passe doit comporter au moins 8 caractères';
    }
    if (!value.contains(RegExp(r'\d'))) {
      return 'Le mot de passe doit contenir au moins un chiffre (0-9)';
    }
    return null;
  }

  static String? validateDisplayName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le nom complet est obligatoire';
    }
    if (value.trim().length < 2) {
      return 'Le nom doit comporter au moins 2 caractères';
    }
    if (value.trim().length > 60) {
      return 'Le nom ne peut pas dépasser 60 caractères';
    }
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le numéro de téléphone est obligatoire';
    }
    if (!_phoneRegExp.hasMatch(value.trim())) {
      return 'Numéro tunisien invalide (ex: +21698123456)';
    }
    return null;
  }

  static String? validateFiliere(String? value, String role) {
    if (role == 'STUDENT' && (value == null || value.isEmpty)) {
      return 'La filière ESSECT est obligatoire pour un étudiant';
    }
    return null;
  }
}
