// 💡 Concept & Analogie : Générateur de QR code dynamique rotatif 30 secondes en Dart pour l'application mobile Flutter.
// 🔄 Comparaison React / Flutter : Produit des tags de signature strictement identiques au module WebCrypto de React et à l'API Node.js.
// 🎯 À retenir pour la soutenance : "Ce module Dart utilise HMAC-SHA256 pour générer le code tournant et le code à 6 chiffres sur mobile."
// Module : Cryptographie Mobile

import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';

class TicketCrypto {
  static int getWindowIndex([int? nowMs]) {
    final time = nowMs ?? DateTime.now().millisecondsSinceEpoch;
    return time ~/ 30000;
  }

  /// Génère la charge utile QR et le code à 6 chiffres pour Flutter
  static Map<String, dynamic> generateTicketData({
    required String ticketKeyHex,
    required String orderId,
    required int windowIndex,
  }) {
    final keyBytes = _hexToBytes(ticketKeyHex);
    final message = utf8.encode('CS2|$orderId|$windowIndex');

    final hmac = Hmac(sha256, keyBytes);
    final digest = hmac.convert(message);
    final bytes = digest.bytes;

    // 16 premiers octets en base64url sans padding
    final first16 = bytes.sublist(0, 16);
    final tagBase64Url = base64Url.encode(first16).replaceAll('=', '');

    // 4 premiers octets Big-Endian en nombre à 6 chiffres
    final byteData = ByteData.sublistView(Uint8List.fromList(bytes));
    final codeNum = byteData.getUint32(0, Endian.big) % 1000000;
    final code6 = codeNum.toString().padLeft(6, '0');

    final qrPayload = 'CS2.$orderId.$windowIndex.$tagBase64Url';

    return {
      'qrPayload': qrPayload,
      'code6': code6,
      'windowIndex': windowIndex,
      'tagBase64Url': tagBase64Url,
    };
  }

  static Uint8List _hexToBytes(String hex) {
    final result = Uint8List(hex.length ~/ 2);
    for (int i = 0; i < hex.length; i += 2) {
      result[i ~/ 2] = int.parse(hex.substring(i, i + 2), radix: 16);
    }
    return result;
  }
}
