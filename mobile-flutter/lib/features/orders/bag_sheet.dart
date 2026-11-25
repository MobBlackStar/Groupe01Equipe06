// 💡 Concept & Analogie : Le tiroir "Dans mon sac" façon Griddle, avec garde-fou mono-commerce et suggestions "Compléter avec ce commerce".
// 🔄 Comparaison React / Flutter : Miroir de `web-react/src/features/bag/BagDrawer.jsx` et `BagContent.jsx`.
// 🎯 À retenir pour la soutenance : "Une seule commande atomique par commerce permet d'obtenir un seul Living Ticket pour l'ensemble du sac."

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/theme.dart';
import '../../core/config/env.dart';
import '../../core/domain/money.dart';
import '../../core/models/loyalty_model.dart';
import '../../core/models/offer_model.dart';
import '../../services/bag_service.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import '../checkout/checkout_screen.dart';

/// Tente d'ajouter une offre au sac mono-commerce ; propose de remplacer le sac en cas de conflit.
Future<void> addOfferToBagWithPrompt(
  BuildContext context,
  OfferModel offer, {
  int quantity = 1,
}) async {
  final bag = context.read<BagService>();
  final result = bag.tryAddOffer(offer, quantity: quantity);

  if (result.status == BagAddStatus.conflict) {
    final replace = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cream,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.ink, width: 2),
        ),
        title: Text('UN SEUL COMMERCE PAR SAC', style: AppTheme.h3(20)),
        content: Text(
          'Votre sac contient déjà des articles de ${result.currentMerchantName}. '
          'Voulez-vous le vider pour ajouter cet article de ${result.incomingMerchantName} ?',
          style: AppTheme.body(15),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Garder mon sac', style: AppTheme.body(15, AppTheme.ink).copyWith(fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.red,
              foregroundColor: AppTheme.cream,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppTheme.ink, width: 2),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Vider et ajouter'),
          ),
        ],
      ),
    );
    if (replace == true && context.mounted) {
      bag.replaceWithOffer(offer, quantity: quantity);
      showBagSheet(context);
    }
    return;
  }

  if (!context.mounted) return;
  final rootCtx = Navigator.of(context, rootNavigator: true).context;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.ink,
        content: Text('${offer.title} ajouté au sac (${bag.totalCount})', style: AppTheme.body(14, AppTheme.cream)),
        action: SnackBarAction(
          label: 'Ouvrir le sac',
          textColor: AppTheme.mustard,
          onPressed: () {
            if (rootCtx.mounted) showBagSheet(rootCtx);
          },
        ),
      ),
    );
}

Future<void> showBagSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const BagSheet(),
  );
}

class BagSheet extends StatefulWidget {
  const BagSheet({super.key});

  @override
  State<BagSheet> createState() => _BagSheetState();
}

