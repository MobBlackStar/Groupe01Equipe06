// 💡 Concept & Analogie : Système d'aiguillage des écrans sur mobile gérant les redirections selon l'état d'authentification et le rôle (Étudiant vs Commerçant).
// 🔄 Comparaison React / Flutter : Utilise `go_router` avec gestion de piles de navigation ; React Router 6 utilise des URLs web.
// 🎯 À retenir pour la soutenance : "Nous utilisons GoRouter avec redirection déclarative par rôle pour isoler les flux Étudiant et Commerçant."
// Module : Navigation & Scaffolding Mobile

import '../services/campus_api.dart';
import '../features/merchant/merchant_onboarding_screen.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
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

import 'theme.dart';
import 'package:provider/provider.dart';
import '../features/auth/profile_screen.dart';
import '../features/orders/bag_sheet.dart';
import '../services/bag_service.dart';
import '../widgets/griddle.dart';
class AppRouter {
  static final AuthService authService = AuthService();

  /// Navigateur racine : la bannière de notification et l'ouverture d'un écran au toucher en ont besoin.
  static final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/login',
    refreshListenable: authService,
    redirect: (BuildContext context, GoRouterState state) {
      final isAuth = authService.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      // Redirection vers login si non connecté (sauf routes d'authentification)
      if (!isAuth) {
        return isAuthRoute ? null : '/login';
      }

      final role = authService.role;

      // Si l'utilisateur est connecté et arrive sur login/register, redirection selon son rôle
      if (isAuthRoute) {
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
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
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

  static const _tabs = [
    GTab('Offres', Icons.shopping_bag_outlined, Icons.shopping_bag),
    GTab('Radar', Icons.map_outlined, Icons.map),
    GTab('Tickets', Icons.confirmation_number_outlined, Icons.confirmation_number),
    GTab('Fidélité', Icons.workspace_premium_outlined, Icons.workspace_premium),
    GTab('Bilan', Icons.bar_chart_outlined, Icons.bar_chart),
  ];

  @override
  Widget build(BuildContext context) {
    final points = context.watch<AuthService>().profile?.ecoPoints;
    final bagCount = context.watch<BagService>().totalCount;
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            GTopBar(
              points: points,
              bagCount: bagCount,
              onBag: () => showBagSheet(context),
              onProfile: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
            ),
            Expanded(child: IndexedStack(index: _currentIndex, children: _pages)),
          ],
        ),
      ),
      bottomNavigationBar: GBottomBar(tabs: _tabs, index: _currentIndex, onChanged: (i) => setState(() => _currentIndex = i)),
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

  @override
  void initState() {
    super.initState();
    // Compte réel sans boutique (nouvelle inscription) : on ouvre directement le dépôt de dossier
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (AppRouter.authService.authMode != AuthMode.real) return;
      try {
        final store = await CampusApi.shared.fetchMyMerchant();
        if (store == null && mounted) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const MerchantOnboardingScreen()));
        }
      } catch (_) {
        // hors ligne : l'onglet Boutique proposera de créer la boutique
      }
    });
  }

  // Seul l'onglet affiché est construit (sauf le bilan) : le scanner n'allume la caméra que lorsqu'il est visible,
  // et chaque liste se recharge depuis le serveur à chaque ouverture.
  List<Widget> get _pages => [
        const MerchantDashboardScreen(),
        _currentIndex == 1 ? const MerchantOffersScreen() : const SizedBox.shrink(),
        _currentIndex == 2 ? const ScannerScreen() : const SizedBox.shrink(),
        _currentIndex == 3 ? const MerchantOrdersScreen() : const SizedBox.shrink(),
        _currentIndex == 4 ? const MerchantStoreScreen() : const SizedBox.shrink(),
      ];

  static const _tabs = [
    GTab('Bilan', Icons.bar_chart_outlined, Icons.bar_chart),
    GTab('Offres', Icons.storefront_outlined, Icons.storefront),
    GTab('Scanner', Icons.qr_code_scanner_outlined, Icons.qr_code_scanner),
    GTab('Retraits', Icons.receipt_long_outlined, Icons.receipt_long),
    GTab('Boutique', Icons.store_outlined, Icons.store),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            GTopBar(onProfile: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()))),
            Expanded(child: IndexedStack(index: _currentIndex, children: _pages)),
          ],
        ),
      ),
      bottomNavigationBar: GBottomBar(tabs: _tabs, index: _currentIndex, onChanged: (i) => setState(() => _currentIndex = i)),
    );
  }
}
