// 💡 Concept & Analogie : Le test de la boîte mystère : le contenu révélé par le serveur doit être lu article par article, quel que soit son format.
// 🔄 Comparaison React / Flutter : Équivalent d'un test Vitest sur `OrderRow` / `UnboxingReveal`.
// 🎯 À retenir pour la soutenance : "Le mobile lit le contenu du panier, la note et les EcoPoints d'une commande terminée ; les avatars prédéfinis sont les mêmes que sur le site."

import 'package:campussave_mobile/core/domain/avatars.dart';
import 'package:campussave_mobile/core/domain/geo.dart';
import 'package:campussave_mobile/core/models/order_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('OrderModel lit le contenu révélé, la note et les points d une commande terminée', () {
    final order = OrderModel.fromApi({
      'orderId': 'o1',
      'orderCode': 'CS-ABC12',
      'status': 'COMPLETED',
      'quantity': 1,
      'offerSnapshot': {'title': 'Panier surprise', 'isSurpriseBasket': true, 'rarity': 'RARE'},
      'merchantSnapshot': {'name': 'Chez Test'},
      'pricing': {'lockedUnitPriceMillimes': 4000, 'totalMillimes': 4000},
      'reveal': {
        'items': [
          {'name': 'Croissants', 'quantity': 2},
          'Jus d orange',
          {'title': 'Brik', 'qty': 3},
        ],
        'note': 'Bon appétit',
      },
      'rating': {'stars': 4},
      'rewards': {'pointsAwarded': 45},
    });
    expect(order.isSurpriseBasket, isTrue);
    expect(order.rarity, 'RARE');
    expect(order.ratingStars, 4);
    expect(order.pointsAwarded, 45);
    expect(order.revealItems.map((e) => '${e['quantity']}x ${e['name']}').toList(), ['2x Croissants', '1x Jus d orange', '3x Brik']);
  });

  test('OrderModel sans révélation ni note : valeurs vides, pas d erreur', () {
    final order = OrderModel.fromApi({'orderId': 'o2', 'status': 'PAID', 'quantity': 2});
    expect(order.revealItems, isEmpty);
    expect(order.ratingStars, isNull);
    expect(order.isSurpriseBasket, isFalse);
  });

  test('avatars prédéfinis : identifiants connus résolus, inconnus ignorés', () {
    expect(resolveAvatarPreset('preset:croissant')?.emoji, '🥐');
    expect(resolveAvatarPreset('preset:inconnu'), isNull);
    expect(resolveAvatarPreset('https://example.com/a.png'), isNull);
  });

  test('coordonnées collées depuis Google Maps et règle des 3 km', () {
    expect(parseCoords('36.7875, 10.1758')?.lat, 36.7875);
    expect(parseCoords('36.7875 10.1758')?.lng, 10.1758);
    expect(parseCoords('abc'), isNull);
    expect(parseCoords('120, 10'), isNull);
    final near = distanceFromEssectM(36.7885, 10.1762);
    expect(near, lessThan(kMaxMerchantDistanceM));
    expect(distanceFromEssectM(36.878, 10.3245), greaterThan(kMaxMerchantDistanceM));
    expect(walkingMinutesFor(0), 0);
    expect(walkingMinutesFor(500), greaterThan(0));
  });
}