class _BagSheetState extends State<BagSheet> {
  Timer? _ticker;
  int _nowMs = DateTime.now().millisecondsSinceEpoch;
  List<LoyaltyReward> _rewards = [];
  String? _selectedRewardId;
  bool _isReserving = false;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _nowMs = DateTime.now().millisecondsSinceEpoch);
    });
    _hydrateRewardsAndCatalog();
  }

  Future<void> _hydrateRewardsAndCatalog() async {
    if (Env.useMocks) return;
    try {
      final loyaltyFuture = CampusApi.shared.fetchLoyalty().then<LoyaltyStatus?>((v) => v, onError: (_) => null);
      final offersFuture = CampusApi.shared.fetchOffers().then<List<OfferModel>>((v) => v, onError: (_) => const <OfferModel>[]);
      final loyalty = await loyaltyFuture;
      final offers = await offersFuture;
      if (!mounted) return;
      if (offers.isNotEmpty) {
        context.read<BagService>().syncCatalog(offers);
      }
      if (loyalty != null) {
        setState(() {
          _rewards = loyalty.rewards.where((r) => r.isAvailable).toList();
        });
      }
    } catch (_) {
      // Silencieux : le sac reste utilisable hors récompenses.
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  List<LoyaltyReward> _applicableRewards(BagService bag) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    return _rewards.where((r) {
      final exp = r.expiresAt?.millisecondsSinceEpoch;
      if (exp != null && exp < nowMs) return false;
      return !r.isFreeSurprise || bag.hasCommonSurpriseItem;
    }).toList();
  }

  Future<void> _checkout(BagService bag) async {
    if (bag.isEmpty || _isReserving) return;
    setState(() => _isReserving = true);
    try {
      final applicable = _applicableRewards(bag);
      final rewardId = applicable.any((r) => r.id == _selectedRewardId) ? _selectedRewardId : null;
      final order = await CampusApi.shared.createOrder(
        items: [
          for (final item in bag.items)
            {'offerId': item.offer.id, 'quantity': item.quantity},
        ],
        rewardId: rewardId,
      );
      if (!mounted) return;
      bag.clear();
      Navigator.pop(context);
      Navigator.push(
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
    final bag = context.watch<BagService>();
    final crossSell = bag.crossSellOffers;
    final applicableRewards = _applicableRewards(bag);
    final totalMillimes = bag.totalMillimesAt(_nowMs);
    final maxH = MediaQuery.of(context).size.height * 0.86;

    return Container(
      constraints: BoxConstraints(maxHeight: maxH),
      decoration: const BoxDecoration(
        color: AppTheme.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: AppTheme.ink, width: 2),
          left: BorderSide(color: AppTheme.ink, width: 2),
          right: BorderSide(color: AppTheme.ink, width: 2),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Poignée & en-tête
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 16, 10),
              child: Column(
                children: [
                  Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(color: AppTheme.ink.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(99)),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.shopping_bag, color: AppTheme.red, size: 24),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('DANS MON SAC', style: AppTheme.h3(22)),
                            if (bag.merchantName != null)
                              Text(bag.merchantName!, style: AppTheme.body(14, AppTheme.muted), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      if (bag.isNotEmpty) GPill('${bag.totalCount} PORTION${bag.totalCount > 1 ? 'S' : ''}', color: AppTheme.mustard),
                      const SizedBox(width: 8),
                      GIconButton(icon: Icons.close, tooltip: 'Fermer', onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(color: AppTheme.ink, height: 1, thickness: 2),

            if (bag.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: GEmpty(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Votre sac est vide',
                  message: 'Ajoutez un plat ou un panier surprise depuis Explorer pour préparer votre retrait.',
                ),
              )
            else ...[
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  children: [
                    for (final item in bag.items) ...[
                      _BagItemRow(
                        item: item,
                        unitPriceMillimes: item.unitPriceAt(_nowMs),
                        onDecrement: () => bag.updateQuantity(item.offer.id, item.quantity - 1),
                        onIncrement: item.quantity < item.maxAllowed
                            ? () => bag.updateQuantity(item.offer.id, item.quantity + 1)
                            : null,
                        onRemove: () => bag.removeItem(item.offer.id),
                      ),
                      const SizedBox(height: 12),
                    ],

                    if (crossSell.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text('COMPLÉTER AVEC CE COMMERCE', style: AppTheme.label(AppTheme.red)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 82,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: crossSell.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 10),
                          itemBuilder: (_, idx) {
                            final extra = crossSell[idx];
                            final extraUnit = BagItem(offer: extra, quantity: 1).unitPriceAt(_nowMs);
                            return InkWell(
                              onTap: () => bag.tryAddOffer(extra, quantity: 1),
                              borderRadius: BorderRadius.circular(14),
                              child: Container(
                                width: 220,
                                padding: const EdgeInsets.all(10),
                                decoration: AppTheme.paperCard(),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(extra.title, style: AppTheme.body(14).copyWith(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                                          const SizedBox(height: 3),
                                          Text(Money.formatTND(extraUnit), style: AppTheme.mono(13, AppTheme.red).copyWith(fontWeight: FontWeight.w700)),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    GPill('+ AJOUTER', color: AppTheme.mustard),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],

                    if (applicableRewards.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Text('COUPON FIDÉLITÉ', style: AppTheme.label()),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          GChip('Aucun', selected: _selectedRewardId == null, onTap: () => setState(() => _selectedRewardId = null)),
                          for (final r in applicableRewards)
                            GChip(
                              r.isFreeSurprise ? '100 % offert' : '-${r.percentOff ?? 10} %',
                              icon: Icons.local_offer_outlined,
                              selected: _selectedRewardId == r.id,
                              onTap: () => setState(() => _selectedRewardId = r.id),
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                decoration: const BoxDecoration(
                  color: AppTheme.cream,
                  border: Border(top: BorderSide(color: AppTheme.ink, width: 2)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text('TOTAL DU SAC', overflow: TextOverflow.ellipsis, style: AppTheme.label()),
                        ),
                        const SizedBox(width: 10),
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerRight,
                            child: Text(Money.formatTND(totalMillimes), style: AppTheme.figure(32, AppTheme.red)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    GButton(
                      _isReserving ? 'Blocage…' : 'Réserver & payer le sac (${Money.formatTND(totalMillimes)})',
                      icon: Icons.bolt,
                      loading: _isReserving,
                      onPressed: _isReserving ? null : () => _checkout(bag),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BagStepButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  const _BagStepButton({required this.icon, required this.tooltip, this.onPressed});

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null;
    return Tooltip(
      message: tooltip,
      child: Opacity(
        opacity: disabled ? 0.35 : 1,
        child: Material(
          color: AppTheme.cream,
          shape: const CircleBorder(side: BorderSide(color: AppTheme.ink, width: 2)),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onPressed,
            child: SizedBox(width: 34, height: 34, child: Icon(icon, size: 18, color: AppTheme.ink)),
          ),
        ),
      ),
    );
  }
}

class _BagItemRow extends StatelessWidget {
  final BagItem item;
  final int unitPriceMillimes;
  final VoidCallback onDecrement;
  final VoidCallback? onIncrement;
  final VoidCallback onRemove;

  const _BagItemRow({
    required this.item,
    required this.unitPriceMillimes,
    required this.onDecrement,
    required this.onIncrement,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final offer = item.offer;
    final subtotalMillimes = unitPriceMillimes * item.quantity;
    return GCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 54,
                  height: 54,
                  child: offer.photoUrl != null && offer.photoUrl!.isNotEmpty
                      ? GImage(url: offer.photoUrl!, placeholder: Container(color: AppTheme.sand), cacheWidth: 200)
                      : Container(color: AppTheme.sand, child: const Icon(Icons.restaurant, color: AppTheme.muted)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(offer.title, style: AppTheme.body(15).copyWith(fontWeight: FontWeight.w700), maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(
                      '${Money.formatTND(unitPriceMillimes)} / unité',
                      style: AppTheme.mono(13, AppTheme.muted),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: AppTheme.red, size: 20),
                tooltip: 'Retirer',
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                padding: EdgeInsets.zero,
                onPressed: onRemove,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _BagStepButton(icon: Icons.remove, tooltip: 'Moins', onPressed: onDecrement),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('${item.quantity}', style: AppTheme.h3(18)),
              ),
              _BagStepButton(icon: Icons.add, tooltip: 'Plus', onPressed: onIncrement),
              const SizedBox(width: 8),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: Text(
                    Money.formatTND(subtotalMillimes),
                    style: AppTheme.figure(26, AppTheme.red),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
