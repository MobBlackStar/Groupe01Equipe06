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
import '../../widgets/griddle.dart';
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
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context))),
            const SizedBox(height: 14),
            const GPageHeader(eyebrow: 'Étape 2 sur 3 · Paiement', title: 'Validation', titleSize: 58),
            const SizedBox(height: 20),

            // Compte à rebours : le stock est bloqué 10 minutes
            GCard(
              ink: !isExpired,
              color: isExpired ? AppTheme.red : null,
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(isExpired ? 'RÉSERVATION EXPIRÉE' : 'STOCK VERROUILLÉ', style: AppTheme.label(isExpired ? AppTheme.cream : AppTheme.mustard)),
                        const SizedBox(height: 2),
                        Text('Prix unitaire garanti au millime', style: AppTheme.body(15, AppTheme.cream)),
                      ],
                    ),
                  ),
                  Text('$minStr:$secStr', style: AppTheme.figure(58, isExpired ? AppTheme.cream : AppTheme.mustard)),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Reçu (cs-receipt) : papier blanc, contour encre, chiffres en Space Mono
            Container(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              decoration: AppTheme.paperCard(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text('RÉCAPITULATIF', style: AppTheme.label())),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: AppTheme.ink, borderRadius: BorderRadius.circular(8)),
                        child: Text(_order.orderCode, style: AppTheme.mono(13, AppTheme.mustard).copyWith(fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(_order.offerTitle.toUpperCase(), style: AppTheme.h3(22)),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.storefront_outlined, size: 17, color: AppTheme.red),
                      const SizedBox(width: 6),
                      Expanded(child: Text(_order.merchantName, style: AppTheme.body(15, AppTheme.muted))),
                    ],
                  ),
                  const _ReceiptRule(),
                  _ReceiptRow('Quantité', 'x ${_order.quantity}'),
                  const SizedBox(height: 8),
                  _ReceiptRow('Prix unitaire verrouillé', Money.formatTND(_order.lockedUnitPriceMillimes)),
                  if (discount > 0) ...[
                    const SizedBox(height: 8),
                    _ReceiptRow('Avantage fidélité', '-${Money.formatTND(discount)}', color: AppTheme.leaf),
                  ],
                  const _ReceiptRule(),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(child: Text('TOTAL NET À RÉGLER', style: AppTheme.h3(18))),
                      Text(Money.formatTND(netTotal), style: AppTheme.figure(46, AppTheme.red)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              GNotice(_errorMessage!, icon: Icons.error_outline),
              const SizedBox(height: 16),
            ],

            GButton(
              _isPaying
                  ? 'Connexion sécurisée…'
                  : netTotal == 0
                      ? 'Valider la commande gratuite'
                      : 'Payer ${Money.formatTND(netTotal)}',
              icon: netTotal == 0 ? Icons.check_circle_outline : Icons.lock_outline,
              loading: _isPaying,
              onPressed: isExpired || _isPaying ? null : _payWithKonnect,
            ),
            const SizedBox(height: 12),
            GButton('Annuler et libérer le stock', variant: GVariant.cream, small: true, onPressed: _isPaying ? null : _cancelReservation),
          ],
        ),
      ),
    );
  }
}

class _ReceiptRule extends StatelessWidget {
  const _ReceiptRule();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: LayoutBuilder(
        builder: (context, c) {
          final n = (c.maxWidth / 9).floor();
          return Row(
            children: List.generate(n, (i) => Expanded(child: Container(height: 2, color: i.isEven ? AppTheme.ink : Colors.transparent))),
          );
        },
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _ReceiptRow(this.label, this.value, {this.color = AppTheme.ink});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text(label, style: AppTheme.body(16, AppTheme.muted))),
        Text(value, style: AppTheme.mono(15, color).copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
