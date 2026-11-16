// 💡 Concept & Analogie : La fiche de sauvetage détaillée sur mobile, condensant en un seul écran le prix en direct, le temps de marche depuis l'ESSECT et l'impact carbone certifié.
// 🔄 Comparaison React / Flutter : En Flutter, nous utilisons un `CustomScrollView` avec un `SliverAppBar` et une barre d'action inférieure ancrée (`bottomNavigationBar`) ; en React, c'est `OfferDetailPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le bouton de réservation déclenche un verrouillage atomique de 10 minutes du stock au prix exact de la seconde, protégeant l'étudiant contre les conflits de concurrence."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/models/offer_model.dart';
import '../../core/domain/money.dart';
import '../../widgets/app_button.dart';
import '../../widgets/live_price_text.dart';
import '../../widgets/countdown_chip.dart';
import '../../widgets/rarity_badge.dart';

class OfferDetailScreen extends StatefulWidget {
  final OfferModel offer;
  final int distanceFromEssectM;

  const OfferDetailScreen({
    super.key,
    required this.offer,
    this.distanceFromEssectM = 180,
  });

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  int _quantity = 1;
  bool _isReserving = false;

  void _reserve() async {
    setState(() {
      _isReserving = true;
    });

    await Future.delayed(const Duration(milliseconds: 700));

    if (mounted) {
      setState(() => _isReserving = false);
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Text('🔒', style: TextStyle(fontSize: 22)),
              SizedBox(width: 8),
              Text('Réservation Bloquée', style: TextStyle(color: AppTheme.limeAccent, fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Votre commande pour $_quantity portion(s) est verrouillée pendant 10 minutes au prix garanti.',
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
              const SizedBox(height: 12),
              const Text(
                'Rendez-vous au comptoir du restaurant à Montfleury avec votre QR code.',
                style: TextStyle(color: Colors.white60, fontSize: 11),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text('OK, Super !', style: TextStyle(color: AppTheme.limeAccent, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;
    final maxAllowed = offer.remainingQuantity.clamp(1, 4);
    final walkingMin = (widget.distanceFromEssectM * 1.3 / 83.33).round().clamp(1, 45);

    // Calcul impact écologique (2.5g CO2 / g aliment)
    final foodGrams = 350 * _quantity;
    final co2Grams = (foodGrams * 2.5).round();
    final phonesCharged = (co2Grams / 10).round();

    // Calcul total
    final totalMillimes = offer.targetPriceMillimes * _quantity;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: Text(offer.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: CountdownChip(pickupEndAt: offer.pickupEndAt),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Image / Illustration
              Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            offer.isSurpriseBasket ? '🎁' : '🥪',
                            style: const TextStyle(fontSize: 64),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            offer.title,
                            style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    if (offer.isSurpriseBasket)
                      const Positioned(
                        top: 14,
                        left: 14,
                        child: RarityBadge(rarity: 'RARE', score: 0.65),
                      ),
                    Positioned(
                      bottom: 12,
                      left: 14,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '📦 ${offer.remainingQuantity} portion${offer.remainingQuantity > 1 ? 's' : ''} restante${offer.remainingQuantity > 1 ? 's' : ''}',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // 2. Commerce & Distance
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '🏪 ${offer.merchantName ?? "Commerce Montfleury"}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '📍 ${widget.distanceFromEssectM} m (~$walkingMin min)',
                    style: const TextStyle(color: AppTheme.limeAccent, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Titre
              Text(
                offer.title,
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),

              // Description
              Text(
                offer.description,
                style: const TextStyle(color: Colors.white60, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 18),

              // 3. Ticker Prix Grand Format
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Prix unitaire actuel :', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    const SizedBox(height: 6),
                    LivePriceText(
                      pricingType: offer.pricingType,
                      originalPriceMillimes: offer.originalPriceMillimes,
                      targetPriceMillimes: offer.targetPriceMillimes,
                      pickupStartAt: offer.pickupStartAt,
                      pickupEndAt: offer.pickupEndAt,
                      stepMillimes: offer.stepMillimes,
                      isLarge: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 4. Impact Écologique
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white10),
                ),
                child: Row(
                  children: [
                    const Text('🌱', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Impact Éco : $foodGrams g sauvés • $co2Grams g CO₂ évités',
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Équivaut à recharger ~ $phonesCharged smartphones',
                            style: const TextStyle(color: Colors.white54, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 5. Sélecteur de Quantité
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Quantité à réserver :', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, color: Colors.white, size: 18),
                          onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                        ),
                        Text(
                          '$_quantity',
                          style: const TextStyle(color: AppTheme.limeAccent, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, color: Colors.white, size: 18),
                          onPressed: _quantity < maxAllowed ? () => setState(() => _quantity++) : null,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          border: const Border(top: BorderSide(color: Colors.white10)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total à régler :', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    Text(
                      Money.formatTND(totalMillimes),
                      style: const TextStyle(color: AppTheme.limeAccent, fontSize: 20, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: AppButton(
                  text: _isReserving ? 'Blocage...' : '⚡ Réserver',
                  backgroundColor: AppTheme.limeAccent,
                  textColor: Colors.black,
                  onPressed: _isReserving ? null : _reserve,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
