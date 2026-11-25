// 💡 Concept & Analogie : Comme une fenêtre ouverte sur le site web à l'intérieur de l'application, cet écran affiche le radar 3D WebGL de Montfleury et reste à l'écoute de ce que la page lui dit (« je suis prête », « ouvre cette offre »).
// 🔄 Comparaison React / Flutter : `webview_flutter` charge la page web ; le canal JavaScript `CampusBridge` reçoit les messages envoyés par `postToHost` (voir `web-react/src/lib/embed.js`).
// 🎯 À retenir pour la soutenance : "Le téléphone n'est jamais sur un écran blanc : si le serveur web est injoignable, si la session est refusée ou si WebGL2 manque, l'écran prévient le parent qui bascule sur la carte native."

import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../app/theme.dart';
import '../../core/api/api_client.dart';
import '../../core/config/env.dart';
import '../../services/auth_service.dart';

/// Raisons pour lesquelles la vue 3D n'est pas disponible (affichées à l'étudiant).
class Radar3dUnavailable {
  final String reason;
  const Radar3dUnavailable(this.reason);
}

class RadarWebView extends StatefulWidget {
  /// Appelé UNE fois si la vue 3D ne peut pas s'afficher : le parent bascule sur la carte native.
  final void Function(String reason) onUnavailable;

  /// Appelé quand la page demande d'ouvrir une offre (écran natif de réservation).
  final void Function(String offerId) onOpenOffer;

  /// Délai maximal avant de considérer que la page ne répond pas.
  final Duration readyTimeout;

  const RadarWebView({
    super.key,
    required this.onUnavailable,
    required this.onOpenOffer,
    this.readyTimeout = const Duration(seconds: 20),
  });

  /// URL chargée dans la WebView (mode `embed` : sans barre de navigation web).
  static Uri get radarUri => Uri.parse('${Env.webAppUrl}/app/radar?embed=1');

  @override
  State<RadarWebView> createState() => _RadarWebViewState();
}

class _RadarWebViewState extends State<RadarWebView> {
  late final WebViewController _controller;
  Timer? _timeout;
  bool _ready = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(AppTheme.cream)
      ..addJavaScriptChannel('CampusBridge', onMessageReceived: _onMessage)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => _injectSession(),
          onWebResourceError: (error) {
            // On ne réagit qu'aux erreurs de la page principale (une image de tuile manquante n'est pas bloquante)
            if (error.isForMainFrame ?? true) _fail('Serveur web injoignable (${Env.webAppUrl})');
          },
          onNavigationRequest: (request) {
            // La vue reste sur notre site : tout autre lien est ignoré
            final host = Uri.parse(Env.webAppUrl).host;
            return Uri.parse(request.url).host == host ? NavigationDecision.navigate : NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(RadarWebView.radarUri);

    _timeout = Timer(widget.readyTimeout, () {
      if (!_ready) _fail('La vue 3D met trop de temps à répondre');
    });
  }

  @override
  void dispose() {
    _timeout?.cancel();
    super.dispose();
  }

  void _fail(String reason) {
    if (_failed || !mounted) return;
    _failed = true;
    _timeout?.cancel();
    widget.onUnavailable(reason);
  }

  /// Transmet la session de l'application à la page (même mécanisme que la connexion démo du site web).
  Future<void> _injectSession() async {
    try {
      final auth = context.read<AuthService>();
      final profile = auth.profile;
      final token = ApiClient.demoAuthToken ?? await auth.currentIdToken();
      if (token == null || profile == null) return;
      final session = jsonEncode({
        'uid': profile.uid,
        'email': profile.email,
        'displayName': profile.displayName,
        'role': profile.role,
        'token': token,
        'ecoPoints': profile.ecoPoints,
      });
      final mode = auth.authMode == AuthMode.real ? 'REAL' : 'DEMO';
      await _controller.runJavaScript(
        "try{localStorage.setItem('campussave_auth_mode', ${jsonEncode(mode)});"
        "localStorage.setItem('campussave_token', ${jsonEncode(token)});"
        "${auth.authMode == AuthMode.demo ? "localStorage.setItem('campussave_demo_session', ${jsonEncode(session)});" : "localStorage.removeItem('campussave_demo_session');"}}catch(e){}",
      );
    } catch (_) {
      // Sans session, la page demandera la connexion et préviendra le parent (auth-required)
    }
  }

  void _onMessage(JavaScriptMessage message) {
    try {
      final data = jsonDecode(message.message) as Map<String, dynamic>;
      switch (data['type']) {
        case 'ready':
          _ready = true;
          _timeout?.cancel();
          if (mounted) setState(() {});
          break;
        case 'openOffer':
          final id = data['offerId']?.toString();
          if (id != null && id.isNotEmpty) widget.onOpenOffer(id);
          break;
        case 'webgl-unavailable':
          _fail('WebGL2 indisponible sur cet appareil');
          break;
        case 'auth-required':
          _fail('Session refusée par le site web');
          break;
      }
    } catch (_) {
      /* message illisible : ignoré */
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(child: WebViewWidget(controller: _controller)),
        if (!_ready)
          Positioned.fill(
            child: Container(
              color: AppTheme.cream,
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text('CHARGEMENT DU RADAR 3D…', style: AppTheme.label(AppTheme.ink)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
