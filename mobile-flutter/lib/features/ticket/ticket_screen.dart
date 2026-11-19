// 💡 Concept & Analogie : L'écrin protecteur qui héberge la carte d'embarquement sur smartphone, accessible même en l'absence de réseau 4G.
// 🔄 Comparaison React / Flutter : En Flutter, `TicketScreen` utilise un `Scaffold` sombre avec un défilement `SingleChildScrollView` ; en React, il correspond à `LivingTicketPage.jsx`.
// 🎯 À retenir pour la soutenance : "Ce billet vivant est le pilier de sécurité de CampusSave : infalsifiable par capture d'écran et vérifiable en 1 scan par le commerçant."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/models/order_model.dart';
import '../../services/campus_api.dart';
import 'boarding_pass.dart';

/// Charge le vrai ticket : `GET /orders/:id/ticket` (ticketKey, orderCode) et `GET /orders/:id`
/// (offre, commerce, quantité) ; sans la clé réelle du serveur le QR ne pourrait jamais être validé.
class TicketScreen extends StatefulWidget {
  final String orderId;

  const TicketScreen({super.key, required this.orderId});

  @override
  State<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends State<TicketScreen> {
  TicketParams? _ticket;
  OrderModel? _order;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final results = await Future.wait([
        CampusApi.shared.fetchTicket(widget.orderId),
        CampusApi.shared.fetchOrder(widget.orderId),
      ]);
      if (!mounted) return;
      setState(() {
        _ticket = results[0] as TicketParams;
        _order = results[1] as OrderModel;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticket = _ticket;
    final order = _order;
    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        title: const Text('Living Ticket • QR Dynamique', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: (ticket == null || order == null)
            ? Center(
                child: _error == null
                    ? const CircularProgressIndicator(color: AppTheme.red)
                    : Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: _load,
                              child: const Text('Réessayer', style: TextStyle(color: AppTheme.red)),
                            ),
                          ],
                        ),
                      ),
              )
            : SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              BoardingPass(
                orderId: order.id,
                orderCode: ticket.orderCode.isNotEmpty ? ticket.orderCode : order.orderCode,
                offerTitle: order.offerTitle,
                merchantName: order.merchantName,
                quantity: order.quantity,
                ticketKeyHex: ticket.ticketKeyHex,
              ),
              const SizedBox(height: 24),

              // Instructions de retrait
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.biscuit,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.ink),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      '📍 Comment récupérer votre repas :',
                      style: TextStyle(color: AppTheme.cream, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 6),
                    Text(
                      '1. Présentez-vous au restaurant à Montfleury pendant le créneau horaire.\n2. Montrez ce ticket thermique et son QR code vivant au commerçant.\n3. Si le scan optique échoue, dictez simplement le code de secours à 6 chiffres.',
                      style: TextStyle(color: AppTheme.muted, fontSize: 13, height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
