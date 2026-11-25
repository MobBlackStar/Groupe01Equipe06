// 💡 Concept & Analogie : Le pupitre de la cuisine où s'affichent les plats à emporter payés d'avance, lus depuis les vraies commandes du commerce.
// 🔄 Comparaison React / Flutter : Équivalent de la page « Commandes » du site : `GET /merchants/me/orders`, regroupées par statut.
// 🎯 À retenir pour la soutenance : "Le commerçant voit les retraits réels de son commerce ; le scanner QR est l'onglet voisin."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../core/models/order_model.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';

class MerchantOrdersScreen extends StatefulWidget {
  const MerchantOrdersScreen({super.key});

  @override
  State<MerchantOrdersScreen> createState() => _MerchantOrdersScreenState();
}

class _MerchantOrdersScreenState extends State<MerchantOrdersScreen> {
  List<({OrderModel order, String student})> _orders = const [];
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
      final raw = await CampusApi.shared.fetchMerchantOrders();
      final orders = raw.map((m) {
        final snap = m['studentSnapshot'] is Map ? Map<String, dynamic>.from(m['studentSnapshot'] as Map) : const <String, dynamic>{};
        return (order: OrderModel.fromApi(m), student: (snap['displayName'] ?? 'Étudiant').toString());
      }).toList();
      if (!mounted) return;
      setState(() {
        _orders = orders;
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

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: GScreenBody(
        eyebrow: 'Espace commerçant',
        title: 'Retraits',
        bottom: const TabBar(
          indicatorColor: AppTheme.red,
          labelColor: AppTheme.red,
          unselectedLabelColor: AppTheme.muted,
          tabs: [Tab(text: 'Payées'), Tab(text: 'Réservées'), Tab(text: 'Terminées')],
        ),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.red))
            : _error != null
                ? ListView(padding: const EdgeInsets.all(20), children: [GEmpty(icon: Icons.cloud_off_outlined, title: 'Commandes indisponibles', message: _error!, actionLabel: 'Réessayer', onAction: _load)])
                : TabBarView(children: [_buildList('PAID'), _buildList('RESERVED'), _buildList('COMPLETED')]),
      ),
    );
  }

  Widget _buildList(String status) {
    final list = _orders.where((o) => o.order.status == status).toList();

    return RefreshIndicator(
      color: AppTheme.red,
      onRefresh: _load,
      child: list.isEmpty
          ? ListView(padding: const EdgeInsets.all(20), children: const [GEmpty(icon: Icons.inbox_outlined, title: 'Rien ici', message: 'Aucune commande sous ce statut.')])
          : ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _OrderTile(order: list[i].order, student: list[i].student),
            ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  final OrderModel order;
  final String student;

  const _OrderTile({required this.order, required this.student});

  static String _hm(DateTime? d) {
    if (d == null) return '';
    final l = d.toLocal();
    return '${l.hour.toString().padLeft(2, '0')}h${l.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final slot = (order.pickupStartAt != null && order.pickupEndAt != null) ? '${_hm(order.pickupStartAt)} – ${_hm(order.pickupEndAt)}' : '';
    return GCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(8)),
                child: Text(order.orderCode, style: AppTheme.mono(13, AppTheme.mustard).copyWith(fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              if (slot.isNotEmpty) Text(slot, style: AppTheme.mono(13, AppTheme.muted)),
            ],
          ),
          const SizedBox(height: 10),
          Text(order.summaryTitle.toUpperCase(), style: AppTheme.h3(20)),
          if (order.normalizedItems.length > 1) ...[
            const SizedBox(height: 4),
            Text(
              order.normalizedItems.map((l) => '${l.quantity}x ${l.title}').join(' · '),
              style: AppTheme.body(13, AppTheme.muted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 2),
          Row(children: [
            const Icon(Icons.person_outline, size: 18, color: AppTheme.red),
            const SizedBox(width: 6),
            Expanded(child: Text(student, style: AppTheme.body(15, AppTheme.muted), overflow: TextOverflow.ellipsis)),
          ]),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text('${order.totalQuantity} portion${order.totalQuantity > 1 ? 's' : ''}', style: AppTheme.body(15, AppTheme.muted))),
              Text(Money.formatTND(order.totalMillimes), style: AppTheme.figure(34, AppTheme.red)),
            ],
          ),
        ],
      ),
    );
  }
}
