// 💡 Concept & Analogie : La fiche de sauvetage détaillée sur mobile, condensant en un seul écran le prix en direct, le temps de marche depuis l'ESSECT et l'impact carbone certifié.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `CustomScrollView` avec un `SliverAppBar` et une barre d'action inférieure ancrée (`bottomNavigationBar`) ; en React, c'est `OfferDetailPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le bouton de réservation déclenche un verrouillage atomique de 10 minutes du stock au prix exact de la seconde, protégeant l'étudiant contre les conflits de concurrence."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/config/env.dart';
import '../../core/models/loyalty_model.dart';
import '../../core/models/offer_model.dart';
import '../../services/campus_api.dart';
import '../checkout/checkout_screen.dart';
import '../../core/domain/money.dart';
import '../../widgets/griddle.dart';
import '../../widgets/live_price_text.dart';
import '../../widgets/countdown_chip.dart';
import '../../widgets/rarity_badge.dart';

class OfferDetailScreen extends StatefulWidget {
  final OfferModel offer;
  final int? distanceFromEssectM;

  const OfferDetailScreen({
    super.key,
    required this.offer,
    this.distanceFromEssectM,
  });

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  int _quantity = 1;
  bool _isReserving = false;
  List<LoyaltyReward> _rewards = [];
  String? _selectedRewardId;

  @override
  void initState() {
    super.initState();
    _loadRewards();
  }

  /// Coupons réellement débloqués (`GET /loyalty/me`) ; le coupon choisi part dans `POST /orders` (rewardId).
  Future<void> _loadRewards() async {
    if (Env.useMocks) return;
    try {
      final loyalty = await CampusApi.shared.fetchLoyalty();
      if (mounted) setState(() => _rewards = loyalty.rewards.where((r) => r.isAvailable).toList());
    } catch (_) {
      // Sans coupons la réservation reste possible au prix plein.
    }
  }

  /// FREE_SURPRISE : uniquement paniers surprise de rareté COMMON ; coupons expirés exclus (règle serveur).
  List<LoyaltyReward> get _applicableRewards {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final commonSurprise = widget.offer.isSurpriseBasket && (widget.offer.rarity ?? 'COMMON') == 'COMMON';
    return _rewards.where((r) {
      final exp = r.expiresAt?.millisecondsSinceEpoch;
      if (exp != null && exp < nowMs) return false;
      return !r.isFreeSurprise || commonSurprise;
    }).toList();
  }

