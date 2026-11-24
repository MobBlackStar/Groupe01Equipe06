// 💡 Concept & Analogie : Les deux gestes de fin de repas : ouvrir la boîte mystère, puis laisser une note au commerçant.
// 🔄 Comparaison React / Flutter : Équivalent de `UnboxingReveal.jsx` et `RatingDialog.jsx` du site (mêmes données : `order.reveal` et `POST /orders/:id/rating`).
// 🎯 À retenir pour la soutenance : "Le déballage montre le vrai contenu renvoyé par le serveur au scan ; la note 1 à 5 est réellement enregistrée, une seule fois par commande."

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../app/theme.dart';
import '../core/models/order_model.dart';
import '../services/campus_api.dart';
import 'griddle.dart';

/// Note d'une commande terminée (1 à 5 étoiles + commentaire). Renvoie `true` si la note a été enregistrée.
Future<bool> showRateOrderDialog(BuildContext context, {required String orderId, required String title}) async {
  int stars = 5;
  final commentController = TextEditingController();
  String? error;
  bool sending = false;

  final done = await showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setModal) => AlertDialog(
        title: Text('Noter $title', style: AppTheme.h3(22)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 1; i <= 5; i++)
                  IconButton(
                    tooltip: '$i étoile${i > 1 ? 's' : ''}',
                    iconSize: 34,
                    icon: Icon(i <= stars ? Icons.star : Icons.star_border, color: AppTheme.orange),
                    onPressed: () => setModal(() => stars = i),
                  ),
              ],
            ),
            TextField(controller: commentController, maxLength: 280, maxLines: 2, decoration: const InputDecoration(hintText: 'Un commentaire (facultatif)')),
            if (error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(error!, style: AppTheme.body(14, AppTheme.red))),
          ],
        ),
        actions: [
          TextButton(onPressed: sending ? null : () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(
            onPressed: sending
                ? null
                : () async {
                    setModal(() {
                      sending = true;
                      error = null;
                    });
                    try {
                      await CampusApi.shared.rateOrder(orderId, stars, comment: commentController.text);
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } catch (e) {
                      setModal(() {
                        sending = false;
                        error = e.toString();
                      });
                    }
                  },
            child: Text(sending ? 'Envoi…' : 'Envoyer'),
          ),
        ],
      ),
    ),
  );
  commentController.dispose();
  if (done == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Merci pour votre avis !')));
  }
  return done == true;
}

/// Déballage d'un panier surprise : secousse de la boîte, puis le vrai contenu révélé par le serveur.
Future<void> showUnboxingSheet(BuildContext context, OrderModel order) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppTheme.cream,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      side: BorderSide(color: AppTheme.ink, width: 2),
    ),
    builder: (ctx) => _UnboxingBody(order: order),
  );
}

class _UnboxingBody extends StatefulWidget {
  final OrderModel order;
  const _UnboxingBody({required this.order});

  @override
  State<_UnboxingBody> createState() => _UnboxingBodyState();
}

class _UnboxingBodyState extends State<_UnboxingBody> with SingleTickerProviderStateMixin {
  late final AnimationController _shake = AnimationController(vsync: this, duration: const Duration(milliseconds: 110));
  bool _revealed = false;

  @override
  void initState() {
    super.initState();
    _shake.repeat(reverse: true);
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      _shake.stop();
      HapticFeedback.heavyImpact();
      setState(() => _revealed = true);
    });
  }

  @override
  void dispose() {
    _shake.dispose();
    super.dispose();
  }

  String get _rarityLabel => switch ((widget.order.rarity ?? '').toUpperCase()) {
        'LEGENDARY' => 'Légendaire',
        'RARE' => 'Rare',
        _ => 'Commun',
      };

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 26, 22, 24),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 350),
          child: !_revealed
              ? Column(
                  key: const ValueKey('box'),
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 20),
                    RotationTransition(
                      turns: Tween<double>(begin: -0.015, end: 0.015).animate(_shake),
                      child: const Text('🎁', style: TextStyle(fontSize: 96)),
                    ),
                    const SizedBox(height: 16),
                    Text('OUVERTURE DU PANIER…', style: AppTheme.display(34)),
                    const SizedBox(height: 24),
                  ],
                )
              : Column(
                  key: const ValueKey('content'),
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GPill('Rareté : $_rarityLabel', color: AppTheme.red),
                    const SizedBox(height: 10),
                    Text('CONTENU DÉVOILÉ', style: AppTheme.display(44)),
                    const SizedBox(height: 14),
                    if (o.revealItems.isEmpty)
                      Text('Le commerçant n\'a pas détaillé le contenu de ce panier.', style: AppTheme.body(16, AppTheme.muted))
                    else
                      for (final it in o.revealItems)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: GCard(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                            child: Row(
                              children: [
                                Expanded(child: Text(it['name'].toString(), style: AppTheme.body(17).copyWith(fontWeight: FontWeight.w700))),
                                Text('x${it['quantity']}', style: AppTheme.mono(15, AppTheme.red).copyWith(fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                    if ((o.revealNote ?? '').isNotEmpty) ...[const SizedBox(height: 4), Text('« ${o.revealNote} »', style: AppTheme.body(15, AppTheme.muted))],
                    if ((o.pointsAwarded ?? 0) > 0) ...[
                      const SizedBox(height: 14),
                      GCard(
                        color: AppTheme.mustard,
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [const Icon(Icons.eco, color: AppTheme.ink), const SizedBox(width: 10), Expanded(child: Text('ECOPOINTS GAGNÉS', style: AppTheme.h3(18))), Text('+${o.pointsAwarded}', style: AppTheme.figure(34))]),
                      ),
                    ],
                    const SizedBox(height: 18),
                    GButton('Super !', icon: Icons.check, onPressed: () => Navigator.pop(context)),
                  ],
                ),
        ),
      ),
    );
  }
}
