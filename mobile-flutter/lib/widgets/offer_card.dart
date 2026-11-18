// 💡 Concept & Analogie : Ticket néo-brutaliste Griddle suspendu à bordure crantée, en carton Warm Ivory (#FAF6EE), bordure 2px Deep Ink (#141210) et ombre dure portée.
// 🔄 Comparaison React / Flutter : En Flutter, le ticket utilise `NeoBrutalSerratedPainter` et `SerratedTicketClipper` ; en React, c'est l'équivalent de `OfferCard.jsx` avec `.ticket-serrated-edge` et `shadow-[4px_4px_0px_#141210]`.
// 🎯 À retenir pour la soutenance : "Design néo-brutaliste Griddle à fort contraste visuel : découpe thermique crantée, ombre dure sans flou et bouton percutant Griddle Red."

import 'package:flutter/material.dart';
import '../core/models/offer_model.dart';
import '../app/theme.dart';
import 'live_price_text.dart';
import 'countdown_chip.dart';
import 'rarity_badge.dart';

Path buildSerratedPath(Size size, double toothWidth, double toothHeight, double r) {
  final path = Path();
  // Coins supérieurs arrondis
  path.moveTo(0, r);
  path.quadraticBezierTo(0, 0, r, 0);
  path.lineTo(size.width - r, 0);
  path.quadraticBezierTo(size.width, 0, size.width, r);

  // Bord droit jusqu'aux crans
  path.lineTo(size.width, size.height - toothHeight);

  // Découpe crantée en bas (droite à gauche)
  final teethCount = (size.width / toothWidth).floor().clamp(4, 100);
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

class SerratedTicketClipper extends CustomClipper<Path> {
  final double toothWidth;
  final double toothHeight;
  final double borderRadius;

  const SerratedTicketClipper({
    this.toothWidth = 10.0,
    this.toothHeight = 7.0,
    this.borderRadius = 14.0,
  });

  @override
  Path getClip(Size size) => buildSerratedPath(size, toothWidth, toothHeight, borderRadius);

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class NeoBrutalSerratedPainter extends CustomPainter {
  final double toothWidth;
  final double toothHeight;
  final double borderRadius;
  final Color fillColor;
  final Color strokeColor;
  final double strokeWidth;
  final Offset shadowOffset;

  const NeoBrutalSerratedPainter({
    this.toothWidth = 10.0,
    this.toothHeight = 7.0,
    this.borderRadius = 14.0,
    this.fillColor = AppTheme.warmIvory,
    this.strokeColor = AppTheme.deepInk,
    this.strokeWidth = 2.0,
    this.shadowOffset = const Offset(4, 4),
  });

  @override
  void paint(Canvas canvas, Size size) {
    final path = buildSerratedPath(size, toothWidth, toothHeight, borderRadius);

    // 1. Ombre dure néo-brutaliste (sans flou)
    canvas.save();
    canvas.translate(shadowOffset.dx, shadowOffset.dy);
    final shadowPaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, shadowPaint);
    canvas.restore();

    // 2. Remplissage papier ivoire chaud
    final fillPaint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, fillPaint);

    // 3. Bordure franche 2px Deep Ink
    final strokePaint = Paint()
      ..color = strokeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant NeoBrutalSerratedPainter oldDelegate) => false;
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
          // Clip métallique Griddle au sommet
          Center(
            child: Container(
              width: 38,
              height: 8,
              margin: const EdgeInsets.only(bottom: 3),
              decoration: BoxDecoration(
                color: AppTheme.deepInk,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white24, width: 1),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black38,
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 14,
                  height: 2,
                  decoration: BoxDecoration(
                    color: AppTheme.mustardYellow,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
            ),
          ),

          // Corps du ticket néo-brutaliste avec crantage zig-zag et ombre dure 4px
          Padding(
            padding: const EdgeInsets.only(right: 4, bottom: 4),
            child: CustomPaint(
              painter: const NeoBrutalSerratedPainter(
                toothWidth: 10,
                toothHeight: 7,
                borderRadius: 14,
                fillColor: AppTheme.warmIvory,
                strokeColor: AppTheme.deepInk,
                strokeWidth: 2.0,
                shadowOffset: Offset(4, 4),
              ),
              child: ClipPath(
                clipper: const SerratedTicketClipper(toothWidth: 10, toothHeight: 7, borderRadius: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Zone Image avec overlays
                    Stack(
                      children: [
                        Container(
                          height: 140,
                          width: double.infinity,
                          decoration: const BoxDecoration(
                            color: Color(0xFF201D1A),
                            border: Border(bottom: BorderSide(color: AppTheme.deepInk, width: 2)),
                          ),
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
                        // Badge Portions restantes (Griddle Deep Ink)
                        Positioned(
                          bottom: 8,
                          left: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.deepInk,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.white24, width: 1),
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

                    // Détails textuels en typographie Deep Ink
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 12, 14, 16),
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
                                    color: AppTheme.deepInk.withValues(alpha: 0.65),
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.mustardYellow.withValues(alpha: 0.25),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: AppTheme.deepInk, width: 1),
                                ),
                                child: Text(
                                  '📍 $distanceFromEssectM m (~$walkingMinutes min)',
                                  style: const TextStyle(
                                    color: AppTheme.deepInk,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 5),

                          // Titre de l'offre
                          Text(
                            offer.title,
                            style: const TextStyle(
                              color: AppTheme.deepInk,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),

                          const SizedBox(height: 10),

                          // Séparateur pointillé Griddle
                          Row(
                            children: List.generate(
                              26,
                              (index) => Expanded(
                                child: Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                  height: 2,
                                  color: index % 2 == 0 ? AppTheme.deepInk : Colors.transparent,
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
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: AppTheme.neoBrutalButton(
                                  backgroundColor: AppTheme.griddleRed,
                                  borderColor: AppTheme.deepInk,
                                  borderWidth: 2.0,
                                  radius: 8.0,
                                  shadowOffset: const Offset(2.5, 2.5),
                                ),
                                child: const Text(
                                  'RÉSERVER',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11.5,
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
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFF201D1A),
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
