// 💡 Concept & Analogie : La caisse enregistreuse intelligente du commerçant : recettes, retraits et note, lus dans ses vrais chiffres.
// 🔄 Comparaison React / Flutter : Équivalent de `MerchantDashboard.jsx` : `GET /dashboards/merchant?range=7d|30d`, tracé en barres avec `fl_chart`.
// 🎯 À retenir pour la soutenance : "Aucun chiffre n'est écrit en dur : recettes, repas sauvés, taux de no-show et top offres viennent de l'API ; un nouveau commerce voit des zéros, pas des valeurs inventées."

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';

class MerchantDashboardScreen extends StatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  State<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends State<MerchantDashboardScreen> {
  bool _is7d = true;
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await CampusApi.shared.fetchMerchantDashboard(range: _is7d ? '7d' : '30d');
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _setRange(bool is7d) {
    if (_is7d == is7d) return;
    _is7d = is7d;
    _load();
  }

  static num _n(dynamic v) => v is num ? v : 0;

  @override
  Widget build(BuildContext context) {
    return GScreenBody(
      eyebrow: 'Espace commerçant',
      title: 'Mes ventes',
      child: RefreshIndicator(
        color: AppTheme.red,
        onRefresh: _load,
        child: _data == null && _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.red))
            : _error != null && _data == null
                ? ListView(padding: const EdgeInsets.all(20), children: [GEmpty(icon: Icons.cloud_off_outlined, title: 'Bilan indisponible', message: _error!, actionLabel: 'Réessayer', onAction: _load)])
                : _content(_data ?? const {}),
      ),
    );
  }

  Widget _content(Map<String, dynamic> d) {
    final kpis = Map<String, dynamic>.from((d['kpis'] as Map?) ?? const {});
    final series = ((d['dailySeries'] as List?) ?? const []).whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
    final top = ((d['topOffers'] as List?) ?? const []).whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
    final rating = _n(kpis['ratingAvg']).toDouble();
    final reviews = _n(kpis['reviewsCount']).toInt();
    final noShow = _n(kpis['noShowsPercent']).toDouble();
    final totalRevenue = series.fold<num>(0, (a, e) => a + _n(e['value']));

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Wrap(
          spacing: 8,
          children: [
            GChip('7 derniers jours', selected: _is7d, onTap: () => _setRange(true)),
            GChip('30 derniers jours', selected: !_is7d, onTap: () => _setRange(false)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: GStat(label: 'Recettes', value: Money.formatTND(totalRevenue.toInt()), icon: Icons.payments_outlined, valueColor: AppTheme.red)),
            const SizedBox(width: 12),
            Expanded(child: GStat(label: 'Repas sauvés', value: '${_n(kpis['mealsRescued']).toInt()}', icon: Icons.shopping_basket_outlined, valueColor: AppTheme.leaf)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: GStat(label: 'Non retirés', value: '${noShow.toStringAsFixed(noShow == noShow.roundToDouble() ? 0 : 1)} %', icon: Icons.event_busy_outlined)),
            const SizedBox(width: 12),
            Expanded(
              child: GStat(
                label: 'Note moyenne',
                value: reviews > 0 ? rating.toStringAsFixed(1) : '—',
                hint: reviews > 0 ? '$reviews avis' : 'Pas encore d\'avis',
                icon: Icons.star_outline,
                valueColor: AppTheme.orange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const GSectionTitle('Recettes par jour'),
        const SizedBox(height: 12),
        GCard(
          padding: const EdgeInsets.fromLTRB(8, 18, 16, 10),
          child: SizedBox(height: 200, child: totalRevenue <= 0 ? const _NoSales() : _RevenueChart(series: series, is7d: _is7d)),
        ),
        const SizedBox(height: 24),
        const GSectionTitle('Offres les plus vendues'),
        const SizedBox(height: 12),
        if (top.isEmpty)
          const GEmpty(icon: Icons.local_offer_outlined, title: 'Pas encore de ventes', message: 'Vos meilleures offres apparaîtront ici dès les premiers retraits.')
        else
          for (final o in top) ...[_TopOfferTile(offer: o), const SizedBox(height: 10)],
      ],
    );
  }
}

class _NoSales extends StatelessWidget {
  const _NoSales();

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Aucune recette sur la période.', style: AppTheme.body(16, AppTheme.muted)));
  }
}

class _RevenueChart extends StatelessWidget {
  final List<Map<String, dynamic>> series;
  final bool is7d;

  const _RevenueChart({required this.series, required this.is7d});

  @override
  Widget build(BuildContext context) {
    // Valeurs en dinars ; l'axe est calé sur le maximum réel (pas de graduation qui se chevauche).
    final values = [for (final e in series) ((e['value'] as num?) ?? 0) / 1000];
    final maxV = values.fold<double>(0, (a, b) => b > a ? b : a);
    final top = maxV <= 0 ? 1.0 : maxV * 1.15;
    final step = (top / 4).clamp(1, double.infinity).toDouble();
    return BarChart(
      BarChartData(
        maxY: top,
        alignment: BarChartAlignment.spaceAround,
        gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: step, getDrawingHorizontalLine: (_) => const FlLine(color: AppTheme.sand, strokeWidth: 1)),
        borderData: FlBorderData(show: false),
        barTouchData: BarTouchData(enabled: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: step,
              getTitlesWidget: (v, meta) => v > top - step * 0.2 && v != meta.max
                  ? const SizedBox.shrink()
                  : Text(v.round().toString(), style: AppTheme.mono(13, AppTheme.muted)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 26,
              getTitlesWidget: (v, meta) {
                final i = v.toInt();
                if (i < 0 || i >= series.length) return const SizedBox.shrink();
                if (!is7d && i % 5 != 0) return const SizedBox.shrink(); // 30 jours : une graduation sur 5
                final label = (series[i]['label'] ?? '').toString();
                return Padding(padding: const EdgeInsets.only(top: 6), child: Text(label, style: AppTheme.mono(12, AppTheme.muted)));
              },
            ),
          ),
        ),
        barGroups: [
          for (var i = 0; i < values.length; i++)
            BarChartGroupData(x: i, barRods: [
              BarChartRodData(toY: values[i], color: values[i] == maxV && maxV > 0 ? AppTheme.orange : AppTheme.red, width: is7d ? 16 : 6, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
            ]),
        ],
      ),
    );
  }
}

class _TopOfferTile extends StatelessWidget {
  final Map<String, dynamic> offer;

  const _TopOfferTile({required this.offer});

  @override
  Widget build(BuildContext context) {
    final sold = (offer['quantitySold'] as num?)?.toInt() ?? 0;
    final revenue = (offer['revenueMillimes'] as num?)?.toInt() ?? 0;
    return GCard(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((offer['title'] ?? '').toString().toUpperCase(), style: AppTheme.h3(18), maxLines: 2, overflow: TextOverflow.ellipsis),
                Text('$sold vendu${sold > 1 ? 's' : ''} · ${offer['decayType'] ?? ''}', style: AppTheme.body(14, AppTheme.muted)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(Money.formatTND(revenue), style: AppTheme.figure(30, AppTheme.red)),
        ],
      ),
    );
  }
}
