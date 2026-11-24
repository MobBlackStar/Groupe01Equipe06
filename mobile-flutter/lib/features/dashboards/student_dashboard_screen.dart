// 💡 Concept & Analogie : Le carnet de vol de l'étudiant : repas sauvés, euros économisés et CO₂ évité, tirés de ses vraies commandes.
// 🔄 Comparaison React / Flutter : Équivalent de `StudentDashboard.jsx` : `GET /dashboards/student`, notation via `POST /orders/:id/rating`.
// 🎯 À retenir pour la soutenance : "Le bilan n'invente rien : les totaux viennent du profil serveur, le graphique cumule les économies réelles par semaine, et la note d'une commande terminée est réellement enregistrée."

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import '../impact/impact_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  bool _showCo2 = false;

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
      final data = await CampusApi.shared.fetchStudentDashboard();
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

  static num _n(dynamic v) => v is num ? v : 0;

  static List<Map<String, dynamic>> _list(dynamic v) => ((v as List?) ?? const []).whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();

  Future<void> _rate(Map<String, dynamic> order) async {
    final id = (order['id'] ?? order['orderId'] ?? '').toString();
    final title = ((order['offerSnapshot'] as Map?)?['title'] ?? 'cette commande').toString();
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
                        await CampusApi.shared.rateOrder(id, stars, comment: commentController.text);
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
    if (done == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Merci pour votre avis !')));
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GScreenBody(
      eyebrow: 'Impact étudiant',
      title: 'Mon bilan',
      trailing: GIconButton(
        icon: Icons.public,
        tooltip: 'Impact du campus',
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ImpactScreen())),
      ),
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
    final stats = Map<String, dynamic>.from((d['stats'] as Map?) ?? const {});
    final loyalty = Map<String, dynamic>.from((d['loyalty'] as Map?) ?? const {});
    final eq = Map<String, dynamic>.from((d['equivalences'] as Map?) ?? const {});
    final history = _list(d['savingsHistory']);
    final orders = _list(d['recentOrders']);

    final meals = _n(loyalty['totalMealsRescued']).toInt() > 0 ? _n(loyalty['totalMealsRescued']).toInt() : _n(stats['ordersCompleted']).toInt();
    final saved = _n(stats['totalSavedMillimes']).toInt();
    final foodKg = _n(stats['foodSavedGrams']) / 1000;
    final co2Kg = _n(stats['co2SavedGrams']) / 1000;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: GStat(label: 'Repas sauvés', value: '$meals', icon: Icons.shopping_bag_outlined, valueColor: AppTheme.red)),
            const SizedBox(width: 12),
            Expanded(child: GStat(label: 'Économisé', value: Money.formatTND(saved), icon: Icons.savings_outlined, valueColor: AppTheme.orange)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: GStat(label: 'Nourriture sauvée', value: '${foodKg.toStringAsFixed(1)} kg', icon: Icons.restaurant_outlined)),
            const SizedBox(width: 12),
            Expanded(child: GStat(label: 'CO₂ évité', value: '${co2Kg.toStringAsFixed(1)} kg', icon: Icons.eco_outlined, valueColor: AppTheme.leaf, hint: 'Standard FAO (2,5×)')),
          ],
        ),
        if (_n(eq['smartphonesCharged']) > 0 || _n(eq['kmCarAvoided']) > 0) ...[
          const SizedBox(height: 12),
          GCard(
            color: const Color(0xFFDDEFD9),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.bolt, color: AppTheme.leaf, size: 30),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Soit ${_n(eq['smartphonesCharged']).toInt()} recharges de smartphone et ${_n(eq['kmCarAvoided'])} km de voiture évités.',
                    style: AppTheme.body(16).copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        const GSectionTitle('Progression cumulée'),
        const SizedBox(height: 12),
        Wrap(spacing: 8, children: [
          GChip('Dinars', selected: !_showCo2, onTap: () => setState(() => _showCo2 = false)),
          GChip('CO₂ (kg)', selected: _showCo2, onTap: () => setState(() => _showCo2 = true)),
        ]),
        const SizedBox(height: 12),
        GCard(
          padding: const EdgeInsets.fromLTRB(8, 18, 18, 10),
          child: SizedBox(height: 190, child: history.isEmpty || history.every((e) => _n(_showCo2 ? e['co2'] : e['value']) == 0) ? Center(child: Text('Passez votre première commande pour voir votre courbe.', textAlign: TextAlign.center, style: AppTheme.body(15, AppTheme.muted))) : _SavingsChart(history: history, co2: _showCo2)),
        ),
        const SizedBox(height: 24),
        const GSectionTitle('Dernières commandes'),
        const SizedBox(height: 12),
        if (orders.isEmpty)
          const GEmpty(icon: Icons.receipt_long_outlined, title: 'Aucune commande', message: 'Vos commandes récentes apparaîtront ici.')
        else
          for (final o in orders) ...[_OrderTile(order: o, onRate: () => _rate(o)), const SizedBox(height: 10)],
      ],
    );
  }
}

