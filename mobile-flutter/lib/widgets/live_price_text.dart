// 💡 Concept & Analogie : Comme le compteur digital d'une pompe à essence ou un panneau boursier, ce composant mobile recalcule chaque seconde le cours exact du repas sauvé.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `Timer.periodic` dans un `StatefulWidget` pour déclencher `setState` toutes les 1 000 ms sans reconstruire toute la page ; en React, c'est l'équivalent direct de `PriceTicker`.
// 🎯 À retenir pour la soutenance : "L'animation de dégressivité continue sur smartphone garantit une expérience utilisateur dynamique à la seconde près, avec un rafraîchissement économe en batterie."

import 'dart:async';
import 'package:flutter/material.dart';
import '../core/domain/pricing.dart';
import '../core/domain/money.dart';
import '../core/time/server_clock.dart';
import '../app/theme.dart';

class LivePriceText extends StatefulWidget {
  final String pricingType; // 'FIXED' ou 'DUTCH' / 'DUTCH_AUCTION'
  final int originalPriceMillimes;
  final int targetPriceMillimes;
  final int? startPriceMillimes;
  final DateTime pickupStartAt;
  final DateTime pickupEndAt;
  final int stepMillimes;
  final TextStyle? priceStyle;
  final bool isLarge;
  final bool onCream;

  const LivePriceText({
    super.key,
    required this.pricingType,
    required this.originalPriceMillimes,
    required this.targetPriceMillimes,
    this.startPriceMillimes,
    required this.pickupStartAt,
    required this.pickupEndAt,
    this.stepMillimes = 100,
    this.priceStyle,
    this.isLarge = false,
    this.onCream = false,
  });

  @override
  State<LivePriceText> createState() => _LivePriceTextState();
}

class _LivePriceTextState extends State<LivePriceText> {
  Timer? _timer;
  late int _nowMs;

  @override
  void initState() {
    super.initState();
    _nowMs = ServerClock.serverNowMs;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _nowMs = ServerClock.serverNowMs;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDutch = widget.pricingType == 'DUTCH' ||
        widget.pricingType == Pricing.modeDutchAuction;

    final currentPrice = Pricing.computeUnitPrice(
      mode: isDutch ? Pricing.modeDutchAuction : Pricing.modeFixed,
      discountedPriceMillimes: widget.targetPriceMillimes,
      startPriceMillimes: widget.startPriceMillimes ?? widget.originalPriceMillimes,
      floorPriceMillimes: widget.targetPriceMillimes,
      decayStartMs: widget.pickupStartAt.millisecondsSinceEpoch,
      pickupEndMs: widget.pickupEndAt.millisecondsSinceEpoch,
      roundingStepMillimes: widget.stepMillimes,
      nowMs: _nowMs,
    );

    final discountPercent = widget.originalPriceMillimes > currentPrice && widget.originalPriceMillimes > 0
        ? (((widget.originalPriceMillimes - currentPrice) / widget.originalPriceMillimes) * 100).round()
        : 0;

    final formattedPrice = Money.formatTND(currentPrice);
    final formattedOriginal = Money.formatTND(widget.originalPriceMillimes);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              formattedPrice,
              style: widget.priceStyle ??
                  TextStyle(
                    color: widget.onCream ? AppTheme.deepInk : AppTheme.limeAccent,
                    fontSize: widget.isLarge ? 28 : 17,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
            ),
            if (widget.originalPriceMillimes > currentPrice) ...[
              const SizedBox(width: 8),
              Text(
                formattedOriginal,
                style: TextStyle(
                  color: widget.onCream ? const Color(0xFF8C857B) : Colors.white38,
                  fontSize: widget.isLarge ? 16 : 12,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: widget.onCream ? const Color(0xFF8C857B) : Colors.white38,
                ),
              ),
            ],
            if (discountPercent > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.griddleRed.withValues(alpha: widget.onCream ? 0.12 : 0.2),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppTheme.griddleRed.withValues(alpha: widget.onCream ? 0.35 : 0.4)),
                ),
                child: Text(
                  '-$discountPercent%',
                  style: const TextStyle(
                    color: AppTheme.griddleRed,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        if (isDutch)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: widget.onCream ? AppTheme.griddleRed : AppTheme.limeAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'Smart Decay en direct',
                  style: TextStyle(
                    color: widget.onCream ? AppTheme.deepInk.withValues(alpha: 0.75) : AppTheme.limeAccent,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
