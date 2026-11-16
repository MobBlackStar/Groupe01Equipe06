// 💡 Concept & Analogie : Test unitaire en Dart validant que l'algorithme d'enchère hollandaise dégressive produit exactement les mêmes résultats sous Flutter que sous Node.js et React sur les 25 vecteurs de référence.
// 🔄 Comparaison React / Flutter : Vérifie la parité arithmétique stricte entre `Pricing.computeFromMap` en Dart et `computeUnitPrice` en JavaScript.
// 🎯 À retenir pour la soutenance : "Ce banc de tests charge les 25 vecteurs de test officiels pour garantir une parfaite synchronisation tarifaire inter-plateformes."
// Module : Logique Métier Dart

import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:campussave_mobile/core/domain/pricing.dart';

void main() {
  group('Algorithme de calcul de prix Flutter (Smart Decay) — 25 Vecteurs Officiels', () {
    test('Chargement et validation de tous les 25 vecteurs de test', () {
      final candidates = [
        File('../shared/test-vectors/pricing.json'),
        File('../../shared/test-vectors/pricing.json'),
        File('shared/test-vectors/pricing.json'),
        File('../campussave/shared/test-vectors/pricing.json'),
      ];

      File? vectorFile;
      for (final candidate in candidates) {
        if (candidate.existsSync()) {
          vectorFile = candidate;
          break;
        }
      }

      expect(vectorFile, isNotNull, reason: 'Le fichier pricing.json doit être accessible pour les tests');

      final jsonContent = vectorFile!.readAsStringSync();
      final data = jsonDecode(jsonContent) as Map<String, dynamic>;
      final testCases = data['testCases'] as List<dynamic>;

      expect(testCases.length, equals(25), reason: 'Il doit y avoir exactement 25 vecteurs de test');

      for (final rawCase in testCases) {
        final tc = rawCase as Map<String, dynamic>;
        final id = tc['id'] as String;
        final offer = tc['offer'] as Map<String, dynamic>;
        final nowInput = tc['nowMs'] ?? tc['now'];
        final expected = tc['expectedPriceMillimes'] as int;
        final notes = tc['notes'] as String? ?? '';

        final computed = Pricing.computeFromMap(offer, nowInput);

        expect(
          computed,
          equals(expected),
          reason: 'Échec pour le vecteur $id ($notes): attendu $expected, obtenu $computed',
        );
      }
    });

    test('Validation individuelle des seuils temporels et couleurs d urgence', () {
      const baseNow = 1700000000000;
      expect(
        Pricing.computeUrgencyColor(pickupEndMs: baseNow + 75 * 60 * 1000, nowMs: baseNow),
        equals('#CCFF00'),
      );
      expect(
        Pricing.computeUrgencyColor(pickupEndMs: baseNow + 35 * 60 * 1000, nowMs: baseNow),
        equals('#FF5500'),
      );
      expect(
        Pricing.computeUrgencyColor(pickupEndMs: baseNow + 10 * 60 * 1000, nowMs: baseNow),
        equals('#FF1744'),
      );

      expect(
        Pricing.computeMinutesLeft(pickupEndMs: baseNow + 45 * 60 * 1000, nowMs: baseNow),
        equals(45),
      );
    });
  });
}
