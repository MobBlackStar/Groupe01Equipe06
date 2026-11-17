// 💡 Concept & Analogie : Client HTTP Dio centralisé injectant le jeton Bearer Firebase et interceptant le temps serveur.
// 🔄 Comparaison React / Flutter : Équivalent direct du client Axios `src/lib/api.js` sous React.
// 🎯 À retenir pour la soutenance : "Ce client Dio injecte automatiquement le token Firebase ou le jeton de démo 1-clic dans toutes les requêtes REST."
// Module : Infrastructure Mobile

import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/env.dart';
import '../time/server_clock.dart';

class ApiClient {
  /// Jeton de test pour les sessions de démonstration 1-clic
  static String? demoAuthToken;

  /// Résolution dynamique de l'URL de base selon la plateforme et l'hôte d'accès
  static String computeBaseUrl() {
    if (kIsWeb) {
      final host = Uri.base.host;
      if (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1') {
        return 'http://$host:4000/api/v1';
      }
    }
    return Env.apiBaseUrl;
  }

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
          // Si consulté via un navigateur mobile sur réseau Wi-Fi local (ex: 192.168.1.15)
          if (kIsWeb) {
            final host = Uri.base.host;
            if (host.isNotEmpty && host != 'localhost' && host != '127.0.0.1') {
              if (options.baseUrl.contains('localhost') || options.baseUrl.contains('127.0.0.1')) {
                options.baseUrl = 'http://$host:4000/api/v1';
              }
            }
          }

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
