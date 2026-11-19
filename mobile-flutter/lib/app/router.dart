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
import '../features/explore/explore_screen.dart';
import '../features/orders/my_orders_screen.dart';
import '../features/loyalty/loyalty_card_screen.dart';
import '../features/merchant/merchant_offers_screen.dart';
import '../features/merchant/offer_form_screen.dart';
import '../features/merchant/scanner_screen.dart';
import '../features/merchant/merchant_orders_screen.dart';
import '../features/merchant/merchant_store_screen.dart';

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
        builder: (context, state) => StudentShell(onSignOut: () => authService.signOut()),
      ),
      GoRoute(
        path: '/merchant',
        builder: (context, state) => MerchantShell(onSignOut: () => authService.signOut()),
      ),
    ],
  );
}

class StudentShell extends StatefulWidget {
  final VoidCallback onSignOut;
  const StudentShell({super.key, required this.onSignOut});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _currentIndex = 0;

  // Commandes et Fidélité sont recréées à chaque sélection de l'onglet : elles rechargent ainsi le serveur
  // (nouvelle commande payée, EcoPoints crédités après un retrait).
  List<Widget> get _pages => [
        const ExploreScreen(),
        const RadarScreen(),
        _currentIndex == 2 ? const MyOrdersScreen() : const SizedBox.shrink(),
        _currentIndex == 3 ? const LoyaltyCardScreen() : const SizedBox.shrink(),
        const StudentDashboardScreen(),
      ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF161920),
        selectedItemColor: const Color(0xFFCCFF00),
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        selectedFontSize: 11,
        unselectedFontSize: 10,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), activeIcon: Icon(Icons.shopping_bag), label: 'Explorer'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), activeIcon: Icon(Icons.map), label: 'Radar 3D'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Commandes'),
          BottomNavigationBarItem(icon: Icon(Icons.card_giftcard_outlined), activeIcon: Icon(Icons.card_giftcard), label: 'Fidélité'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), activeIcon: Icon(Icons.bar_chart), label: 'Dashboard'),
        ],
      ),
    );
  }
}

class MerchantShell extends StatefulWidget {
  final VoidCallback onSignOut;
  const MerchantShell({super.key, required this.onSignOut});

  @override
  State<MerchantShell> createState() => _MerchantShellState();
}

class _MerchantShellState extends State<MerchantShell> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    MerchantDashboardScreen(),
    MerchantOffersScreen(),
    ScannerScreen(),
    MerchantOrdersScreen(),
    MerchantStoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF161920),
        selectedItemColor: const Color(0xFFFF5500),
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        selectedFontSize: 11,
        unselectedFontSize: 10,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), activeIcon: Icon(Icons.bar_chart), label: 'Stats'),
          BottomNavigationBarItem(icon: Icon(Icons.storefront_outlined), activeIcon: Icon(Icons.storefront), label: 'Offres'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner_outlined), activeIcon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_outlined), activeIcon: Icon(Icons.receipt), label: 'Commandes'),
          BottomNavigationBarItem(icon: Icon(Icons.store_outlined), activeIcon: Icon(Icons.store), label: 'Boutique'),
        ],
      ),
    );
  }
}
