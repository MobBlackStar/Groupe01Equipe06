// 💡 Concept & Analogie : Le portefeuille de tickets de l'étudiant : à payer, à retirer, retiré, annulé, avec le bon geste sur chaque carte (payer, annuler, noter, rouvrir le panier).
// 🔄 Comparaison React / Flutter : Équivalent de `MyOrdersPage.jsx` : `GET /orders/my-orders`, annulation `POST /orders/:id/cancel`, note `POST /orders/:id/rating`.
// 🎯 À retenir pour la soutenance : "Une réservation non payée peut être annulée (stock libéré, coupon restitué) ; une commande retirée peut être notée une fois, et le contenu d'un panier surprise se rouvre."

import 'package:flutter/material.dart';

import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../core/models/order_model.dart';
import '../../core/time/server_clock.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import '../../widgets/order_actions.dart';
import '../checkout/checkout_screen.dart';
import '../ticket/ticket_screen.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  List<OrderModel> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// `GET /orders/my-orders` : commandes réelles de l'étudiant (statut, prix gelé, code) ; rien n'est simulé localement.
  Future<void> _load() async {
    try {
      final orders = await CampusApi.shared.fetchMyOrders();
      if (!mounted) return;
      setState(() {
        _orders = orders;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _cancel(OrderModel order) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Annuler la réservation ?', style: AppTheme.h3(22)),
        content: Text('Le stock sera libéré et votre coupon éventuel restitué.', style: AppTheme.body(16)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Garder')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Annuler la réservation')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await CampusApi.shared.cancelOrder(order.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Réservation annulée.')));
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _rate(OrderModel order) async {
    final saved = await showRateOrderDialog(context, orderId: order.id, title: order.offerTitle);
    if (saved) _load();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppTheme.cream,
        body: GScreenBody(
          eyebrow: 'Espace étudiant',
          title: 'Mes tickets',
          bottom: const TabBar(
            indicatorColor: AppTheme.red,
            labelColor: AppTheme.red,
            unselectedLabelColor: AppTheme.muted,
            tabs: [Tab(text: 'En cours'), Tab(text: 'Terminées'), Tab(text: 'Annulées')],
          ),
          child: TabBarView(
            children: [
              _buildOrderList(['PAID', 'RESERVED']),
              _buildOrderList(['COMPLETED']),
              _buildOrderList(['CANCELLED', 'EXPIRED', 'NO_SHOW', 'FAILED']),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrderList(List<String> allowedStatuses) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.red));
    }

    final nowMs = ServerClock.serverNowMs;
    // Une réservation dont les 10 minutes sont écoulées n'est plus payable : elle passe dans « Annulées ».
    String effectiveStatus(OrderModel o) {
      final exp = o.reservationExpiresAt?.millisecondsSinceEpoch;
      return (o.isReserved && exp != null && exp < nowMs) ? 'EXPIRED' : o.status;
    }

    final list = _orders.where((o) => allowedStatuses.contains(effectiveStatus(o))).toList();

    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        color: AppTheme.red,
        backgroundColor: AppTheme.biscuit,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: GEmpty(
                icon: _error != null ? Icons.cloud_off : Icons.confirmation_number_outlined,
                title: _error != null ? 'Connexion impossible' : 'Aucun ticket ici',
                message: _error ?? 'Vos commandes de cet onglet apparaîtront ici. Réservez une offre pour obtenir un Living Ticket.',
                actionLabel: _error != null ? 'Réessayer' : null,
                onAction: _error != null ? _load : null,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.red,
      backgroundColor: AppTheme.biscuit,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        itemCount: list.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final order = list[index];
          return _OrderCard(
            order: order,
            status: effectiveStatus(order),
            onTicket: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TicketScreen(orderId: order.id))).then((_) => _load()),
            onPay: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CheckoutScreen(order: order))).then((_) => _load()),
            onCancel: () => _cancel(order),
            onRate: () => _rate(order),
            onReveal: () => showUnboxingSheet(context, order),
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  final String status;
  final VoidCallback onTicket;
  final VoidCallback onPay;
  final VoidCallback onCancel;
  final VoidCallback onRate;
  final VoidCallback onReveal;

  const _OrderCard({required this.order, required this.status, required this.onTicket, required this.onPay, required this.onCancel, required this.onRate, required this.onReveal});

  @override
  Widget build(BuildContext context) {
    final (String label, Color color) = switch (status) {
      'RESERVED' => ('À payer', AppTheme.orange),
      'PAID' => ('À retirer', AppTheme.red),
      'COMPLETED' => ('Retirée', AppTheme.leaf),
      'CANCELLED' => ('Annulée', AppTheme.muted),
      'EXPIRED' => ('Expirée', AppTheme.muted),
      'NO_SHOW' => ('Non retirée', AppTheme.muted),
      _ => (status, AppTheme.muted),
    };
    final stars = order.ratingStars;

    return GCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
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
              GPill(label, color: color),
            ],
          ),
          const SizedBox(height: 10),
          Text(order.offerTitle.toUpperCase(), style: AppTheme.h3(20), maxLines: 2, overflow: TextOverflow.ellipsis),
          Row(children: [
            const Icon(Icons.storefront_outlined, size: 17, color: AppTheme.red),
            const SizedBox(width: 6),
            Expanded(child: Text(order.merchantName, style: AppTheme.body(15, AppTheme.muted), overflow: TextOverflow.ellipsis)),
          ]),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text('${order.quantity} portion${order.quantity > 1 ? 's' : ''}', style: AppTheme.body(15, AppTheme.muted))),
              Text(Money.formatTND(order.totalMillimes), style: AppTheme.figure(34, AppTheme.red)),
            ],
          ),
          if (status == 'PAID') ...[const SizedBox(height: 12), GButton('Mon Living Ticket', icon: Icons.qr_code_2, onPressed: onTicket)],
          if (status == 'RESERVED') ...[
            const SizedBox(height: 12),
            GButton('Payer ${Money.formatTND(order.totalMillimes)}', icon: Icons.lock_outline, onPressed: onPay),
            const SizedBox(height: 8),
            GButton('Annuler la réservation', variant: GVariant.cream, small: true, onPressed: onCancel),
          ],
          if (status == 'COMPLETED') ...[
            if (stars != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(children: [for (var i = 1; i <= 5; i++) Icon(i <= stars ? Icons.star : Icons.star_border, size: 20, color: AppTheme.orange)]),
              ),
            if (order.isSurpriseBasket && order.revealItems.isNotEmpty) ...[const SizedBox(height: 12), GButton('Revoir mon panier', icon: Icons.card_giftcard, variant: GVariant.mustard, small: true, onPressed: onReveal)],
            if (stars == null) ...[const SizedBox(height: 10), GButton('Noter cette commande', icon: Icons.star_outline, variant: GVariant.cream, small: true, onPressed: onRate)],
          ],
        ],
      ),
    );
  }
}
