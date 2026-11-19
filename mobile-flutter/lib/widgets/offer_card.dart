// 💡 Concept & Analogie : Comme une étiquette de vitrine de boulangerie (grande photo, un autocollant "-51 %", le prix en gros et un bouton rouge), la carte d'offre donne envie en un coup d'œil.
// 🔄 Comparaison React / Flutter : Équivalent mobile de `OfferCard.jsx` : mêmes éléments (photo `BoxFit.cover`, pastilles, prix dégressif, bouton Réserver) construits avec les styles de `AppTheme` au lieu des classes `cs-card` / `cs-photo`.
// 🎯 À retenir pour la soutenance : "La carte mobile et la carte web sont la même maquette Griddle : photo qui remplit son cadre, texte >= 13 px, prix en League Gothic, bouton rouge à contour encre."

import 'package:flutter/material.dart';
import '../core/models/offer_model.dart';
import '../app/theme.dart';
import 'live_price_text.dart';
import 'countdown_chip.dart';
import 'rarity_badge.dart';

class OfferCard extends StatelessWidget {
  final OfferModel offer;
  final int? distanceFromEssectM;
  final VoidCallback? onTap;

  const OfferCard({
    super.key,
    required this.offer,
    this.distanceFromEssectM,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final dist = distanceFromEssectM;
    final walkingMinutes = dist == null ? null : (dist * 1.3 / 83.33).round().clamp(1, 45);
    final stock = offer.remainingQuantity;

    return Material(
      color: AppTheme.biscuit,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo qui remplit son cadre (jamais de miniature flottante dans du vide)
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (offer.photoUrl != null && offer.photoUrl!.isNotEmpty)
                    Image.network(
                      offer.photoUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const _PhotoPlaceholder(),
                    )
                  else
                    const _PhotoPlaceholder(),
                  Positioned(top: 10, right: 10, child: CountdownChip(pickupEndAt: offer.pickupEndAt)),
                  if (offer.isSurpriseBasket)
                    const Positioned(top: 10, left: 10, child: RarityBadge(rarity: 'RARE', score: 0.65)),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: _Sticker(
                      icon: Icons.shopping_bag_outlined,
                      text: stock > 1 ? '$stock restants' : '$stock restant',
                      color: AppTheme.ink,
                      textColor: AppTheme.cream,
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text((offer.merchantName ?? 'Commerce Montfleury').toUpperCase(), style: AppTheme.label(), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(
                    offer.title.toUpperCase(),
                    style: AppTheme.h3(21),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (walkingMinutes != null && distanceFromEssectM != null) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.directions_walk, size: 18, color: AppTheme.red),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            '$walkingMinutes min à pied · $distanceFromEssectM m',
                            style: AppTheme.body(14, AppTheme.muted).copyWith(fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: LivePriceText(
                          pricingType: offer.pricingType,
                          originalPriceMillimes: offer.originalPriceMillimes,
                          targetPriceMillimes: offer.targetPriceMillimes,
                          pickupStartAt: offer.pickupStartAt,
                          pickupEndAt: offer.pickupEndAt,
                          stepMillimes: offer.stepMillimes,
                          onCream: true,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        decoration: AppTheme.pill(color: AppTheme.red),
                        child: Text(
                          'RÉSERVER',
                          style: AppTheme.h3(16, AppTheme.cream).copyWith(letterSpacing: 0.8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotoPlaceholder extends StatelessWidget {
  const _PhotoPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.sand,
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.restaurant_menu, size: 44, color: AppTheme.muted),
          const SizedBox(height: 6),
          Text('CAMPUSSAVE · ANTI-GASPI', style: AppTheme.label()),
        ],
      ),
    );
  }
}

/// Autocollant : fond plein, contour encre (équivalent de `cs-pill`).
class _Sticker extends StatelessWidget {
  final IconData? icon;
  final String text;
  final Color color;
  final Color textColor;

  const _Sticker({this.icon, required this.text, this.color = AppTheme.mustard, this.textColor = AppTheme.ink});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: AppTheme.pill(color: color),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 15, color: textColor), const SizedBox(width: 5)],
          Text(text, style: AppTheme.body(13, textColor).copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
