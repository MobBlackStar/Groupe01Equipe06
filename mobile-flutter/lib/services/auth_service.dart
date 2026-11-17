// 💡 Concept & Analogie : Service d'authentification mobile (ChangeNotifier) diffusant l'état de l'utilisateur à l'application Flutter.
// 🔄 Comparaison React / Flutter : Équivalent de `AuthContext.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les flux d'authentification Firebase, gère les jetons de démonstration 1-clic et expose les informations de rôle au routeur."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../core/models/user_profile.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';

class AuthService extends ChangeNotifier {
  User? _user;
  UserProfile? _profile;
  String? _role;
  bool _isLoading = true;

  User? get user => _user;
  UserProfile? get profile => _profile;
  String? get role => _role;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null || _profile != null || ApiClient.demoAuthToken != null;

  AuthService() {
    _initAuthListener();
  }

  void _initAuthListener() {
    try {
      FirebaseAuth.instance.idTokenChanges().listen((firebaseUser) async {
        _user = firebaseUser;
        if (firebaseUser != null) {
          try {
            final tokenResult = await firebaseUser.getIdTokenResult(true);
            _role = tokenResult.claims?['role'] as String?;
            await _loadRemoteProfile();
          } catch (e) {
            debugPrint('Avis d initialisation token : $e');
          }
        } else if (ApiClient.demoAuthToken == null) {
          // Ne pas écraser une session démo active si un null asynchrone arrive
          _role = null;
          _profile = null;
        }
        _isLoading = false;
        notifyListeners();
      }, onError: (err) {
        debugPrint('Erreur écoute Firebase Auth : $err');
        _isLoading = false;
        notifyListeners();
      });
    } catch (e) {
      // Cas où Firebase n'est pas initialisé sur l'émulateur
      debugPrint('Firebase Auth non initialisé : $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadRemoteProfile() async {
    try {
      final res = await ApiClient.dio.get(Endpoints.me);
      if (res.data is Map && res.data['user'] != null) {
        _profile = UserProfile.fromJson(res.data['user'] as Map<String, dynamic>);
        if (_profile?.role != null) {
          _role = _profile!.role;
        }
      }
    } catch (e) {
      debugPrint('Chargement profil distant impossible : $e');
    }
  }

  /// Connexion classique avec identifiants Firebase
  Future<void> signInWithEmailAndPassword(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    ApiClient.demoAuthToken = null;
    try {
      final credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      _user = credential.user;
      final tokenResult = await _user?.getIdTokenResult(true);
      _role = tokenResult?.claims?['role'] as String?;
      await _loadRemoteProfile();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Connexion 1-clic pour le kit de démonstration (Étudiant ou Commerçant)
  Future<void> signInDemo(String roleType) async {
    _isLoading = true;
    notifyListeners();

    final isStudent = roleType.toUpperCase() == 'STUDENT';
    final demoEmail = isStudent ? 'etudiant@essect.u-tunis.tn' : 'commercant@baguette.tn';
    final uid = isStudent ? 'student-yassine' : 'm-baguette';
    final role = isStudent ? 'STUDENT' : 'MERCHANT';
    final token = 'test-token:$uid:$role:$demoEmail';

    ApiClient.demoAuthToken = token;
    _role = role;
    _profile = UserProfile(
      uid: uid,
      email: demoEmail,
      role: role,
      displayName: isStudent ? 'Yassine Trabelsi' : 'Baguette & Baguette Montfleury',
      phone: isStudent ? '+21698123456' : '+21671390111',
      filiereId: isStudent ? 'EBUSINESS_3A' : null,
      ecoPoints: isStudent ? 90 : 0,
    );

    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: demoEmail,
        password: 'CampusSave2026!',
      );
    } catch (_) {
      // Mode simulation hors-ligne garanti pour la soutenance
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Rafraîchissement forcé des claims et du profil
  Future<void> refreshUser() async {
    if (_user != null) {
      final tokenResult = await _user!.getIdTokenResult(true);
      _role = tokenResult.claims?['role'] as String?;
      await _loadRemoteProfile();
      notifyListeners();
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    ApiClient.demoAuthToken = null;
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {}
    _user = null;
    _profile = null;
    _role = null;
    notifyListeners();
  }
}
