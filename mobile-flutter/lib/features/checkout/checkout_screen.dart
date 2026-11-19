// 💡 Concept & Analogie : Comme l'écran du terminal de paiement qui maintient votre réservation au chaud pendant 10 minutes avant de débloquer le billet d'embarquement.
// 🔄 Comparaison React / Flutter : En Flutter, ce formulaire mobile utilise un `Timer.periodic` pour animer le compte à rebours de 10 min et un `ElevatedButton` à retour haptique ; en React, il correspond à `CheckoutPage.jsx`.
// 🎯 À retenir pour la soutenance : "Le verrouillage atomique de 10 minutes empêche la surréservation et garantit le prix gelé face aux variations de l'enchère hollandaise."

import 'dart:async';
import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/domain/money.dart';
import '../../core/models/order_model.dart';
import '../../core/time/server_clock.dart';
import '../../services/campus_api.dart';
import '../../widgets/app_button.dart';
import '../ticket/ticket_screen.dart';
import 'payment_webview_screen.dart';

class CheckoutScreen extends StatefulWidget {
  /// Commande serveur (statut RESERVED) : prix gelé, remise fidélité et total sont ceux de l'API.
  final OrderModel order;

  const CheckoutScreen({super.key, required this.order});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  Timer? _timer;
  late int _nowMs;
  bool _isPaying = false;
  String? _errorMessage;

  OrderModel get _order => widget.order;

  @override
  void initState() {
    super.initState();
    _nowMs = ServerClock.serverNowMs;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _nowMs = ServerClock.serverNowMs;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _openTicket() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => TicketScreen(orderId: _order.id)),
    );
  }

  /// Init paiement → passerelle (simulée ou Konnect) → vérification serveur → ticket.
  /// Le ticket n'est ouvert que si le serveur confirme le paiement (`confirmed: true`).
  Future<void> _payWithKonnect() async {
    setState(() {
      _isPaying = true;
      _errorMessage = null;
    });
    try {
      final init = await CampusApi.shared.initPayment(_order.id);
      if (!mounted) return;

      // Commande couverte à 100 % par un coupon : déjà confirmée côté serveur, pas de passerelle
      if (init.paidWithReward) {
        _openTicket();
        return;
      }

      final payUrl = init.payUrl;
      if (payUrl == null || payUrl.isEmpty) {
        throw const ApiException("La passerelle de paiement n'a pas renvoyé de lien.");
      }

      final paid = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentWebViewScreen(
            payUrl: payUrl,
            orderId: _order.id,
            paymentRef: init.paymentRef,
          ),
        ),
      );
      if (!mounted) return;
      if (paid == true) {
        _openTicket();
      } else {
        setState(() => _errorMessage = "Le paiement n'a pas été confirmé. Vous pouvez réessayer tant que le stock est verrouillé.");
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isPaying = false);
    }
  }

  Future<void> _cancelReservation() async {
    try {
      await CampusApi.shared.cancelOrder(_order.id);
    } catch (_) {
      // La réservation expire de toute façon après 10 minutes.
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final expiresMs = _order.reservationExpiresAt?.millisecondsSinceEpoch ?? _nowMs;
    final diffMs = expiresMs - _nowMs;
    final secondsLeft = diffMs > 0 ? (diffMs / 1000).floor() : 0;
    final isExpired = secondsLeft <= 0;

    final minStr = (secondsLeft ~/ 60).toString().padLeft(2, '0');
    final secStr = (secondsLeft % 60).toString().padLeft(2, '0');

    // Montants figés par le serveur : aucun calcul de remise côté client.
    final discount = _order.discountMillimes;
    final netTotal = _order.totalMillimes;

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
                            _order.orderCode,
                            style: const TextStyle(color: AppTheme.limeAccent, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _order.offerTitle,
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '🏪 ${_order.merchantName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    const Divider(color: Colors.white10, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Quantité :', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        Text('x ${_order.quantity} portion(s)', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Prix unitaire verrouillé :', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        Text(
                          Money.formatTND(_order.lockedUnitPriceMillimes),
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

              if (_errorMessage != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.redCritical.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.redCritical),
                  ),
                  child: Text(_errorMessage!, style: const TextStyle(color: Colors.white, fontSize: 12)),
                ),
                const SizedBox(height: 16),
              ] else
                const SizedBox(height: 10),
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
                  onPressed: _isPaying ? null : _cancelReservation,
                  child: const Text('Annuler et libérer le stock', style: TextStyle(color: Colors.white54, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
