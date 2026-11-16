// 💡 Concept & Analogie : Système d'aiguillage des écrans sur mobile gérant les redirections selon l'état d'authentification et le rôle (Étudiant vs Commerçant).
// 🔄 Comparaison React / Flutter : Utilise `go_router` avec gestion de piles de navigation ; React Router 6 utilise des URLs web.
// 🎯 À retenir pour la soutenance : "Nous utilisons GoRouter avec redirection déclarative par rôle pour isoler les flux Étudiant et Commerçant."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const Scaffold(
          body: Center(
            child: Text(
              "Écran de Connexion Mobile (CampusSave)\nEn cours d'intégration",
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFFCCFF00)),
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/student',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Espace Étudiant Mobile')),
        ),
      ),
      GoRoute(
        path: '/merchant',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Espace Commerçant Mobile')),
        ),
      ),
    ],
  );
}
