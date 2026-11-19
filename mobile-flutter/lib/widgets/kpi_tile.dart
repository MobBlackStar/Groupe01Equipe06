// 💡 Concept & Analogie : Comme une jauge d'énergie sur un tableau de bord high-tech, cette tuile condense un résultat chiffré essentiel en un coup d'œil.
// 🔄 Comparaison React / Flutter : En Flutter, `KpiTile` est un `StatelessWidget` utilisant `Container` et `BoxDecoration` avec dégradé subtil ; en React, c'est `KpiCard` avec Tailwind CSS.
// 🎯 À retenir pour la soutenance : "Composant réutilisable pour tous les écrans mobiles offrant une cohérence visuelle parfaite avec notre charte graphique Dark Obsidian."

import 'package:flutter/material.dart';

import '../app/theme.dart';
import 'griddle.dart';
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
        return AppTheme.red;
      case KpiAccent.amber:
        return AppTheme.orange;
      case KpiAccent.cyan:
        return AppTheme.ink;
      case KpiAccent.purple:
        return AppTheme.red;
      case KpiAccent.slate:
        return AppTheme.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _accentColor == AppTheme.orange ? AppTheme.orange : (_accentColor == AppTheme.red ? AppTheme.red : AppTheme.ink);
    return GCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: Text(title.toUpperCase(), style: AppTheme.label(), maxLines: 2, overflow: TextOverflow.ellipsis)),
              if (icon != null) ...[
                const SizedBox(width: 6),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: AppTheme.cream, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                  child: Icon(icon, size: 17, color: AppTheme.ink),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(value, style: AppTheme.figure(52, color)),
                if (badge != null) ...[
                  const SizedBox(width: 8),
                  Padding(padding: const EdgeInsets.only(bottom: 6), child: GPill(badge!, color: positive ? const Color(0xFFDDEFD9) : AppTheme.cream, textColor: positive ? AppTheme.leaf : AppTheme.red)),
                ],
              ],
            ),
          ),
          if (subtitle != null) ...[const SizedBox(height: 2), Text(subtitle!, style: AppTheme.body(14, AppTheme.muted), maxLines: 2, overflow: TextOverflow.ellipsis)],
        ],
      ),
    );
  }
}
