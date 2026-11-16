// 💡 Concept & Analogie : L'écrin protecteur qui héberge la carte d'embarquement sur smartphone, accessible même en l'absence de réseau 4G.
// 🔄 Comparaison React / Flutter : En Flutter, `TicketScreen` utilise un `Scaffold` sombre avec un défilement `SingleChildScrollView` ; en React, il correspond à `LivingTicketPage.jsx`.
// 🎯 À retenir pour la soutenance : "Ce billet vivant est le pilier de sécurité de CampusSave : infalsifiable par capture d'écran et vérifiable en 1 scan par le commerçant."

import 'package:flutter/material.dart';
import '../../app/theme.dart';
import 'boarding_pass.dart';

class TicketScreen extends StatelessWidget {
  final String orderId;
  final String orderCode;
  final String offerTitle;
  final String merchantName;
  final int quantity;
  final String ticketKeyHex;

  const TicketScreen({
    super.key,
    required this.orderId,
    this.orderCode = 'CS-8K4M9',
    this.offerTitle = 'Baguette Farcie Escalope Panée & Fromage',
    this.merchantName = 'Baguette & Baguette Montfleury',
    this.quantity = 2,
    this.ticketKeyHex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        title: const Text('Living Ticket • QR Dynamique', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              BoardingPass(
                orderId: orderId,
                orderCode: orderCode,
                offerTitle: offerTitle,
                merchantName: merchantName,
                quantity: quantity,
                ticketKeyHex: ticketKeyHex,
              ),
              const SizedBox(height: 24),

              // Instructions de retrait
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
                  children: const [
                    Text(
                      '📍 Comment récupérer votre repas :',
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 6),
                    Text(
                      '1. Présentez-vous au restaurant à Montfleury pendant le créneau horaire.\n2. Montrez ce QR code vivant au commerçant.\n3. Si le scan optique échoue, dictez simplement le code à 6 chiffres.',
                      style: TextStyle(color: Colors.white70, fontSize: 11, height: 1.5),
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
