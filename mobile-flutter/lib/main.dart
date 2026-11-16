// 💡 Concept & Analogie : Comme la clé de contact qui lance le moteur et démarre le tableau de bord d'un véhicule, `main()` initialise les bindings Flutter, Firebase et lance l'application `CampusSaveApp`.
// 🔄 Comparaison React / Flutter : Équivalent de `main.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée universel de notre application mobile Flutter."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'app/app.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialisation sécurisée de Firebase avec options de campussave-dev et repli automatique
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('⚠️ Initialisation Firebase ignorée / mode démo local : $e');
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const CampusSaveApp(),
    ),
  );
}
