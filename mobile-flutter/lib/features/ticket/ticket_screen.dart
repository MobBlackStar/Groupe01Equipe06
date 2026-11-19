// 💡 Concept & Analogie : L'écrin protecteur qui héberge la carte d'embarquement sur smartphone, accessible même en l'absence de réseau 4G.
// 🔄 Comparaison React / Flutter : En Flutter, `TicketScreen` utilise un `Scaffold` sombre avec un défilement `SingleChildScrollView` ; en React, il correspond à `LivingTicketPage.jsx`.
// 🎯 À retenir pour la soutenance : "Ce billet vivant est le pilier de sécurité de CampusSave : infalsifiable par capture d'écran et vérifiable en 1 scan par le commerçant."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/models/order_model.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
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
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: [
            Align(alignment: Alignment.centerLeft, child: GIconButton(icon: Icons.arrow_back, tooltip: 'Retour', onPressed: () => Navigator.maybePop(context))),
            const SizedBox(height: 14),
            const GPageHeader(eyebrow: 'Étape 3 sur 3 · Retrait', title: 'Living Ticket', titleSize: 58, lead: 'Le QR change toutes les 30 secondes.'),
            const SizedBox(height: 22),
            if (ticket == null || order == null)
              _error == null
                  ? const Padding(padding: EdgeInsets.symmetric(vertical: 60), child: Center(child: CircularProgressIndicator(color: AppTheme.red)))
                  : GEmpty(icon: Icons.cloud_off, title: 'Ticket indisponible', message: _error!, actionLabel: 'Réessayer', onAction: _load)
            else ...[
              BoardingPass(
                orderId: order.id,
                orderCode: ticket.orderCode.isNotEmpty ? ticket.orderCode : order.orderCode,
                offerTitle: order.offerTitle,
                merchantName: order.merchantName,
                quantity: order.quantity,
                ticketKeyHex: ticket.ticketKeyHex,
              ),
              const SizedBox(height: 24),
              const GCard(
                padding: EdgeInsets.all(18),
                child: _PickupSteps(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PickupSteps extends StatelessWidget {
  const _PickupSteps();

  @override
  Widget build(BuildContext context) {
    const steps = [
      'Présentez-vous au restaurant à Montfleury pendant le créneau horaire.',
      'Montrez ce ticket et son QR code vivant au commerçant.',
      'Si le scan échoue, dictez le code de secours à 6 chiffres.',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('COMMENT RÉCUPÉRER VOTRE REPAS', style: AppTheme.h3(20)),
        const SizedBox(height: 12),
        for (var i = 0; i < steps.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppTheme.red, shape: BoxShape.circle, border: Border.all(color: AppTheme.ink, width: 2)),
                  child: Text('${i + 1}', style: AppTheme.figure(20, AppTheme.cream)),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(steps[i], style: AppTheme.body(16))),
              ],
            ),
          ),
      ],
    );
  }
}
