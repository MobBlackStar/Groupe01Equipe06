// 💡 Concept & Analogie : Comme l'ouverture d'un coffre légendaire dans un jeu mobile, l'application fait vibrer le smartphone au moment où le contenu secret du panier surprise est dévoilé.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons `AnimationController`, `Transform.rotate`, `ScaleTransition` et `HapticFeedback.heavyImpact()` ; en React, ce comportement est orchestré par Framer Motion.
// 🎯 À retenir pour la soutenance : "L'animation d'ouverture gamifiée récompense l'étudiant avec un retour haptique physique sur smartphone et une incrémentation immédiate de ses EcoPoints."

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme.dart';
import '../loyalty/loyalty_card_screen.dart';

class UnboxingOverlay extends StatefulWidget {
  final Map<String, dynamic>? revealData;
  final VoidCallback? onClose;

  const UnboxingOverlay({
    super.key,
    this.revealData,
    this.onClose,
  });

  @override
  State<UnboxingOverlay> createState() => _UnboxingOverlayState();
}

class _UnboxingOverlayState extends State<UnboxingOverlay> with TickerProviderStateMixin {
  late AnimationController _shakeController;
  late AnimationController _burstController;
  late Animation<double> _shakeAnimation;
  late Animation<double> _scaleAnimation;

  int _step = 1; // 1: Shaking, 2: Burst & Reveal

  final Map<String, dynamic> _defaultReveal = {
    'rarity': 'RARE',
    'items': [
      {'name': 'Croissants pur beurre dorés', 'qty': 2, 'emoji': '🥐'},
      {'name': 'Pain au chocolat feuilleté', 'qty': 1, 'emoji': '🍫'},
      {'name': 'Fricassés thon & harissa', 'qty': 2, 'emoji': '🥟'},
    ],
    'note': "Merci d'avoir sauvé ces invendus cuisinés avec amour ce midi à Montfleury !",
    'pointsAwarded': 45,
  };

  @override
  void initState() {
    super.initState();

    // 1. Contrôleur de secousse (0.8s)
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _shakeAnimation = Tween<double>(begin: -0.08, end: 0.08).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.easeInOut),
    );

    // 2. Contrôleur d'explosion / burst
    _burstController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.1).animate(
      CurvedAnimation(parent: _burstController, curve: Curves.elasticOut),
    );

    _startSequence();
  }

  void _startSequence() async {
    _shakeController.repeat(reverse: true);
    await Future.delayed(const Duration(milliseconds: 800));

    if (mounted) {
      _shakeController.stop();
      HapticFeedback.heavyImpact(); // Retour haptique physique

      setState(() => _step = 2);
      _burstController.forward();
    }
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _burstController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reveal = widget.revealData ?? _defaultReveal;
    final rarity = (reveal['rarity'] as String?)?.toUpperCase() ?? 'RARE';
    final items = (reveal['items'] as List<dynamic>?) ?? [];
    final pointsAwarded = reveal['pointsAwarded'] ?? 45;

    Color rarityColor = AppTheme.ink;
    String rarityTitle = 'RARE 💎';
    if (rarity == 'LEGENDARY') {
      rarityColor = AppTheme.mustard;
      rarityTitle = 'LÉGENDAIRE ✨';
    } else if (rarity == 'COMMON') {
      rarityColor = AppTheme.muted;
      rarityTitle = 'COMMUN 🎁';
    }

    return Scaffold(
      backgroundColor: Colors.black.withOpacity(0.88),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.biscuit,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: rarityColor.withOpacity(0.5), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: rarityColor.withOpacity(0.25),
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Étape 1 : Secousse
                  if (_step == 1) ...[
                    const SizedBox(height: 20),
                    AnimatedBuilder(
                      animation: _shakeAnimation,
                      builder: (context, child) {
                        return Transform.rotate(
                          angle: _shakeAnimation.value,
                          child: const Text('🎁', style: TextStyle(fontSize: 84)),
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Déballage du Panier Surprise...',
                      style: TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Suspense culinaire à Montfleury...',
                      style: TextStyle(color: AppTheme.muted, fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                  ] else ...[
                    // Étape 2 : Révélation du contenu
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: rarityColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: rarityColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          'RARETÉ : $rarityTitle',
                          style: TextStyle(color: rarityColor, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Contenu Dévoilé !',
                      style: TextStyle(color: AppTheme.ink, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // Liste des articles
                    ...items.map((item) {
                      final m = item as Map<String, dynamic>;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppTheme.cream,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.sand),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(m['emoji'] as String? ?? '🥪', style: const TextStyle(fontSize: 20)),
                                const SizedBox(width: 10),
                                Text(
                                  m['name'] as String? ?? 'Article',
                                  style: const TextStyle(color: AppTheme.ink, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            Text(
                              'x ${m['qty']}',
                              style: const TextStyle(color: AppTheme.red, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      );
                    }),

                    // Note commerçant
                    if (reveal['note'] != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '💬 « ${reveal['note']} »',
                        style: const TextStyle(color: AppTheme.muted, fontSize: 13, fontStyle: FontStyle.italic),
                        textAlign: TextAlign.center,
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Badge EcoPoints
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.red.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.red.withOpacity(0.4)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: const [
                              Text('🌱', style: TextStyle(fontSize: 20)),
                              SizedBox(width: 8),
                              Text('EcoPoints Gagnés :', style: TextStyle(color: AppTheme.ink, fontSize: 13, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          Text(
                            '+$pointsAwarded pts',
                            style: const TextStyle(color: AppTheme.red, fontSize: 16, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Bouton vers Fidélité
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const LoyaltyCardScreen()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.red,
                          foregroundColor: AppTheme.cream,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('🌱 Voir ma Carte de Fidélité', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
