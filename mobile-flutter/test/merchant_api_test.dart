// 💡 Concept & Analogie : Un faux serveur qui répond toujours la même chose : on vérifie que l'application comprend bien ses réponses.
// 🔄 Comparaison React / Flutter : Équivalent d'un test Vitest avec un `axios` simulé.
// 🎯 À retenir pour la soutenance : "Les écrans commerçant lisent les vraies réponses de l'API : prix aplatis depuis `pricing`, distance du commerce, boutique absente (404) = null."

import 'dart:convert';

import 'package:campussave_mobile/core/models/offer_model.dart';
import 'package:campussave_mobile/services/campus_api.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAdapter implements HttpClientAdapter {
  final int status;
  final Map<String, dynamic> body;

  _FakeAdapter(this.status, this.body);

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<List<int>>? requestStream, Future<void>? cancelFuture) async {
    return ResponseBody.fromString(jsonEncode(body), status, headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    });
  }

  @override
  void close({bool force = false}) {}
}

CampusApi _api(int status, Map<String, dynamic> body) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))..httpClientAdapter = _FakeAdapter(status, body);
  return CampusApi(dio);
}

void main() {
  test('fetchMyOffers aplatit le bloc pricing et ignore les offres supprimées', () async {
    final api = _api(200, {
      'offers': [
        {
          'id': 'a',
          'title': 'Prix fixe',
          'pricing': {'mode': 'FIXED', 'originalPriceMillimes': 7500, 'discountedPriceMillimes': 3800},
          'quantity': 5,
          'quantityAvailable': 3,
          'status': 'ACTIVE',
        },
        {
          'id': 'b',
          'title': 'Dégressif',
          'pricing': {'mode': 'DUTCH_AUCTION', 'originalPriceMillimes': 9000, 'startPriceMillimes': 6000, 'floorPriceMillimes': 2500},
          'quantity': 2,
          'quantityAvailable': 2,
          'status': 'ACTIVE',
        },
        {'id': 'c', 'title': 'Archivée', 'status': 'DELETED'},
      ],
    });

    final offers = await api.fetchMyOffers();
    expect(offers.map((o) => o.id), ['a', 'b']);
    expect(offers[0].pricingType, 'FIXED');
    expect(offers[0].originalPriceMillimes, 7500);
    expect(offers[0].targetPriceMillimes, 3800);
    expect(offers[1].pricingType, 'DUTCH');
    expect(offers[1].targetPriceMillimes, 2500);
    expect(offers[1].startPriceMillimes, 6000);
    expect(offers[0].startPriceMillimes, isNull);
  });

  test('fetchMyMerchant renvoie null quand le commerçant n\'a pas encore de boutique (404)', () async {
    final api = _api(404, {
      'error': {'code': 'MERCHANT_NOT_FOUND', 'message': 'Commerce introuvable'},
    });
    expect(await api.fetchMyMerchant(), isNull);
  });

  test('fetchMyMerchant renvoie le commerce du compte', () async {
    final api = _api(200, {
      'merchant': {'id': 'm1', 'name': 'Chez Test', 'status': 'PENDING'},
    });
    final m = await api.fetchMyMerchant();
    expect(m?['status'], 'PENDING');
  });

  test('OfferModel lit la distance réelle du commerce, ou null si inconnue', () {
    final withDistance = OfferModel.fromJson({
      'id': 'x',
      'title': 'T',
      'merchantSnapshot': {'name': 'M', 'distanceFromEssectM': 340},
    });
    final without = OfferModel.fromJson({'id': 'y', 'title': 'T'});
    expect(withDistance.distanceFromEssectM, 340);
    expect(without.distanceFromEssectM, isNull);
  });
}
