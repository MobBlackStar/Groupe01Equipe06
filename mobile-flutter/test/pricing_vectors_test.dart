// 💡 Concept & Analogie : Test unitaire en Dart validant que l'algorithme d'enchère hollandaise dégressive produit exactement les mêmes résultats sous Flutter que sous Node.js et React.
// 🔄 Comparaison React / Flutter : Vérifie la parité stricte entre `Pricing.computeUnitPrice` en Dart et `computeUnitPrice` en JavaScript.
// 🎯 À retenir pour la soutenance : "Ce test garantit que l'application mobile calcule les prix dégressifs avec la même précision arithmétique que le backend."
// Module : Logique Métier Dart

import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/domain/pricing.dart';

void main() {
  group('Algorithme de calcul de prix Flutter (Smart Decay (Enchère dégressive))', () {
    test('Prix fixe standard', () {
      final price = Pricing.computeUnitPrice(
        mode: Pricing.modeFixed,
        discountedPriceMillimes: 4500,
        nowMs: 1700000000000,
      );
      expect(price, equals(4500));
    });

    test('Enchère hollandaise avant début de dégressivité', () {
      final price = Pricing.computeUnitPrice(
        mode: Pricing.modeDutchAuction,
        startPriceMillimes: 5000,
        floorPriceMillimes: 1500,
        decayStartMs: 1700000000000,
        pickupEndMs: 1700009000000,
        nowMs: 1699999000000,
      );
      expect(price, equals(5000));
    });

    test('Cas spécifié mi-parcours 16h15 -> 3200 millimes', () {
      // 150 min au total, écoulé 75 min (progress = 0.5)
      // 5000 - 3500*0.5 = 3250 -> arrondi pas de 100 -> 3200
      final price = Pricing.computeUnitPrice(
        mode: Pricing.modeDutchAuction,
        startPriceMillimes: 5000,
        floorPriceMillimes: 1500,
        decayStartMs: 1700056800000,
        pickupEndMs: 1700065800000,
        nowMs: 1700061300000,
        roundingStepMillimes: 100,
      );
      expect(price, equals(3200));
    });

    test('Cas spécifié fin de créneau 17h29 -> 1500 millimes', () {
      final price = Pricing.computeUnitPrice(
        mode: Pricing.modeDutchAuction,
        startPriceMillimes: 5000,
        floorPriceMillimes: 1500,
        decayStartMs: 1700056800000,
        pickupEndMs: 1700065800000,
        nowMs: 1700065740000,
        roundingStepMillimes: 100,
      );
      expect(price, equals(1500));
    });

    test('Couleur d urgence selon le temps restant', () {
      const baseNow = 1700000000000;
      expect(Pricing.computeUrgencyColor(pickupEndMs: baseNow + 75 * 60 * 1000, nowMs: baseNow), equals('#CCFF00'));
      expect(Pricing.computeUrgencyColor(pickupEndMs: baseNow + 35 * 60 * 1000, nowMs: baseNow), equals('#FF5500'));
      expect(Pricing.computeUrgencyColor(pickupEndMs: baseNow + 10 * 60 * 1000, nowMs: baseNow), equals('#FF1744'));
    });
  });
}
