// 💡 Concept & Analogie : Le standard téléphonique de l'application : il enregistre le numéro de l'appareil auprès du serveur, affiche une bannière quand un message arrive et ouvre le bon écran au toucher.
// 🔄 Comparaison React / Flutter : Équivalent de `firebase-messaging-sw.js` + `lib/push.js` sous React : même route `POST /users/me/fcm-token`, mêmes types d'événements (ORDER_PAID, TICKET_READY…).
// 🎯 À retenir pour la soutenance : "Dès la connexion (démo ou compte réel) l'appareil est enregistré ; au premier plan une bannière Griddle s'affiche, en arrière-plan Android affiche une bannière haute priorité grâce au canal campussave_high_importance."
// Module : Infrastructure Mobile

import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../app/theme.dart';
import '../features/loyalty/loyalty_card_screen.dart';
import '../features/merchant/merchant_orders_screen.dart';
import '../features/merchant/merchant_store_screen.dart';
import '../features/orders/my_orders_screen.dart';
import 'campus_api.dart';

/// Gestionnaire d'arrière-plan : doit être une fonction de premier niveau. Le système affiche lui-même la notification
/// (message « notification » + canal haute importance) ; rien d'autre à faire ici.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    debugPrint('Notification reçue en arrière-plan : ${message.notification?.title}');
  }
}

enum PushStatus { unsupported, denied, notRegistered, active }

class FcmService {
  /// Clé du navigateur racine (posée par le routeur) : sert à afficher la bannière et à ouvrir un écran au toucher.
  static GlobalKey<NavigatorState>? navigatorKey;

  static String? _registeredToken;
  static bool _listening = false;
  static OverlayEntry? _banner;
  static Timer? _bannerTimer;

  static bool get _supported => !kIsWeb;

  /// Écouteurs (premier plan, ouverture depuis la barre de notifications, rotation du jeton). À appeler une fois au démarrage.
  static Future<void> initialize() async {
    if (!_supported || _listening) return;
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen((m) => _openFor(m.data));
      FirebaseMessaging.instance.onTokenRefresh.listen((t) => _register(t));
      _listening = true;
      // Application lancée par un toucher sur une notification alors qu'elle était fermée
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) Future.delayed(const Duration(seconds: 1), () => _openFor(initial.data));
    } catch (e) {
      debugPrint('FCM non initialisé : $e');
    }
  }

  /// Après une connexion (démo ou compte réel) : demande l'autorisation si besoin puis enregistre l'appareil auprès du serveur.
  static Future<PushStatus> registerForCurrentUser() async {
    if (!_supported) return PushStatus.unsupported;
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(alert: true, badge: true, sound: true);
      if (settings.authorizationStatus == AuthorizationStatus.denied) return PushStatus.denied;
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return PushStatus.notRegistered;
      await _register(token);
      await FirebaseMessaging.instance.subscribeToTopic('new-offers').catchError((_) {});
      return _registeredToken == null ? PushStatus.notRegistered : PushStatus.active;
    } catch (e) {
      debugPrint('Enregistrement FCM impossible : $e');
      return PushStatus.notRegistered;
    }
  }

  static Future<void> _register(String token) async {
    try {
      await CampusApi.shared.registerFcmToken(token);
      _registeredToken = token;
    } catch (e) {
      debugPrint('Jeton FCM refusé par le serveur : $e');
    }
  }

  /// À la déconnexion : l'appareil ne doit plus recevoir les notifications de l'ancien compte.
  static Future<void> unregister() async {
    final token = _registeredToken;
    _registeredToken = null;
    if (!_supported || token == null) return;
    try {
      await CampusApi.shared.removeFcmToken(token);
    } catch (_) {
      // hors ligne : le serveur élaguera le jeton au prochain échec d'envoi
    }
  }

  /// État pour l'écran de profil (autorisation du système + enregistrement auprès du serveur).
  static Future<PushStatus> status() async {
    if (!_supported) return PushStatus.unsupported;
    try {
      final s = await FirebaseMessaging.instance.getNotificationSettings();
      if (s.authorizationStatus == AuthorizationStatus.denied) return PushStatus.denied;
      if (s.authorizationStatus != AuthorizationStatus.authorized && s.authorizationStatus != AuthorizationStatus.provisional) return PushStatus.notRegistered;
      return _registeredToken != null ? PushStatus.active : PushStatus.notRegistered;
    } catch (_) {
      return PushStatus.notRegistered;
    }
  }

  // ------------------------------------------------------------------ premier plan : bannière Griddle

  static void _onForegroundMessage(RemoteMessage message) {
    final title = message.notification?.title ?? 'CampusSave';
    final body = message.notification?.body ?? '';
    showBanner(title, body, onTap: () => _openFor(message.data));
  }

  /// Bannière en haut de l'écran (disparaît seule après 5 s, toucher = ouvrir l'écran concerné).
  static void showBanner(String title, String body, {VoidCallback? onTap}) {
    final overlay = navigatorKey?.currentState?.overlay;
    if (overlay == null) return;
    _dismissBanner();
    _banner = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 8,
        left: 12,
        right: 12,
        child: Material(
          color: Colors.transparent,
          child: GestureDetector(
            onTap: () {
              _dismissBanner();
              onTap?.call();
            },
            onVerticalDragEnd: (_) => _dismissBanner(),
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
              decoration: BoxDecoration(
                color: AppTheme.mustard,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppTheme.ink, width: 2),
                boxShadow: const [BoxShadow(color: AppTheme.ink, offset: Offset(3, 3))],
              ),
              child: Row(
                children: [
                  const Icon(Icons.notifications_active, color: AppTheme.ink),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: AppTheme.h3(18), maxLines: 1, overflow: TextOverflow.ellipsis),
                        if (body.isNotEmpty) Text(body, style: AppTheme.body(14), maxLines: 2, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  IconButton(onPressed: _dismissBanner, icon: const Icon(Icons.close, color: AppTheme.ink), tooltip: 'Fermer'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    overlay.insert(_banner!);
    _bannerTimer = Timer(const Duration(seconds: 5), _dismissBanner);
  }

  static void _dismissBanner() {
    _bannerTimer?.cancel();
    _banner?.remove();
    _banner = null;
  }

  // ------------------------------------------------------------------ toucher : ouvre l'écran concerné

  static void _openFor(Map<String, dynamic> data) {
    final nav = navigatorKey?.currentState;
    if (nav == null) return;
    Widget? page;
    switch (data['type']) {
      case 'TICKET_READY':
      case 'ORDER_COMPLETED':
      case 'PICKUP_REMINDER':
        page = const MyOrdersScreen();
      case 'REWARD_UNLOCKED':
        page = const LoyaltyCardScreen();
      case 'ORDER_PAID':
        page = const MerchantOrdersScreen();
      case 'MERCHANT_STATUS':
        page = const MerchantStoreScreen();
    }
    if (page != null) nav.push(MaterialPageRoute(builder: (_) => page!));
  }
}
