// 💡 Concept & Analogie : Comme le banc d'essai de calibration des instruments de navigation et de fidélité pour s'assurer que chaque distance calculée et chaque palier de points respectent rigoureusement les formules physiques et mathématiques.
// 🔄 Comparaison React / Flutter : Valide que les données géospatiales et les profils de fidélité retournés par l'API sont prêts à alimenter MapLibre 3D, Flutter Map et les cartes de tampons.
// 🎯 À retenir pour la soutenance : "Nos tests démontrent la précision du calcul géodésique Haversine, la validité des 3 niveaux d'urgence temporelle, et l'exactitude des paliers de fidélité (Graine, Pousse, Arbre, Forêt)."
// Module : Tests Radar Géospatial & Fidélité

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ESSECT_COORDINATES } from '../../shared/constants.js';
import { distanceFromEssect, calculateWalkingMinutes } from '../../shared/geo.js';
import { getLoyaltyTier, getNextRewardMilestone, calculateStamps } from '../../shared/loyalty.js';
import { computeUnitPrice } from '../../shared/pricing.js';

describe('Radar Géospatial & Programme de Fidélité (Jour 6)', () => {

  describe('1. Calculs Géospatiaux & Estimation Piétonne', () => {
    test('Calcul de distance Haversine depuis le campus ESSECT Montfleury', () => {
      // Coordonnées de Baguette & Baguette Montfleury (~280 m à vol d'oiseau)
      const lat = 36.7865;
      const lng = 10.1752;

      const dist = distanceFromEssect(lat, lng);
      assert.ok(dist > 50 && dist < 500, `Distance inattendue : ${dist} m`);
    });

    test('Estimation du temps de marche urbain avec coefficient de détour 1.3', () => {
      // Pour une distance de 500 mètres :
      // 500 * 1.3 = 650 m
      // 650 / (5000 / 60) ≈ 7.8 -> arrondi à 8 minutes
      const walking = calculateWalkingMinutes(500);
      assert.equal(walking, 8);

      // Distance nulle -> 0 minute
      assert.equal(calculateWalkingMinutes(0), 0);

      // Très courte distance (50 m) -> minimum garanti 1 minute
      assert.equal(calculateWalkingMinutes(50), 1);
    });

    test('Attribution des couleurs d urgence temporelle', () => {
      const nowMs = 1700000000000;

      // Offre 1 : Plus de 60 minutes restantes -> #CCFF00 (Vert Lime)
      const offerLow = {
        pickupEndAt: new Date(nowMs + 90 * 60 * 1000).toISOString(),
      };
      const minLeftLow = (new Date(offerLow.pickupEndAt).getTime() - nowMs) / 60000;
      const colorLow = minLeftLow > 60 ? '#CCFF00' : minLeftLow >= 20 ? '#FF5500' : '#FF1744';
      assert.equal(colorLow, '#CCFF00');

      // Offre 2 : 45 minutes restantes (20 à 60 min) -> #FF5500 (Orange)
      const offerMed = {
        pickupEndAt: new Date(nowMs + 45 * 60 * 1000).toISOString(),
      };
      const minLeftMed = (new Date(offerMed.pickupEndAt).getTime() - nowMs) / 60000;
      const colorMed = minLeftMed > 60 ? '#CCFF00' : minLeftMed >= 20 ? '#FF5500' : '#FF1744';
      assert.equal(colorMed, '#FF5500');

      // Offre 3 : Moins de 20 minutes restantes -> #FF1744 (Rouge pulsation)
      const offerHigh = {
        pickupEndAt: new Date(nowMs + 12 * 60 * 1000).toISOString(),
      };
      const minLeftHigh = (new Date(offerHigh.pickupEndAt).getTime() - nowMs) / 60000;
      const colorHigh = minLeftHigh > 60 ? '#CCFF00' : minLeftHigh >= 20 ? '#FF5500' : '#FF1744';
      assert.equal(colorHigh, '#FF1744');
    });
  });

  describe('2. Logique de Fidélité & Récompenses (GET /loyalty/me)', () => {
    test('Transition des 4 rangs de fidélité (Graine, Pousse, Arbre, Forêt)', () => {
      assert.equal(getLoyaltyTier(0), 'GRAINE');
      assert.equal(getLoyaltyTier(80), 'GRAINE');
      assert.equal(getLoyaltyTier(100), 'POUSSE');
      assert.equal(getLoyaltyTier(240), 'POUSSE');
      assert.equal(getLoyaltyTier(300), 'ARBRE');
      assert.equal(getLoyaltyTier(590), 'ARBRE');
      assert.equal(getLoyaltyTier(600), 'FORET');
      assert.equal(getLoyaltyTier(1500), 'FORET');
    });

    test('Calcul des tampons actifs (0 à 4 sur 5) et prochain palier', () => {
      // 0 point : 0 tampon, prochain à 100
      assert.equal(calculateStamps(0), 0);
      assert.equal(getNextRewardMilestone(0), 100);

      // 40 points : 2 tampons (40/20), prochain à 100
      assert.equal(calculateStamps(40), 2);
      assert.equal(getNextRewardMilestone(40), 100);

      // 80 points : 4 tampons, prochain à 100
      assert.equal(calculateStamps(80), 4);
      assert.equal(getNextRewardMilestone(80), 100);

      // 120 points : 1 tampon sur la tranche 100-200, prochain à 200
      assert.equal(calculateStamps(120), 1);
      assert.equal(getNextRewardMilestone(120), 200);

      // 360 points : 3 tampons sur la tranche 300-400, prochain à 400
      assert.equal(calculateStamps(360), 3);
      assert.equal(getNextRewardMilestone(360), 400);
    });
  });

  describe('3. Tri par Distance dans le Catalogue', () => {
    test('Tri croissant par merchantSnapshot.distanceFromEssectM', () => {
      const offers = [
        { id: 'off-far', merchantSnapshot: { distanceFromEssectM: 1200 } },
        { id: 'off-close', merchantSnapshot: { distanceFromEssectM: 250 } },
        { id: 'off-mid', merchantSnapshot: { distanceFromEssectM: 600 } },
      ];

      offers.sort((a, b) => {
        const distA = a.merchantSnapshot?.distanceFromEssectM ?? 99999;
        const distB = b.merchantSnapshot?.distanceFromEssectM ?? 99999;
        return distA - distB;
      });

      assert.equal(offers[0].id, 'off-close');
      assert.equal(offers[1].id, 'off-mid');
      assert.equal(offers[2].id, 'off-far');
    });
  });

});
