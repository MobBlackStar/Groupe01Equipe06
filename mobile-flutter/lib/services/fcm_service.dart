// 💡 Concept & Analogie : Service de gestion des notifications push Firebase Cloud Messaging sur mobile.
// 🔄 Comparaison React / Flutter : Équivalent de `firebase-messaging-sw.js` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les messages entrants et enregistre le token de l'appareil auprès du backend."
// Module : Infrastructure Mobile

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      if (kDebugMode) {
        print('Autorisation notifications FCM accordée');
      }
    }
  }

  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
