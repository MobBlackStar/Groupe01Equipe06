// 💡 Concept & Analogie : Le portefeuille de tickets de l'étudiant répertoriant toutes ses actions anti-gaspillage passées et ses retraits programmés.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `DefaultTabController` avec des `TabBar` et `ListView.separated` ; en React, il correspond à `MyOrdersPage.jsx`.
// 🎯 À retenir pour la soutenance : "Une navigation fluide par onglets séparant les commandes actives prêtes pour retrait et l'historique archivé."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../ticket/ticket_screen.dart';
import '../checkout/checkout_screen.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  final List<Map<String, dynamic>> _orders = [
    {
      'id': 'ord-1',
      'orderCode': 'CS-8K4M9',
      'title': 'Baguette Farcie Escalope Panée & Fromage',
      'merchantName': 'Baguette & Baguette Montfleury',
      'quantity': 2,
      'unitPriceMillimes': 3800,
      'status': 'PAID',
    },
    {
      'id': 'ord-2',
      'orderCode': 'CS-3T7X1',
      'title': 'Panier Surprise Viennoiseries du Matin',
      'merchantName': "Cafétéria L'Étoile du Savoir",
      'quantity': 1,
      'unitPriceMillimes': 2500,
      'status': 'RESERVED',
      'expiresAt': DateTime.now().add(const Duration(minutes: 8)),
    },
    {
      'id': 'ord-3',
      'orderCode': 'CS-9M2K4',
      'title': 'Ojja Royale aux Merguez & Œuf',
      'merchantName': 'Restaurant Le Dôme Montfleury',
      'quantity': 1,
      'unitPriceMillimes': 4500,
      'status': 'COMPLETED',
    },
  ];

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
            _buildOrderList(['CANCELLED', 'EXPIRED']),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderList(List<String> allowedStatuses) {
    final list = _orders.where((o) => allowedStatuses.contains(o['status'])).toList();

    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text('🛍️', style: TextStyle(fontSize: 48)),
            SizedBox(height: 12),
            Text('Aucune commande dans cet onglet', style: TextStyle(color: Colors.white70, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final order = list[index];
        final status = order['status'] as String;
        final total = (order['unitPriceMillimes'] as int) * (order['quantity'] as int);

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
                      order['orderCode'] as String,
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
                order['title'] as String,
                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '🏪 ${order['merchantName']}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Quantité : ${order['quantity']} • Total : ${Money.formatTND(total)}',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  if (status == 'PAID')
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => TicketScreen(
                              orderId: order['id'] as String,
                              orderCode: order['orderCode'] as String,
                              offerTitle: order['title'] as String,
                              merchantName: order['merchantName'] as String,
                              quantity: order['quantity'] as int,
                            ),
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
                            builder: (context) => CheckoutScreen(
                              orderId: order['id'] as String,
                              orderCode: order['orderCode'] as String,
                              offerTitle: order['title'] as String,
                              merchantName: order['merchantName'] as String,
                              quantity: order['quantity'] as int,
                              lockedUnitPriceMillimes: order['unitPriceMillimes'] as int,
                              reservationExpiresAt: order['expiresAt'] as DateTime? ?? DateTime.now().add(const Duration(minutes: 8)),
                            ),
                          ),
                        );
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
    );
  }
}
