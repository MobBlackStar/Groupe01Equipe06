// 💡 Concept & Analogie : Ticket de caisse thermique de restaurant Griddle (Thermal Receipt) avec papier ivoire (#FAF6EE), découpe crantée, encoches latérales et typographie monospace officielle.
// 🔄 Comparaison React / Flutter : En Flutter, le ticket utilise `ThermalReceiptClipper` et `QrImageView` avec rafraîchissement local par Timer ; en React, ce composant correspond à `BoardingPass.jsx`.
// 🎯 À retenir pour la soutenance : "Ce ticket thermique matérialise la preuve d'achat avec un tampon d'authenticité et un jeton HMAC-SHA256 dynamique infalsifiable recalculé toutes les 30s."

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../app/theme.dart';
import '../../core/crypto/ticket_crypto.dart';
import '../../core/time/server_clock.dart';

/// Découpe thermique avec encoches de perforation latérales et crantage zig-zag en bas
class ThermalReceiptClipper extends CustomClipper<Path> {
  final double punchRadius;
  final double punchPosition;
  final double toothWidth;
  final double toothHeight;
  final double topBorderRadius;

  const ThermalReceiptClipper({
    this.punchRadius = 10.0,
    this.punchPosition = 0.35,
    this.toothWidth = 8.0,
    this.toothHeight = 5.0,
    this.topBorderRadius = 16.0,
  });

