// 💡 Concept & Analogie : Le relevé de la carte de fidélité tel que le serveur le tient : points, tampons et coupons réellement débloqués.
// 🔄 Comparaison React / Flutter : Miroir de la réponse `GET /loyalty/me` lue par `LoyaltyCardPage.jsx` et `OfferDetailPage.jsx`.
// 🎯 À retenir pour la soutenance : "Un coupon n'est appliqué qu'en envoyant son rewardId à POST /orders ; le serveur calcule la remise et la plafonne."
// Module : Modèles de Données Mobile

import 'order_model.dart' show parseApiDate;

class LoyaltyReward {
  final String id;
  final String type; // PERCENT_OFF | FREE_SURPRISE
  final String status; // AVAILABLE | LOCKED | USED | EXPIRED
  final int? percentOff;
  final int? maxDiscountMillimes;
  final int? milestone;
  final DateTime? expiresAt;

  const LoyaltyReward({
    required this.id,
    required this.type,
    required this.status,
    this.percentOff,
    this.maxDiscountMillimes,
    this.milestone,
    this.expiresAt,
  });

  bool get isAvailable => status == 'AVAILABLE';
  bool get isFreeSurprise => type == 'FREE_SURPRISE';

  factory LoyaltyReward.fromApi(Map<String, dynamic> json) => LoyaltyReward(
        // Même règle que `rewardKey` (shared/loyalty.js) : `rewardId` d'abord, sinon `id`.
        id: (json['rewardId'] ?? json['id'] ?? '').toString(),
        type: (json['type'] ?? 'PERCENT_OFF').toString(),
        status: (json['status'] ?? 'AVAILABLE').toString(),
        percentOff: (json['percentOff'] as num?)?.toInt(),
        maxDiscountMillimes: (json['maxDiscountMillimes'] as num?)?.toInt(),
        milestone: (json['milestone'] as num?)?.toInt(),
        expiresAt: parseApiDate(json['expiresAt']),
      );
}

class LoyaltyStatus {
  final int ecoPoints;
  final String displayName;
  final int totalMealsRescued;
  final List<LoyaltyReward> rewards;

  const LoyaltyStatus({
    required this.ecoPoints,
    required this.displayName,
    required this.totalMealsRescued,
    required this.rewards,
  });

  factory LoyaltyStatus.fromApi(Map<String, dynamic> json) {
    final raw = (json['rewards'] ?? json['unlockedRewards']) as List? ?? const [];
    return LoyaltyStatus(
      ecoPoints: (json['ecoPoints'] as num?)?.toInt() ?? 0,
      displayName: (json['displayName'] ?? '').toString(),
      totalMealsRescued: (json['totalMealsRescued'] as num?)?.toInt() ?? 0,
      rewards: raw
          .whereType<Map>()
          .map((m) => LoyaltyReward.fromApi(Map<String, dynamic>.from(m)))
          .toList(),
    );
  }
}
