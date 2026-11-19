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
                    fontFamily: AppTheme.fontDisplay, // les prix sont des « figures » League Gothic, comme sur le site
                    color: AppTheme.red,
                    fontSize: widget.isLarge ? 52 : 36,
                    height: 1,
                    letterSpacing: 0.2,
                  ),
            ),
            if (widget.originalPriceMillimes > currentPrice) ...[
              const SizedBox(width: 8),
              Text(
                formattedOriginal,
                style: TextStyle(
                  color: widget.onCream ? AppTheme.muted : AppTheme.muted,
                  fontSize: widget.isLarge ? 18 : 14,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: widget.onCream ? AppTheme.muted : AppTheme.muted,
                ),
              ),
            ],
            if (discountPercent > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.mustard,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: AppTheme.ink, width: 2),
                ),
                child: Text(
                  '-$discountPercent%',
                  style: const TextStyle(
                    color: AppTheme.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
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
                    color: widget.onCream ? AppTheme.red : AppTheme.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'Smart Decay en direct',
                  style: TextStyle(
                    color: widget.onCream ? AppTheme.ink.withValues(alpha: 0.75) : AppTheme.red,
                    fontSize: 13,
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
