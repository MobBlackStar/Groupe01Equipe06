// 💡 Concept & Analogie : Le guichet unique de l'application : réserver, payer, afficher le ticket et consulter la fidélité passent tous par ce service, jamais par des données locales.
// 🔄 Comparaison React / Flutter : Regroupe en Dart les appels que le web répartit entre `OfferDetailPage`, `CheckoutPage`, `PaymentReturnPage`, `LivingTicketPage` et `LoyaltyCardPage`.
// 🎯 À retenir pour la soutenance : "Le client Dio est injectable : la même logique est testée contre un backend isolé en mémoire sans toucher Firebase."
// Module : Infrastructure Mobile

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show visibleForTesting;
import '../core/api/api_client.dart';
import '../core/api/endpoints.dart';
import '../core/models/loyalty_model.dart';
import '../core/models/offer_model.dart';
import '../core/models/order_model.dart';

/// Erreur API lisible : message serveur (`error.message`) et code (`error.code`, ex. OFFER_SOLD_OUT).
class ApiException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  const ApiException(this.message, {this.code, this.statusCode});

  factory ApiException.from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['error'] is Map) {
        final e = data['error'] as Map;
        return ApiException(
          (e['message'] ?? 'Erreur serveur').toString(),
          code: e['code']?.toString(),
          statusCode: error.response?.statusCode,
        );
      }
      if (error.response == null) {
        return const ApiException('Serveur injoignable. Vérifiez la connexion et l\'adresse de l\'API.');
      }
      return ApiException('Erreur serveur (${error.response?.statusCode})', statusCode: error.response?.statusCode);
    }
    return ApiException(error.toString());
  }

  @override
  String toString() => message;
}

class CampusApi {
  final Dio _dio;

  CampusApi([Dio? dio]) : _dio = dio ?? ApiClient.dio;

  static CampusApi? _shared;
  static CampusApi get shared => _shared ??= CampusApi();

  @visibleForTesting
  static set shared(CampusApi api) => _shared = api;

  Future<Map<String, dynamic>> _call(Future<Response<dynamic>> Function() request) async {
    try {
      final res = await request();
      final data = res.data;
      return data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
    } catch (e) {
      throw ApiException.from(e);
    }
  }

  // --- Offres -------------------------------------------------------------

  Future<List<OfferModel>> fetchOffers() async {
    final data = await _call(() => _dio.get(Endpoints.offers, queryParameters: {'limit': 50}));
    final list = data['offers'] as List? ?? const [];
    return list.whereType<Map>().map((m) => OfferModel.fromJson(Map<String, dynamic>.from(m))).toList();
  }

  // --- Commandes ----------------------------------------------------------

  /// `POST /orders` : le serveur fige le prix et applique le coupon (`rewardId`) ; aucun calcul côté client.
  Future<OrderModel> createOrder({required String offerId, required int quantity, String? rewardId}) async {
    final data = await _call(() => _dio.post(Endpoints.orders, data: {
          'offerId': offerId,
          'quantity': quantity,
          if (rewardId != null) 'rewardId': rewardId,
        }));
    return OrderModel.fromApi(Map<String, dynamic>.from(data['order'] as Map));
  }

  Future<OrderModel> fetchOrder(String orderId) async {
    final data = await _call(() => _dio.get(Endpoints.orderById(orderId)));
    return OrderModel.fromApi(Map<String, dynamic>.from((data['order'] ?? data) as Map));
  }

  Future<List<OrderModel>> fetchMyOrders() async {
    final data = await _call(() => _dio.get(Endpoints.myOrders));
    final list = data['orders'] as List? ?? const [];
    return list.whereType<Map>().map((m) => OrderModel.fromApi(Map<String, dynamic>.from(m))).toList();
  }

  Future<void> cancelOrder(String orderId) => _call(() => _dio.post(Endpoints.cancelOrder(orderId)));

  Future<TicketParams> fetchTicket(String orderId) async {
    final data = await _call(() => _dio.get(Endpoints.getTicket(orderId)));
    return TicketParams.fromApi(data);
  }

  // --- Paiement -----------------------------------------------------------

  Future<PaymentInit> initPayment(String orderId) async {
    final data = await _call(() => _dio.post(Endpoints.initPayment, data: {'orderId': orderId}));
    return PaymentInit.fromApi(data);
  }

  /// `POST /payments/konnect/verify` → `{ order, confirmed }`. `paymentRef` n'est envoyé que s'il existe
  /// (passerelle simulée : absent, le serveur retrouve la référence de la commande).
  /// Renvoie `true` uniquement si le serveur a confirmé le paiement.
  Future<bool> verifyPayment(String orderId, {String? paymentRef}) async {
    final data = await _call(() => _dio.post(Endpoints.verifyPayment, data: {
          'orderId': orderId,
          if (paymentRef != null && paymentRef.isNotEmpty) 'paymentRef': paymentRef,
        }));
    return data['confirmed'] == true;
  }

  // --- Fidélité -----------------------------------------------------------

  Future<LoyaltyStatus> fetchLoyalty() async {
    final data = await _call(() => _dio.get(Endpoints.loyaltyMe));
    return LoyaltyStatus.fromApi(data);
  }
}
