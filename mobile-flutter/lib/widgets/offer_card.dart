// 💡 Concept & Analogie : Ticket de commande suspendu à bordure dentelée (StreetWok), évoquant un ticket de cuisine physique en papier chaud (#F5EFE6) avec encre espresso (#161412).
// 🔄 Comparaison React / Flutter : En Flutter, le ticket est découpé avec un `SerratedTicketClipper` et décoré avec un clip métallique ; en React, c'est l'équivalent de `OfferCard.jsx` avec `.ticket-serrated-edge`.
// 🎯 À retenir pour la soutenance : "Ce ticket physique suspendu matérialise l'urgence du sauvetage alimentaire avec un ticker de prix dégressif en temps réel et une découpe crantée distinctive."

import 'package:flutter/material.dart';
import '../core/models/offer_model.dart';
import '../app/theme.dart';
import 'live_price_text.dart';
import 'countdown_chip.dart';
import 'rarity_badge.dart';

/// Découpe crantée zig-zag (serrated ticket edge) pour le bas du ticket
class SerratedTicketClipper extends CustomClipper<Path> {
  final double toothWidth;
  final double toothHeight;
  final double borderRadius;

  const SerratedTicketClipper({
    this.toothWidth = 10.0,
    this.toothHeight = 6.0,
    this.borderRadius = 16.0,
  });

  @override
  Path getClip(Size size) {
    final path = Path();
    final r = borderRadius;

    // Coins arrondis en haut
    path.moveTo(0, r);
    path.quadraticBezierTo(0, 0, r, 0);
    path.lineTo(size.width - r, 0);
    path.quadraticBezierTo(size.width, 0, size.width, r);

    // Bord droit descendant jusqu'à l'amorce des dents
    path.lineTo(size.width, size.height - toothHeight);

    // Découpe dentelée du bas (de droite à gauche)
    final teethCount = (size.width / toothWidth).floor();
    final actualToothWidth = size.width / teethCount;

    for (int i = teethCount; i > 0; i--) {
      final x1 = (i - 0.5) * actualToothWidth;
      final y1 = size.height;
      final x2 = (i - 1) * actualToothWidth;
      final y2 = size.height - toothHeight;
      path.lineTo(x1, y1);
      path.lineTo(x2, y2);
    }

    // Bord gauche remontant
    path.lineTo(0, r);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Clip métallique de suspension StreetWok
          Center(
            child: Container(
              width: 36,
              height: 7,
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF33302C),
                borderRadius: BorderRadius.circular(3),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black45,
                    blurRadius: 3,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 14,
                  height: 2,
                  decoration: BoxDecoration(
                    color: const Color(0xFF6B665F),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
            ),
          ),

          // Corps du ticket cranté en papier crème
          ClipPath(
            clipper: const SerratedTicketClipper(toothWidth: 10, toothHeight: 7, borderRadius: 16),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.warmCream,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Zone Image avec overlays
                  Stack(
                    children: [
                      Container(
                        height: 140,
                        width: double.infinity,
                        color: const Color(0xFF262320),
                        child: offer.photoUrl != null && offer.photoUrl!.isNotEmpty
                            ? Image.network(
                                offer.photoUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                              )
                            : _buildPlaceholder(),
                      ),
                      // Badge Temps Restant
                      Positioned(
                        top: 10,
                        right: 10,
                        child: CountdownChip(pickupEndAt: offer.pickupEndAt),
                      ),
                      // Badge Panier Surprise
                      if (offer.isSurpriseBasket)
                        const Positioned(
                          top: 10,
                          left: 10,
                          child: RarityBadge(rarity: 'RARE', score: 0.65),
                        ),
                      // Badge Stock restant
                      Positioned(
                        bottom: 8,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.deepEspresso.withValues(alpha: 0.88),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '📦 ${offer.remainingQuantity} restant${offer.remainingQuantity > 1 ? 's' : ''}',
                            style: const TextStyle(
                              color: AppTheme.warmCream,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Détails textuels en typographie espresso
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Ligne Commerce & Distance piétonne ESSECT
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                (offer.merchantName ?? 'Commerce Montfleury').toUpperCase(),
                                style: TextStyle(
                                  color: AppTheme.deepEspresso.withValues(alpha: 0.65),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '📍 $distanceFromEssectM m (~$walkingMinutes min)',
                              style: const TextStyle(
                                color: AppTheme.streetFlameRed,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),

                        // Titre de l'offre en Deep Espresso percutant
                        Text(
                          offer.title,
                          style: const TextStyle(
                            color: AppTheme.deepEspresso,
                            fontSize: 14.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.2,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 10),

                        // Séparateur pointillé StreetWok
                        Row(
                          children: List.generate(
                            26,
                            (index) => Expanded(
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                height: 1.5,
                                color: index % 2 == 0
                                    ? const Color(0xFFC7BEB1)
                                    : Colors.transparent,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 10),

                        // Prix direct dégressif & CTA Réserver
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
                              onCream: true,
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(
                                color: AppTheme.deepEspresso,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 4,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Text(
                                'RÉSERVER',
                                style: TextStyle(
                                  color: AppTheme.warmCream,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.5,
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
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFF262320),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🥪', style: TextStyle(fontSize: 36)),
            const SizedBox(height: 4),
            Text(
              'CampusSave Anti-Gaspi',
              style: TextStyle(
                color: AppTheme.warmCream.withValues(alpha: 0.5),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
