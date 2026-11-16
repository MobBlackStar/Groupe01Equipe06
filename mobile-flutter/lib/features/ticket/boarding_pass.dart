// 💡 Concept & Analogie : Carte d'embarquement mobile à perforation latérale inspirée des passes de vol VIP, empêchant les fraudes par capture d'écran grâce à un QR code dynamique rotatif.
// 🔄 Comparaison React / Flutter : En Flutter, les encoches perforées sont créées par un `ClipPath` et le QR code est rendu par `QrImageView` ; en React, ce composant correspond à `BoardingPass.jsx`.
// 🎯 À retenir pour la soutenance : "Toutes les 30 secondes, l'application mobile calcule un hash HMAC-SHA256 local sans appel réseau et met à jour le QR code et le code de secours à 6 chiffres."

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../app/theme.dart';
import '../../core/crypto/ticket_crypto.dart';

class TicketClipper extends CustomClipper<Path> {
  final double punchRadius;
  final double punchPosition;

  TicketClipper({this.punchRadius = 12.0, this.punchPosition = 0.42});

  @override
  Path getClip(Size size) {
    final path = Path();
    final y = size.height * punchPosition;

    path.lineTo(0, y - punchRadius);
    path.arcToPoint(
      Offset(0, y + punchRadius),
      radius: Radius.circular(punchRadius),
      clockwise: true,
    );
    path.lineTo(0, size.height);
    path.lineTo(size.width, size.height);
    path.lineTo(size.width, y + punchRadius);
    path.arcToPoint(
      Offset(size.width, y - punchRadius),
      radius: Radius.circular(punchRadius),
      clockwise: true,
    );
    path.lineTo(size.width, 0);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class BoardingPass extends StatefulWidget {
  final String orderId;
  final String orderCode;
  final String offerTitle;
  final String merchantName;
  final int quantity;
  final String ticketKeyHex;

  const BoardingPass({
    super.key,
    required this.orderId,
    required this.orderCode,
    required this.offerTitle,
    required this.merchantName,
    this.quantity = 1,
    this.ticketKeyHex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
  });

  @override
  State<BoardingPass> createState() => _BoardingPassState();
}

class _BoardingPassState extends State<BoardingPass> {
  Timer? _timer;
  late int _nowMs;

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

  @override
  Widget build(BuildContext context) {
    final windowIndex = TicketCrypto.getWindowIndex(_nowMs);
    final ticketData = TicketCrypto.generateTicketData(
      ticketKeyHex: widget.ticketKeyHex,
      orderId: widget.orderId,
      windowIndex: windowIndex,
    );

    final secondsRemaining = 30 - ((_nowMs ~/ 1000) % 30);
    final progress = secondsRemaining / 30.0;

    final now = DateTime.fromMillisecondsSinceEpoch(_nowMs);
    final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    final code6 = ticketData['code6'] as String;
    final formattedCode6 = '${code6.substring(0, 3)} ${code6.substring(3)}';

    return ClipPath(
      clipper: TicketClipper(),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Bandeau supérieur holographique
            Container(
              height: 4,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.limeAccent, Colors.cyanAccent, AppTheme.orangeUrgent],
                ),
              ),
            ),

            // Partie 1 : Trajet & Données de Vol
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.redCritical.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.redCritical.withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.redCritical, shape: BoxShape.circle)),
                            const SizedBox(width: 5),
                            Text('LIVE • $timeStr', style: const TextStyle(color: AppTheme.redCritical, fontSize: 10, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      Text(
                        widget.orderCode,
                        style: const TextStyle(color: AppTheme.limeAccent, fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('DÉPART', style: TextStyle(color: Colors.white38, fontSize: 9, letterSpacing: 1)),
                          Text('ESSECT', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Montfleury', style: TextStyle(color: Colors.white54, fontSize: 10)),
                        ],
                      ),
                      const Text('➔', style: TextStyle(color: AppTheme.limeAccent, fontSize: 20)),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('RETRAIT', style: TextStyle(color: Colors.white38, fontSize: 9, letterSpacing: 1)),
                          Text(
                            widget.merchantName,
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Text('Montfleury', style: TextStyle(color: AppTheme.limeAccent, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${widget.quantity}x ${widget.offerTitle}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                      const Text('Aujourd hui', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    ],
                  ),
                ],
              ),
            ),

            // Ligne perforée
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(
                  30,
                  (index) => Expanded(
                    child: Container(
                      color: index % 2 == 0 ? Colors.transparent : Colors.white12,
                      height: 1,
                    ),
                  ),
                ),
              ),
            ),

            // Partie 2 : QR Code rotatif 30s & Code de secours
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: QrImageView(
                      data: ticketData['qrPayload'] as String,
                      version: QrVersions.auto,
                      size: 160.0,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Barre de progression 30 secondes
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Rotation jeton cryptographique :', style: TextStyle(color: Colors.white38, fontSize: 10)),
                      Text('${secondsRemaining}s', style: const TextStyle(color: AppTheme.limeAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white12,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.limeAccent),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Code de secours
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black38,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Column(
                      children: [
                        const Text('CODE DE SECOURS (SAISIE MANUELLE)', style: TextStyle(color: Colors.white38, fontSize: 9, letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text(
                          formattedCode6,
                          style: const TextStyle(
                            color: AppTheme.limeAccent,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 4,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text('💡', style: TextStyle(fontSize: 12)),
                      SizedBox(width: 4),
                      Text(
                        'Augmentez la luminosité pour faciliter le scan',
                        style: TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
