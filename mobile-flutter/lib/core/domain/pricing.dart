// 💡 Concept & Analogie : Implémentation Dart de l'algorithme d'enchère hollandaise dégressive (Smart Decay (Enchère dégressive)) pour Flutter.
// 🔄 Comparaison React / Flutter : Produit des valeurs strictement identiques à `shared/pricing.js` validées par `test/pricing_vectors_test.dart`.
// 🎯 À retenir pour la soutenance : "Ce module Dart porte fidèlement l'algorithme de dégressivité linéaire pour un calcul réactif et hors ligne sur smartphone."
// Module : Logique Métier Dart

import 'dart:math';

class Pricing {
  static const String modeFixed = 'FIXED';
  static const String modeDutchAuction = 'DUTCH_AUCTION';

  /// Calcule le prix unitaire d'une offre en millimes (entier strict)
  static int computeUnitPrice({
    required String mode,
    int? discountedPriceMillimes,
    int? startPriceMillimes,
    int? floorPriceMillimes,
    int? decayStartMs,
    int? pickupEndMs,
    int roundingStepMillimes = 100,
    required int nowMs,
  }) {
    if (mode == modeFixed) {
      return discountedPriceMillimes ?? 0;
    }

    if (mode == modeDutchAuction) {
      final start = startPriceMillimes ?? 0;
      final floor = floorPriceMillimes ?? 0;
      final step = roundingStepMillimes > 0 ? roundingStepMillimes : 100;

      if (decayStartMs == null || pickupEndMs == null || pickupEndMs <= decayStartMs) {
        return start;
      }

      if (nowMs <= decayStartMs) {
        return start;
      }

      if (nowMs >= pickupEndMs) {
        return floor;
      }

      final progress = (nowMs - decayStartMs) / (pickupEndMs - decayStartMs);
      final raw = start - (start - floor) * progress;
      final stepped = (raw / step).floor() * step;

      return max(floor, stepped);
    }

    return discountedPriceMillimes ?? 0;
  }

  /// Calcule la couleur d'urgence visuelle (#CCFF00, #FF5500, #FF1744)
  static String computeUrgencyColor({required int pickupEndMs, required int nowMs}) {
    final minutesLeft = (pickupEndMs - nowMs) / 60000.0;
    if (minutesLeft > 60) return '#CCFF00';
    if (minutesLeft >= 20) return '#FF5500';
    return '#FF1744';
  }
}
