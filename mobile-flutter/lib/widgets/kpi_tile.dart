// 💡 Concept & Analogie : Comme une jauge d'énergie sur un tableau de bord high-tech, cette tuile condense un résultat chiffré essentiel en un coup d'œil.
// 🔄 Comparaison React / Flutter : En Flutter, `KpiTile` est un `StatelessWidget` utilisant `Container` et `BoxDecoration` avec dégradé subtil ; en React, c'est `KpiCard` avec Tailwind CSS.
// 🎯 À retenir pour la soutenance : "Composant réutilisable pour tous les écrans mobiles offrant une cohérence visuelle parfaite avec notre charte graphique Dark Obsidian."

import 'package:flutter/material.dart';

enum KpiAccent { lime, amber, cyan, purple, slate }

class KpiTile extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  final KpiAccent accent;
  final String? badge;
  final bool positive;
  final VoidCallback? onTap;

  const KpiTile({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.icon,
    this.accent = KpiAccent.lime,
    this.badge,
    this.positive = true,
    this.onTap,
  });

  Color get _accentColor {
    switch (accent) {
      case KpiAccent.lime:
        return const Color(0xFFCCFF00);
      case KpiAccent.amber:
        return const Color(0xFFFF5500);
      case KpiAccent.cyan:
        return const Color(0xFF00E5FF);
      case KpiAccent.purple:
        return const Color(0xFFA855F7);
      case KpiAccent.slate:
        return const Color(0xFF94A3B8);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _accentColor;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161920),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withOpacity(0.08),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (icon != null)
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(icon, color: color, size: 16),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                      color: color,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  if (badge != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: (positive ? Colors.green : Colors.red).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        badge!,
                        style: TextStyle(
                          color: positive ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
