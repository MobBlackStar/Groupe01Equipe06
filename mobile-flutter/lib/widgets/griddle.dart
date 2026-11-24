// 💡 Concept & Analogie : Comme la boîte de pièces d'un jeu de construction (carte, autocollant, bouton rouge, ruban défilant), ce fichier contient toutes les briques visuelles Griddle ; un écran les assemble au lieu de dessiner ses propres rectangles.
// 🔄 Comparaison React / Flutter : Équivalent du kit `components/ui` + des classes `cs-*` du site web (`cs-card`, `cs-pill`, `cs-sticker`, `cs-btn`, `cs-display`, `cs-ticker`) : mêmes noms d'usage, mêmes proportions.
// 🎯 À retenir pour la soutenance : "Mobile et web partagent le même vocabulaire de composants : un écran Flutter se lit comme une page React (en-tête eyebrow + titre display, cartes biscuit, autocollants, bouton rouge à contour encre)."

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../app/theme.dart';

// ---------------------------------------------------------------------------------------------
// Cartes et pastilles
// ---------------------------------------------------------------------------------------------

/// Carte biscuit (`cs-card`). `paper: true` = papier blanc à contour encre (`cs-card-paper`) ; `ink: true` = panneau noir.
class GCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final VoidCallback? onTap;
  final bool paper;
  final bool ink;
  final Color? color;
  final double radius;

  const GCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin = EdgeInsets.zero,
    this.onTap,
    this.paper = false,
    this.ink = false,
    this.color,
    this.radius = 20,
  });

  @override
  Widget build(BuildContext context) {
    final bg = color ?? (ink ? AppTheme.ink : (paper ? AppTheme.paper : AppTheme.biscuit));
    final deco = BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(radius),
      border: paper ? Border.all(color: AppTheme.ink, width: 2) : null,
    );
    final content = Padding(padding: padding, child: child);
    return Padding(
      padding: margin,
      child: Material(
        color: Colors.transparent,
        child: Ink(
          decoration: deco,
          child: onTap == null
              ? content
              : InkWell(borderRadius: BorderRadius.circular(radius), onTap: onTap, child: content),
        ),
      ),
    );
  }
}

/// Pastille d'état (`cs-pill`) : fond plein, contour encre.
class GPill extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Color color;
  final Color? textColor;
  final bool outlined;

  const GPill(this.text, {super.key, this.icon, this.color = AppTheme.mustard, this.textColor, this.outlined = true});

  @override
  Widget build(BuildContext context) {
    final fg = textColor ?? AppTheme.onColor(color);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
        border: outlined ? Border.all(color: AppTheme.ink, width: 2) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 15, color: fg), const SizedBox(width: 5)],
          Flexible(
            child: Text(
              text,
              overflow: TextOverflow.ellipsis,
              style: AppTheme.body(13, fg).copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.3),
            ),
          ),
        ],
      ),
    );
  }
}

/// Autocollant (`cs-sticker`) : Knewave, ovale, légèrement incliné, contour blanc.
class GSticker extends StatelessWidget {
  final String text;
  final Color color;
  final double angle;
  final double fontSize;

