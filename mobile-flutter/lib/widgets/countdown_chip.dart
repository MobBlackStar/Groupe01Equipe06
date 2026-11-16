// 💡 Concept & Analogie : Comme l'horloge d'un chronomètre d'urgence sur tableau de bord, cette puce mobile actualise le décompte et change de couleur selon le niveau d'urgence.
// 🔄 Comparaison React / Flutter : En Flutter, ce composant utilise `Pricing.computeUrgencyColor` et `Timer.periodic` ; en React, c'est le composant `CountdownChip`.
// 🎯 À retenir pour la soutenance : "Alerte visuelle tripartite (>60m lime, 20-60m orange, <20m rouge pulsant) pour inciter les étudiants au passage à l'acte."

import 'dart:async';
import 'package:flutter/material.dart';
import '../core/domain/pricing.dart';

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

  Color _parseHexColor(String hex) {
    final clean = hex.replaceAll('#', '');
    return Color(int.parse('FF$clean', radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    final endMs = widget.pickupEndAt.millisecondsSinceEpoch;
    final diffMs = endMs - _nowMs;
    final minutesLeft = diffMs > 0 ? (diffMs / 60000).floor() : 0;
    final colorHex = Pricing.computeUrgencyColor(pickupEndMs: endMs, nowMs: _nowMs);
    final color = _parseHexColor(colorHex);

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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