  Future<void> _reserve() async {
    setState(() => _isReserving = true);
    try {
      // Le serveur fige le prix, applique le coupon et renvoie la commande (10 min de blocage de stock).
      final order = await CampusApi.shared.createOrder(
        offerId: widget.offer.id,
        quantity: _quantity,
        rewardId: _applicableRewards.any((r) => r.id == _selectedRewardId) ? _selectedRewardId : null,
      );
      if (!mounted) return;
      await Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => CheckoutScreen(order: order)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isReserving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;
    final maxAllowed = offer.remainingQuantity.clamp(1, 4);
    final dist = widget.distanceFromEssectM;
    final walkingMin = dist == null ? null : (dist * 1.3 / 83.33).round().clamp(1, 45);

    // Impact écologique (2,5 g de CO2 évités par gramme d'aliment sauvé)
    final foodGrams = 350 * _quantity;
    final co2Grams = (foodGrams * 2.5).round();
    final phonesCharged = (co2Grams / 10).round();
    final totalMillimes = offer.targetPriceMillimes * _quantity;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Photo pleine largeur, boutons et autocollants par-dessus
          AspectRatio(
            aspectRatio: 4 / 3.4,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (offer.photoUrl != null && offer.photoUrl!.isNotEmpty)
                  GImage(url: offer.photoUrl!, placeholder: const _DetailPhotoPlaceholder(), cacheWidth: 1200)
                else
                  const _DetailPhotoPlaceholder(),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context)),
                        const Spacer(),
                        CountdownChip(pickupEndAt: offer.pickupEndAt),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 14,
                  bottom: 14,
                  child: Wrap(
                    spacing: 8,
                    children: [
                      GPill('${offer.remainingQuantity} restant${offer.remainingQuantity > 1 ? 's' : ''}', icon: Icons.shopping_bag_outlined, color: AppTheme.ink),
                      if (offer.isSurpriseBasket) RarityBadge(rarity: (offer.rarity ?? 'COMMON').toUpperCase(), score: 0.65),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((offer.merchantName ?? 'Commerce Montfleury').toUpperCase(), style: AppTheme.eyebrow()),
                const SizedBox(height: 4),
                Text(offer.title.toUpperCase(), style: AppTheme.display(46)),
                const SizedBox(height: 10),
                Text(offer.description, style: AppTheme.body(17, AppTheme.muted)),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (walkingMin != null) GPill('$walkingMin min à pied', icon: Icons.directions_walk, color: AppTheme.cream),
                    if (dist != null) GPill('$dist m de l\'ESSECT', icon: Icons.place_outlined, color: AppTheme.cream),
                  ],
                ),
                const SizedBox(height: 22),

                // Prix
                GCard(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('PRIX UNITAIRE ACTUEL', style: AppTheme.label()),
                      const SizedBox(height: 6),
                      LivePriceText(
                        pricingType: offer.pricingType,
                        originalPriceMillimes: offer.originalPriceMillimes,
                        targetPriceMillimes: offer.targetPriceMillimes,
                        pickupStartAt: offer.pickupStartAt,
                        pickupEndAt: offer.pickupEndAt,
                        stepMillimes: offer.stepMillimes,
                        onCream: true,
                        isLarge: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Impact écologique
                GCard(
                  color: const Color(0xFFDDEFD9),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(color: AppTheme.leaf, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                        child: const Icon(Icons.eco, color: AppTheme.cream, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('IMPACT ÉCO', style: AppTheme.label(AppTheme.leaf)),
                            Text('$foodGrams g sauvés · $co2Grams g CO₂ évités', style: AppTheme.body(17).copyWith(fontWeight: FontWeight.w700)),
                            Text('Équivalent à recharger ~$phonesCharged smartphones', style: AppTheme.body(14, AppTheme.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),

                // Quantité
                Row(
                  children: [
                    Expanded(child: Text('QUANTITÉ À RÉSERVER', style: AppTheme.h3(18))),
                    GIconButton(icon: Icons.remove, tooltip: 'Moins', onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null),
                    SizedBox(width: 56, child: Center(child: Text('$_quantity', style: AppTheme.figure(40, AppTheme.red)))),
                    GIconButton(icon: Icons.add, tooltip: 'Plus', onPressed: _quantity < maxAllowed ? () => setState(() => _quantity++) : null),
                  ],
                ),

                if (_applicableRewards.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  Text('COUPON FIDÉLITÉ', style: AppTheme.h3(18)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      GChip('Aucun', selected: _selectedRewardId == null, onTap: () => setState(() => _selectedRewardId = null)),
                      for (final r in _applicableRewards)
                        GChip(
                          r.isFreeSurprise ? '100 % offert' : '-${r.percentOff ?? 10} %',
                          icon: Icons.local_offer_outlined,
                          selected: _selectedRewardId == r.id,
                          onTap: () => setState(() => _selectedRewardId = r.id),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('La remise est calculée par le serveur à la réservation.', style: AppTheme.body(14, AppTheme.muted)),
                ],
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(color: AppTheme.cream, border: Border(top: BorderSide(color: AppTheme.ink, width: 2))),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: Row(
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TOTAL ESTIMÉ', style: AppTheme.label()),
                    Text(Money.formatTND(totalMillimes), style: AppTheme.figure(40, AppTheme.red)),
                  ],
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: GButton(
                    _isReserving ? 'Blocage…' : 'Réserver',
                    icon: Icons.bolt,
                    loading: _isReserving,
                    onPressed: _isReserving ? null : _reserve,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailPhotoPlaceholder extends StatelessWidget {
  const _DetailPhotoPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.sand,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.restaurant_menu, size: 64, color: AppTheme.muted),
          const SizedBox(height: 8),
          Text('CAMPUSSAVE · ANTI-GASPI', style: AppTheme.label()),
        ],
      ),
    );
  }
}