  const GSticker(this.text, {super.key, this.color = AppTheme.red, this.angle = -0.07, this.fontSize = 18});

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppTheme.paper, width: 3),
          boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 3))],
        ),
        child: Text(
          text,
          style: TextStyle(fontFamily: AppTheme.fontSticker, fontSize: fontSize, height: 1.1, color: AppTheme.onColor(color)),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Boutons
// ---------------------------------------------------------------------------------------------

enum GVariant { red, cream, ink, mustard }

/// Bouton pilule à contour encre (`cs-btn`). Taille 52 px ; `small` = 40 px.
class GButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final GVariant variant;
  final IconData? icon;
  final bool loading;
  final bool small;
  final bool expand;

  const GButton(
    this.label, {
    super.key,
    required this.onPressed,
    this.variant = GVariant.red,
    this.icon,
    this.loading = false,
    this.small = false,
    this.expand = true,
  });

  @override
  Widget build(BuildContext context) {
    final bg = switch (variant) {
      GVariant.red => AppTheme.red,
      GVariant.cream => AppTheme.cream,
      GVariant.ink => AppTheme.ink,
      GVariant.mustard => AppTheme.mustard,
    };
    final fg = AppTheme.onColor(bg);
    final disabled = onPressed == null || loading;
    final h = small ? 40.0 : 52.0;
    return Opacity(
      opacity: disabled && !loading ? 0.5 : 1,
      child: Material(
        color: bg,
        shape: const StadiumBorder(side: BorderSide(color: AppTheme.ink, width: 2)),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: disabled ? null : onPressed,
          child: Container(
            height: h,
            width: expand ? double.infinity : null,
            padding: EdgeInsets.symmetric(horizontal: small ? 18 : 26),
            alignment: Alignment.center,
            child: loading
                ? SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: fg))
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[Icon(icon, size: small ? 18 : 20, color: fg), const SizedBox(width: 8)],
                      Flexible(
                        child: Text(
                          label.toUpperCase(),
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontFamily: AppTheme.fontBody, fontSize: small ? 14 : 17, fontWeight: FontWeight.w700, letterSpacing: 0.7, color: fg),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// Bouton rond d'icône (`cs-icon-btn`).
class GIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String tooltip;
  final Color color;

  const GIconButton({super.key, required this.icon, required this.onPressed, required this.tooltip, this.color = AppTheme.cream});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: color,
        shape: const CircleBorder(side: BorderSide(color: AppTheme.ink, width: 2)),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(width: 44, height: 44, child: Icon(icon, size: 22, color: AppTheme.onColor(color))),
        ),
      ),
    );
  }
}

/// Filtre pilule (`cs-chip`) : sélectionné = moutarde.
class GChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  const GChip(this.label, {super.key, required this.selected, required this.onTap, this.icon});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppTheme.mustard : AppTheme.cream,
      shape: const StadiumBorder(side: BorderSide(color: AppTheme.ink, width: 2)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 16, color: AppTheme.ink), const SizedBox(width: 6)],
              Text(label, style: AppTheme.body(14).copyWith(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Titres et en-têtes
// ---------------------------------------------------------------------------------------------

/// En-tête de page : eyebrow rouge + titre display League Gothic + chapô (`cs-eyebrow` / `cs-display` / `cs-lead`).
class GPageHeader extends StatelessWidget {
  final String? eyebrow;
  final String title;
  final String? lead;
  final Widget? trailing;
  final double titleSize;

  const GPageHeader({super.key, this.eyebrow, required this.title, this.lead, this.trailing, this.titleSize = 54});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null) ...[Text(eyebrow!.toUpperCase(), style: AppTheme.eyebrow()), const SizedBox(height: 4)],
              Text(title.toUpperCase(), style: AppTheme.display(titleSize)),
              if (lead != null) ...[const SizedBox(height: 8), Text(lead!, style: AppTheme.body(17, AppTheme.muted))],
            ],
          ),
        ),
        if (trailing != null) ...[const SizedBox(width: 12), trailing!],
      ],
    );
  }
}

/// Titre de section (`cs-title`, Bowlby One SC) avec action facultative à droite.
class GSectionTitle extends StatelessWidget {
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  const GSectionTitle(this.text, {super.key, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(child: Text(text.toUpperCase(), style: AppTheme.title(22))),
        if (actionLabel != null)
          GestureDetector(
            onTap: onAction,
            child: Text(actionLabel!.toUpperCase(), style: AppTheme.label(AppTheme.red).copyWith(decoration: TextDecoration.underline, decorationThickness: 2)),
          ),
      ],
    );
  }
}

/// Page défilante : fond crème, en-tête optionnel, tirer pour actualiser (`cs-page`).
class GPage extends StatelessWidget {
  final GPageHeader? header;
  final List<Widget> children;
  final Future<void> Function()? onRefresh;
  final EdgeInsets padding;
  final Widget? topBar;

