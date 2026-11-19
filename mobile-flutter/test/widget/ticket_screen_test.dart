// 💡 Concept & Analogie : Vérifie que l'écran du ticket affiche bien la clé et la commande du serveur, et non plus un ticket factice figé dans le code.
// 🔄 Comparaison React / Flutter : Équivalent du test de `LivingTicketPage.jsx` (ticketKey + orderCode issus de /orders/:id/ticket).
// 🎯 À retenir pour la soutenance : "Le code à 6 chiffres affiché est dérivé de la clé du serveur : changer la clé change le code, il n'y a plus de valeur par défaut."
// Module : Tests Mobile

import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/crypto/ticket_crypto.dart';
import 'package:campussave_mobile/core/time/server_clock.dart';
import 'package:campussave_mobile/features/ticket/ticket_screen.dart';
import 'package:campussave_mobile/services/campus_api.dart';

const _serverKey = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

class _FakeServer implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    final Map<String, dynamic> body;
    if (options.path.endsWith('/ticket')) {
      body = {'ticketKey': _serverKey, 'windowSeconds': 30, 'orderCode': 'CS-7Q2ZD', 'serverTime': ServerClock.serverNowMs};
    } else {
      body = {
        'order': {
          'orderId': 'ord-42',
          'orderCode': 'CS-7Q2ZD',
          'status': 'PAID',
          'quantity': 3,
          'offerSnapshot': {'title': 'Offre Test Serveur'},
          'merchantSnapshot': {'name': 'Commerce Test'},
          'pricing': {'lockedUnitPriceMillimes': 1000, 'subtotalMillimes': 3000, 'totalMillimes': 3000},
        },
      };
    }
    return ResponseBody.fromString(jsonEncode(body), 200, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  testWidgets('TicketScreen affiche la commande et le code 6 chiffres dérivés de la clé serveur', (tester) async {
    CampusApi.shared = CampusApi(Dio()..httpClientAdapter = _FakeServer());

    await tester.pumpWidget(const MaterialApp(home: TicketScreen(orderId: 'ord-42')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.textContaining('Offre Test Serveur'), findsWidgets);
    expect(find.textContaining('CS-7Q2ZD'), findsWidgets);
    expect(find.textContaining('CS-8K4M9'), findsNothing); // ancien ticket factice

    final code6 = TicketCrypto.generateTicketData(
      ticketKeyHex: _serverKey,
      orderId: 'ord-42',
      windowIndex: TicketCrypto.getWindowIndex(ServerClock.serverNowMs),
    )['code6'] as String;
    expect(find.textContaining('${code6.substring(0, 3)} ${code6.substring(3)}'), findsWidgets);

    // Démonte l'écran : annule le Timer du BoardingPass
    await tester.pumpWidget(const SizedBox());
  });
}
