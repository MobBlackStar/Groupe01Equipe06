// 💡 Concept & Analogie : Client HTTP Dio centralisé injectant le jeton Bearer Firebase et interceptant le temps serveur.
// 🔄 Comparaison React / Flutter : Équivalent direct du client Axios `src/lib/api.js` sous React.
// 🎯 À retenir pour la soutenance : "Ce client Dio injecte automatiquement le token Firebase ou le jeton de démo 1-clic dans toutes les requêtes REST."
// Module : Infrastructure Mobile

import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/env.dart';
import '../time/server_clock.dart';

class ApiClient {
  /// Jeton de test pour les sessions de démonstration 1-clic
  static String? demoAuthToken;

  /// URL de base de l'API : uniquement celle configurée au build (`API_BASE_URL`), jamais une adresse devinée.
  static String computeBaseUrl() => Env.apiBaseUrl;

  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: computeBaseUrl(),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            try {
              final token = await user.getIdToken();
              options.headers['Authorization'] = 'Bearer $token';
            } catch (_) {
              if (demoAuthToken != null) {
                options.headers['Authorization'] = 'Bearer $demoAuthToken';
              }
            }
          } else if (demoAuthToken != null) {
            options.headers['Authorization'] = 'Bearer $demoAuthToken';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (response.data is Map && response.data['serverTime'] != null) {
            final serverTimeMs = response.data['serverTime'] as int;
            ServerClock.updateServerOffset(serverTimeMs);
          }
          return handler.next(response);
        },
      ),
    );
}
