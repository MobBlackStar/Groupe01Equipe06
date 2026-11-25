// 💡 Concept & Analogie : Service d'authentification mobile (ChangeNotifier) diffusant l'état de l'utilisateur à l'application Flutter.
// 🔄 Comparaison React / Flutter : Équivalent de `AuthContext.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les flux d'authentification Firebase, gère les jetons de démonstration 1-clic et expose les informations de rôle au routeur."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import '../core/models/user_profile.dart';
import 'campus_api.dart';
import 'fcm_service.dart';
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';

/// Mode de connexion, comme `authMode` sur le site : démonstration 1-clic (jeton de test) ou compte réel Firebase.
enum AuthMode { none, demo, real }

class AuthService extends ChangeNotifier {
  AuthMode get authMode => ApiClient.demoAuthToken != null ? AuthMode.demo : (_user != null ? AuthMode.real : AuthMode.none);

  /// Enregistre l'appareil pour les notifications push (démo et compte réel), sans jamais bloquer ni faire échouer la connexion.
  void _afterLogin() {
    FcmService.registerForCurrentUser().catchError((_) => PushStatus.notRegistered);
  }

  User? _user;
  UserProfile? _profile;
  String? _role;
  bool _isLoading = true;

  User? get user => _user;
  UserProfile? get profile => _profile;
  String? get role => _role;
  bool get isLoading => _isLoading;
  /// Jeton Firebase courant (null en session de démonstration) : transmis à la WebView du radar 3D.
  Future<String?> currentIdToken() async {
    try {
      return await _user?.getIdToken();
    } catch (_) {
      return null;
    }
  }

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
            _afterLogin();
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
      _afterLogin();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Inscription avec création de compte Firebase + enregistrement du profil backend
  Future<void> registerWithEmailAndPassword({
    required String email,
    required String password,
    required String role,
    required String displayName,
    String? phone,
    String? filiereId,
  }) async {
    _isLoading = true;
    notifyListeners();
    ApiClient.demoAuthToken = null;

    try {
      final cleanEmail = email.trim().toLowerCase();
      final compactPhone = phone?.replaceAll(RegExp(r'[\s\-().]'), '').trim();
      final cleanPhone =
          (compactPhone != null && compactPhone.isNotEmpty && compactPhone != '+216' && compactPhone != '+')
              ? compactPhone
              : null;

      // Pré-vérification unicité email & téléphone avant création Firebase Auth
      try {
        final availRes = await ApiClient.dio.post(
          Endpoints.checkAvailability,
          data: {
            'email': cleanEmail,
            if (cleanPhone != null) 'phone': cleanPhone,
          },
        );
        final avail = availRes.data is Map ? availRes.data as Map : const {};
        if (avail['emailTaken'] == true) {
          throw const ApiException('Cette adresse email est déjà associée à un compte existant.', code: 'EMAIL_ALREADY_IN_USE', statusCode: 409);
        }
        if (avail['phoneTaken'] == true) {
          throw const ApiException('Ce numéro de téléphone est déjà utilisé par un autre compte.', code: 'PHONE_ALREADY_IN_USE', statusCode: 409);
        }
      } on ApiException {
        rethrow;
      } catch (_) {}

      final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: cleanEmail,
        password: password,
      );
      _user = credential.user;

      // Enregistrer le profil auprès de l'API CampusSave pour injecter le rôle et créer le document utilisateur Firestore
      try {
        await ApiClient.dio.post(
          Endpoints.registerProfile,
          data: {
            'role': role,
            'displayName': displayName,
            if (cleanPhone != null) 'phone': cleanPhone,
            if (filiereId != null) 'filiereId': filiereId,
          },
        );
      } catch (e) {
        if (e is DioException && e.response?.statusCode == 409) {
          try {
            await credential.user?.delete();
            _user = null;
          } catch (_) {}
        }
        rethrow;
      }

      // Rafraîchir les custom claims pour récupérer le rôle
      final tokenResult = await _user?.getIdTokenResult(true);
      _role = tokenResult?.claims?['role'] as String? ?? role;
      await _loadRemoteProfile();
      _afterLogin();
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

    // Mode démo propre : on quitte d'abord tout compte Firebase (pas de mélange de jetons ni de profils)
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {}
    _user = null;

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
    // Remplace les valeurs d'amorçage ci-dessus par le vrai profil du serveur (nom, EcoPoints) quand l'API répond.
    try {
      await _loadRemoteProfile();
      _afterLogin();
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

  /// Applique un profil renvoyé par le serveur (après une modification) : barre du haut, profil et points se mettent à jour partout.
  void applyProfile(UserProfile profile) {
    _profile = profile;
    notifyListeners();
  }

  /// Déconnexion
  Future<void> signOut() async {
    await FcmService.unregister(); // l'appareil n'est plus lié à ce compte (jeton encore valide à cet instant)
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