  const GPage({super.key, this.header, required this.children, this.onRefresh, this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 32), this.topBar});

  @override
  Widget build(BuildContext context) {
    final list = ListView(
      padding: padding,
      physics: const AlwaysScrollableScrollPhysics(),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        if (header != null) ...[header!, const SizedBox(height: 22)],
        ...children,
      ],
    );
    return ColoredBox(
      color: AppTheme.cream,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            if (topBar != null) topBar!,
            Expanded(
              child: onRefresh == null
                  ? list
                  : RefreshIndicator(color: AppTheme.red, backgroundColor: AppTheme.cream, onRefresh: onRefresh!, child: list),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Chiffres, états vides, ruban
// ---------------------------------------------------------------------------------------------

/// Tuile de chiffre (`cs-stat`) : libellé, grand nombre League Gothic, mention.
class GStat extends StatelessWidget {
  final String label;
  final String value;
  final String? hint;
  final IconData? icon;
  final Color valueColor;
  final Widget? badge;

  const GStat({super.key, required this.label, required this.value, this.hint, this.icon, this.valueColor = AppTheme.ink, this.badge});

  @override
  Widget build(BuildContext context) {
    return GCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(label.toUpperCase(), style: AppTheme.label(), maxLines: 2, overflow: TextOverflow.ellipsis)),
              if (icon != null) Icon(icon, size: 20, color: AppTheme.red),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(value, style: AppTheme.figure(50, valueColor)),
                if (badge != null) ...[const SizedBox(width: 8), badge!],
              ],
            ),
          ),
          if (hint != null) ...[const SizedBox(height: 2), Text(hint!, style: AppTheme.body(13, AppTheme.muted))],
        ],
      ),
    );
  }
}

/// État vide : pastille moutarde + titre + message + action.
class GEmpty extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const GEmpty({super.key, required this.icon, required this.title, required this.message, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return GCard(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 28),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: AppTheme.mustard, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
            child: Icon(icon, size: 34, color: AppTheme.ink),
          ),
          const SizedBox(height: 16),
          Text(title.toUpperCase(), textAlign: TextAlign.center, style: AppTheme.display(32)),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center, style: AppTheme.body(16, AppTheme.muted)),
          if (actionLabel != null) ...[const SizedBox(height: 18), GButton(actionLabel!, onPressed: onAction, expand: false)],
        ],
      ),
    );
  }
}

/// Message d'erreur / d'information en bandeau (`cs-error-text` dans un cadre).
class GNotice extends StatelessWidget {
  final String text;
  final IconData icon;
  final Color color;

  const GNotice(this.text, {super.key, this.icon = Icons.info_outline, this.color = AppTheme.red});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: AppTheme.cream, borderRadius: BorderRadius.circular(16), border: Border.all(color: color, width: 2)),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: AppTheme.body(15, AppTheme.ink).copyWith(fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}

/// Ruban rouge défilant (`cs-ticker`) : le slogan de la page d'accueil du site.
class GTicker extends StatefulWidget {
  final List<String> items;
  final Color color;

  const GTicker({super.key, required this.items, this.color = AppTheme.red});

  @override
  State<GTicker> createState() => _GTickerState();
}

class _GTickerState extends State<GTicker> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 22))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fg = AppTheme.onColor(widget.color);
    final style = AppTheme.display(24, fg).copyWith(letterSpacing: 1.2);
    final unit = '${widget.items.map((e) => e.toUpperCase()).join('   ✦   ')}   ✦   ';
    final painter = TextPainter(text: TextSpan(text: unit, style: style), textDirection: TextDirection.ltr)..layout();
    final w = painter.width;
    final reduce = MediaQuery.of(context).disableAnimations;
    return Container(
      height: 44,
      decoration: BoxDecoration(color: widget.color, border: const Border.symmetric(horizontal: BorderSide(color: AppTheme.ink, width: 2))),
      child: ClipRect(
        child: OverflowBox(
          alignment: Alignment.centerLeft,
          maxWidth: double.infinity,
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, child) => Transform.translate(offset: Offset(reduce ? 0 : -_c.value * w, 0), child: child),
            child: Row(children: List.generate(math.max(2, (600 / math.max(w, 1)).ceil() + 2), (_) => Text(unit, style: style))),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Barres de l'application (haut : marque + points ; bas : onglets)
// ---------------------------------------------------------------------------------------------

/// Barre du haut : marque CAMPUSSAVE + autocollant « essect », points EcoPoints, accès au profil.
class GTopBar extends StatelessWidget {
  final int? points;
  final VoidCallback? onProfile;

  const GTopBar({super.key, this.points, this.onProfile});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 62,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(color: AppTheme.cream, border: Border(bottom: BorderSide(color: AppTheme.ink, width: 2))),
      child: Row(
        children: [
          Text('CAMPUSSAVE', style: AppTheme.display(34, AppTheme.red)),
          const SizedBox(width: 6),
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('essect', style: const TextStyle(fontFamily: AppTheme.fontSticker, fontSize: 15, color: AppTheme.ink)),
          ),
          const Spacer(),
          if (points != null) GPill('$points PTS', color: AppTheme.mustard),
          if (onProfile != null) ...[const SizedBox(width: 8), GIconButton(icon: Icons.person_outline, onPressed: onProfile, tooltip: 'Mon profil')],
        ],
      ),
    );
  }
}

