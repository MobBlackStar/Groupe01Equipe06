// 💡 Concept & Analogie : Comme les gemmes précieuses d'une quête dans un jeu de rôle, ce badge mobile indique la rareté et l'attrait mystère d'un panier anti-gaspillage.
// 🔄 Comparaison React / Flutter : En Flutter, nous composons un `Container` avec un dégradé linéaire (`LinearGradient`) et des bordures semi-transparentes ; en React, nous utilisons des classes utilitaires Tailwind.
// 🎯 À retenir pour la soutenance : "Trois échelons de rareté (COMMON, RARE, LEGENDARY) calculés à partir de la réduction et de la notoriété du restaurant."

import 'package:flutter/material.dart';

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
    Color startColor;
    Color endColor;
    Color textColor;
    Color borderColor;
    String label;
    String icon;

    switch (rarity.toUpperCase()) {
      case 'LEGENDARY':
        startColor = const Color(0x33FFB300);
        endColor = const Color(0x55FFA000);
        textColor = const Color(0xFFFFD54F);
        borderColor = const Color(0x99FFC107);
        label = 'Légendaire';
        icon = '✨';
        break;
      case 'RARE':
        startColor = const Color(0x3300E5FF);
        endColor = const Color(0x550288D1);
        textColor = const Color(0xFF80D8FF);
        borderColor = const Color(0x9900E5FF);
        label = 'Rare';
        icon = '💎';
        break;
      case 'COMMON':
      default:
        startColor = const Color(0x3378909C);
        endColor = const Color(0x55455A64);
        textColor = const Color(0xFFCFD8DC);
        borderColor = const Color(0x66B0BEC5);
        label = 'Commun';
        icon = '🎁';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [startColor, endColor]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 10)),
          const SizedBox(width: 4),
          Text(
            'Panier $label',
            style: TextStyle(
              color: textColor,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (score != null) ...[
            const SizedBox(width: 3),
            Text(
              '(${(score! * 100).round()}%)',
              style: TextStyle(
                color: textColor.withOpacity(0.7),
                fontSize: 9,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
