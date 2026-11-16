// 💡 Concept & Analogie : Comme la caisse enregistreuse intelligente d'une enseigne moderne, cet écran détaille les flux de trésorerie récupérés et les invendus sauvés de la benne.
// 🔄 Comparaison React / Flutter : En Flutter, `MerchantDashboardScreen` utilise les diagrammes en barres `BarChart` de `fl_chart` adaptés pour écrans tactiles ; en React, nous utilisons `BarChartCard`.
// 🎯 À retenir pour la soutenance : "Le commerçant dispose d'une visibilité claire sur ses recettes journalières et son taux de non-présentation, démontrant la viabilité économique du modèle anti-gaspi."

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../widgets/kpi_tile.dart';

class MerchantDashboardScreen extends StatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  State<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends State<MerchantDashboardScreen> {
  int _selectedRange = 0; // 0: 7 jours, 1: 30 jours

  @override
  Widget build(BuildContext context) {
    final is7d = _selectedRange == 0;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0F12),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D0F12),
        elevation: 0,
        title: const Text(
          'Performances Ventes 📊',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bascule de période
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF161920),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRange = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: is7d ? const Color(0xFFCCFF00) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '7 derniers jours',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: is7d ? Colors.black : const Color(0xFF94A3B8),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedRange = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: !is7d ? const Color(0xFFCCFF00) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '30 derniers jours',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: !is7d ? Colors.black : const Color(0xFF94A3B8),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Grille KPI
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                KpiTile(
                  title: 'Recettes Anti-Gaspi',
                  value: is7d ? '184,5 DT' : '742,0 DT',
                  subtitle: 'Revenu additionnel',
                  icon: Icons.payments_outlined,
                  accent: KpiAccent.lime,
                  badge: is7d ? '+18%' : '+24%',
                ),
                KpiTile(
                  title: 'Repas Sauvés',
                  value: is7d ? '52' : '215',
                  subtitle: 'Invendus valorisés',
                  icon: Icons.shopping_basket_outlined,
                  accent: KpiAccent.amber,
                ),
                KpiTile(
                  title: 'Taux de Retrait',
                  value: is7d ? '96%' : '97%',
                  subtitle: 'Commandes honorées',
                  icon: Icons.verified_outlined,
                  accent: KpiAccent.cyan,
                  badge: 'Fiable',
                ),
                const KpiTile(
                  title: 'Note Moyenne',
                  value: '4.8 / 5',
                  subtitle: '38 avis étudiants',
                  icon: Icons.star_rate_rounded,
                  accent: KpiAccent.amber,
                  badge: '⭐ Top',
                ),
              ],
            ),
            const SizedBox(height: 24),

            // BarChart fl_chart
            const Text(
              'Recettes Journalières (TND)',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            Container(
              height: 200,
              padding: const EdgeInsets.only(top: 16, right: 16, left: 0, bottom: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF161920),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: BarChart(
                BarChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: Colors.white.withOpacity(0.05),
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
                          const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
                          final idx = value.toInt();
                          if (idx >= 0 && idx < days.length) {
                            return Text(days[idx], style: const TextStyle(color: Color(0xFF64748B), fontSize: 10));
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}k',
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 9),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: [
                    BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 24, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 31, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 28, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 36, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 42, color: const Color(0xFFFF5500), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 5, barRods: [BarChartRodData(toY: 15, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                    BarChartGroupData(x: 6, barRods: [BarChartRodData(toY: 8, color: const Color(0xFFCCFF00), width: 14, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))]),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Top 3 Offres
            const Text(
              'Offres les Plus Sauvées',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF161920),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                children: [
                  _buildTopRow('1', 'Baguette Farcie Escalope Panée', '24 sauvés', '91,200 DT'),
                  const Divider(color: Colors.white10, height: 20),
                  _buildTopRow('2', 'Panier Surprise Viennoiseries', '16 sauvés', '40,000 DT'),
                  const Divider(color: Colors.white10, height: 20),
                  _buildTopRow('3', 'Makloub Poulet Mariné', '12 sauvés', '53,300 DT'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopRow(String rank, String title, String count, String revenue) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: Text(
            '#$rank',
            style: const TextStyle(color: Color(0xFFCCFF00), fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(count, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
            ],
          ),
        ),
        Text(
          revenue,
          style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 12, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
