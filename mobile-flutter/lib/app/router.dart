// 💡 Concept & Analogie : Système d'aiguillage des écrans sur mobile gérant les redirections selon l'état d'authentification et le rôle (Étudiant vs Commerçant).
// 🔄 Comparaison React / Flutter : Utilise `go_router` avec gestion de piles de navigation ; React Router 6 utilise des URLs web.
// 🎯 À retenir pour la soutenance : "Nous utilisons GoRouter avec redirection déclarative par rôle pour isoler les flux Étudiant et Commerçant."
// Module : Navigation & Scaffolding Mobile

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../features/auth/login_screen.dart';
import '../features/radar/radar_screen.dart';
import '../features/dashboards/student_dashboard_screen.dart';
import '../features/dashboards/merchant_dashboard_screen.dart';
import '../features/impact/impact_screen.dart';
import '../features/loyalty/loyalty_card_screen.dart';
import '../features/explore/explore_screen.dart';
import '../features/orders/my_orders_screen.dart';
import '../features/merchant/merchant_offers_screen.dart';
import '../features/merchant/merchant_orders_screen.dart';
import '../features/merchant/offer_form_screen.dart';
import '../features/merchant/scanner_screen.dart';

class AppRouter {
  static final AuthService authService = AuthService();

  static final GoRouter router = GoRouter(
    initialLocation: '/login',
    refreshListenable: authService,
    redirect: (BuildContext context, GoRouterState state) {
      final isAuth = authService.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';

      // Redirection vers login si non connecté
      if (!isAuth) {
        return isLoggingIn ? null : '/login';
      }

      final role = authService.role;

      // Si l'utilisateur est connecté et arrive sur login, redirection selon son rôle
      if (isLoggingIn) {
        if (role == 'MERCHANT') return '/merchant';
        return '/student';
      }

      // Cloisonnement strict des espaces par rôle
      if (state.matchedLocation.startsWith('/merchant') && role != 'MERCHANT') {
        return '/student';
      }
      if (state.matchedLocation.startsWith('/student') && role == 'MERCHANT') {
        return '/merchant';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(authService: authService),
      ),
      GoRoute(
        path: '/radar',
        builder: (context, state) => const RadarScreen(),
      ),
      GoRoute(
        path: '/student/radar',
        builder: (context, state) => const RadarScreen(),
      ),
      GoRoute(
        path: '/impact',
        builder: (context, state) => const ImpactScreen(),
      ),
      GoRoute(
        path: '/student/dashboard',
        builder: (context, state) => const StudentDashboardScreen(),
      ),
      GoRoute(
        path: '/student/explore',
        builder: (context, state) => const ExploreScreen(),
      ),
      GoRoute(
        path: '/student/loyalty',
        builder: (context, state) => const LoyaltyCardScreen(),
      ),
      GoRoute(
        path: '/student/orders',
        builder: (context, state) => const MyOrdersScreen(),
      ),
      GoRoute(
        path: '/merchant/dashboard',
        builder: (context, state) => const MerchantDashboardScreen(),
      ),
      GoRoute(
        path: '/merchant/offers',
        builder: (context, state) => const MerchantOffersScreen(),
      ),
      GoRoute(
        path: '/merchant/offers/new',
        builder: (context, state) => const OfferFormScreen(),
      ),
      GoRoute(
        path: '/merchant/orders',
        builder: (context, state) => const MerchantOrdersScreen(),
      ),
      GoRoute(
        path: '/merchant/scan',
        builder: (context, state) => const ScannerScreen(),
      ),
      GoRoute(
        path: '/student',
        builder: (context, state) => Scaffold(
          appBar: AppBar(
            title: const Text('Espace Étudiant CampusSave'),
            backgroundColor: const Color(0xFF16191E),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Color(0xFFCCFF00)),
                onPressed: () => authService.signOut(),
              ),
            ],
          ),
          body: const Center(
            child: Text(
              'Bienvenue dans l Espace Étudiant\nCatalogue & Radar en cours',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/merchant',
        builder: (context, state) => Scaffold(
          appBar: AppBar(
            title: const Text('Espace Commerçant CampusSave'),
            backgroundColor: const Color(0xFF16191E),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout, color: Color(0xFFCCFF00)),
                onPressed: () => authService.signOut(),
              ),
            ],
          ),
          body: const Center(
            child: Text(
              'Bienvenue dans l Espace Commerçant\nOffres & Scanner en cours',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
          ),
        ),
      ),
    ],
  );
}
