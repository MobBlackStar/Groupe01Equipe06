// 💡 Concept & Analogie : Comme l'autocollant de couleur sur une boîte-surprise ("RARE", "LÉGENDAIRE"), ce badge indique d'un coup d'œil l'attrait d'un panier mystère.
// 🔄 Comparaison React / Flutter : Équivalent de `RarityBadge.jsx` : une pastille `cs-pill` à contour encre, sans dégradé ni transparence.
// 🎯 À retenir pour la soutenance : "Trois échelons de rareté (COMMUN, RARE, LÉGENDAIRE) calculés à partir de la réduction et de la notoriété ; chacun a sa couleur Griddle, jamais de néon."

import 'package:flutter/material.dart';

import '../app/theme.dart';

class RarityBadge extends StatelessWidget {
  final String rarity; // 'COMMON', 'RARE', 'LEGENDARY'
  final double? score;

  const RarityBadge({
    super.key,
    required this.rarity,
    this.score,
  });

  @override
  Widget build(BuildContext context) {
    final Color fill;
    final Color text;
    final String label;
    final IconData icon;

    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        fill = AppTheme.ink;
        text = AppTheme.mustard;
        label = 'Légendaire';
        icon = Icons.auto_awesome;
        break;
      case 'RARE':
        fill = AppTheme.mustard;
        text = AppTheme.ink;
        label = 'Rare';
        icon = Icons.diamond_outlined;
        break;
      case 'COMMON':
      default:
        fill = AppTheme.cream;
        text = AppTheme.ink;
        label = 'Commun';
        icon = Icons.card_giftcard;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: AppTheme.pill(color: fill),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: text),
          const SizedBox(width: 5),
          Text(
            'Panier $label${score != null ? ' ${(score! * 100).round()}%' : ''}',
            style: AppTheme.body(13, text).copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
