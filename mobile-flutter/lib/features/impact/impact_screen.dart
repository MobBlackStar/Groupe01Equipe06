// 💡 Concept & Analogie : Comme le thermomètre géant d'une campagne de solidarité étudiante, cet écran célèbre l'effort écologique collectif du campus de l'ESSECT.
// 🔄 Comparaison React / Flutter : En Flutter, `ImpactScreen` utilise des `ListView` avec défilement fluide et indicateurs de progression natifs ; en React, c'est `ImpactDashboardPage`.
// 🎯 À retenir pour la soutenance : "L'application mobile permet à tout visiteur de constater en un geste la dynamique écologique des 5 filières et l'impact carbone certifié EPA."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
class ImpactScreen extends StatelessWidget {
  final String? studentFiliere;

  const ImpactScreen({super.key, this.studentFiliere = 'EBUSINESS_3A'});

  @override
  Widget build(BuildContext context) {
    final filieres = [
      {'name': '3A E-Business', 'code': 'EBUSINESS_3A', 'co2': '520 kg', 'food': '208 kg', 'pts': '10 400', 'rank': '🥇'},
      {'name': 'Finance', 'code': 'FINANCE', 'co2': '380 kg', 'food': '152 kg', 'pts': '7 600', 'rank': '🥈'},
      {'name': 'Marketing', 'code': 'MARKETING', 'co2': '295 kg', 'food': '118 kg', 'pts': '5 900', 'rank': '🥉'},
      {'name': 'Gestion', 'code': 'GESTION', 'co2': '210 kg', 'food': '84 kg', 'pts': '4 200', 'rank': '#4'},
      {'name': 'Comptabilité', 'code': 'COMPTABILITE', 'co2': '165 kg', 'food': '66 kg', 'pts': '3 300', 'rank': '#5'},
    ];

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        backgroundColor: AppTheme.cream,
        elevation: 0,
        title: const Text(
          'Impact Campus ESSECT 🌱',
          style: TextStyle(color: AppTheme.ink, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bandeau Héroïque
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.biscuit, AppTheme.sand],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.red.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.red.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'SOLIDARITÉ & CLIMAT',
                      style: TextStyle(color: AppTheme.red, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    '1 680 repas sauvés',
                    style: TextStyle(color: AppTheme.ink, fontSize: 26, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Soit 580 kg de nourriture sauvée et 1,45 tonne de CO₂e évitée sur Montfleury.',
                    style: TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Équivalences EPA
            const Text(
              'Équivalences Concrètes (EPA / FAO)',
              style: TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.biscuit,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('📱', style: TextStyle(fontSize: 22)),
                        SizedBox(height: 6),
                        Text('145 000', style: TextStyle(color: AppTheme.ink, fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('charges smartphone', style: TextStyle(color: AppTheme.ink, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.biscuit,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('🚗', style: TextStyle(fontSize: 22)),
                        SizedBox(height: 6),
                        Text('5 940 km', style: TextStyle(color: AppTheme.ink, fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('de voiture évités', style: TextStyle(color: AppTheme.red, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Challenge Inter-Filières
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Challenge Inter-Filières 🏆',
                  style: TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Saison 2026',
                  style: TextStyle(color: AppTheme.red, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),

            ListView.separated(
              itemCount: filieres.length,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final filiere = filieres[index];
                final isUser = filiere['code'] == studentFiliere;

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isUser ? AppTheme.red.withOpacity(0.08) : AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isUser ? AppTheme.red.withOpacity(0.4) : AppTheme.ink.withOpacity(0.08),
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(filiere['rank']!, style: const TextStyle(fontSize: 20)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  filiere['name']!,
                                  style: const TextStyle(color: AppTheme.ink, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                if (isUser) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.red,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'VOUS',
                                      style: TextStyle(color: AppTheme.cream, fontSize: 13, fontWeight: FontWeight.w900),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            Text(
                              '${filiere['food']} sauvés • ${filiere['pts']} pts',
                              style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        filiere['co2']!,
                        style: const TextStyle(color: AppTheme.red, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
