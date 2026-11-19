// 💡 Concept & Analogie : Le pupitre de commande de la cuisine où s'affichent les plats à emporter payés d'avance par les étudiants.
// 🔄 Comparaison React / Flutter : En Flutter, les commandes se consultent avec des tuiles à haute lisibilité et accès direct au scanner caméra ; en React, il correspond à `MerchantOrdersPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le commerçant consulte en direct les retraits de la journée et accède au scanner QR pour valider la délivrance en 1 seconde."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';

import '../../widgets/griddle.dart';
class MerchantOrdersScreen extends StatefulWidget {
  const MerchantOrdersScreen({super.key});

  @override
  State<MerchantOrdersScreen> createState() => _MerchantOrdersScreenState();
}

class _MerchantOrdersScreenState extends State<MerchantOrdersScreen> {
  final List<Map<String, dynamic>> _orders = [
    {
      'id': 'ord-m-1',
      'orderCode': 'CS-8K4M9',
      'customerName': 'Yassine Trabelsi (ESSECT 3A)',
      'title': 'Baguette Farcie Escalope Panée & Fromage',
      'quantity': 2,
      'totalPriceMillimes': 7600,
      'status': 'PAID',
      'pickupSlot': 'Aujourd hui 17h00 – 18h30',
    },
    {
      'id': 'ord-m-2',
      'orderCode': 'CS-3T7X1',
      'customerName': 'Sarra Ben Salem (ESSECT 2A)',
      'title': 'Panier Surprise Salés du Midi',
      'quantity': 1,
      'totalPriceMillimes': 2500,
      'status': 'RESERVED',
      'pickupSlot': 'Aujourd hui 17h30 – 19h00',
    },
    {
      'id': 'ord-m-3',
      'orderCode': 'CS-9M2K4',
      'customerName': 'Mohamed Dridi (ESSECT 1A)',
      'title': 'Makloub Escalope Panée',
      'quantity': 1,
      'totalPriceMillimes': 3800,
      'status': 'COMPLETED',
      'pickupSlot': 'Hier 18h15',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppTheme.cream,
        
        body: GScreenBody(eyebrow: 'Espace commerçant', title: 'Retraits', bottom: const TabBar(
            indicatorColor: AppTheme.red,
            labelColor: AppTheme.red,
            unselectedLabelColor: AppTheme.muted,
            tabs: [
              Tab(text: 'Payées'),
              Tab(text: 'Réservées'),
              Tab(text: 'Terminées'),
            ],
          ), child: TabBarView(
          children: [
            _buildList('PAID'),
            _buildList('RESERVED'),
            _buildList('COMPLETED'),
          ],
        )),
        floatingActionButton: FloatingActionButton.extended(
          backgroundColor: AppTheme.red,
          foregroundColor: AppTheme.cream,
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Scanner un Retrait', style: TextStyle(fontWeight: FontWeight.bold)),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Ouverture du scanner caméra commerçant...'),
                backgroundColor: AppTheme.biscuit,
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildList(String status) {
    final list = _orders.where((o) => o['status'] == status).toList();

    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text('📦', style: TextStyle(fontSize: 48)),
            SizedBox(height: 12),
            Text('Aucune commande sous ce statut', style: TextStyle(color: AppTheme.muted, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = list[index];

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.biscuit,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: status == 'PAID' ? AppTheme.red.withOpacity(0.3) : AppTheme.sand,
            ),
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
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.red.withOpacity(0.4)),
                    ),
                    child: Text(
                      item['orderCode'] as String,
                      style: const TextStyle(color: AppTheme.red, fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  Text(
                    item['pickupSlot'] as String,
                    style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                item['title'] as String,
                style: const TextStyle(color: AppTheme.ink, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '👤 Client : ${item['customerName']}',
                style: const TextStyle(color: AppTheme.muted, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Quantité : ${item['quantity']} portion(s)',
                    style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                  Text(
                    Money.formatTND(item['totalPriceMillimes'] as int),
                    style: const TextStyle(color: AppTheme.red, fontSize: 14, fontWeight: FontWeight.bold),
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
