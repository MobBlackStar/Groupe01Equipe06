// 💡 Concept & Analogie : La répétition générale de la démo : un étudiant réserve, paie, présente son ticket, le commerçant le valide et les EcoPoints montent, le tout contre un vrai backend (isolé, en mémoire).
// 🔄 Comparaison React / Flutter : Rejoue en Dart le parcours que le web accomplit déjà (OfferDetail -> Checkout -> PaymentReturn -> LivingTicket -> scan commerçant -> LoyaltyCard).
// 🎯 À retenir pour la soutenance : "Le code à 6 chiffres calculé sur mobile avec la clé du serveur est accepté par le commerçant : la cryptographie est identique de bout en bout."
// Module : Tests Mobile (E2E)
//
// Désactivé par défaut. Lancer un backend isolé (jamais le Firebase réel) :
//   cd backend-node && FIREBASE_SERVICE_ACCOUNT_BASE64= KONNECT_API_KEY= KONNECT_RECEIVER_WALLET_ID= PORT=4100 node src/server.js
// puis :
//   $env:CAMPUSSAVE_E2E_BASE='http://localhost:4100/api/v1'; flutter test test/e2e/journey_e2e_test.dart

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/crypto/ticket_crypto.dart';
import 'package:campussave_mobile/services/campus_api.dart';

/// `lenient: true` (commerçant) renvoie aussi les 4xx pour les asserter ; l'étudiant garde le comportement
/// par défaut de Dio (exception sur 4xx/5xx) comme `ApiClient.dio` en production.
Dio _client(String base, String token, {bool lenient = false}) => Dio(BaseOptions(
      baseUrl: base,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      validateStatus: lenient ? (_) => true : null,
    ));

void main() {
  final base = Platform.environment['CAMPUSSAVE_E2E_BASE'];
  final skip = base == null ? 'définir CAMPUSSAVE_E2E_BASE (backend isolé, ex. http://localhost:4100/api/v1)' : null;

  test('Étudiant : réserver -> payer -> ticket -> commerçant valide (QR puis code 6) -> EcoPoints', () async {
    final student = CampusApi(_client(base!, 'test-token:student-yassine:STUDENT:etudiant@essect.u-tunis.tn'));
    final merchant = _client(base, 'test-token:m-baguette:MERCHANT:commercant@baguette.tn', lenient: true);

    final offers = await student.fetchOffers();
    final offer = offers.firstWhere((o) => o.merchantId == 'merchant-baguette-baguette' && !o.isSurpriseBasket && o.pricingType == 'FIXED' && o.remainingQuantity >= 2);

    final before = await student.fetchLoyalty();

    // --- Commande 1 : QR scanné ---------------------------------------------------------------
    final reserved = await student.createOrder(offerId: offer.id, quantity: 1);
    expect(reserved.status, 'RESERVED');
    expect(reserved.totalMillimes, offer.targetPriceMillimes);
    expect(reserved.reservationExpiresAt, isNotNull);

    // Pas de ticket tant que la commande n'est pas payée
    await expectLater(student.fetchTicket(reserved.id), throwsA(isA<ApiException>()));

    final init = await student.initPayment(reserved.id);
    expect(init.payUrl, contains('payment/return'));
    expect(await student.verifyPayment(reserved.id, paymentRef: init.paymentRef), isTrue);

    final order = await student.fetchOrder(reserved.id);
    final ticket = await student.fetchTicket(reserved.id);
    expect(order.status, 'PAID');
    expect(ticket.orderCode, order.orderCode);
    expect(ticket.ticketKeyHex, matches(RegExp(r'^[0-9a-f]{64}$')));

    final window = TicketCrypto.getWindowIndex();
    final data = TicketCrypto.generateTicketData(ticketKeyHex: ticket.ticketKeyHex, orderId: order.id, windowIndex: window);

    final scan = await merchant.post('/tickets/scan', data: {'qrPayload': data['qrPayload']});
    expect(scan.statusCode, 200, reason: '${scan.data}');
    final awarded = (scan.data['pointsAwarded'] as num).toInt();
    expect(awarded, greaterThan(0));

    // Billet déjà utilisé : le serveur refuse un second passage
    final replay = await merchant.post('/tickets/scan', data: {'qrPayload': data['qrPayload']});
    expect(replay.statusCode, isNot(200));

    final after = await student.fetchLoyalty();
    expect(after.ecoPoints, before.ecoPoints + awarded);

    // --- Commande 2 : code de secours à 6 chiffres + code erroné refusé -------------------------
    final second = await student.createOrder(offerId: offer.id, quantity: 1);
    await student.initPayment(second.id);
    expect(await student.verifyPayment(second.id), isTrue); // sans paymentRef : le serveur retrouve celui de la commande
    final t2 = await student.fetchTicket(second.id);
    final code6 = TicketCrypto.generateTicketData(
      ticketKeyHex: t2.ticketKeyHex,
      orderId: second.id,
      windowIndex: TicketCrypto.getWindowIndex(),
    )['code6'] as String;

    final wrong = (int.parse(code6) + 1) % 1000000;
    final bad = await merchant.post('/tickets/redeem-code', data: {'orderCode': t2.orderCode, 'code6': wrong.toString().padLeft(6, '0')});
    expect(bad.statusCode, isNot(200));

    final good = await merchant.post('/tickets/redeem-code', data: {'orderCode': t2.orderCode, 'code6': code6});
    expect(good.statusCode, 200, reason: '${good.data}');

    final end = await student.fetchLoyalty();
    expect(end.ecoPoints, greaterThan(after.ecoPoints));

    // --- Liste des commandes : COMPLETED pour les deux --------------------------------------------
    final mine = await student.fetchMyOrders();
    expect(mine.where((o) => o.id == order.id || o.id == second.id).every((o) => o.status == 'COMPLETED'), isTrue);

    // --- Coupon : le serveur applique la remise (rewardId), jamais le client ----------------------
    final usable = end.rewards.where((r) => r.isAvailable && !r.isFreeSurprise).toList();
    if (usable.isNotEmpty) {
      final fresh = (await student.fetchOffers()).firstWhere((o) => o.merchantId == 'merchant-baguette-baguette' && !o.isSurpriseBasket && o.pricingType == 'FIXED' && o.remainingQuantity >= 1);
      final discounted = await student.createOrder(offerId: fresh.id, quantity: 1, rewardId: usable.first.id);
      expect(discounted.discountMillimes, greaterThan(0));
      expect(discounted.totalMillimes, discounted.subtotalMillimes - discounted.discountMillimes);
      await student.cancelOrder(discounted.id);
    }
  }, skip: skip, timeout: const Timeout(Duration(seconds: 60)));

  test('Réservation d\'une offre inconnue : message serveur lisible', () async {
    final student = CampusApi(_client(base!, 'test-token:student-yassine:STUDENT:etudiant@essect.u-tunis.tn'));
    await expectLater(
      student.createOrder(offerId: 'off-inexistante', quantity: 1),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'OFFER_NOT_FOUND')),
    );
  }, skip: skip);
}
