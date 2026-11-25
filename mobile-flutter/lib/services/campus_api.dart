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
import '../core/models/user_profile.dart';

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

  /// `POST /orders` : accepte soit un sac multi-articles (`items`) d'un seul commerce, soit `{ offerId, quantity }`.
  Future<OrderModel> createOrder({
    String? offerId,
    int? quantity,
    List<Map<String, dynamic>>? items,
    String? rewardId,
  }) async {
    final payload = <String, dynamic>{
      if (items != null && items.isNotEmpty)
        'items': items
      else ...{
        'offerId': offerId,
        'quantity': quantity ?? 1,
      },
      if (rewardId != null) 'rewardId': rewardId,
    };
    final data = await _call(() => _dio.post(Endpoints.orders, data: payload));
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

  // --- Impact (public) ----------------------------------------------------

  /// `GET /impact/global` : totaux du campus + équivalences (smartphones, km de voiture).
  Future<Map<String, dynamic>> fetchGlobalImpact() => _call(() => _dio.get(Endpoints.impactGlobal));

  /// `GET /impact/filieres` : classement inter-filières trié côté serveur.
  Future<List<Map<String, dynamic>>> fetchFilieresImpact() async {
    final data = await _call(() => _dio.get(Endpoints.impactFilieres));
    final list = data['filieres'] as List? ?? const [];
    return list.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  // --- Commerçant : offres ------------------------------------------------

  /// `GET /merchants/me/offers` : les documents sont stockés avec un bloc `pricing` imbriqué ;
  /// on les aplatit pour `OfferModel` (prix initial, prix cible, type de tarification).
  Future<List<OfferModel>> fetchMyOffers() async {
    final data = await _call(() => _dio.get(Endpoints.merchantOffers));
    final list = data['offers'] as List? ?? const [];
    return list
        .whereType<Map>()
        .map((m) => _flattenOffer(Map<String, dynamic>.from(m)))
        .where((o) => o.status != 'DELETED')
        .toList();
  }

  static OfferModel _flattenOffer(Map<String, dynamic> json) {
    final pricing = json['pricing'];
    if (pricing is Map) {
      final dutch = pricing['mode'] == 'DUTCH_AUCTION';
      json['pricingType'] = dutch ? 'DUTCH' : 'FIXED';
      json['originalPriceMillimes'] ??= pricing['originalPriceMillimes'];
      if (dutch) json['startPriceMillimes'] ??= pricing['startPriceMillimes'];
      json['targetPriceMillimes'] ??= dutch ? pricing['floorPriceMillimes'] : pricing['discountedPriceMillimes'];
    }
    return OfferModel.fromJson(json);
  }

  /// `POST /offers` : le corps suit `createOfferSchema` (prix dans `pricing`).
  Future<void> createOffer(Map<String, dynamic> body) => _call(() => _dio.post(Endpoints.offers, data: body));

  /// `PATCH /offers/:id` : mise à jour partielle (le serveur refuse de changer le prix une fois une réservation faite).
  Future<void> updateOffer(String id, Map<String, dynamic> body) => _call(() => _dio.patch(Endpoints.offerById(id), data: body));

  /// `POST /uploads/image` (multipart, 5 Mo max, JPEG/PNG/WEBP) : renvoie l'adresse publique de la photo.
  Future<String> uploadImage(List<int> bytes, {required String filename, String contentType = 'image/jpeg'}) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename, contentType: DioMediaType.parse(contentType)),
    });
    final data = await _call(() => _dio.post(Endpoints.uploadImage, data: form));
    final url = data['url']?.toString();
    if (url == null || url.isEmpty) throw const ApiException('Le serveur n\'a pas renvoyé d\'adresse pour la photo.');
    return url;
  }

  /// `DELETE /offers/:id` : suppression définitive, ou archivage si des commandes existent.
  Future<void> deleteOffer(String id) => _call(() => _dio.delete(Endpoints.offerById(id)));

  /// `POST /ai/offer-autofill` : renvoie `{ suggestion, source }` (`ai` ou `fallback`).
  Future<Map<String, dynamic>> offerAutofill(String rawNote) =>
      _call(() => _dio.post(Endpoints.aiOfferAutofill, data: {'rawNote': rawNote}));

  // --- Commerçant : boutique ----------------------------------------------

  /// `GET /merchants/me` : le commerce du compte connecté, ou `null` s'il n'en a pas encore (404).
  Future<Map<String, dynamic>?> fetchMyMerchant() async {
    try {
      final data = await _call(() => _dio.get(Endpoints.merchantsMe));
      final m = data['merchant'];
      return m is Map ? Map<String, dynamic>.from(m) : null;
    } on ApiException catch (e) {
      if (e.statusCode == 404 || e.code == 'MERCHANT_NOT_FOUND') return null;
      rethrow;
    }
  }

  /// `POST /merchants` : dépôt du dossier (statut PENDING jusqu'à validation par l'administration).
  Future<void> createMerchant(Map<String, dynamic> body) => _call(() => _dio.post(Endpoints.merchants, data: body));

  /// `GET /merchants/me/orders` : commandes reçues par le commerce (documents bruts, avec `studentSnapshot`).
  Future<List<Map<String, dynamic>>> fetchMerchantOrders() async {
    final data = await _call(() => _dio.get(Endpoints.merchantOrders));
    final list = data['orders'] as List? ?? const [];
    return list.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  // --- Profil et boutique ---------------------------------------------------

  /// `PATCH /users/me` : met à jour le profil (nom, téléphone, filière, avatar, préférences) et renvoie le profil du serveur.
  Future<UserProfile> updateProfile(Map<String, dynamic> body) async {
    final data = await _call(() => _dio.patch(Endpoints.me, data: body));
    return UserProfile.fromJson(Map<String, dynamic>.from(data['user'] as Map));
  }

  /// `PATCH /merchants/me` : modifie la fiche du commerce (statut d'agrément protégé côté serveur).
  Future<Map<String, dynamic>> updateMyMerchant(Map<String, dynamic> body) async {
    final data = await _call(() => _dio.patch(Endpoints.merchantsMe, data: body));
    return Map<String, dynamic>.from((data['merchant'] as Map?) ?? const {});
  }

  // --- Notifications push -----------------------------------------------------

  /// `POST /users/me/fcm-token` : enregistre cet appareil (204). Valable pour les comptes réels et les comptes de démonstration.
  Future<void> registerFcmToken(String token) => _call(() => _dio.post(Endpoints.fcmToken, data: {'token': token}));

  /// `DELETE /users/me/fcm-token` : retire cet appareil (déconnexion).
  Future<void> removeFcmToken(String token) => _call(() => _dio.delete(Endpoints.fcmToken, data: {'token': token}));

  /// `POST /users/me/fcm-test` : envoie une vraie notification à tous mes appareils ; renvoie `{ok, tokensCount, sentCount, failedCount, mode, diagnostics}`.
  Future<Map<String, dynamic>> sendFcmTest() => _call(() => _dio.post(Endpoints.fcmTest));

  // --- Tableaux de bord ---------------------------------------------------

  /// `GET /dashboards/student` : impact personnel, fidélité, historique d'économies et dernières commandes.
  Future<Map<String, dynamic>> fetchStudentDashboard() => _call(() => _dio.get(Endpoints.dashboardsStudent));

  /// `GET /dashboards/merchant?range=7d|30d` : recettes, retraits, no-shows, série journalière et top offres.
  Future<Map<String, dynamic>> fetchMerchantDashboard({String range = '7d'}) =>
      _call(() => _dio.get(Endpoints.dashboardsMerchant, queryParameters: {'range': range}));

  /// `POST /orders/:id/rating` : note de 1 à 5 d'une commande terminée (une seule fois).
  Future<void> rateOrder(String orderId, int stars, {String comment = ''}) =>
      _call(() => _dio.post(Endpoints.rateOrder(orderId), data: {'stars': stars, if (comment.trim().isNotEmpty) 'comment': comment.trim()}));
}
