// 💡 Concept & Analogie : Le portefeuille de tickets de l'étudiant répertoriant toutes ses actions anti-gaspillage passées et ses retraits programmés.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `DefaultTabController` avec des `TabBar` et `ListView.separated` ; en React, il correspond à `MyOrdersPage.jsx`.
// 🎯 À retenir pour la soutenance : "Une navigation fluide par onglets séparant les commandes actives prêtes pour retrait et l'historique archivé."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../core/models/order_model.dart';
import '../../core/time/server_clock.dart';
import '../../services/campus_api.dart';
import '../ticket/ticket_screen.dart';
import '../checkout/checkout_screen.dart';

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

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppTheme.darkBackground,
        appBar: AppBar(
          title: const Text('Mes Commandes', style: TextStyle(fontWeight: FontWeight.bold)),
          centerTitle: true,
          bottom: const TabBar(
            indicatorColor: AppTheme.limeAccent,
            labelColor: AppTheme.limeAccent,
            unselectedLabelColor: Colors.white54,
            tabs: [
              Tab(text: '⚡ En cours'),
              Tab(text: '✓ Terminées'),
              Tab(text: '✕ Annulées'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrderList(['PAID', 'RESERVED']),
            _buildOrderList(['COMPLETED']),
            _buildOrderList(['CANCELLED', 'EXPIRED', 'NO_SHOW', 'FAILED']),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderList(List<String> allowedStatuses) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.limeAccent));
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
        color: AppTheme.limeAccent,
        backgroundColor: AppTheme.surfaceCard,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 120),
            Column(
              children: [
                Text(_error != null ? '⚠️' : '🛍️', style: const TextStyle(fontSize: 48)),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    _error ?? 'Aucune commande dans cet onglet',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.limeAccent,
      backgroundColor: AppTheme.surfaceCard,
      child: ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final order = list[index];
        final status = effectiveStatus(order);
        final total = order.totalMillimes;

        Color badgeColor = AppTheme.limeAccent;
        String badgeText = 'PAID';
        if (status == 'RESERVED') {
          badgeColor = AppTheme.orangeUrgent;
          badgeText = 'RÉSERVÉ (10 MIN)';
        } else if (status == 'COMPLETED') {
          badgeColor = Colors.greenAccent;
          badgeText = 'RÉCUPÉRÉ';
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: badgeColor.withOpacity(0.4)),
                    ),
                    child: Text(
                      order.orderCode,
                      style: TextStyle(color: badgeColor, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                order.offerTitle,
                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '🏪 ${order.merchantName}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Quantité : ${order.quantity} • Total : ${Money.formatTND(total)}',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  if (status == 'PAID')
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => TicketScreen(orderId: order.id),
                          ),
                        );
                      },
                      icon: const Icon(Icons.qr_code, size: 14, color: Colors.black),
                      label: const Text('Living Ticket', style: TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.limeAccent,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  if (status == 'RESERVED')
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CheckoutScreen(order: order),
                          ),
                        ).then((_) => _load());
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.orangeUrgent,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Payer (10 min)', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    ),
    );
  }
}
