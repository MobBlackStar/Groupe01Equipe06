// 💡 Concept & Analogie : Test des « traducteurs » entre les réponses JSON du serveur et les écrans : si un champ change de nom, ce test le signale avant la démo.
// 🔄 Comparaison React / Flutter : Équivalent des helpers `buildTicket` / `extractOrder` de `LivingTicketPage.jsx` et `CheckoutPage.jsx`.
// 🎯 À retenir pour la soutenance : "L'application affiche les montants du serveur ; elle ne recalcule jamais une remise ni un total."
// Module : Tests Mobile

import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/domain/loyalty.dart';
import 'package:campussave_mobile/core/models/loyalty_model.dart';
import 'package:campussave_mobile/core/models/offer_model.dart';
import 'package:campussave_mobile/core/models/order_model.dart';

void main() {
  group('parseApiDate', () {
    test('accepte ISO, millisecondes et Timestamp Firestore sérialisé', () {
      expect(parseApiDate('2026-11-19T10:00:00.000Z')!.toUtc().hour, 10);
      expect(parseApiDate(1795045148392)!.millisecondsSinceEpoch, 1795045148392);
      expect(parseApiDate({'_seconds': 1795045148, '_nanoseconds': 0})!.millisecondsSinceEpoch, 1795045148000);
      expect(parseApiDate(null), isNull);
      expect(parseApiDate('pas une date'), isNull);
    });
  });

  group('OrderModel.fromApi', () {
    final json = {
      'orderId': 'abc123',
      'orderCode': 'CS-8K4M9',
      'status': 'RESERVED',
      'quantity': 2,
      'offerSnapshot': {'title': 'Baguette Farcie', 'pickupEndAt': '2026-11-19T12:00:00.000Z'},
      'merchantSnapshot': {'id': 'm-baguette', 'name': 'Baguette & Baguette'},
      'pricing': {
        'lockedUnitPriceMillimes': 3800,
        'subtotalMillimes': 7600,
        'reward': {'rewardId': 'rw_100', 'type': 'PERCENT_OFF', 'discountMillimes': 1520},
        'totalMillimes': 6080,
      },
      'reservationExpiresAt': '2026-11-19T10:10:00.000Z',
    };

    test('reprend les montants figés par le serveur (jamais recalculés)', () {
      final o = OrderModel.fromApi(json);
      expect(o.id, 'abc123');
      expect(o.isReserved, isTrue);
      expect(o.subtotalMillimes, 7600);
      expect(o.discountMillimes, 1520);
      expect(o.totalMillimes, 6080);
      expect(o.offerTitle, 'Baguette Farcie');
      expect(o.merchantName, 'Baguette & Baguette');
    });

    test('accepte `id` (listes) à la place de `orderId`', () {
      final o = OrderModel.fromApi({...json, 'orderId': null, 'id': 'xyz'});
      expect(o.id, 'xyz');
    });
  });

  group('TicketParams / PaymentInit', () {
    test('lit ticketKey (nom serveur) et le nom historique ticketKeyHex', () {
      expect(TicketParams.fromApi({'ticketKey': 'ab12', 'orderCode': 'CS-1', 'windowSeconds': 30}).ticketKeyHex, 'ab12');
      expect(TicketParams.fromApi({'ticket': {'ticketKeyHex': 'cd34', 'orderCode': 'CS-1'}}).ticketKeyHex, 'cd34');
    });

    test('commande gratuite : paidWithReward sans payUrl', () {
      final p = PaymentInit.fromApi({'paidWithReward': true, 'order': {}});
      expect(p.paidWithReward, isTrue);
      expect(p.payUrl, isNull);
    });
  });

  group('Fidélité (ALG-LOYALTY)', () {
    test('tampons = floor((ecoPoints mod 100) / 20) sur 5', () {
      expect(Loyalty.calculateStamps(0), 0);
      expect(Loyalty.calculateStamps(90), 4);
      expect(Loyalty.calculateStamps(100), 0);
      expect(Loyalty.calculateStamps(240), 2);
      expect(Loyalty.calculateStamps(299), 4);
    });

    test('coupons : identifiant rewardId puis id, statut AVAILABLE', () {
      final s = LoyaltyStatus.fromApi({
        'ecoPoints': 120,
        'rewards': [
          {'rewardId': 'rw_100_ab', 'type': 'PERCENT_OFF', 'percentOff': 20, 'maxDiscountMillimes': 2000, 'status': 'AVAILABLE'},
          {'id': 'seed-1', 'type': 'FREE_SURPRISE', 'status': 'USED'},
        ],
      });
      expect(s.rewards.map((r) => r.id), ['rw_100_ab', 'seed-1']);
      expect(s.rewards.first.isAvailable, isTrue);
      expect(s.rewards.last.isFreeSurprise, isTrue);
      expect(s.rewards.last.isAvailable, isFalse);
    });
  });

  group('OfferModel.fromJson (forme API)', () {
    test('lit quantityAvailable, merchantSnapshot.name et rarity', () {
      final o = OfferModel.fromJson({
        'id': 'off-7',
        'merchantId': 'm-vert',
        'title': 'Panier',
        'category': 'MIXTE',
        'pricingType': 'FIXED',
        'originalPriceMillimes': 7000,
        'targetPriceMillimes': 2900,
        'quantityAvailable': 3,
        'merchantSnapshot': {'name': 'Le Vert'},
        'isSurpriseBasket': true,
        'rarity': 'COMMON',
        'pickupEndAt': '2026-11-19T12:00:00.000Z',
      });
      expect(o.remainingQuantity, 3);
      expect(o.merchantName, 'Le Vert');
      expect(o.rarity, 'COMMON');
    });
  });
}
