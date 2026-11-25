// 💡 Concept & Analogie : Modèle d'offre anti-gaspillage supportant les prix fixes et les enchères dégressives (Smart Decay).
// 🔄 Comparaison React / Flutter : Alimente les cartes d'offres mobiles avec les calculs de prix temps réel.
// 🎯 À retenir pour la soutenance : "Ce modèle encapsule les prix en millimes entiers stricts et les créneaux de collecte."
// Module : Modèles de Données Mobile

import 'order_model.dart' show parseApiDate;

class OfferModel {
  final String id;
  final String merchantId;
  final String? merchantName;
  final String title;
  final String description;
  final String category;
  final String pricingType; // 'FIXED' ou 'DUTCH'
  final int originalPriceMillimes;
  final int targetPriceMillimes;
  final int decayHours;
  final int stepMillimes;
  final int quantity;
  final int remainingQuantity;
  final DateTime pickupStartAt;
  final DateTime pickupEndAt;
  final bool isSurpriseBasket;
  final String status; // 'ACTIVE', 'SOLD_OUT', 'EXPIRED'
  final String? photoUrl;
  final String? rarity; // COMMON | RARE | LEGENDARY (paniers surprise)
  final int? startPriceMillimes; // départ d'une enchère dégressive (null pour un prix fixe)
  final int? currentPriceMillimes; // prix courant calculé côté serveur si disponible
  final int? distanceFromEssectM; // distance réelle du commerce (merchantSnapshot), null si inconnue

  const OfferModel({
    required this.id,
    required this.merchantId,
    this.merchantName,
    required this.title,
    required this.description,
    required this.category,
    this.pricingType = 'FIXED',
    required this.originalPriceMillimes,
    required this.targetPriceMillimes,
    this.decayHours = 2,
    this.stepMillimes = 100,
    required this.quantity,
    required this.remainingQuantity,
    required this.pickupStartAt,
    required this.pickupEndAt,
    this.isSurpriseBasket = false,
    this.status = 'ACTIVE',
    this.photoUrl,
    this.rarity,
    this.startPriceMillimes,
    this.currentPriceMillimes,
    this.distanceFromEssectM,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    final pricing = json['pricing'] is Map ? Map<String, dynamic>.from(json['pricing'] as Map) : const <String, dynamic>{};
    final rawMode = (json['pricingType'] ?? pricing['mode'] ?? json['pricingMode'] ?? 'FIXED').toString().toUpperCase();
    final isDutch = rawMode == 'DUTCH' || rawMode == 'DUTCH_AUCTION';

    final originalPrice = (json['originalPriceMillimes'] as num?)?.toInt() ??
        (pricing['originalPriceMillimes'] as num?)?.toInt() ??
        0;
    final startPrice = (json['startPriceMillimes'] as num?)?.toInt() ??
        (pricing['startPriceMillimes'] as num?)?.toInt();
    final currentServerPrice = (json['currentPriceMillimes'] as num?)?.toInt();

    final rawTarget = (json['targetPriceMillimes'] as num?)?.toInt() ??
        (isDutch ? (pricing['floorPriceMillimes'] as num?)?.toInt() : null) ??
        (pricing['discountedPriceMillimes'] as num?)?.toInt() ??
        (json['discountedPriceMillimes'] as num?)?.toInt() ??
        (pricing['floorPriceMillimes'] as num?)?.toInt() ??
        (json['floorPriceMillimes'] as num?)?.toInt() ??
        currentServerPrice ??
        startPrice ??
        originalPrice;

    int safeTarget = rawTarget > 0 ? rawTarget : 0;
    if (safeTarget <= 0) {
      final fallback = (pricing['discountedPriceMillimes'] as num?)?.toInt() ??
          (pricing['startPriceMillimes'] as num?)?.toInt() ??
          currentServerPrice ??
          originalPrice;
      safeTarget = fallback;
    }

    return OfferModel(
      id: json['id'] as String? ?? '',
      merchantId: json['merchantId'] as String? ?? '',
      merchantName: json['merchantName'] as String? ??
          (json['merchantSnapshot'] is Map ? (json['merchantSnapshot'] as Map)['name'] as String? : null),
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'SANDWICH',
      pricingType: isDutch ? 'DUTCH' : 'FIXED',
      originalPriceMillimes: originalPrice > 0 ? originalPrice : safeTarget,
      targetPriceMillimes: safeTarget,
      decayHours: (json['decayHours'] as num?)?.toInt() ?? 2,
      stepMillimes: (json['stepMillimes'] as num?)?.toInt() ?? (pricing['roundingStepMillimes'] as num?)?.toInt() ?? 100,
      quantity: (json['quantity'] as num?)?.toInt() ?? (json['quantityTotal'] as num?)?.toInt() ?? (json['quantityAvailable'] as num?)?.toInt() ?? 1,
      // L'API expose le stock sous `quantityAvailable` (alias historique : `remainingQuantity`)
      remainingQuantity: (json['quantityAvailable'] as num?)?.toInt() ?? (json['remainingQuantity'] as num?)?.toInt() ?? (json['quantity'] as num?)?.toInt() ?? 1,
      pickupStartAt: parseApiDate(json['pickupStartAt']) ?? DateTime.now(),
      pickupEndAt: parseApiDate(json['pickupEndAt']) ?? DateTime.now().add(const Duration(hours: 2)),
      isSurpriseBasket: json['isSurpriseBasket'] as bool? ?? false,
      rarity: json['rarity'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      photoUrl: (json['photoUrl'] as String?) ?? (json['imageUrl'] as String?),
      startPriceMillimes: startPrice,
      currentPriceMillimes: currentServerPrice,
      distanceFromEssectM: (json['distanceFromEssectM'] as num?)?.toInt() ??
          (json['merchantSnapshot'] is Map ? ((json['merchantSnapshot'] as Map)['distanceFromEssectM'] as num?)?.toInt() : null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'merchantId': merchantId,
      'merchantName': merchantName,
      'title': title,
      'description': description,
      'category': category,
      'pricingType': pricingType,
      'originalPriceMillimes': originalPriceMillimes,
      'targetPriceMillimes': targetPriceMillimes,
      'startPriceMillimes': startPriceMillimes,
      'currentPriceMillimes': currentPriceMillimes,
      'decayHours': decayHours,
      'stepMillimes': stepMillimes,
      'quantity': quantity,
      'remainingQuantity': remainingQuantity,
      'pickupStartAt': pickupStartAt.toIso8601String(),
      'pickupEndAt': pickupEndAt.toIso8601String(),
      'isSurpriseBasket': isSurpriseBasket,
      'status': status,
      'photoUrl': photoUrl,
      'rarity': rarity,
      'distanceFromEssectM': distanceFromEssectM,
    };
  }
}
