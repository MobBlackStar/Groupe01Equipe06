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

class OrderLine {
  final String offerId;
  final String title;
  final int quantity;
  final int unitPriceMillimes;
  final int originalUnitPriceMillimes;
  final int lineSubtotalMillimes;
  final String? photoUrl;
  final bool isSurpriseBasket;
  final String? rarity;

  const OrderLine({
    required this.offerId,
    required this.title,
    required this.quantity,
    required this.unitPriceMillimes,
    required this.originalUnitPriceMillimes,
    required this.lineSubtotalMillimes,
    this.photoUrl,
    this.isSurpriseBasket = false,
    this.rarity,
  });

  factory OrderLine.fromApi(Map<String, dynamic> json) {
    final qty = (json['quantity'] as num?)?.toInt() ?? 1;
    final unit = (json['unitPriceMillimes'] as num?)?.toInt() ?? 0;
    final original = (json['originalUnitPriceMillimes'] as num?)?.toInt() ?? unit;
    final lineSubtotal = (json['lineSubtotalMillimes'] as num?)?.toInt() ?? (unit * qty);
    return OrderLine(
      offerId: (json['offerId'] ?? '').toString(),
      title: (json['title'] ?? 'Article').toString(),
      quantity: qty,
      unitPriceMillimes: unit,
      originalUnitPriceMillimes: original,
      lineSubtotalMillimes: lineSubtotal,
      photoUrl: json['photoUrl']?.toString(),
      isSurpriseBasket: json['isSurpriseBasket'] == true,
      rarity: json['rarity']?.toString(),
    );
  }
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
  final bool isSurpriseBasket;
  final String? rarity;
  final int? ratingStars; // null = pas encore noté
  final List<Map<String, dynamic>> revealItems; // contenu du panier surprise révélé au retrait : [{name, quantity}]
  final String? revealNote;
  final int? pointsAwarded;
  final List<OrderLine> items;

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
    this.isSurpriseBasket = false,
    this.rarity,
    this.ratingStars,
    this.revealItems = const [],
    this.revealNote,
    this.pointsAwarded,
    this.items = const [],
  });

  bool get isReserved => status == 'RESERVED';
  bool get isPaid => status == 'PAID';

  /// Lignes normalisées : garantit au moins une ligne même pour une commande mono-article historique.
  List<OrderLine> get normalizedItems {
    if (items.isNotEmpty) return items;
    if (offerTitle.isEmpty && quantity <= 0) return const [];
    return [
      OrderLine(
        offerId: '',
        title: offerTitle.isNotEmpty ? offerTitle : 'Article',
        quantity: quantity > 0 ? quantity : 1,
        unitPriceMillimes: lockedUnitPriceMillimes,
        originalUnitPriceMillimes: lockedUnitPriceMillimes,
        lineSubtotalMillimes: subtotalMillimes > 0 ? subtotalMillimes : (lockedUnitPriceMillimes * (quantity > 0 ? quantity : 1)),
        isSurpriseBasket: isSurpriseBasket,
        rarity: rarity,
      ),
    ];
  }

  String get summaryTitle {
    final lines = normalizedItems;
    if (lines.length <= 1) {
      return offerTitle.isNotEmpty ? offerTitle : (lines.isNotEmpty ? lines.first.title : 'Commande');
    }
    final extra = lines.length - 1;
    return '${lines.first.title} + $extra autre${extra > 1 ? 's' : ''}';
  }

  int get totalQuantity {
    if (quantity > 0) return quantity;
    return normalizedItems.fold(0, (sum, line) => sum + line.quantity);
  }

  /// Parse un document commande ; accepte `orderId` (création) comme `id` (listes).
  factory OrderModel.fromApi(Map<String, dynamic> json) {
    final offer = json['offerSnapshot'] is Map ? Map<String, dynamic>.from(json['offerSnapshot'] as Map) : const <String, dynamic>{};
    final merchant = json['merchantSnapshot'] is Map ? Map<String, dynamic>.from(json['merchantSnapshot'] as Map) : const <String, dynamic>{};
    final pricing = json['pricing'] is Map ? Map<String, dynamic>.from(json['pricing'] as Map) : const <String, dynamic>{};
    final reward = pricing['reward'] is Map ? Map<String, dynamic>.from(pricing['reward'] as Map) : const <String, dynamic>{};

    int millimes(dynamic v) => (v as num?)?.toInt() ?? 0;
    final rating = json['rating'] is Map ? Map<String, dynamic>.from(json['rating'] as Map) : const <String, dynamic>{};
    final reveal = json['reveal'] is Map ? Map<String, dynamic>.from(json['reveal'] as Map) : const <String, dynamic>{};
    final rewardsDoc = json['rewards'] is Map ? Map<String, dynamic>.from(json['rewards'] as Map) : const <String, dynamic>{};
    // Le contenu révélé est une liste d'objets {name, quantity} (ou de textes pour les anciennes offres)
    final revealItems = <Map<String, dynamic>>[
      for (final it in (reveal['items'] as List? ?? const []))
        if (it is Map)
          {'name': (it['name'] ?? it['title'] ?? '').toString(), 'quantity': ((it['quantity'] ?? it['qty'] ?? 1) as num).toInt()}
        else if (it != null)
          {'name': it.toString(), 'quantity': 1},
    ];
    final rawItems = json['items'] as List? ?? const [];
    final parsedItems = <OrderLine>[
      for (final raw in rawItems)
        if (raw is Map) OrderLine.fromApi(Map<String, dynamic>.from(raw)),
    ];
    final itemsQty = parsedItems.fold<int>(0, (sum, line) => sum + line.quantity);
    final rawQty = millimes(json['quantity']);
    final quantity = rawQty > 0 ? rawQty : itemsQty;
    final unit = pricing['lockedUnitPriceMillimes'] != null
        ? millimes(pricing['lockedUnitPriceMillimes'])
        : (parsedItems.isNotEmpty ? parsedItems.first.unitPriceMillimes : 0);
    final subtotal = pricing['subtotalMillimes'] != null
        ? millimes(pricing['subtotalMillimes'])
        : (parsedItems.isNotEmpty ? parsedItems.fold<int>(0, (sum, l) => sum + l.lineSubtotalMillimes) : unit * quantity);
    final discount = millimes(reward['discountMillimes']);
    final total = pricing['totalMillimes'] != null ? millimes(pricing['totalMillimes']) : (subtotal - discount);
    final snapshotTitle = (offer['title'] ?? '').toString();
    final resolvedTitle = snapshotTitle.isNotEmpty
        ? snapshotTitle
        : (parsedItems.isEmpty
            ? ''
            : parsedItems.length == 1
                ? parsedItems.first.title
                : '${parsedItems.first.title} + ${parsedItems.length - 1} autre${parsedItems.length - 1 > 1 ? 's' : ''}');
    final hasSurprise = offer['isSurpriseBasket'] == true || parsedItems.any((line) => line.isSurpriseBasket);
    final resolvedRarity = offer['rarity']?.toString() ?? parsedItems.where((l) => l.rarity != null).map((l) => l.rarity).firstOrNull;

    return OrderModel(
      id: (json['orderId'] ?? json['id'] ?? '').toString(),
      orderCode: (json['orderCode'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      quantity: quantity,
      offerTitle: resolvedTitle,
      merchantName: (merchant['name'] ?? '').toString(),
      pickupStartAt: parseApiDate(offer['pickupStartAt']),
      pickupEndAt: parseApiDate(offer['pickupEndAt']),
      reservationExpiresAt: parseApiDate(json['reservationExpiresAt']),
      lockedUnitPriceMillimes: unit,
      subtotalMillimes: subtotal,
      discountMillimes: discount,
      totalMillimes: total,
      createdAt: parseApiDate(json['createdAt']),
      isSurpriseBasket: hasSurprise,
      rarity: resolvedRarity,
      ratingStars: (rating['stars'] as num?)?.toInt(),
      revealItems: revealItems,
      revealNote: reveal['note']?.toString(),
      pointsAwarded: (rewardsDoc['pointsAwarded'] as num?)?.toInt(),
      items: parsedItems,
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
