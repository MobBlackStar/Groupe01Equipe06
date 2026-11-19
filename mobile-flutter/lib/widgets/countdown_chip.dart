// 💡 Concept & Analogie : Comme l'horloge d'un chronomètre d'urgence sur tableau de bord, cette puce mobile actualise le décompte et change de couleur selon le niveau d'urgence.
// 🔄 Comparaison React / Flutter : En Flutter, ce composant utilise `Pricing.computeUrgencyColor` et `Timer.periodic` ; en React, c'est le composant `CountdownChip`.
// 🎯 À retenir pour la soutenance : "Alerte visuelle tripartite (>60m lime, 20-60m orange, <20m rouge pulsant) pour inciter les étudiants au passage à l'acte."

import 'dart:async';
import 'package:flutter/material.dart';
import '../core/domain/pricing.dart';
import '../app/theme.dart';

class CountdownChip extends StatefulWidget {
  final DateTime pickupEndAt;

  const CountdownChip({
    super.key,
    required this.pickupEndAt,
  });

  @override
  State<CountdownChip> createState() => _CountdownChipState();
}

class _CountdownChipState extends State<CountdownChip> {
  Timer? _timer;
  late int _nowMs;

  @override
  void initState() {
    super.initState();
    _nowMs = DateTime.now().millisecondsSinceEpoch;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _nowMs = DateTime.now().millisecondsSinceEpoch;
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
    final endMs = widget.pickupEndAt.millisecondsSinceEpoch;
    final diffMs = endMs - _nowMs;
    final minutesLeft = diffMs > 0 ? (diffMs / 60000).floor() : 0;
    final colorHex = Pricing.computeUrgencyColor(pickupEndMs: endMs, nowMs: _nowMs);
    final color = AppTheme.urgencyFromApi(colorHex); // l'API émet du néon : traduit en moutarde / orange / rouge Griddle

    String label;
    if (minutesLeft <= 0) {
      label = 'Clôturé';
    } else if (minutesLeft >= 60) {
      final h = minutesLeft ~/ 60;
      final m = minutesLeft % 60;
      label = '${h}h${m > 0 ? m.toString().padLeft(2, '0') : ''} restant';
    } else {
      label = '$minutesLeft min';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: AppTheme.pill(color: AppTheme.cream),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.ink, width: 1.5),
            ),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: AppTheme.body(13, AppTheme.ink).copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