class GTab {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  const GTab(this.label, this.icon, this.activeIcon);
}

/// Barre d'onglets du bas (équivalent de `MobileTabBar`) : onglet actif = pilule rouge.
class GBottomBar extends StatelessWidget {
  final List<GTab> tabs;
  final int index;
  final ValueChanged<int> onChanged;

  const GBottomBar({super.key, required this.tabs, required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(color: AppTheme.cream, border: Border(top: BorderSide(color: AppTheme.ink, width: 2))),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(6, 8, 6, 8),
          child: Row(
            children: List.generate(tabs.length, (i) {
              final t = tabs[i];
              final active = i == index;
              return Expanded(
                child: Semantics(
                  button: true,
                  selected: active,
                  label: t.label,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => onChanged(i),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: 54,
                            height: 32,
                            decoration: BoxDecoration(
                              color: active ? AppTheme.red : Colors.transparent,
                              borderRadius: BorderRadius.circular(999),
                              border: active ? Border.all(color: AppTheme.ink, width: 2) : null,
                            ),
                            child: Icon(active ? t.activeIcon : t.icon, size: 22, color: active ? AppTheme.cream : AppTheme.ink),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            t.label.toUpperCase(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontFamily: AppTheme.fontBody, fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 0.3, color: active ? AppTheme.red : AppTheme.ink),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

/// Corps d'écran de l'application : en-tête de page (eyebrow + titre display), barre d'onglets facultative, puis le contenu.
class GScreenBody extends StatelessWidget {
  final String eyebrow;
  final String title;
  final Widget child;
  final Widget? bottom;
  final Widget? trailing;

  const GScreenBody({super.key, required this.eyebrow, required this.title, required this.child, this.bottom, this.trailing});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppTheme.cream,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
            child: GPageHeader(eyebrow: eyebrow, title: title, titleSize: 48, trailing: trailing),
          ),
          if (bottom != null) Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: bottom),
          Expanded(child: child),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Image réseau : décodée à la bonne taille, fondu à l'apparition, repli propre en cas d'erreur
// ---------------------------------------------------------------------------------------------

class GImage extends StatelessWidget {
  final String url;
  final Widget placeholder;
  final int cacheWidth;

  const GImage({super.key, required this.url, required this.placeholder, this.cacheWidth = 900});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        placeholder,
        Image.network(
          url,
          fit: BoxFit.cover,
          cacheWidth: cacheWidth, // décode à la taille d'affichage : bien moins de mémoire, défilement plus fluide
          gaplessPlayback: true,
          filterQuality: FilterQuality.low,
          frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
            if (wasSynchronouslyLoaded) return child;
            return AnimatedOpacity(opacity: frame == null ? 0 : 1, duration: const Duration(milliseconds: 250), curve: Curves.easeOut, child: child);
          },
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------------------------
// Squelette de chargement : garde la mise en page stable pendant que les offres arrivent
// ---------------------------------------------------------------------------------------------

class GSkeletonCard extends StatefulWidget {
  const GSkeletonCard({super.key});

  @override
  State<GSkeletonCard> createState() => _GSkeletonCardState();
}

class _GSkeletonCardState extends State<GSkeletonCard> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final tone = Color.lerp(AppTheme.biscuit, AppTheme.sand, _c.value)!;
          Widget bar(double w, double h) => Container(width: w, height: h, decoration: BoxDecoration(color: tone, borderRadius: BorderRadius.circular(8)));
          return Container(
            decoration: BoxDecoration(color: AppTheme.cream, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.sand, width: 2)),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(aspectRatio: 16 / 10, child: ColoredBox(color: tone)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [bar(120, 12), const SizedBox(height: 10), bar(240, 22), const SizedBox(height: 14), bar(90, 28)],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
