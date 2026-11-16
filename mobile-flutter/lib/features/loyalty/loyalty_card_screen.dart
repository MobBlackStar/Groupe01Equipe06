// 💡 Concept & Analogie : Le pass fidélité étudiant au creux de la main, récompensant chaque geste éco-responsable par des réductions concrètes et un arbre virtuel qui grandit.
// 🔄 Comparaison React / Flutter : En Flutter, la carte utilise un `Container` à dégradé et des tampons en `GridView` ou `Row` ; en React, il correspond à `LoyaltyCardPage.jsx`.
// 🎯 À retenir pour la soutenance : "Quatre paliers vivants (GRAINE ➔ POUSSE ➔ ARBRE ➔ FORET) et un cycle court de 5 tampons pour maintenir la motivation étudiante toute l'année universitaire."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/loyalty.dart';

class LoyaltyCardScreen extends StatefulWidget {
  const LoyaltyCardScreen({super.key});

  @override
  State<LoyaltyCardScreen> createState() => _LoyaltyCardScreenState();
}

class _LoyaltyCardScreenState extends State<LoyaltyCardScreen> {
  int _ecoPoints = 240;
  int _mealsRescued = 12;

  final List<Map<String, dynamic>> _rewards = [
    {
      'id': 'rw-1',
      'title': '-20% Réduction Immédiate',
      'sub': 'Plafonné à 2,000 DT sur votre commande',
      'milestone': 100,
      'status': 'USED',
    },
    {
      'id': 'rw-2',
      'title': '-20% Réduction Immédiate',
      'sub': 'Plafonné à 2,000 DT sur votre commande',
      'milestone': 200,
      'status': 'AVAILABLE',
    },
  ];

  void _addPoints(int amount) {
    setState(() {
      _ecoPoints += amount;
      if (amount == 20) _mealsRescued += 1;
      if (_ecoPoints >= 300 && !_rewards.any((r) => r['milestone'] == 300)) {
        _rewards.add({
          'id': 'rw-3',
          'title': 'Panier Surprise 100% Offert ✨',
          'sub': 'Offert jusqu à 4,000 DT sur un panier mystère',
          'milestone': 300,
          'status': 'AVAILABLE',
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Calcul palier
    String tierLabel = 'Graine';
    String tierIcon = '🌱';
    if (_ecoPoints >= 600) {
      tierLabel = 'Forêt';
      tierIcon = '🌲';
    } else if (_ecoPoints >= 300) {
      tierLabel = 'Arbre';
      tierIcon = '🌳';
    } else if (_ecoPoints >= 100) {
      tierLabel = 'Pousse';
      tierIcon = '🌿';
    }

    final activeStamps = (_ecoPoints % 100) ~/ 20;
    final nextMilestone = ((_ecoPoints ~/ 100) + 1) * 100;
    final progress = (_ecoPoints % 100) / 100.0;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Carte Éco-Fidélité', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. La Carte Virtuelle Apple Pass
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF161E16), Color(0xFF10141A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.limeAccent.withOpacity(0.4), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.limeAccent.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: const [
                        Text(
                          'CAMPUSSAVE VIP PASS',
                          style: TextStyle(color: AppTheme.limeAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        Text('ESSECT 2026', style: TextStyle(color: Colors.white38, fontSize: 10, fontFamily: 'monospace')),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(tierIcon, style: const TextStyle(fontSize: 44)),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Palier Écologique', style: TextStyle(color: Colors.white54, fontSize: 11)),
                                Text(
                                  tierLabel,
                                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Solde Points', style: TextStyle(color: Colors.white54, fontSize: 11)),
                            Text(
                              '$_ecoPoints',
                              style: const TextStyle(color: AppTheme.limeAccent, fontSize: 26, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text('Yassine Trabelsi', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            Text('Filière E-Business 3A', style: TextStyle(color: Colors.white54, fontSize: 11)),
                          ],
                        ),
                        Text(
                          '🌱 $_mealsRescued repas sauvés',
                          style: const TextStyle(color: AppTheme.limeAccent, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 2. Progression vers le palier suivant
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Vers le prochain coupon :', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text('$_ecoPoints / $nextMilestone pts', style: const TextStyle(color: AppTheme.limeAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.white10,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.limeAccent),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 3. Grille des 5 tampons
              const Text('Cycle de Tampons (5 Repas)', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(5, (index) {
                  final isStamped = index < activeStamps;
                  final isGift = index == 4;

                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index == 4 ? 0 : 8),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: isStamped
                            ? AppTheme.limeAccent.withOpacity(0.15)
                            : AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isStamped
                              ? AppTheme.limeAccent
                              : isGift
                                  ? Colors.amber.withOpacity(0.4)
                                  : Colors.white10,
                          width: isStamped ? 1.5 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          isStamped ? '🌱' : isGift ? '🎁' : '${index + 1}',
                          style: TextStyle(
                            fontSize: isStamped || isGift ? 20 : 14,
                            color: isStamped ? AppTheme.limeAccent : Colors.white38,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),

              // 4. Portefeuille des Récompenses
              const Text('Mes Coupons Disponibles', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              ..._rewards.map((r) {
                final isAvailable = r['status'] == 'AVAILABLE';
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isAvailable ? AppTheme.limeAccent.withOpacity(0.4) : Colors.white10,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r['title'] as String,
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            r['sub'] as String,
                            style: const TextStyle(color: Colors.white54, fontSize: 10),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isAvailable ? AppTheme.limeAccent.withOpacity(0.15) : Colors.white10,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isAvailable ? 'ACTIF' : 'UTILISÉ',
                          style: TextStyle(
                            color: isAvailable ? AppTheme.limeAccent : Colors.white38,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),

              const SizedBox(height: 20),

              // 5. Boutons démo soutenance
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Banc de Démo Live (Soutenance) :', style: TextStyle(color: AppTheme.limeAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _addPoints(20),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.limeAccent),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('+20 EcoPoints', style: TextStyle(color: AppTheme.limeAccent, fontSize: 11)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _addPoints(60),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.amber),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Franchir 300 pts ✨', style: TextStyle(color: Colors.amber, fontSize: 11)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
