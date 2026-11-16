// 💡 Concept & Analogie : Test de parité cryptographique validant que Dart produit au bit près les mêmes signatures HMAC-SHA256, tags base64url et codes 6 chiffres que Node.js et WebCrypto.
// 🔄 Comparaison React / Flutter : Valide les vecteurs du Living Ticket anti-capture d'écran (`shared/test-vectors/ticket.json`).
// 🎯 À retenir pour la soutenance : "Ce test garantit que le QR code affiché sur l'iPhone ou le smartphone Android d'un étudiant est immédiatement vérifiable par le scanner commerçant."
// Module : Cryptographie Mobile

import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/crypto/ticket_crypto.dart';

void main() {
  group('Cryptographie du Living Ticket — Vecteurs Officiels cross-runtime', () {
    test('Chargement et vérification des 5 vecteurs de test officiels', () {
      final candidates = [
        File('../shared/test-vectors/ticket.json'),
        File('../../shared/test-vectors/ticket.json'),
        File('shared/test-vectors/ticket.json'),
        File('../campussave/shared/test-vectors/ticket.json'),
      ];

      File? vectorFile;
      for (final candidate in candidates) {
        if (candidate.existsSync()) {
          vectorFile = candidate;
          break;
        }
      }

      expect(vectorFile, isNotNull, reason: 'Le fichier ticket.json doit exister');

      final content = vectorFile!.readAsStringSync();
      final data = jsonDecode(content) as Map<String, dynamic>;
      final testCases = data['testCases'] as List<dynamic>;

      expect(testCases.length, equals(5));

      for (final raw in testCases) {
        final tc = raw as Map<String, dynamic>;
        final id = tc['id'] as String;
        final ticketKeyHex = tc['ticketKeyHex'] as String;
        final orderId = tc['orderId'] as String;
        final windowIndex = tc['windowIndex'] as int;
        final expectedTag = tc['expectedTag'] as String;
        final expectedCode6 = tc['expectedCode6'] as String;
        final expectedQr = tc['expectedQrPayload'] as String;

        final result = TicketCrypto.generateTicketData(
          ticketKeyHex: ticketKeyHex,
          orderId: orderId,
          windowIndex: windowIndex,
        );

        expect(result['tagBase64Url'], equals(expectedTag), reason: 'Échec tag pour $id');
        expect(result['code6'], equals(expectedCode6), reason: 'Échec code6 pour $id');
        expect(result['qrPayload'], equals(expectedQr), reason: 'Échec qrPayload pour $id');
      }
    });
  });
}
