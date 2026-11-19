// 💡 Concept & Analogie : Comme le carnet de vol d'un jeune pilote récapitulant chaque heure de vol accomplie, cet écran synthétise chaque sauvetage de repas réussi par l'étudiant.
// 🔄 Comparaison React / Flutter : En Flutter, `StudentDashboardScreen` s'appuie sur `fl_chart` pour le tracé fluide de courbes vectorielles avec grille customisée ; en React, nous utilisons Recharts.
// 🎯 À retenir pour la soutenance : "Ce dashboard mobile permet à l'étudiant de mesurer son impact en temps réel directement entre deux cours à l'ESSECT."

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../widgets/kpi_tile.dart';

import '../../app/theme.dart';
import '../../widgets/griddle.dart';
class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  int _selectedChartMetric = 0; // 0: Dinars, 1: CO2 kg

  final List<Map<String, dynamic>> _recentOrders = [
    {
      'code': 'CS-8K4M9',
      'title': 'Baguette Farcie Escalope',
      'merchant': 'Baguette & Baguette',
      'price': '3,800 DT',
      'saved': '4,000 DT',
      'rating': 5,
    },
    {
      'code': 'CS-3T7X1',
      'title': 'Panier Surprise Viennoiseries',
      'merchant': 'Cafétéria L\'Étoile',
      'price': '2,500 DT',
      'saved': '3,500 DT',
      'rating': null,
    },
    {
      'code': 'CS-9M2K4',
      'title': 'Ojja Royale aux Merguez',
      'merchant': 'Restaurant Le Dôme',
      'price': '4,500 DT',
      'saved': '4,000 DT',
      'rating': 4,
    },
  ];

  void _showRatingModal(Map<String, dynamic> order) {
    int rating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppTheme.biscuit,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Évaluer ${order['title']}',
            style: const TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Attribuez une note de 1 à 5 étoiles :',
                style: TextStyle(color: AppTheme.muted, fontSize: 13),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: AppTheme.mustard,
                      size: 32,
                    ),
                    onPressed: () {
                      setModalState(() {
                        rating = index + 1;
                      });
                    },
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentController,
                maxLength: 280,
                maxLines: 2,
                style: const TextStyle(color: AppTheme.ink, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Commentaire optionnel...',
                  hintStyle: const TextStyle(color: AppTheme.muted),
                  filled: true,
                  fillColor: AppTheme.cream,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler', style: TextStyle(color: AppTheme.muted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.red,
                foregroundColor: AppTheme.cream,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                setState(() {
                  order['rating'] = rating;
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Avis enregistré avec succès ! Merci pour votre retour.'),
                    backgroundColor: AppTheme.biscuit,
                  ),
                );
              },
              child: const Text('Enregistrer', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      
      body: GScreenBody(eyebrow: 'Impact étudiant', title: 'Mon bilan', child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Grille KPI
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: const [
                KpiTile(
                  title: 'Repas Sauvés',
                  value: '14',
                  subtitle: 'Invendus rachetés',
                  icon: Icons.shopping_bag_outlined,
                  accent: KpiAccent.lime,
                  badge: '+3 sem.',
                ),
                KpiTile(
                  title: 'Dinars Économisés',
                  value: '46,5 DT',
                  subtitle: 'Pouvoir d\'achat',
                  icon: Icons.savings_outlined,
                  accent: KpiAccent.amber,
                  badge: 'Direct',
                ),
                KpiTile(
                  title: 'Nourriture Sauvée',
                  value: '5.8 kg',
                  subtitle: 'Anti-gaspillage',
                  icon: Icons.restaurant_outlined,
                  accent: KpiAccent.cyan,
                ),
                KpiTile(
                  title: 'CO₂e Évité',
                  value: '14.5 kg',
                  subtitle: 'Standard FAO (2.5x)',
                  icon: Icons.forest_outlined,
                  accent: KpiAccent.purple,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Sélecteur & Graphique FL_Chart
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Progression Cumulative',
                  style: TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
                  ),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => setState(() => _selectedChartMetric = 0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _selectedChartMetric == 0 ? AppTheme.red : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'TND',
                            style: TextStyle(
                              color: _selectedChartMetric == 0 ? Colors.black : AppTheme.muted,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _selectedChartMetric = 1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _selectedChartMetric == 1 ? AppTheme.ink : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'CO₂',
                            style: TextStyle(
                              color: _selectedChartMetric == 1 ? Colors.black : AppTheme.muted,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Container(
              height: 200,
              padding: const EdgeInsets.only(top: 16, right: 16, left: 0, bottom: 8),
              decoration: BoxDecoration(
                color: AppTheme.biscuit,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
              ),
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: AppTheme.ink.withOpacity(0.05),
                      strokeWidth: 1,
                    ),
                  ),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const labels = ['S1', 'S2', 'S3', 'S4', 'S5'];
                          final idx = value.toInt();
                          if (idx >= 0 && idx < labels.length) {
                            return Text(labels[idx], style: const TextStyle(color: AppTheme.muted, fontSize: 13));
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 32,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            value.toInt().toString(),
                            style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: _selectedChartMetric == 0
                          ? const [
                              FlSpot(0, 7.5),
                              FlSpot(1, 14),
                              FlSpot(2, 26),
                              FlSpot(3, 36),
                              FlSpot(4, 46.5),
                            ]
                          : const [
                              FlSpot(0, 2.2),
                              FlSpot(1, 4.1),
                              FlSpot(2, 7.8),
                              FlSpot(3, 11.2),
                              FlSpot(4, 14.5),
                            ],
                      isCurved: true,
                      color: _selectedChartMetric == 0 ? AppTheme.red : AppTheme.ink,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: (_selectedChartMetric == 0 ? AppTheme.red : AppTheme.ink).withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Commandes récentes & notation
            const Text(
              'Derniers Repas & Évaluations',
              style: TextStyle(color: AppTheme.ink, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            ListView.separated(
              itemCount: _recentOrders.length,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final order = _recentOrders[index];
                final rating = order['rating'] as int?;

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.biscuit,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.ink.withOpacity(0.08)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.check_circle, color: AppTheme.red, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order['title'] as String,
                              style: const TextStyle(color: AppTheme.ink, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              '${order['merchant']} • ${order['price']}',
                              style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      if (rating != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.mustard.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.mustard.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star, color: AppTheme.mustard, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                '$rating/5',
                                style: const TextStyle(color: AppTheme.red, fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        )
                      else
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.mustard.withOpacity(0.15),
                            foregroundColor: AppTheme.mustard,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: BorderSide(color: AppTheme.mustard.withOpacity(0.3)),
                            ),
                          ),
                          onPressed: () => _showRatingModal(order),
                          child: const Text('⭐ Noter', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      )),
    );
  }
}
