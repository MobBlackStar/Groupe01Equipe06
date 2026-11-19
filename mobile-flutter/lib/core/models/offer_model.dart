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
    this.distanceFromEssectM,
  });

  factory OfferModel.fromJson(Map<String, dynamic> json) {
    return OfferModel(
      id: json['id'] as String? ?? '',
      merchantId: json['merchantId'] as String? ?? '',
      merchantName: json['merchantName'] as String? ??
          (json['merchantSnapshot'] is Map ? (json['merchantSnapshot'] as Map)['name'] as String? : null),
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'SANDWICH',
      pricingType: json['pricingType'] as String? ??
          (json['pricing'] is Map ? (json['pricing'] as Map)['mode'] as String? : null) ??
          'FIXED',
      originalPriceMillimes: (json['originalPriceMillimes'] as num?)?.toInt() ?? 0,
      targetPriceMillimes: (json['targetPriceMillimes'] as num?)?.toInt() ?? 0,
      decayHours: (json['decayHours'] as num?)?.toInt() ?? 2,
      stepMillimes: (json['stepMillimes'] as num?)?.toInt() ?? 100,
      quantity: (json['quantity'] as num?)?.toInt() ?? (json['quantityAvailable'] as num?)?.toInt() ?? 1,
      // L'API expose le stock sous `quantityAvailable` (alias historique : `remainingQuantity`)
      remainingQuantity: (json['quantityAvailable'] as num?)?.toInt() ?? (json['remainingQuantity'] as num?)?.toInt() ?? 1,
      pickupStartAt: parseApiDate(json['pickupStartAt']) ?? DateTime.now(),
      pickupEndAt: parseApiDate(json['pickupEndAt']) ?? DateTime.now().add(const Duration(hours: 2)),
      isSurpriseBasket: json['isSurpriseBasket'] as bool? ?? false,
      rarity: json['rarity'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      photoUrl: json['photoUrl'] as String?,
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
