// 💡 Concept & Analogie : Le comptoir numérique du commerçant : agrément, coordonnées et chiffres clés, tous lus depuis son vrai dossier.
// 🔄 Comparaison React / Flutter : Équivalent de `MerchantStorePage.jsx` : `GET /merchants/me`, avec la création du dossier via `POST /merchants`.
// 🎯 À retenir pour la soutenance : "Le statut (en attente, agréé, refusé) vient du serveur ; seul un administrateur peut le changer."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import 'merchant_onboarding_screen.dart';
import 'merchant_store_edit_screen.dart';

class MerchantStoreScreen extends StatefulWidget {
  const MerchantStoreScreen({super.key});

  @override
  State<MerchantStoreScreen> createState() => _MerchantStoreScreenState();
}

class _MerchantStoreScreenState extends State<MerchantStoreScreen> {
  Map<String, dynamic>? _store;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final store = await CampusApi.shared.fetchMyMerchant();
      if (!mounted) return;
      setState(() {
        _store = store;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openOnboarding() async {
    final created = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const MerchantOnboardingScreen()));
    if (created == true) _load();
  }

  Future<void> _openEdit() async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => MerchantStoreEditScreen(store: _store!)));
    if (saved == true) _load();
  }

  static const _typeLabels = {
    'RESTAURANT': 'Restaurant',
    'CAFETERIA': 'Cafétéria',
    'BOULANGERIE': 'Boulangerie',
    'FAST_FOOD': 'Fast-food',
    'PATISSERIE': 'Pâtisserie',
  };

  @override
  Widget build(BuildContext context) {
    return GScreenBody(
      eyebrow: 'Espace commerçant',
      title: 'Ma boutique',
      child: RefreshIndicator(
        color: AppTheme.red,
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.red))
            : _error != null
                ? ListView(padding: const EdgeInsets.all(20), children: [GEmpty(icon: Icons.cloud_off_outlined, title: 'Boutique indisponible', message: _error!, actionLabel: 'Réessayer', onAction: _load)])
                : _store == null
                    ? ListView(padding: const EdgeInsets.all(20), children: [
                        GEmpty(
                          icon: Icons.storefront_outlined,
                          title: 'Pas encore de boutique',
                          message: 'Déposez votre dossier pour publier des offres anti-gaspi près du campus.',
                          actionLabel: 'Créer ma boutique',
                          onAction: _openOnboarding,
                        ),
                      ])
                    : _content(_store!),
      ),
    );
  }

  Widget _content(Map<String, dynamic> s) {
    final status = (s['status'] ?? 'PENDING').toString();
    final address = s['address'] is Map ? Map<String, dynamic>.from(s['address'] as Map) : const <String, dynamic>{};
    final addressLine = [address['street'], address['area'], address['city']].where((e) => e != null && e.toString().isNotEmpty).join(', ');
    final distance = s['distanceFromEssectM'];
    final walking = s['walkingMinutes'];
    final rating = s['ratingAvg'];
    final ratingCount = s['ratingCount'];

    final (Color color, IconData icon, String title, String text) = switch (status) {
      'APPROVED' => (AppTheme.leaf, Icons.verified_outlined, 'Agréé', 'Votre commerce est actif et visible par les étudiants.'),
      'REJECTED' => (AppTheme.red, Icons.cancel_outlined, 'Dossier refusé', (s['statusReason'] ?? 'Consultez le motif auprès de l\'administration.').toString()),
      _ => (AppTheme.orange, Icons.hourglass_top, 'En attente de validation', 'Votre dossier est en cours d\'examen par l\'administration.'),
    };

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        GCard(
          color: color,
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Icon(icon, size: 34, color: AppTheme.onColor(color)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title.toUpperCase(), style: AppTheme.h3(22, AppTheme.onColor(color))),
                    const SizedBox(height: 2),
                    Text(text, style: AppTheme.body(15, AppTheme.onColor(color))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        GCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_typeLabels[s['type']]?.toUpperCase() ?? 'COMMERCE', style: AppTheme.eyebrow()),
              const SizedBox(height: 4),
              Text((s['name'] ?? '').toString().toUpperCase(), style: AppTheme.display(40)),
              const SizedBox(height: 12),
              if (addressLine.isNotEmpty) _InfoRow(Icons.place_outlined, addressLine),
              if ((s['phone'] ?? '').toString().isNotEmpty) _InfoRow(Icons.phone_outlined, s['phone'].toString(), mono: true),
              if (distance is num) _InfoRow(Icons.directions_walk, '${distance.round()} m de l\'ESSECT${walking is num ? ' · ${walking.round()} min à pied' : ''}'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        GButton('Modifier ma boutique', icon: Icons.edit_outlined, variant: GVariant.cream, onPressed: _openEdit),
        const SizedBox(height: 18),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: GStat(label: 'Offres actives', value: '${(s['activeOfferCount'] as num?)?.toInt() ?? 0}', icon: Icons.local_offer_outlined)),
            const SizedBox(width: 12),
            Expanded(child: GStat(label: 'Repas sauvés', value: '${(s['totalMealsSaved'] as num?)?.toInt() ?? 0}', icon: Icons.eco_outlined, valueColor: AppTheme.leaf)),
          ],
        ),
        const SizedBox(height: 12),
        GStat(
          label: 'Note moyenne',
          value: (rating is num && (ratingCount as num? ?? 0) > 0) ? rating.toStringAsFixed(1) : '—',
          hint: (ratingCount is num && ratingCount > 0) ? '$ratingCount avis' : 'Pas encore d\'avis',
          icon: Icons.star_outline,
          valueColor: AppTheme.red,
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool mono;

  const _InfoRow(this.icon, this.text, {this.mono = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppTheme.red),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: mono ? AppTheme.mono(15).copyWith(fontWeight: FontWeight.w700) : AppTheme.body(16))),
        ],
      ),
    );
  }
}
