// 💡 Concept & Analogie : Carte de présentation compacte d'un sauvetage alimentaire, conçue pour être consultée rapidement entre deux cours sur smartphone.
// 🔄 Comparaison React / Flutter : En Flutter, la carte utilise un `InkWell` tactile avec des bordures `Border.all` réactives à l'urgence ; en React, c'est le composant `OfferCard.jsx`.
// 🎯 À retenir pour la soutenance : "Chaque carte synthétise les critères de décision clés pour l'étudiant : distance piétonne depuis l'ESSECT, prix en direct et temps restant."

import 'package:flutter/material.dart';
import '../core/models/offer_model.dart';
import '../app/theme.dart';
import 'live_price_text.dart';
import 'countdown_chip.dart';
import 'rarity_badge.dart';

class OfferCard extends StatelessWidget {
  final OfferModel offer;
  final int distanceFromEssectM;
  final VoidCallback? onTap;

  const OfferCard({
    super.key,
    required this.offer,
    this.distanceFromEssectM = 220,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final walkingMinutes = (distanceFromEssectM * 1.3 / 83.33).round().clamp(1, 45);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Zone Image avec overlays
            Stack(
              children: [
                Container(
                  height: 140,
                  width: double.infinity,
                  color: const Color(0xFF1E222D),
                  child: offer.photoUrl != null && offer.photoUrl!.isNotEmpty
                      ? Image.network(
                          offer.photoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                        )
                      : _buildPlaceholder(),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: CountdownChip(pickupEndAt: offer.pickupEndAt),
                ),
                if (offer.isSurpriseBasket)
                  const Positioned(
                    top: 10,
                    left: 10,
                    child: RarityBadge(rarity: 'RARE', score: 0.65),
                  ),
                Positioned(
                  bottom: 8,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.75),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '📦 ${offer.remainingQuantity} restant${offer.remainingQuantity > 1 ? 's' : ''}',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),

            // Détails textuels
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          offer.merchantName ?? 'Commerce Montfleury',
                          style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        '📍 $distanceFromEssectM m (~$walkingMinutes min)',
                        style: const TextStyle(color: AppTheme.limeAccent, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    offer.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      LivePriceText(
                        pricingType: offer.pricingType,
                        originalPriceMillimes: offer.originalPriceMillimes,
                        targetPriceMillimes: offer.targetPriceMillimes,
                        pickupStartAt: offer.pickupStartAt,
                        pickupEndAt: offer.pickupEndAt,
                        stepMillimes: offer.stepMillimes,
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.limeAccent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Réserver',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
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

  Widget _buildPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Text('🥪', style: TextStyle(fontSize: 36)),
          SizedBox(height: 4),
          Text('CampusSave Anti-Gaspi', style: TextStyle(color: Colors.white38, fontSize: 10)),
        ],
      ),
    );
  }
}
