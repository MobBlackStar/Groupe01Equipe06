// 💡 Concept & Analogie : L'écrin protecteur qui héberge la carte d'embarquement sur smartphone, accessible même en l'absence de réseau 4G.
// 🔄 Comparaison React / Flutter : En Flutter, `TicketScreen` utilise un `Scaffold` sombre avec un défilement `SingleChildScrollView` ; en React, il correspond à `LivingTicketPage.jsx`.
// 🎯 À retenir pour la soutenance : "Ce billet vivant est le pilier de sécurité de CampusSave : infalsifiable par capture d'écran et vérifiable en 1 scan par le commerçant."

import 'dart:async';

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import '../../core/models/order_model.dart';
import '../../services/campus_api.dart';
import '../../widgets/griddle.dart';
import '../../widgets/order_actions.dart';
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
  Timer? _poll;
  bool _wasPaid = false;
  bool _revealShown = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  /// Tant que la commande est à retirer, on interroge le serveur toutes les 4 s : dès que le commerçant valide le scan,
  /// l'écran passe à « Retrait validé » et, pour un panier surprise, le déballage s'ouvre tout seul.
  void _startPolling() {
    _poll?.cancel();
    if (_order?.status != 'PAID') return;
    _poll = Timer.periodic(const Duration(seconds: 4), (_) async {
      try {
        final fresh = await CampusApi.shared.fetchOrder(widget.orderId);
        if (!mounted || fresh.status == 'PAID') return;
        _poll?.cancel();
        setState(() => _order = fresh);
        if (fresh.status == 'COMPLETED' && _wasPaid && fresh.isSurpriseBasket && fresh.revealItems.isNotEmpty && !_revealShown) {
          _revealShown = true;
          showUnboxingSheet(context, fresh);
        }
      } catch (_) {
        // réseau instable : on réessaie au prochain tour
      }
    });
  }

  Future<void> _rate() async {
    final order = _order;
    if (order == null) return;
    final saved = await showRateOrderDialog(context, orderId: order.id, title: order.offerTitle);
    if (saved) _load();
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
        _wasPaid = _order?.status == 'PAID';
      });
      _startPolling();
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
              if (order.status == 'COMPLETED') ...[
                GCard(
                  color: const Color(0xFFDDEFD9),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.check_circle, color: AppTheme.leaf, size: 30),
                        const SizedBox(width: 10),
                        Expanded(child: Text('RETRAIT VALIDÉ${(order.pointsAwarded ?? 0) > 0 ? ' · +${order.pointsAwarded} ECOPOINTS' : ''}', style: AppTheme.h3(20))),
                      ]),
                      const SizedBox(height: 12),
                      if (order.isSurpriseBasket && order.revealItems.isNotEmpty) ...[
                        GButton('Voir mon panier', icon: Icons.card_giftcard, variant: GVariant.mustard, small: true, onPressed: () => showUnboxingSheet(context, order)),
                        const SizedBox(height: 8),
                      ],
                      if (order.ratingStars == null) GButton('Noter la commande', icon: Icons.star_outline, variant: GVariant.cream, small: true, onPressed: _rate),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],
              BoardingPass(
                orderId: order.id,
                orderCode: ticket.orderCode.isNotEmpty ? ticket.orderCode : order.orderCode,
                offerTitle: order.summaryTitle,
                merchantName: order.merchantName,
                quantity: order.totalQuantity,
                items: order.normalizedItems,
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
