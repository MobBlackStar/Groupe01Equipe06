// 💡 Concept & Analogie : Client HTTP Dio centralisé injectant le jeton Bearer Firebase et interceptant le temps serveur.
// 🔄 Comparaison React / Flutter : Équivalent direct du client Axios `src/lib/api.js` sous React.
// 🎯 À retenir pour la soutenance : "Ce client Dio injecte automatiquement le token Firebase de l'utilisateur connecté dans toutes les requêtes REST."
// Module : Infrastructure Mobile

import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/env.dart';
import '../time/server_clock.dart';

class ApiClient {
  static final Dio dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            final token = await user.getIdToken();
            options.headers['Authorization'] = 'Bearer $token';
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
