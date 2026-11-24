// 💡 Concept & Analogie : Le carnet d'inventaire du commerçant : chaque offre affiche son stock restant et son prix, lus depuis le serveur.
// 🔄 Comparaison React / Flutter : Équivalent de la page « Mes offres » du site : `GET /merchants/me/offers`, suppression via `DELETE /offers/:id`.
// 🎯 À retenir pour la soutenance : "La liste vient de l'API (plus aucune offre factice) ; la suppression est confirmée puis réellement exécutée côté serveur."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../core/models/offer_model.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import 'offer_form_screen.dart';

class MerchantOffersScreen extends StatefulWidget {
  const MerchantOffersScreen({super.key});

  @override
  State<MerchantOffersScreen> createState() => _MerchantOffersScreenState();
}

class _MerchantOffersScreenState extends State<MerchantOffersScreen> {
  List<OfferModel> _offers = const [];
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
      final offers = await CampusApi.shared.fetchMyOffers();
      if (!mounted) return;
      setState(() {
        _offers = offers;
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

  Future<void> _create() async {
    final created = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const OfferFormScreen()));
    if (created == true) _load();
  }

  Future<void> _edit(OfferModel offer) async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => OfferFormScreen(offer: offer)));
    if (saved == true) _load();
  }

  Future<void> _delete(OfferModel offer) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Retirer cette offre ?', style: AppTheme.h3(22)),
        content: Text('« ${offer.title} » ne sera plus visible par les étudiants.', style: AppTheme.body(16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Retirer')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await CampusApi.shared.deleteOffer(offer.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Offre retirée du catalogue.')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return GScreenBody(
      eyebrow: 'Espace commerçant',
      title: 'Mes offres',
      bottom: Padding(
        padding: const EdgeInsets.fromLTRB(8, 6, 8, 12),
        child: GButton('Publier une offre', icon: Icons.add, onPressed: _create),
      ),
      child: RefreshIndicator(
        color: AppTheme.red,
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.red))
            : _error != null
                ? ListView(padding: const EdgeInsets.all(20), children: [GEmpty(icon: Icons.cloud_off_outlined, title: 'Offres indisponibles', message: _error!, actionLabel: 'Réessayer', onAction: _load)])
                : _offers.isEmpty
                    ? ListView(padding: const EdgeInsets.all(20), children: const [GEmpty(icon: Icons.inventory_2_outlined, title: 'Aucune offre', message: 'Publiez votre première offre anti-gaspi pour la voir ici.')])
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                        itemCount: _offers.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, i) => _OfferTile(offer: _offers[i], onEdit: () => _edit(_offers[i]), onDelete: () => _delete(_offers[i])),
                      ),
      ),
    );
  }
}

class _OfferTile extends StatelessWidget {
  final OfferModel offer;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _OfferTile({required this.offer, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final soldOut = offer.status == 'SOLD_OUT' || offer.remainingQuantity == 0;
    final expired = offer.status == 'EXPIRED';
    final label = expired ? 'Expirée' : (soldOut ? 'Épuisée' : 'En ligne');
    final color = (expired || soldOut) ? AppTheme.muted : AppTheme.leaf;

    return GCard(
      padding: const EdgeInsets.fromLTRB(18, 14, 8, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GPill(label, color: color),
              const Spacer(),
              IconButton(icon: const Icon(Icons.edit_outlined, color: AppTheme.ink), tooltip: 'Modifier l\'offre', onPressed: onEdit),
              IconButton(icon: const Icon(Icons.delete_outline, color: AppTheme.ink), tooltip: 'Retirer l\'offre', onPressed: onDelete),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(offer.title.toUpperCase(), style: AppTheme.h3(22)),
                if (offer.description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(offer.description, style: AppTheme.body(15, AppTheme.muted), maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: Text('Stock ${offer.remainingQuantity} / ${offer.quantity}', style: AppTheme.mono(14, AppTheme.ink).copyWith(fontWeight: FontWeight.w700))),
                    Text(Money.formatTND(offer.targetPriceMillimes), style: AppTheme.figure(36, AppTheme.red)),
                  ],
                ),
                Text('au lieu de ${Money.formatTND(offer.originalPriceMillimes)}', style: AppTheme.body(14, AppTheme.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
