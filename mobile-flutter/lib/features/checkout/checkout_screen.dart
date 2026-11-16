// 💡 Concept & Analogie : Comme l'écran du terminal de paiement qui maintient votre réservation au chaud pendant 10 minutes avant de débloquer le billet d'embarquement.
// 🔄 Comparaison React / Flutter : En Flutter, ce formulaire mobile utilise un `Timer.periodic` pour animer le compte à rebours de 10 min et un `ElevatedButton` à retour haptique ; en React, il correspond à `CheckoutPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le verrouillage atomique de 10 minutes empêche la surréservation et garantit le prix gelé face aux variations de l'enchère hollandaise."

import 'dart:async';
import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../widgets/app_button.dart';
import '../ticket/ticket_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final String orderId;
  final String orderCode;
  final String offerTitle;
  final String merchantName;
  final int quantity;
  final int lockedUnitPriceMillimes;
  final DateTime reservationExpiresAt;

  const CheckoutScreen({
    super.key,
    required this.orderId,
    this.orderCode = 'CS-8K4M9',
    this.offerTitle = 'Baguette Farcie Escalope Panée & Fromage',
    this.merchantName = 'Baguette & Baguette Montfleury',
    this.quantity = 2,
    this.lockedUnitPriceMillimes = 3800,
    required this.reservationExpiresAt,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  Timer? _timer;
  late int _nowMs;
  bool _isPaying = false;
  String _selectedReward = 'NONE'; // 'NONE', 'DISCOUNT_20', 'FREE_BASKET'

  @override
  void initState() {
    super.initState();
    _nowMs = DateTime.now().millisecondsSinceEpoch;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _nowMs = DateTime.now().millisecondsSinceEpoch;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _payWithKonnect() async {
    setState(() => _isPaying = true);
    await Future.delayed(const Duration(milliseconds: 900));

    if (mounted) {
      setState(() => _isPaying = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => TicketScreen(
            orderId: widget.orderId,
            orderCode: widget.orderCode,
            offerTitle: widget.offerTitle,
            merchantName: widget.merchantName,
            quantity: widget.quantity,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final expiresMs = widget.reservationExpiresAt.millisecondsSinceEpoch;
    final diffMs = expiresMs - _nowMs;
    final secondsLeft = diffMs > 0 ? (diffMs / 1000).floor() : 0;
    final isExpired = secondsLeft <= 0;

    final minStr = (secondsLeft ~/ 60).toString().padLeft(2, '0');
    final secStr = (secondsLeft % 60).toString().padLeft(2, '0');

    final subtotal = widget.lockedUnitPriceMillimes * widget.quantity;
    int discount = 0;
    if (_selectedReward == 'DISCOUNT_20') {
      discount = (subtotal * 0.2).round();
    } else if (_selectedReward == 'FREE_BASKET') {
      discount = subtotal;
    }
    final netTotal = (subtotal - discount).clamp(0, subtotal);

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Validation de Commande', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Compte à rebours 10 min
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isExpired
                      ? AppTheme.redCritical.withOpacity(0.15)
                      : AppTheme.limeAccent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isExpired ? AppTheme.redCritical : AppTheme.limeAccent.withOpacity(0.4),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text('⏳', style: TextStyle(fontSize: 22)),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isExpired ? 'Réservation Expirée' : 'Stock Verrouillé (10 min)',
                              style: TextStyle(
                                color: isExpired ? AppTheme.redCritical : AppTheme.limeAccent,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const Text(
                              'Prix unitaire garanti au millime',
                              style: TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Text(
                      '$minStr:$secStr',
                      style: TextStyle(
                        color: isExpired ? AppTheme.redCritical : AppTheme.limeAccent,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 2. Récapitulatif
              Container(
                padding: const EdgeInsets.all(18),
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
                        const Text('RÉCAPITULATIF', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppTheme.limeAccent.withOpacity(0.3)),
                          ),
                          child: Text(
                            widget.orderCode,
                            style: const TextStyle(color: AppTheme.limeAccent, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      widget.offerTitle,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '🏪 ${widget.merchantName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    const Divider(color: Colors.white10, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Quantité :', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        Text('x ${widget.quantity} portion(s)', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Prix unitaire verrouillé :', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        Text(
                          Money.formatTND(widget.lockedUnitPriceMillimes),
                          style: const TextStyle(color: AppTheme.limeAccent, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    if (discount > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Avantage fidélité :', style: TextStyle(color: Colors.amber, fontSize: 13)),
                          Text(
                            '-${Money.formatTND(discount)}',
                            style: const TextStyle(color: Colors.amber, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                    const Divider(color: Colors.white10, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Net à Régler :', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        Text(
                          Money.formatTND(netTotal),
                          style: const TextStyle(color: AppTheme.limeAccent, fontSize: 22, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 3. Récompense Fidélité
              const Text('Récompense Fidélité EcoPoints', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildRewardChip('NONE', 'Aucune'),
                  const SizedBox(width: 8),
                  _buildRewardChip('DISCOUNT_20', '-20% Réduc'),
                  const SizedBox(width: 8),
                  _buildRewardChip('FREE_BASKET', '100% Offert ✨'),
                ],
              ),
              const SizedBox(height: 30),

              // 4. Boutons
              AppButton(
                text: _isPaying
                    ? 'Connexion sécurisée Konnect...'
                    : netTotal == 0
                        ? '✨ Valider la Commande Gratuite'
                        : '💳 Payer ${Money.formatTND(netTotal)} avec Konnect',
                backgroundColor: AppTheme.limeAccent,
                textColor: Colors.black,
                onPressed: isExpired || _isPaying ? null : _payWithKonnect,
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Annuler et libérer le stock', style: TextStyle(color: Colors.white54, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardChip(String id, String label) {
    final isSel = _selectedReward == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedReward = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSel ? AppTheme.limeAccent.withOpacity(0.15) : AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSel ? AppTheme.limeAccent : Colors.white10),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSel ? AppTheme.limeAccent : Colors.white70,
                fontSize: 11,
                fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
