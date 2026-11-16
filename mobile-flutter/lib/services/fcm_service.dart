// 💡 Concept & Analogie : Service de gestion des notifications push Firebase Cloud Messaging sur mobile avec écouteurs d'arrière-plan et d'avant-plan.
// 🔄 Comparaison React / Flutter : Équivalent de `firebase-messaging-sw.js` sous React.
// 🎯 À retenir pour la soutenance : "Ce service écoute les messages entrants (rappels, retraits, tickets prêts) et synchronise le jeton de l'appareil."
// Module : Infrastructure Mobile

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

// Gestionnaire d'arrière-plan requis au niveau racine pour Firebase Messaging
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print('Notification reçue en arrière-plan : ${message.notification?.title}');
  }
}

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

      // Écoute des notifications lorsque l'application est au premier plan
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        if (kDebugMode) {
          print('Notification au premier plan : ${message.notification?.title} - ${message.notification?.body}');
        }
      });

      // Souscription automatique au canal des nouveaux paniers surprise
      await _messaging.subscribeToTopic('new-offers').catchError((_) {});
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (_) {
      return null;
    }
  }
}