  @override
  Path getClip(Size size) {
    final path = Path();
    final r = topBorderRadius;
    final punchY = size.height * punchPosition;

    // Coin supérieur gauche
    path.moveTo(0, r);
    path.quadraticBezierTo(0, 0, r, 0);
    path.lineTo(size.width - r, 0);
    path.quadraticBezierTo(size.width, 0, size.width, r);

    // Côté droit jusqu'à l'encoche
    path.lineTo(size.width, punchY - punchRadius);
    path.arcToPoint(
      Offset(size.width, punchY + punchRadius),
      radius: Radius.circular(punchRadius),
      clockwise: false,
    );

    // Côté droit descendant jusqu'au crantage
    path.lineTo(size.width, size.height - toothHeight);

    // Crantage thermique zig-zag du bas (droite vers gauche)
    final teethCount = (size.width / toothWidth).floor();
    final actualToothWidth = size.width / teethCount;

    for (int i = teethCount; i > 0; i--) {
      final x1 = (i - 0.5) * actualToothWidth;
      final y1 = size.height;
      final x2 = (i - 1) * actualToothWidth;
      final y2 = size.height - toothHeight;
      path.lineTo(x1, y1);
      path.lineTo(x2, y2);
    }

    // Côté gauche montant jusqu'à l'encoche
    path.lineTo(0, punchY + punchRadius);
    path.arcToPoint(
      Offset(0, punchY - punchRadius),
      radius: Radius.circular(punchRadius),
      clockwise: false,
    );

    // Retour au coin supérieur gauche
    path.lineTo(0, r);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class BoardingPass extends StatefulWidget {
  final String orderId;
  final String orderCode;
  final String offerTitle;
  final String merchantName;
  final int quantity;
  /// Clé HMAC réelle renvoyée par `GET /orders/:id/ticket` (jamais de valeur par défaut : un QR factice ne validerait pas).
  final String ticketKeyHex;

  const BoardingPass({
    super.key,
    required this.orderId,
    required this.orderCode,
    required this.offerTitle,
    required this.merchantName,
    this.quantity = 1,
    required this.ticketKeyHex,
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
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    final code6 = ticketData['code6'] as String;
    final formattedCode6 = '${code6.substring(0, 3)} ${code6.substring(3)}';

    return ClipPath(
      clipper: const ThermalReceiptClipper(punchRadius: 10, punchPosition: 0.36, toothWidth: 8, toothHeight: 6),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.paper,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Liseré supérieur aux couleurs Griddle
            Container(
              height: 5,
              color: AppTheme.red,
            ),

            // En-tête officiel Ticket Thermique
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
              child: Column(
                children: [
                  const Text(
                    '★ CAMPUSSAVE • ESSECT MONTFLEURY ★',
                    style: TextStyle(
                      color: AppTheme.ink,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      fontFamily: AppTheme.fontMono,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'TICKET DE RETRAIT ANTI-GASPI EN DIRECT',
                    style: TextStyle(
                      color: AppTheme.ink.withValues(alpha: 0.65),
                      fontSize: 13,
                      fontFamily: AppTheme.fontMono,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Ligne Order Code & Statut Live
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.red.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppTheme.red.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: AppTheme.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'LIVE • $timeStr',
                              style: const TextStyle(
                                color: AppTheme.red,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                fontFamily: AppTheme.fontMono,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '#${widget.orderCode}',
                        style: const TextStyle(
                          color: AppTheme.ink,
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          fontFamily: AppTheme.fontMono,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Ligne perforée de séparation thermique
            _buildDashedLine(),

            // Section Corps du Reçu & Données de Retrait
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildReceiptRow('COMMERCE', widget.merchantName.toUpperCase()),
                  const SizedBox(height: 6),
                  _buildReceiptRow('CAMPUS', 'ESSECT TUNIS (MONTFLEURY)'),
                  const SizedBox(height: 6),
                  _buildReceiptRow('ARTICLE', '${widget.quantity}x ${widget.offerTitle}'),
                  const SizedBox(height: 6),
                  _buildReceiptRow('STATUT', 'PAYÉ & RÉSERVÉ'),
                  const SizedBox(height: 10),
                  // Tampon encreur rouge [PAYÉ], sous les lignes pour ne jamais recouvrir le texte
                  Align(
                    alignment: Alignment.centerRight,
                    child: Transform.rotate(
                      angle: -0.16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.red, width: 2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'PAYÉ • ESSECT',
                          style: TextStyle(
                            color: AppTheme.red,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            fontFamily: AppTheme.fontMono,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Ligne perforée au niveau des encoches latérales
            _buildDashedLine(),

            // Section QR Code Rotatif & Code de Secours
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 22),
              child: Column(
                children: [
                  // Boîtier QR Code blanc pur pour contraste de lecture optimal
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.ink,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.ink, width: 2),
                      boxShadow: const [
                        BoxShadow(
                          color: AppTheme.ink,
                          offset: Offset(3, 3),
                          blurRadius: 0,
                        ),
                      ],
                    ),
                    child: QrImageView(
                      data: ticketData['qrPayload'] as String,
                      version: QrVersions.auto,
                      size: 165.0,
                      backgroundColor: AppTheme.ink,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Rotation 30s du jeton
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ROTATION JETON SÉCURISÉ :',
                        style: TextStyle(
                          color: AppTheme.ink.withValues(alpha: 0.65),
                          fontSize: 13,
                          fontFamily: AppTheme.fontMono,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${secondsRemaining}s',
                        style: const TextStyle(
                          color: AppTheme.red,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          fontFamily: AppTheme.fontMono,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: AppTheme.sand,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.red),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Code de Secours Monospace
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.ink,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.sand),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'CODE DE SECOURS (SAISIE MANUELLE)',
                          style: TextStyle(
                            color: AppTheme.cream.withValues(alpha: 0.7),
                            fontSize: 13,
                            letterSpacing: 1,
                            fontFamily: AppTheme.fontMono,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formattedCode6,
                          style: const TextStyle(
                            color: AppTheme.mustard,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 5,
                            fontFamily: AppTheme.fontMono,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 13)),
                      const SizedBox(width: 4),
                      Text(
                        'Présentez ce reçu au comptoir avant expiration',
                        style: TextStyle(
                          color: AppTheme.ink.withValues(alpha: 0.6),
                          fontSize: 13,
                          fontFamily: AppTheme.fontMono,
                        ),
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

  Widget _buildDashedLine() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: List.generate(
          32,
          (index) => Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 1),
              color: index % 2 == 0 ? AppTheme.ink.withValues(alpha: 0.3) : Colors.transparent,
              height: 1.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TextStyle(
              color: AppTheme.ink.withValues(alpha: 0.55),
              fontSize: 13,
              fontFamily: AppTheme.fontMono,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const Text(': ', style: TextStyle(color: AppTheme.ink, fontSize: 13, fontFamily: AppTheme.fontMono)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppTheme.ink,
              fontSize: 13,
              fontFamily: AppTheme.fontMono,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
