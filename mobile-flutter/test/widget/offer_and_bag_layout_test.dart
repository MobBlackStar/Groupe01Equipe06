// Module : Tests Widget Mobile (Mise en page 360px & Flux Sac Mono-Commerce)
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:campussave_mobile/core/models/offer_model.dart';
import 'package:campussave_mobile/features/explore/offer_detail_screen.dart';
import 'package:campussave_mobile/features/orders/bag_sheet.dart';
import 'package:campussave_mobile/services/bag_service.dart';
import 'package:campussave_mobile/widgets/griddle.dart';
import 'package:campussave_mobile/widgets/offer_card.dart';

OfferModel _sampleOffer({
  String id = 'off-test-1',
  String merchantId = 'merch-1',
  String merchantName = 'Munchies & Baguette Ali Trad',
  String title = 'Baguette Farcie Escalope & Frites',
}) {
  final now = DateTime.now();
  return OfferModel(
    id: id,
    merchantId: merchantId,
    merchantName: merchantName,
    title: title,
    description: 'Baguette croustillante fraîchement préparée pour les étudiants ESSECT.',
    category: 'SANDWICH',
    pricingType: 'DUTCH',
    originalPriceMillimes: 6800,
    startPriceMillimes: 4500,
    targetPriceMillimes: 3500,
    quantity: 5,
    remainingQuantity: 3,
    pickupStartAt: now.subtract(const Duration(minutes: 20)),
    pickupEndAt: now.add(const Duration(hours: 2)),
    distanceFromEssectM: 120,
  );
}

void main() {
  testWidgets('GTopBar, OfferCard, OfferDetailScreen et BagSheet rendent sans debordement sur 360px', (tester) async {
    tester.view.physicalSize = const Size(360, 780);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final bag = BagService();
    final offer1 = _sampleOffer();
    final offer2 = _sampleOffer(
      id: 'off-test-2',
      title: 'Makloub Chawarma Poulet Épicé',
    );
    bag.syncCatalog([offer1, offer2]);

    await tester.pumpWidget(
      ChangeNotifierProvider<BagService>.value(
        value: bag,
        child: MaterialApp(
          home: Scaffold(
            body: ListView(
              children: [
                GTopBar(points: 110, bagCount: 2, onBag: () {}, onProfile: () {}),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: OfferCard(
                    offer: offer1,
                    distanceFromEssectM: 120,
                    onAddToBag: () => bag.tryAddOffer(offer1),
                    onTap: () {},
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('CAMPUSSAVE'), findsOneWidget);
    expect(find.text('110 PTS'), findsOneWidget);
    expect(find.text('+ SAC'), findsOneWidget);
    expect(find.text('RÉSERVER'), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Taper sur + SAC met à jour le BagService
    await tester.tap(find.text('+ SAC'));
    await tester.pump();
    expect(bag.totalCount, 1);

    // Vérifier OfferDetailScreen (barre du bas complète visible & sans overflow)
    await tester.pumpWidget(
      ChangeNotifierProvider<BagService>.value(
        value: bag,
        child: MaterialApp(
          home: OfferDetailScreen(offer: offer1, distanceFromEssectM: 120),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.textContaining('AU SAC'), findsOneWidget);
    expect(find.text('RÉSERVER & PAYER'), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Vérifier BagSheet avec 2 articles + CTA Réserver & payer le sac
    bag.tryAddOffer(offer2);
    await tester.pumpWidget(
      ChangeNotifierProvider<BagService>.value(
        value: bag,
        child: const MaterialApp(
          home: Scaffold(body: BagSheet()),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('DANS MON SAC'), findsOneWidget);
    expect(find.textContaining('RÉSERVER & PAYER LE SAC'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
