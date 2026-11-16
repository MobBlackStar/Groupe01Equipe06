// 💡 Concept & Analogie : Fichier modèle généré par la CLI FlutterFire (`flutterfire configure`).
// 🔄 Comparaison React / Flutter : Contient les identifiants publics de configuration Firebase pour Android et iOS.
// 🎯 À retenir pour la soutenance : "Ce fichier d'exemple montre la configuration attendue ; le fichier réel `firebase_options.dart` contenant les identifiants du projet est strictement gitignoré."
// Module : Infrastructure Mobile

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError('Plateforme non prise en charge');
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyExampleWebKey',
    appId: '1:123456789:web:example',
    messagingSenderId: '123456789',
    projectId: 'campussave-essect-dev',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyExampleAndroidKey',
    appId: '1:123456789:android:example',
    messagingSenderId: '123456789',
    projectId: 'campussave-essect-dev',
  );
}
