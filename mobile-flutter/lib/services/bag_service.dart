// 💡 Concept & Analogie : Le panier mono-commerce "Dans mon sac" côté mobile — toutes les offres d'un même commerçant sont regroupées avant de réserver en un seul passage.
// 🔄 Comparaison React / Flutter : Miroir de `web-react/src/features/bag/BagContext.jsx`, basé sur `ChangeNotifier` et `Pricing.computeUnitPrice`.
// 🎯 À retenir pour la soutenance : "La contrainte mono-commerce garantit un retrait unique par QR code tout en conservant le calcul des enchères hollandaises à la seconde."

import 'dart:collection';
import 'package:flutter/foundation.dart';
import '../core/domain/pricing.dart';
import '../core/models/offer_model.dart';

class BagItem {
  final OfferModel offer;
  final int quantity;

  const BagItem({required this.offer, required this.quantity});

  int get maxAllowed => offer.remainingQuantity > 0 ? offer.remainingQuantity.clamp(1, 4) : 1;

  int unitPriceAt(int nowMs) {
    final startMs = offer.pickupStartAt.millisecondsSinceEpoch;
    final endMs = offer.pickupEndAt.millisecondsSinceEpoch;
    return Pricing.computeUnitPrice(
      mode: offer.pricingType,
      discountedPriceMillimes: offer.targetPriceMillimes,
      startPriceMillimes: offer.startPriceMillimes ?? offer.originalPriceMillimes,
      floorPriceMillimes: offer.targetPriceMillimes,
      decayStartMs: startMs,
      pickupEndMs: endMs,
      roundingStepMillimes: offer.stepMillimes,
      nowMs: nowMs,
    );
  }

  BagItem copyWith({OfferModel? offer, int? quantity}) => BagItem(
        offer: offer ?? this.offer,
        quantity: quantity ?? this.quantity,
      );
}

enum BagAddStatus { added, conflict }

class BagAddResult {
  final BagAddStatus status;
  final String? currentMerchantName;
  final String? incomingMerchantName;

  const BagAddResult._({
    required this.status,
    this.currentMerchantName,
    this.incomingMerchantName,
  });

  const BagAddResult.added() : this._(status: BagAddStatus.added);

  const BagAddResult.conflict({
    required String? currentMerchantName,
    required String? incomingMerchantName,
  }) : this._(
          status: BagAddStatus.conflict,
          currentMerchantName: currentMerchantName,
          incomingMerchantName: incomingMerchantName,
        );
}

class BagService extends ChangeNotifier {
  final List<BagItem> _items = [];
  List<OfferModel> _catalog = [];
  String? _merchantId;
  String? _merchantName;

  UnmodifiableListView<BagItem> get items => UnmodifiableListView(_items);
  String? get merchantId => _merchantId;
  String? get merchantName => _merchantName;
  bool get isEmpty => _items.isEmpty;
  bool get isNotEmpty => _items.isNotEmpty;

  int get totalCount => _items.fold(0, (sum, item) => sum + item.quantity);

  bool get hasCommonSurpriseItem =>
      _items.any((item) => item.offer.isSurpriseBasket && (item.offer.rarity ?? 'COMMON') == 'COMMON');

  int quantityOf(String offerId) {
    for (final item in _items) {
      if (item.offer.id == offerId) return item.quantity;
    }
    return 0;
  }

  int totalMillimesAt(int nowMs) => _items.fold(
        0,
        (sum, item) => sum + item.unitPriceAt(nowMs) * item.quantity,
      );

  /// Autres offres actives du même commerçant non encore présentes dans le sac (cross-sell).
  List<OfferModel> get crossSellOffers {
    if (_merchantId == null || _items.isEmpty) return const [];
    final inBagIds = _items.map((item) => item.offer.id).toSet();
    return _catalog
        .where((offer) =>
            offer.merchantId == _merchantId &&
            offer.remainingQuantity > 0 &&
            offer.status == 'ACTIVE' &&
            !inBagIds.contains(offer.id))
        .toList();
  }

  /// Synchronise le catalogue des offres pour proposer des suggestions "Compléter avec ce commerce".
  void syncCatalog(List<OfferModel> offers) {
    _catalog = List<OfferModel>.from(offers);
    var changed = false;
    final byId = {for (final o in offers) o.id: o};
    for (var i = 0; i < _items.length; i++) {
      final fresh = byId[_items[i].offer.id];
      if (fresh != null) {
        final maxQ = fresh.remainingQuantity > 0 ? fresh.remainingQuantity.clamp(1, 4) : 1;
        _items[i] = _items[i].copyWith(
          offer: fresh,
          quantity: _items[i].quantity.clamp(1, maxQ),
        );
        changed = true;
      }
    }
    if (changed) notifyListeners();
  }

  BagAddResult tryAddOffer(OfferModel offer, {int quantity = 1}) {
    final safeQty = quantity.clamp(1, offer.remainingQuantity > 0 ? offer.remainingQuantity.clamp(1, 4) : 1);
    if (_merchantId != null && _items.isNotEmpty && _merchantId != offer.merchantId) {
      return BagAddResult.conflict(
        currentMerchantName: _merchantName ?? 'votre commerce actuel',
        incomingMerchantName: offer.merchantName ?? 'cet autre commerce',
      );
    }

    _merchantId = offer.merchantId;
    _merchantName = offer.merchantName ?? _merchantName ?? 'Commerce partenaire';

    final idx = _items.indexWhere((item) => item.offer.id == offer.id);
    if (idx >= 0) {
      final existing = _items[idx];
      final nextQty = (existing.quantity + safeQty).clamp(1, existing.maxAllowed);
      _items[idx] = existing.copyWith(offer: offer, quantity: nextQty);
    } else {
      _items.add(BagItem(offer: offer, quantity: safeQty));
    }
    notifyListeners();
    return const BagAddResult.added();
  }

  void replaceWithOffer(OfferModel offer, {int quantity = 1}) {
    _items.clear();
    _merchantId = null;
    _merchantName = null;
    tryAddOffer(offer, quantity: quantity);
  }

  void updateQuantity(String offerId, int nextQuantity) {
    final idx = _items.indexWhere((item) => item.offer.id == offerId);
    if (idx < 0) return;
    if (nextQuantity <= 0) {
      removeItem(offerId);
      return;
    }
    final item = _items[idx];
    _items[idx] = item.copyWith(quantity: nextQuantity.clamp(1, item.maxAllowed));
    notifyListeners();
  }

  void removeItem(String offerId) {
    _items.removeWhere((item) => item.offer.id == offerId);
    if (_items.isEmpty) {
      _merchantId = null;
      _merchantName = null;
    }
    notifyListeners();
  }

  void clear() {
    if (_items.isEmpty) return;
    _items.clear();
    _merchantId = null;
    _merchantName = null;
    notifyListeners();
  }
}
