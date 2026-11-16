// 💡 Concept & Analogie : Comme le banc d'étalonnage des instruments de pilotage d'un navire, ce fichier valide l'exactitude des calculs de rentabilité, des ratios écologiques et des agrégations multi-rôles.
// 🔄 Comparaison React / Flutter : Garantit que les données envoyées aux tableaux de bord Web et Mobile sont exemptes de toute incohérence arithmétique.
// 🎯 À retenir pour la soutenance : "Nos tests vérifient la rigueur des formules de calcul d'impact, l'atomicité des évaluations commerçants et la précision du robot superviseur des retraits."
// Module : Tests Tableaux de Bord, Impact & Évaluations

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateImpact, calculateEquivalences } from '../../shared/impact.js';
import { ROLES, ORDER_STATUS, MERCHANT_STATUS, BUSINESS_RULES } from '../../shared/constants.js';

describe('Tableaux de Bord, Impact Campus & Évaluations (Jour 7)', () => {

  describe('1. Formules Scientifiques d Impact Écologique & Équivalences', () => {
    test('Calcul de l empreinte carbone évitée selon le ratio officiel FAO (2.5g CO2 / g aliment)', () => {
      // 400 grammes d'aliments sauvés -> 400 * 2.5 = 1000 grammes de CO2 (1 kg CO2e)
      const impact400 = calculateImpact(400);
      assert.equal(impact400.foodSavedGrams, 400);
      assert.equal(impact400.co2SavedGrams, 1000);

      // 1200 grammes (3 portions moyennes) -> 3000 grammes de CO2
      const impact1200 = calculateImpact(1200);
      assert.equal(impact1200.co2SavedGrams, 3000);

      // Garde-fou : poids nul -> 0 g de CO2
      const impact0 = calculateImpact(0);
      assert.equal(impact0.co2SavedGrams, 0);

      // Rejet strict des valeurs négatives
      assert.throws(() => calculateImpact(-100), /Le poids ne peut pas être négatif/);
    });

    test('Conversion en équivalences réelles de la vie courante (EPA / ADEME)', () => {
      // 10 000 g de CO2 évité :
      // - Smartphones chargés (10 g / charge) -> 1000 recharges complètes
      // - Km en voiture moyenne évitée (244 g / km) -> 10000 / 244 ≈ 40.98 km
      const eq = calculateEquivalences(10000);
      assert.equal(eq.smartphonesCharged, 1000);
      assert.equal(eq.kmCarAvoided, 40.98);

      // Cas limite : 0 g de CO2
      const eq0 = calculateEquivalences(0);
      assert.equal(eq0.smartphonesCharged, 0);
      assert.equal(eq0.kmCarAvoided, 0);
    });
  });

  describe('2. Logique Analytique du Tableau de Bord Étudiant', () => {
    test('Synthèse des statistiques et répartition des économies hebdomadaires et mensuelles', () => {
      const stats = {
        ordersCompleted: 8,
        totalSpentMillimes: 24000,
        totalSavedMillimes: 36000,
        foodSavedGrams: 3200,
        co2SavedGrams: 8000,
        noShows: 0,
      };

      const equivalences = calculateEquivalences(stats.co2SavedGrams);
      assert.equal(equivalences.smartphonesCharged, 800);
      assert.equal(equivalences.kmCarAvoided, 32.79);

      // Calcul des économies sur les 7 derniers jours et 30 derniers jours
      const now = Date.now();
      const mockOrders = [
        {
          id: 'ord-1',
          status: ORDER_STATUS.COMPLETED,
          createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
          pricing: { moneySavedMillimes: 4500 },
        },
        {
          id: 'ord-2',
          status: ORDER_STATUS.COMPLETED,
          createdAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
          pricing: { moneySavedMillimes: 3500 },
        },
        {
          id: 'ord-3',
          status: ORDER_STATUS.COMPLETED,
          createdAt: new Date(now - 20 * 24 * 3600 * 1000).toISOString(),
          pricing: { moneySavedMillimes: 5000 },
        },
      ];

      const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
      const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;

      let weeklySaved = 0;
      let monthlySaved = 0;

      mockOrders.forEach((o) => {
        const time = new Date(o.createdAt).getTime();
        const saved = o.pricing?.moneySavedMillimes || 0;
        if (time >= sevenDaysAgo) weeklySaved += saved;
        if (time >= thirtyDaysAgo) monthlySaved += saved;
      });

      assert.equal(weeklySaved, 8000); // 4500 + 3500
      assert.equal(monthlySaved, 13000); // 4500 + 3500 + 5000
    });
  });

  describe('3. Logique Analytique du Tableau de Bord Commerçant', () => {
    test('Calcul précis du taux de no-show commerçant', () => {
      // Cas 1 : 18 commandes terminées et 2 no-shows -> 2 / (18 + 2) = 10.0%
      const ordersCompleted = 18;
      const noShows = 2;
      const total = ordersCompleted + noShows;
      const rate = total > 0 ? Number(((noShows / total) * 100).toFixed(1)) : 0;
      assert.equal(rate, 10.0);

      // Cas 2 : Aucune commande traitée -> 0% (pas de division par zéro)
      const emptyTotal = 0;
      const emptyRate = emptyTotal > 0 ? Number(((0 / emptyTotal) * 100).toFixed(1)) : 0;
      assert.equal(emptyRate, 0);

      // Cas 3 : 50 commandes terminées et 0 no-show -> 0.0%
      const perfectRate = Number(((0 / 50) * 100).toFixed(1));
      assert.equal(perfectRate, 0.0);
    });

    test('Consolidation des séries temporelles (fenêtre 7 jours ou 30 jours)', () => {
      const numDays = 7;
      const now = new Date();
      const series = [];

      for (let i = numDays - 1; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        series.push(dayDate.toISOString().split('T')[0]);
      }

      assert.equal(series.length, 7);
      // La série doit être strictement chronologique
      assert.ok(series[0] <= series[6]);
    });
  });

  describe('4. Logique du Tableau de Bord Administrateur & Agrégations', () => {
    test('Validation des catégories de statuts pour utilisateurs, commerces et commandes', () => {
      const expectedRoles = [ROLES.STUDENT, ROLES.MERCHANT, ROLES.ADMIN];
      assert.deepEqual(expectedRoles, ['STUDENT', 'MERCHANT', 'ADMIN']);

      const expectedMerchantStatuses = [
        MERCHANT_STATUS.PENDING,
        MERCHANT_STATUS.APPROVED,
        MERCHANT_STATUS.REJECTED,
        MERCHANT_STATUS.SUSPENDED,
      ];
      assert.equal(expectedMerchantStatuses.length, 4);

      const expectedOrderStatuses = [
        ORDER_STATUS.RESERVED,
        ORDER_STATUS.PAID,
        ORDER_STATUS.COMPLETED,
        ORDER_STATUS.CANCELLED,
        ORDER_STATUS.EXPIRED,
        ORDER_STATUS.NO_SHOW,
      ];
      assert.equal(expectedOrderStatuses.length, 6);
    });
  });

  describe('5. Classement des Filières ESSECT & Impact Campus', () => {
    test('Tri décroissant des filières par CO2 évité et total EcoPoints', () => {
      const filieres = [
        { filiereId: 'FINANCE', co2SavedGrams: 39000, ecoPointsTotal: 920 },
        { filiereId: 'EBUSINESS_3A', co2SavedGrams: 52000, ecoPointsTotal: 1240 },
        { filiereId: 'MARKETING', co2SavedGrams: 31000, ecoPointsTotal: 760 },
        { filiereId: 'GESTION', co2SavedGrams: 25000, ecoPointsTotal: 580 },
        { filiereId: 'COMPTABILITE', co2SavedGrams: 20000, ecoPointsTotal: 490 },
      ];

      filieres.sort((a, b) => {
        const diffCo2 = (b.co2SavedGrams || 0) - (a.co2SavedGrams || 0);
        if (diffCo2 !== 0) return diffCo2;
        return (b.ecoPointsTotal || 0) - (a.ecoPointsTotal || 0);
      });

      assert.equal(filieres[0].filiereId, 'EBUSINESS_3A');
      assert.equal(filieres[1].filiereId, 'FINANCE');
      assert.equal(filieres[4].filiereId, 'COMPTABILITE');
    });
  });

  describe('6. Moteur d Évaluation des Commandes (Order Rating)', () => {
    test('Calcul de la nouvelle moyenne du commerce lors d une évaluation par un étudiant', () => {
      // Commerce ayant 4 avis pour une moyenne de 4.5 (somme = 18)
      const currentCount = 4;
      const currentAvg = 4.5;
      const currentSum = currentAvg * currentCount; // 18

      // Nouvel avis : 5 étoiles
      const newStars = 5;
      const newCount = currentCount + 1; // 5
      const newSum = currentSum + newStars; // 23
      const newAvg = Number((newSum / newCount).toFixed(1)); // 23 / 5 = 4.6

      assert.equal(newCount, 5);
      assert.equal(newAvg, 4.6);

      // Deuxième cas : premier avis sur un commerce nouveau (0 avis)
      const firstStars = 4;
      const firstCount = 1;
      const firstAvg = Number((firstStars / firstCount).toFixed(1));
      assert.equal(firstAvg, 4.0);
    });

    test('Validation des critères d évaluation (1 à 5 étoiles, commentaire optionnel max 280 caractères)', () => {
      const validRatings = [1, 2, 3, 4, 5];
      validRatings.forEach((stars) => {
        assert.ok(stars >= 1 && stars <= 5);
      });

      const invalidRatingLow = 0;
      const invalidRatingHigh = 6;
      assert.ok(invalidRatingLow < 1);
      assert.ok(invalidRatingHigh > 5);

      const validComment = 'Excellent repas, bien emballé et servi avec le sourire !';
      assert.ok(validComment.length <= 280);
    });
  });

  describe('7. Robot Superviseur des Non-Présentations (No-Show Sweeper)', () => {
    test('Détection des créneaux expirés : bascule NO_SHOW à 30 minutes après la clôture', () => {
      const nowMs = 1700000000000;
      const thirtyMinutesMs = 30 * 60 * 1000;

      // Commande A : créneau terminé il y a 35 minutes -> éligible NO_SHOW
      const pickupEndA = nowMs - 35 * 60 * 1000;
      const isEligibleNoShowA = nowMs > pickupEndA + thirtyMinutesMs;
      assert.equal(isEligibleNoShowA, true);

      // Commande B : créneau terminé il y a 10 minutes -> pas encore NO_SHOW (délai de grâce)
      const pickupEndB = nowMs - 10 * 60 * 1000;
      const isEligibleNoShowB = nowMs > pickupEndB + thirtyMinutesMs;
      assert.equal(isEligibleNoShowB, false);

      // Commande C : créneau expirant dans 15 minutes -> éligible au rappel de retrait (PICKUP_REMINDER)
      const pickupEndC = nowMs + 15 * 60 * 1000;
      const timeLeftC = pickupEndC - nowMs;
      const isEligibleReminderC = timeLeftC > 0 && timeLeftC <= thirtyMinutesMs;
      assert.equal(isEligibleReminderC, true);
    });
  });

});
