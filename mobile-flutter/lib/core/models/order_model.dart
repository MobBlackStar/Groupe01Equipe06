// 💡 Concept & Analogie : Le reçu officiel renvoyé par le serveur : mobile n'invente rien, il affiche les montants et le statut tels que l'API les a figés.
// 🔄 Comparaison React / Flutter : Miroir de l'objet `order` consommé par `CheckoutPage.jsx` et `LivingTicketPage.jsx` (réponses de /orders, /orders/:id et /orders/:id/ticket).
// 🎯 À retenir pour la soutenance : "Le total à payer (pricing.totalMillimes) et la remise fidélité sont calculés par le serveur ; l'application ne recalcule jamais une réduction."
// Module : Modèles de Données Mobile

/// Convertit une date d'API en [DateTime] : ISO 8601, millisecondes, ou Timestamp Firestore sérialisé
/// (`{_seconds: n}` / `{seconds: n}`). Renvoie `null` si la valeur n'est pas exploitable.
DateTime? parseApiDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is num) return DateTime.fromMillisecondsSinceEpoch(value.toInt());
  if (value is String) return DateTime.tryParse(value);
  if (value is Map) {
    final secs = value['_seconds'] ?? value['seconds'];
    if (secs is num) return DateTime.fromMillisecondsSinceEpoch(secs.toInt() * 1000);
  }
  return null;
}

class OrderModel {
  final String id;
  final String orderCode;
  final String status;
  final int quantity;
  final String offerTitle;
  final String merchantName;
  final DateTime? pickupStartAt;
  final DateTime? pickupEndAt;
  final DateTime? reservationExpiresAt;
  final int lockedUnitPriceMillimes;
  final int subtotalMillimes;
  final int discountMillimes;
  final int totalMillimes;
  final DateTime? createdAt;

  const OrderModel({
    required this.id,
    required this.orderCode,
    required this.status,
    required this.quantity,
    required this.offerTitle,
    required this.merchantName,
    this.pickupStartAt,
    this.pickupEndAt,
    this.reservationExpiresAt,
    required this.lockedUnitPriceMillimes,
    required this.subtotalMillimes,
    required this.discountMillimes,
    required this.totalMillimes,
    this.createdAt,
  });

  bool get isReserved => status == 'RESERVED';
  bool get isPaid => status == 'PAID';

  /// Parse un document commande ; accepte `orderId` (création) comme `id` (listes).
  factory OrderModel.fromApi(Map<String, dynamic> json) {
    final offer = json['offerSnapshot'] is Map ? Map<String, dynamic>.from(json['offerSnapshot'] as Map) : const <String, dynamic>{};
    final merchant = json['merchantSnapshot'] is Map ? Map<String, dynamic>.from(json['merchantSnapshot'] as Map) : const <String, dynamic>{};
    final pricing = json['pricing'] is Map ? Map<String, dynamic>.from(json['pricing'] as Map) : const <String, dynamic>{};
    final reward = pricing['reward'] is Map ? Map<String, dynamic>.from(pricing['reward'] as Map) : const <String, dynamic>{};

    int millimes(dynamic v) => (v as num?)?.toInt() ?? 0;
    final quantity = millimes(json['quantity']);
    final unit = millimes(pricing['lockedUnitPriceMillimes']);
    final subtotal = pricing['subtotalMillimes'] != null ? millimes(pricing['subtotalMillimes']) : unit * quantity;
    final discount = millimes(reward['discountMillimes']);
    final total = pricing['totalMillimes'] != null ? millimes(pricing['totalMillimes']) : (subtotal - discount);

    return OrderModel(
      id: (json['orderId'] ?? json['id'] ?? '').toString(),
      orderCode: (json['orderCode'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      quantity: quantity,
      offerTitle: (offer['title'] ?? '').toString(),
      merchantName: (merchant['name'] ?? '').toString(),
      pickupStartAt: parseApiDate(offer['pickupStartAt']),
      pickupEndAt: parseApiDate(offer['pickupEndAt']),
      reservationExpiresAt: parseApiDate(json['reservationExpiresAt']),
      lockedUnitPriceMillimes: unit,
      subtotalMillimes: subtotal,
      discountMillimes: discount,
      totalMillimes: total,
      createdAt: parseApiDate(json['createdAt']),
    );
  }
}

/// Paramètres cryptographiques de `GET /orders/:id/ticket` (la clé n'est jamais stockée côté client).
class TicketParams {
  final String ticketKeyHex;
  final String orderCode;
  final int windowSeconds;

  const TicketParams({
    required this.ticketKeyHex,
    required this.orderCode,
    this.windowSeconds = 30,
  });

  factory TicketParams.fromApi(Map<String, dynamic> json) {
    final src = json['ticket'] is Map ? Map<String, dynamic>.from(json['ticket'] as Map) : json;
    return TicketParams(
      ticketKeyHex: (src['ticketKey'] ?? src['ticketKeyHex'] ?? '').toString(),
      orderCode: (src['orderCode'] ?? '').toString(),
      windowSeconds: (src['windowSeconds'] as num?)?.toInt() ?? 30,
    );
  }
}

/// Résultat de `POST /payments/konnect/init`.
class PaymentInit {
  final String? payUrl;
  final String? paymentRef;
  final bool paidWithReward;

  const PaymentInit({this.payUrl, this.paymentRef, this.paidWithReward = false});

  factory PaymentInit.fromApi(Map<String, dynamic> json) => PaymentInit(
        payUrl: json['payUrl'] as String?,
        paymentRef: json['paymentRef'] as String?,
        paidWithReward: json['paidWithReward'] == true,
      );
}
