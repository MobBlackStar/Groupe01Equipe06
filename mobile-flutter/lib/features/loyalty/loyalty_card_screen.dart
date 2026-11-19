// 💡 Concept & Analogie : Carte de fidélité physique tamponnée CAMPUSSAVE CLUB en design néo-brutaliste Griddle.
// 🔄 Comparaison React / Flutter : En Flutter, la carte utilise un `CustomPaint` vectoriel pour les encoches en pointillés et une ombre dure décalée ; en React, c'est `LoyaltyCardPage.jsx` et `StampGrid.jsx`.
// 🎯 À retenir pour la soutenance : "Une métaphore physique de fidélité tactile (CAMPUSSAVE CLUB) où chaque repas sauvé appose un tampon rouge vif sur un carton ivoire texturé à bordure 2px."

import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/loyalty.dart';
import '../../core/models/loyalty_model.dart';
import '../../services/campus_api.dart';

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
  int _ecoPoints = 0;
  int _mealsRescued = 0;
  String _displayName = '';
  List<LoyaltyReward> _rewards = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// `GET /loyalty/me` : EcoPoints, repas sauvés et coupons réellement débloqués (rien n'est simulé localement).
  Future<void> _load() async {
    try {
      final loyalty = await CampusApi.shared.fetchLoyalty();
      if (!mounted) return;
      setState(() {
        _ecoPoints = loyalty.ecoPoints;
        _mealsRescued = loyalty.totalMealsRescued;
        _displayName = loyalty.displayName;
        _rewards = loyalty.rewards;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
      });
    }
  }

  String _rewardTitle(LoyaltyReward r) =>
      r.isFreeSurprise ? 'Panier Surprise 100% Offert ✨' : '-${r.percentOff ?? 10}% Réduction Immédiate';

  String _rewardSub(LoyaltyReward r) {
    final cap = r.maxDiscountMillimes;
    final capText = cap == null ? '' : 'Plafonné à ${(cap / 1000).toStringAsFixed(3).replaceAll('.', ',')} DT';
    return r.isFreeSurprise ? 'Panier mystère COMMON. $capText'.trim() : capText;
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

    // ALG-LOYALTY : tampons = floor((ecoPoints mod 100) / 20) sur 5 ; le 5e emplacement est le coupon -20 %
    const totalStamps = 5;
    final activeStamps = Loyalty.calculateStamps(_ecoPoints);
    final nextMilestone = ((_ecoPoints ~/ 100) + 1) * 100;
    final progress = (_ecoPoints % 100) / 100.0;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text(
          'CAMPUSSAVE CLUB • FIDÉLITÉ',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5, fontSize: 16),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.mustardYellow,
        backgroundColor: AppTheme.surfaceCard,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. CARTE PHYSIQUE NÉO-BRUTALISTE (CAMPUSSAVE CLUB)
              Transform.rotate(
                angle: -0.02, // Inclinaison tactile ~1.2 degré
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(right: 4, bottom: 4),
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
                  decoration: BoxDecoration(
                    color: AppTheme.warmIvory,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.deepInk, width: 2.5),
                    boxShadow: const [
                      BoxShadow(
                        color: AppTheme.deepInk,
                        offset: Offset(5, 5),
                        blurRadius: 0,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header CAMPUSSAVE CLUB
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CAMPUSSAVE CLUB',
                                style: TextStyle(
                                  color: AppTheme.deepInk,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "20 points = 1 tampon. Au 5e, le club t'offre -20 %.",
                                style: TextStyle(
                                  color: AppTheme.deepInk.withValues(alpha: 0.7),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.griddleRed,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.deepInk, width: 1.5),
                            ),
                            child: Text(
                              '$activeStamps/$totalStamps TAMPONS',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Grille des 5 emplacements : 4 tampons + le coupon -20 %
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(totalStamps, (index) => _buildStampSlot(index, activeStamps)),
                      ),

                      const SizedBox(height: 16),

                      // Pied de carte : Nom de l'étudiant et badge éco
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${(_displayName.isEmpty ? 'ÉTUDIANT ESSECT' : _displayName).toUpperCase()} • ESSECT 2026',
                            style: TextStyle(
                              color: AppTheme.deepInk.withValues(alpha: 0.65),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'monospace',
                              letterSpacing: 0.5,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.matchaEmerald.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.matchaEmerald, width: 1),
                            ),
                            child: Text(
                              '🌱 $_mealsRescued sauvés',
                              style: const TextStyle(
                                color: AppTheme.matchaEmerald,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w900,
                              ),
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
                  border: Border.all(color: Colors.white12),
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
                                color: AppTheme.mustardYellow,
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
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.mustardYellow),
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
                            color: AppTheme.mustardYellow,
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

              // 3. Portefeuille des Récompenses Vouchers (Style Néo-Brutaliste)
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
                final isAvailable = r.isAvailable;
                return Container(
                  margin: const EdgeInsets.only(bottom: 12, right: 3),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isAvailable ? AppTheme.warmIvory : AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isAvailable ? AppTheme.deepInk : Colors.white12,
                      width: isAvailable ? 2 : 1,
                    ),
                    boxShadow: isAvailable
                        ? const [
                            BoxShadow(
                              color: AppTheme.deepInk,
                              offset: Offset(3, 3),
                              blurRadius: 0,
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    children: [
                      // Badge Coupon
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: isAvailable ? AppTheme.mustardYellow : Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isAvailable ? AppTheme.deepInk : Colors.white12,
                            width: isAvailable ? 2 : 1,
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
                              _rewardTitle(r),
                              style: TextStyle(
                                color: isAvailable ? AppTheme.deepInk : AppTheme.textMuted,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _rewardSub(r),
                              style: TextStyle(
                                color: isAvailable ? AppTheme.deepInk.withValues(alpha: 0.65) : AppTheme.textMuted,
                                fontSize: 10,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              r.id,
                              style: TextStyle(
                                color: isAvailable ? AppTheme.griddleRed : AppTheme.textMuted,
                                fontSize: 10,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // État Stamp
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        decoration: BoxDecoration(
                          color: isAvailable ? AppTheme.matchaEmerald : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isAvailable ? AppTheme.deepInk : Colors.white12,
                            width: isAvailable ? 1.5 : 1,
                          ),
                        ),
                        child: Text(
                          isAvailable ? 'DISPONIBLE' : (r.status == 'LOCKED' ? 'RÉSERVÉ' : 'UTILISÉ'),
                          style: TextStyle(
                            color: isAvailable ? Colors.white : AppTheme.textMuted,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              if (_rewards.isEmpty)
                Text(
                  _error ?? 'Aucun coupon pour le moment : un coupon se débloque tous les 100 EcoPoints.',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  /// Construction d'un slot circulaire tamponné ou vierge (CAMPUSSAVE CLUB)
  Widget _buildStampSlot(int index, int activeStamps) {
    final isStamped = index < activeStamps;
    final isFreeBowl = index == 4;

    final angle = isStamped ? ((index * 7) % 15 - 7) * (math.pi / 180) : 0.0;

    return SizedBox(
      width: 54,
      height: 54,
      child: CustomPaint(
        painter: DashedCirclePainter(
          color: isStamped
              ? AppTheme.griddleRed
              : isFreeBowl
                  ? AppTheme.griddleRed.withValues(alpha: 0.7)
                  : const Color(0xFFC7BEB1),
          strokeWidth: isStamped ? 2.0 : 1.3,
          dashCount: 16,
        ),
        child: Center(
          child: Transform.rotate(
            angle: angle,
            child: isStamped
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '(((',
                        style: TextStyle(
                          color: AppTheme.griddleRed.withValues(alpha: 0.8),
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          height: 0.8,
                        ),
                      ),
                      const Icon(
                        Icons.ramen_dining_rounded,
                        color: AppTheme.griddleRed,
                        size: 26,
                      ),
                    ],
                  )
                : isFreeBowl
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '-20 %',
                            style: TextStyle(
                              color: AppTheme.griddleRed,
                              fontSize: 7.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'COUPON',
                            style: TextStyle(
                              color: AppTheme.griddleRed,
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
                          color: AppTheme.deepInk.withValues(alpha: 0.25),
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
