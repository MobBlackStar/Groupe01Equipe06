// 💡 Concept & Analogie : Comme un guichet à deux fenêtres (la grande vue 3D et la carte papier de secours), cet écran choisit la bonne et propose un bouton pour passer de l'une à l'autre.
// 🔄 Comparaison React / Flutter : Équivalent d'un `useState('3D' | '2D')` : le mode est un état ; la vue 3D est la page web `HoloRadarPage` (WebView), la vue 2D est `NativeRadarView` (flutter_map).
// 🎯 À retenir pour la soutenance : "Le téléphone affiche le même radar 3D WebGL que le site ; si le serveur web, la session ou WebGL2 manquent, il retombe automatiquement sur la carte 2D native : jamais d'écran blanc."

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/config/env.dart';
import '../../core/models/offer_model.dart';
import '../../services/campus_api.dart';
import '../explore/offer_detail_screen.dart';
import 'native_radar_view.dart';
import 'radar_web_view.dart';

enum _RadarMode { webgl3d, native2d }

class RadarScreen extends StatefulWidget {
  const RadarScreen({super.key});

  @override
  State<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends State<RadarScreen> {
  // La vue 3D n'existe que si le site web est configuré (WEB_APP_URL) et hors navigateur (pas de WebView sur le web).
  static bool get _canShow3d => !kIsWeb && Env.hasWebApp;
  _RadarMode _mode = _canShow3d ? _RadarMode.webgl3d : _RadarMode.native2d;
  int _webViewGeneration = 0; // change à chaque retour en 3D : la page est rechargée proprement

  void _fallBack(String reason) {
    if (!mounted || _mode == _RadarMode.native2d) return;
    setState(() => _mode = _RadarMode.native2d);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Vue 3D indisponible : $reason. Carte 2D native affichée.')),
    );
  }

  void _toggle() {
    setState(() {
      if (_mode == _RadarMode.webgl3d) {
        _mode = _RadarMode.native2d;
      } else {
        _webViewGeneration++;
        _mode = _RadarMode.webgl3d;
      }
    });
  }

  /// La page 3D demande d'ouvrir une offre : on utilise l'écran natif (réservation, paiement, ticket).
  Future<void> _openOffer(String offerId) async {
    try {
      final List<OfferModel> offers = await CampusApi.shared.fetchOffers();
      OfferModel? offer;
      for (final o in offers) {
        if (o.id == offerId) offer = o;
      }
      if (!mounted) return;
      final OfferModel? found = offer;
      if (found == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cette offre n\'est plus disponible.')));
        return;
      }
      Navigator.push(context, MaterialPageRoute(builder: (_) => OfferDetailScreen(offer: found)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Impossible de charger l\'offre. Réessayez.')));
    }
  }

  Widget _toggleButton() {
    final to3d = _mode == _RadarMode.native2d;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: TextButton.icon(
        onPressed: to3d && !_canShow3d ? null : _toggle, // 3D indisponible : site web non configuré, ou navigateur
        style: TextButton.styleFrom(
          backgroundColor: AppTheme.mustard,
          foregroundColor: AppTheme.ink,
          shape: const StadiumBorder(side: BorderSide(color: AppTheme.ink, width: 2)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          textStyle: AppTheme.body(14).copyWith(fontWeight: FontWeight.w700, decoration: TextDecoration.none),
        ),
        icon: Icon(to3d ? Icons.view_in_ar : Icons.map_outlined, size: 18),
        label: Text(to3d ? 'Vue 3D WebGL' : 'Carte 2D Native'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_mode == _RadarMode.native2d) {
      return NativeRadarView(extraActions: [_toggleButton()]);
    }
    // Vue 3D plein écran : la page web (mode embed) porte ses propres pastilles de rayon et sa fiche glissable ;
    // seul le bouton de bascule 2D flotte par-dessus, sous la barre de la page.
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Positioned.fill(
              child: RadarWebView(
                key: ValueKey(_webViewGeneration),
                onUnavailable: _fallBack,
                onOpenOffer: _openOffer,
              ),
            ),
            Positioned(
              left: 12,
              top: 76,
              child: Material(
                color: Colors.transparent,
                child: _toggleButton(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
