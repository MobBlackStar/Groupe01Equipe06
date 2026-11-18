// 💡 Concept & Analogie : Carte de fidélité physique tamponnée inspirée de StreetWok Bowl Club (image9.png), avec encoches circulaires en pointillés et tampons encreurs rouges.
// 🔄 Comparaison React / Flutter : En Flutter, les cercles pointillés sont peints via un `CustomPainter` vectoriel et la carte est inclinée via `Transform.rotate` ; en React, c'est `LoyaltyCardPage.jsx` et `StampGrid.jsx`.
// 🎯 À retenir pour la soutenance : "Une métaphore physique de fidélité tactile (Bowl Club) où chaque repas sauvé appose un tampon rouge vif sur un carton crème texturé."

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../app/theme.dart';

/// Peintre vectoriel pour cercles en pointillés réguliers
class DashedCirclePainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final int dashCount;

  const DashedCirclePainter({
    required this.color,
    this.strokeWidth = 1.5,
    this.dashCount = 18,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    const totalAngle = 2 * math.pi;
    final sweepAngle = (totalAngle / dashCount) * 0.55;
    final gapAngle = (totalAngle / dashCount) * 0.45;

    for (int i = 0; i < dashCount; i++) {
      final startAngle = i * (sweepAngle + gapAngle);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant DashedCirclePainter oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.strokeWidth != strokeWidth ||
      oldDelegate.dashCount != dashCount;
}

class LoyaltyCardScreen extends StatefulWidget {
  const LoyaltyCardScreen({super.key});

  @override
  State<LoyaltyCardScreen> createState() => _LoyaltyCardScreenState();
}

class _LoyaltyCardScreenState extends State<LoyaltyCardScreen> {
  int _ecoPoints = 240;
  int _mealsRescued = 12;

  final List<Map<String, dynamic>> _rewards = [
    {
      'id': 'rw-1',
      'title': '-20% Réduction Immédiate',
      'sub': 'Plafonné à 2,000 DT sur commande Montfleury',
      'milestone': 100,
      'status': 'USED',
      'code': 'CS-ECO-100',
    },
    {
      'id': 'rw-2',
      'title': '-20% Réduction Immédiate',
      'sub': 'Plafonné à 2,000 DT sur commande Montfleury',
      'milestone': 200,
      'status': 'AVAILABLE',
      'code': 'CS-ECO-200',
    },
  ];

  void _addPoints(int amount) {
    setState(() {
      _ecoPoints += amount;
      if (amount == 20) _mealsRescued += 1;
      if (_ecoPoints >= 300 && !_rewards.any((r) => r['milestone'] == 300)) {
        _rewards.add({
          'id': 'rw-3',
          'title': 'Panier Surprise 100% Offert ✨',
          'sub': 'Offert jusqu à 4,000 DT sur un panier mystère',
          'milestone': 300,
          'status': 'AVAILABLE',
          'code': 'CS-MYST-300',
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Calcul palier écologique
    String tierLabel = 'Graine';
    String tierIcon = '🌱';
    if (_ecoPoints >= 600) {
      tierLabel = 'Forêt';
      tierIcon = '🌲';
    } else if (_ecoPoints >= 300) {
      tierLabel = 'Arbre';
      tierIcon = '🌳';
    } else if (_ecoPoints >= 100) {
      tierLabel = 'Pousse';
      tierIcon = '🌿';
    }

    const totalStamps = 10;
    final activeStamps = ((_ecoPoints ~/ 20) % totalStamps);
    final nextMilestone = ((_ecoPoints ~/ 100) + 1) * 100;
    final progress = (_ecoPoints % 100) / 100.0;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text(
          'CARTE FIDÉLITÉ • BOWL CLUB',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5, fontSize: 16),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. CARTE PHYSIQUE TAMPONNÉE (Inspirée de image9.png - StreetWok Bowl Club)
              Transform.rotate(
                angle: -0.025, // Inclinée de ~1.5 degré pour un réalisme physique
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
                  decoration: BoxDecoration(
                    color: AppTheme.warmCream,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 18,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header de la carte physique
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'BOWL CLUB',
                                style: TextStyle(
                                  color: AppTheme.deepEspresso,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '1 tampon par plat sauvé. Le 10ème est offert.',
                                style: TextStyle(
                                  color: AppTheme.deepEspresso.withValues(alpha: 0.7),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.streetFlameRed.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '$activeStamps/$totalStamps TAMPONS',
                              style: const TextStyle(
                                color: AppTheme.streetFlameRed,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Grille des 10 encoches de tampons (2 rangées de 5)
                      Column(
                        children: [
                          // Rangée 1 : Tampons 1 à 5
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(5, (index) => _buildStampSlot(index, activeStamps)),
                          ),
                          const SizedBox(height: 14),
                          // Rangée 2 : Tampons 6 à 10 (10 = Repas Offert)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(5, (index) => _buildStampSlot(index + 5, activeStamps)),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Pied de carte : Nom de l'étudiant et badge éco
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'YASSINE TRABELSI • ESSECT 2026',
                            style: TextStyle(
                              color: AppTheme.deepEspresso.withValues(alpha: 0.55),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'monospace',
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            '🌱 $_mealsRescued sauvés',
                            style: const TextStyle(
                              color: AppTheme.matchaEmerald,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 26),

              // 2. Progression vers le Palier Suivant
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(tierIcon, style: const TextStyle(fontSize: 20)),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Palier Éco-Actuel',
                                  style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
                                ),
                                Text(
                                  tierLabel,
                                  style: const TextStyle(
                                    color: AppTheme.warmCream,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Solde EcoPoints', style: TextStyle(color: AppTheme.textMuted, fontSize: 10)),
                            Text(
                              '$_ecoPoints pts',
                              style: const TextStyle(
                                color: AppTheme.mustardGold,
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.white10,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.mustardGold),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Prochain palier à $nextMilestone pts',
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 10.5),
                        ),
                        Text(
                          '${((1 - progress) * 100).round()} pts restants',
                          style: const TextStyle(
                            color: AppTheme.mustardGold,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. Portefeuille des Récompenses Vouchers (Style Tickets Perforés)
              const Text(
                'COUPONS & TICKETS GAGNÉS',
                style: TextStyle(
                  color: AppTheme.warmCream,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 12),
              ..._rewards.map((r) {
                final isAvailable = r['status'] == 'AVAILABLE';
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isAvailable ? AppTheme.mustardGold.withValues(alpha: 0.5) : AppTheme.borderColor,
                    ),
                  ),
                  child: Row(
                    children: [
                      // Badge Coupon
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isAvailable
                              ? AppTheme.mustardGold.withValues(alpha: 0.15)
                              : Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isAvailable ? AppTheme.mustardGold : Colors.white12,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            isAvailable ? '🎟️' : '✓',
                            style: const TextStyle(fontSize: 22),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),

                      // Détails du Coupon
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r['title'] as String,
                              style: TextStyle(
                                color: isAvailable ? AppTheme.warmCream : AppTheme.textMuted,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              r['sub'] as String,
                              style: const TextStyle(color: AppTheme.textMuted, fontSize: 10),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              r['code'] as String? ?? 'CS-ECO',
                              style: TextStyle(
                                color: isAvailable ? AppTheme.mustardGold : AppTheme.textMuted,
                                fontSize: 10,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // État Stamp
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        decoration: BoxDecoration(
                          color: isAvailable
                              ? AppTheme.matchaEmerald.withValues(alpha: 0.18)
                              : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isAvailable ? AppTheme.matchaEmerald : Colors.white12,
                          ),
                        ),
                        child: Text(
                          isAvailable ? 'DISPONIBLE' : 'UTILISÉ',
                          style: TextStyle(
                            color: isAvailable ? AppTheme.matchaEmerald : AppTheme.textMuted,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 18),

              // 4. Banc de Démo Live (Soutenance)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.bolt, color: AppTheme.mustardGold, size: 16),
                        SizedBox(width: 6),
                        Text(
                          'Banc de Démo Live (Soutenance) :',
                          style: TextStyle(
                            color: AppTheme.mustardGold,
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _addPoints(20),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.streetFlameRed),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text(
                              '+20 pts (Tamponner)',
                              style: TextStyle(
                                color: AppTheme.streetFlameRed,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _addPoints(60),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.mustardGold),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text(
                              'Franchir 300 pts ✨',
                              style: TextStyle(
                                color: AppTheme.mustardGold,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
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
    );
  }

  /// Construction d'un slot circulaire tamponné ou vierge (Style Bowl Club image9.png)
  Widget _buildStampSlot(int index, int activeStamps) {
    final isStamped = index < activeStamps;
    final isFreeBowl = index == 9;

    // Légère rotation aléatoire pour le rendu "tampon encreur manuel"
    final angle = isStamped ? ((index * 7) % 15 - 7) * (math.pi / 180) : 0.0;

    return SizedBox(
      width: 54,
      height: 54,
      child: CustomPaint(
        painter: DashedCirclePainter(
          color: isStamped
              ? AppTheme.streetFlameRed
              : isFreeBowl
                  ? AppTheme.streetFlameRed.withValues(alpha: 0.6)
                  : const Color(0xFFC7BEB1),
          strokeWidth: isStamped ? 1.8 : 1.3,
          dashCount: 16,
        ),
        child: Center(
          child: Transform.rotate(
            angle: angle,
            child: isStamped
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Bol fumant rouge avec vapeur
                      Text(
                        '(((',
                        style: TextStyle(
                          color: AppTheme.streetFlameRed.withValues(alpha: 0.8),
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          height: 0.8,
                        ),
                      ),
                      const Icon(
                        Icons.ramen_dining_rounded,
                        color: AppTheme.streetFlameRed,
                        size: 26,
                      ),
                    ],
                  )
                : isFreeBowl
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'REPAS',
                            style: TextStyle(
                              color: AppTheme.streetFlameRed,
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'OFFERT',
                            style: TextStyle(
                              color: AppTheme.streetFlameRed,
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      )
                    : Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: AppTheme.deepEspresso.withValues(alpha: 0.25),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
          ),
        ),
      ),
    );
  }
}
