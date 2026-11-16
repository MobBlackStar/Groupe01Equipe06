// 💡 Concept & Analogie : Implémentation Dart de l'algorithme d'enchère hollandaise dégressive (Smart Decay) pour Flutter.
// 🔄 Comparaison React / Flutter : Produit des valeurs strictement identiques à `shared/pricing.js` validées par `test/pricing_vectors_test.dart`.
// 🎯 À retenir pour la soutenance : "Ce module Dart porte fidèlement l'algorithme de dégressivité linéaire pour un calcul réactif et hors ligne sur smartphone."
// Module : Logique Métier Dart

import 'dart:math';

class Pricing {
  static const String modeFixed = 'FIXED';
  static const String modeDutchAuction = 'DUTCH_AUCTION';
  static const String modeDutch = 'DUTCH';

  /// Extrait un horodatage en millisecondes depuis un int, String ISO 8601 ou DateTime.
  static int? parseTimestampToMs(dynamic val) {
    if (val == null) return null;
    if (val is int) return val;
    if (val is double) return val.toInt();
    if (val is DateTime) return val.millisecondsSinceEpoch;
    if (val is String) {
      final parsed = DateTime.tryParse(val);
      if (parsed != null) return parsed.millisecondsSinceEpoch;
      final asInt = int.tryParse(val);
      if (asInt != null) return asInt;
    }
    return null;
  }

  /// Calcule le prix unitaire d'une offre à partir d'une Map (document Firestore ou JSON de test)
  static int computeFromMap(Map<String, dynamic> offer, dynamic nowInput) {
    final pricing = offer['pricing'] is Map<String, dynamic>
        ? offer['pricing'] as Map<String, dynamic>
        : offer;
    final mode = (pricing['mode'] ?? offer['pricingType'] ?? offer['pricingMode'] ?? modeFixed).toString().toUpperCase();

    final nowMs = parseTimestampToMs(nowInput) ?? 0;

    if (mode == modeFixed || mode == 'FIXED') {
      final discounted = pricing['discountedPriceMillimes'] ??
          offer['discountedPriceMillimes'] ??
          offer['targetPriceMillimes'] ??
          0;
      return (discounted as num).round();
    }

    if (mode == modeDutchAuction || mode == modeDutch || mode == 'DUTCH_AUCTION' || mode == 'DUTCH') {
      final start = ((pricing['startPriceMillimes'] ??
          offer['startPriceMillimes'] ??
          offer['originalPriceMillimes'] ??
          0) as num).toInt();
      final floor = ((pricing['floorPriceMillimes'] ??
          offer['floorPriceMillimes'] ??
          offer['targetPriceMillimes'] ??
          0) as num).toInt();
      final step = max(
        1,
        ((pricing['roundingStepMillimes'] ?? offer['stepMillimes'] ?? 100) as num).toInt(),
      );

      final decayStartMs = parseTimestampToMs(
        pricing['decayStartAt'] ?? offer['decayStartAt'] ?? offer['pickupStartAt'],
      );
      final pickupEndMs = parseTimestampToMs(
        pricing['pickupEndAt'] ?? offer['pickupEndAt'],
      );

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
      final rawPrice = start - (start - floor) * progress;
      final steppedPrice = (rawPrice / step).floor() * step;

      return min(start, max(floor, steppedPrice));
    }

    final fallback = pricing['discountedPriceMillimes'] ?? offer['discountedPriceMillimes'] ?? 0;
    return (fallback as num).round();
  }

  /// Calcule le prix unitaire d'une offre en millimes (entier strict) via paramètres nommés
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
    final normalizedMode = mode.toUpperCase();
    if (normalizedMode == modeFixed || normalizedMode == 'FIXED') {
      return discountedPriceMillimes ?? 0;
    }

    if (normalizedMode == modeDutchAuction || normalizedMode == modeDutch || normalizedMode == 'DUTCH') {
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

      return min(start, max(floor, stepped));
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

  /// Retourne les minutes restantes avant la clôture
  static int computeMinutesLeft({required int pickupEndMs, required int nowMs}) {
    final diffMs = pickupEndMs - nowMs;
    return max(0, (diffMs / 60000.0).floor());
  }
}
