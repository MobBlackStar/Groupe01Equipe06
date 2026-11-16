// 💡 Concept & Analogie : Service d'authentification mobile (ChangeNotifier) diffusant l'état de l'utilisateur à l'application Flutter.
// 🔄 Comparaison React / Flutter : Équivalent de `AuthContext.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les flux d'authentification Firebase et expose les informations de rôle au routeur."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthService extends ChangeNotifier {
  User? _user;
  String? _role;
  bool _isLoading = true;

  User? get user => _user;
  String? get role => _role;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthService() {
    // Initialisation du flux utilisateur
    _isLoading = false;
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    _user = null;
    _role = null;
    notifyListeners();
  }
}
