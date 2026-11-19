// 💡 Concept & Analogie : Composant racine Flutter qui configure le thème sombre, les localisations et le routeur GoRouter.
// 🔄 Comparaison React / Flutter : Équivalent de `App.jsx` sous React.
// 🎯 À retenir pour la soutenance : "Ce widget configure le MaterialApp.router avec notre thème sombre aux accents vert lime."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'router.dart';
import 'theme.dart';

class CampusSaveApp extends StatelessWidget {
  const CampusSaveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CampusSave',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      routerConfig: AppRouter.router,
    );
  }
}
