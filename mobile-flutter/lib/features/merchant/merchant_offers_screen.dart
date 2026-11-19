// 💡 Concept & Analogie : Comme le carnet d'inventaire du commerçant où sont consignées les promotions du jour avec leur stock restant et leur état de vente.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `ListView.builder` avec des tuiles `Dismissible` ou des boutons d'actions contextuels ; en React, il correspond à `MerchantOffersPage.jsx`.
// 🎯 À retenir pour la soutenance : "Permet au commerçant de suivre en direct l'écoulement de ses stocks et de désactiver une offre si le dernier plat est vendu sur place."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/models/offer_model.dart';
import '../../core/domain/money.dart';
import 'offer_form_screen.dart';

class MerchantOffersScreen extends StatefulWidget {
  const MerchantOffersScreen({super.key});

  @override
  State<MerchantOffersScreen> createState() => _MerchantOffersScreenState();
}

class _MerchantOffersScreenState extends State<MerchantOffersScreen> {
  // Liste des offres du commerçant (données simulées)
  final List<OfferModel> _offers = [
    OfferModel(
      id: 'off-m1',
      merchantId: 'm-current',
      merchantName: 'Chez Chaker Montfleury',
      title: 'Makloub Escalope Panée & Double Fromage',
      description: 'Pain makloub artisanal, escalope panée et sauce maison.',
      category: 'SANDWICH',
      pricingType: 'DUTCH',
      originalPriceMillimes: 7500,
      targetPriceMillimes: 3800,
      quantity: 5,
      remainingQuantity: 3,
      pickupStartAt: DateTime.now().subtract(const Duration(minutes: 30)),
      pickupEndAt: DateTime.now().add(const Duration(minutes: 60)),
      status: 'ACTIVE',
    ),
    OfferModel(
      id: 'off-m2',
      merchantId: 'm-current',
      merchantName: 'Chez Chaker Montfleury',
      title: 'Panier Surprise Salés du Midi',
      description: 'Assortiment de mini-chapatis et fricassés tunisiens.',
      category: 'MIXTE',
      pricingType: 'FIXED',
      originalPriceMillimes: 6000,
      targetPriceMillimes: 2500,
      quantity: 4,
      remainingQuantity: 0,
      pickupStartAt: DateTime.now().subtract(const Duration(hours: 2)),
      pickupEndAt: DateTime.now().subtract(const Duration(minutes: 10)),
      isSurpriseBasket: true,
      status: 'SOLD_OUT',
    ),
  ];

  void _deleteOffer(int index) {
    final title = _offers[index].title;
    setState(() {
      _offers.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🗑️ Offre "$title" retirée du catalogue'),
        backgroundColor: AppTheme.biscuit,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text('Mes Offres Publiées', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: _offers.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text('📋', style: TextStyle(fontSize: 48)),
                    SizedBox(height: 12),
                    Text(
                      'Aucune offre active pour le moment',
                      style: TextStyle(color: AppTheme.muted, fontSize: 14),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _offers.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final offer = _offers[index];
                  final isSoldOut = offer.status == 'SOLD_OUT' || offer.remainingQuantity == 0;

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.biscuit,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSoldOut ? AppTheme.sand : AppTheme.red.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isSoldOut
                                    ? AppTheme.sand
                                    : AppTheme.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isSoldOut ? 'ÉPUISÉ' : 'EN LIGNE',
                                style: TextStyle(
                                  color: isSoldOut ? AppTheme.muted : AppTheme.red,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: AppTheme.muted, size: 20),
                              onPressed: () => _deleteOffer(index),
                              tooltip: 'Supprimer l offre',
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          offer.title,
                          style: const TextStyle(
                            color: AppTheme.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          offer.description,
                          style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Stock : ${offer.remainingQuantity} / ${offer.quantity}',
                              style: const TextStyle(color: AppTheme.muted, fontSize: 13),
                            ),
                            Text(
                              '${Money.formatTND(offer.targetPriceMillimes)} (de base ${Money.formatTND(offer.originalPriceMillimes)})',
                              style: const TextStyle(
                                color: AppTheme.red,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.red,
        foregroundColor: AppTheme.cream,
        icon: const Icon(Icons.add),
        label: const Text('Publier une Offre', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const OfferFormScreen()),
          );
        },
      ),
    );
  }
}
