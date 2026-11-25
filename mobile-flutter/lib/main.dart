// 💡 Concept & Analogie : Comme la clé de contact qui lance le moteur et démarre le tableau de bord d'un véhicule, `main()` initialise les bindings Flutter, Firebase et lance l'application `CampusSaveApp`.
// 🔄 Comparaison React / Flutter : Équivalent de `main.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée universel de notre application mobile Flutter."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';
import 'app/app.dart';
import 'app/router.dart';
import 'services/auth_service.dart';
import 'services/bag_service.dart';
import 'services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialisation sécurisée de Firebase avec options de campussave-dev et repli automatique
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('⚠️ Initialisation Firebase ignorée / mode démo local : $e');
  }

  FcmService.navigatorKey = AppRouter.rootNavigatorKey;
  await FcmService.initialize(); // écouteurs de notifications système + bannière mascotte

  runApp(
    MultiProvider(
      providers: [
        // Une seule instance : celle du routeur (connexion, déconnexion, redirections) ; le profil et les points la lisent aussi.
        ChangeNotifierProvider<AuthService>.value(value: AppRouter.authService),
        ChangeNotifierProvider<BagService>(create: (_) => BagService()),
      ],
      child: const CampusSaveApp(),
    ),
  );
}