class _SavingsChart extends StatelessWidget {
  final List<Map<String, dynamic>> history;
  final bool co2;

  const _SavingsChart({required this.history, required this.co2});

  @override
  Widget build(BuildContext context) {
    final spots = <FlSpot>[
      for (var i = 0; i < history.length; i++) FlSpot(i.toDouble(), co2 ? ((history[i]['co2'] as num?) ?? 0).toDouble() : ((history[i]['value'] as num?) ?? 0) / 1000),
    ];
    final maxY = spots.fold<double>(0, (a, s) => s.y > a ? s.y : a);
    final top = maxY <= 0 ? 1.0 : maxY * 1.2;
    final step = (top / 4).clamp(0.5, double.infinity).toDouble();
    return LineChart(
      LineChartData(
        minY: 0,
        maxY: top,
        gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: step, getDrawingHorizontalLine: (_) => const FlLine(color: AppTheme.sand, strokeWidth: 1)),
        borderData: FlBorderData(show: false),
        lineTouchData: const LineTouchData(enabled: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: step,
              getTitlesWidget: (v, meta) => v == meta.max ? const SizedBox.shrink() : Text(v.toStringAsFixed(v == v.roundToDouble() ? 0 : 1), style: AppTheme.mono(13, AppTheme.muted)),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 26,
              interval: 1,
              getTitlesWidget: (v, meta) {
                final i = v.toInt();
                if (i < 0 || i >= history.length || v != i.toDouble()) return const SizedBox.shrink();
                return Padding(padding: const EdgeInsets.only(top: 6), child: Text((history[i]['label'] ?? '').toString(), style: AppTheme.mono(12, AppTheme.muted)));
              },
            ),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.25,
            preventCurveOverShooting: true,
            color: co2 ? AppTheme.leaf : AppTheme.red,
            barWidth: 4,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(show: true, color: (co2 ? AppTheme.leaf : AppTheme.red).withOpacity(0.12)),
          ),
        ],
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  final Map<String, dynamic> order;
  final VoidCallback onRate;

  const _OrderTile({required this.order, required this.onRate});

  @override
  Widget build(BuildContext context) {
    final offer = Map<String, dynamic>.from((order['offerSnapshot'] as Map?) ?? const {});
    final merchant = Map<String, dynamic>.from((order['merchantSnapshot'] as Map?) ?? const {});
    final pricing = Map<String, dynamic>.from((order['pricing'] as Map?) ?? const {});
    final status = (order['status'] ?? '').toString();
    final rating = order['rating'];
    final stars = rating is Map ? (rating['stars'] as num?)?.toInt() : null;
    final canRate = status == 'COMPLETED' && rating == null;
    final total = (pricing['totalMillimes'] as num?)?.toInt() ?? 0;
    final saved = ((pricing['savedMillimes'] ?? pricing['moneySavedMillimes']) as num?)?.toInt() ?? 0;

    return GCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(8)),
                child: Text((order['orderCode'] ?? '').toString(), style: AppTheme.mono(13, AppTheme.mustard).copyWith(fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              GPill(_statusLabel(status), color: status == 'COMPLETED' ? AppTheme.leaf : (status == 'CANCELLED' || status == 'EXPIRED' || status == 'NO_SHOW' ? AppTheme.muted : AppTheme.orange)),
            ],
          ),
          const SizedBox(height: 10),
          Text((offer['title'] ?? '').toString().toUpperCase(), style: AppTheme.h3(19), maxLines: 2, overflow: TextOverflow.ellipsis),
          Text((merchant['name'] ?? '').toString(), style: AppTheme.body(15, AppTheme.muted)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text(saved > 0 ? 'Économisé : ${Money.formatTND(saved)}' : '', style: AppTheme.body(14, AppTheme.leaf).copyWith(fontWeight: FontWeight.w700))),
              Text(Money.formatTND(total), style: AppTheme.figure(30, AppTheme.red)),
            ],
          ),
          if (stars != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Row(children: [for (var i = 1; i <= 5; i++) Icon(i <= stars ? Icons.star : Icons.star_border, size: 20, color: AppTheme.orange)]),
            ),
          if (canRate) ...[const SizedBox(height: 10), GButton('Noter cette commande', icon: Icons.star_outline, variant: GVariant.mustard, small: true, onPressed: onRate)],
        ],
      ),
    );
  }

  static String _statusLabel(String s) => switch (s) {
        'RESERVED' => 'Réservée',
        'PAID' => 'À retirer',
        'COMPLETED' => 'Retirée',
        'CANCELLED' => 'Annulée',
        'EXPIRED' => 'Expirée',
        'NO_SHOW' => 'Non retirée',
        _ => s,
      };
}
