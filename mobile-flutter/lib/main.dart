// 💡 Concept & Analogie : Comme la clé de contact qui lance le moteur et démarre le tableau de bord d'un véhicule, `main()` initialise les bindings Flutter, Firebase et lance l'application `CampusSaveApp`.
// 🔄 Comparaison React / Flutter : Équivalent de `main.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée universel de notre application mobile Flutter."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app/app.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // L'initialisation complète Firebase sera finalisée avec les credentials du projet
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: const CampusSaveApp(),
    ),
  );
}
