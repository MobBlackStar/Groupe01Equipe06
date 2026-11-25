// 💡 Concept & Analogie : Comme un badge d'accès NFC virtuel à code tournant, ce widget génère et rafraîchit le QR code HMAC toutes les 30 secondes pour empêcher toute fraude par capture d'écran.
// 🔄 Comparaison React / Flutter : Équivalent Flutter direct de `RotatingQr.jsx` sous React, utilisant `qr_flutter` et un Timer périodique cadencé sur l'horloge.
// 🎯 À retenir pour la soutenance : "Le calcul cryptographique HMAC s'effectue en mémoire sans latence réseau, avec dérivation de la fenêtre temporelle de 30 secondes."
// Module : Interface Living Ticket Mobile

import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/crypto/ticket_crypto.dart';
import 'halftone_mascot_qr.dart';

import '../../app/theme.dart';
class RotatingQr extends StatefulWidget {
  final String ticketKeyHex;
  final String orderId;
  final String? orderCode;

  const RotatingQr({
    super.key,
    required this.ticketKeyHex,
    required this.orderId,
    this.orderCode,
  });

  @override
  State<RotatingQr> createState() => _RotatingQrState();
}

class _RotatingQrState extends State<RotatingQr> {
  Timer? _timer;
  Map<String, dynamic>? _ticketData;
  int _secondsRemaining = 30;

  @override
  void initState() {
    super.initState();
    _refreshTicketData();
    _startTimer();
  }

  @override
  void didUpdateWidget(covariant RotatingQr oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.ticketKeyHex != widget.ticketKeyHex || oldWidget.orderId != widget.orderId) {
      _refreshTicketData();
    }
  }

  void _refreshTicketData() {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final currentWindow = TicketCrypto.getWindowIndex(nowMs);
    final data = TicketCrypto.generateTicketData(
      ticketKeyHex: widget.ticketKeyHex,
      orderId: widget.orderId,
      windowIndex: currentWindow,
    );
    setState(() {
      _ticketData = data;
    });
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final nowMs = DateTime.now().millisecondsSinceEpoch;
      final currentSeconds = (nowMs ~/ 1000) % 30;
      final remaining = 30 - currentSeconds;

      setState(() {
        _secondsRemaining = remaining;
      });

      // Renouvellement à chaque transition de fenêtre de 30 secondes
      if (remaining == 30 || _ticketData == null) {
        _refreshTicketData();
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
    final qrPayload = _ticketData?['qrPayload'] as String? ?? '';
    final code6 = _ticketData?['code6'] as String? ?? '------';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.biscuit,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Pastille d'état dynamique
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.leaf.withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.leaf.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.leaf,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'LIVING TICKET ACTIF',
                  style: TextStyle(
                    color: AppTheme.leaf,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Cadre central du QR Code
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: qrPayload.isNotEmpty
                ? HalftoneMascotQr(
                    data: qrPayload,
                    size: 210,
                  )
                : const SizedBox(
                    width: 210,
                    height: 210,
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
          ),
          const SizedBox(height: 16),

          // Code de secours à 6 chiffres
          Text(
            'Code de secours (caméra indisponible) :',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.cream,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Text(
              code6.length == 6
                  ? '${code6.substring(0, 3)} - ${code6.substring(3, 6)}'
                  : code6,
              style: const TextStyle(
                fontFamily: AppTheme.fontMono,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.red,
                letterSpacing: 3,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Anneau de décompte 30 secondes
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.cream,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 32,
                  height: 32,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: _secondsRemaining / 30.0,
                        backgroundColor: Colors.white.withOpacity(0.1),
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.red),
                        strokeWidth: 3,
                      ),
                      Text(
                        '$_secondsRemaining',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Renouvellement automatique',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      'Protection anti-capture d\'écran',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          if (widget.orderCode != null) ...[
            const SizedBox(height: 10),
            Text(
              'N° de retrait : ${widget.orderCode}',
              style: TextStyle(
                fontFamily: AppTheme.fontMono,
                fontSize: 13,
                color: Colors.grey.shade400,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
