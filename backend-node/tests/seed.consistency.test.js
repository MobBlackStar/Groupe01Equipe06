// 💡 Concept & Analogie : Le contrôle de caisse de fin de journée : chaque total affiché doit être la somme exacte des tickets.
// 🔄 Comparaison React / Flutter : Garantit que les tableaux de bord web et mobile (M8, B3, B4) affichent des chiffres qui ne se contredisent pas.
// 🎯 À retenir pour la soutenance : "Les statistiques étudiants, commerçants, filières et campus sont recalculées ici à partir des commandes du jeu de données ; le CO2 vaut round(grammes × 2,5)."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../scripts/seed-data/demoDataset.js';
import { calculateImpact } from '../../shared/impact.js';
import { getLoyaltyTier, getNextRewardMilestone } from '../../shared/loyalty.js';
import { getTunisDayKey } from '../src/utils/tunisTime.js';

const NOW = Date.parse('2026-11-24T10:00:00Z');
const { entries } = buildDemoDataset(NOW);
const byPrefix = (prefix, depth) => entries.filter((e) => e.path.startsWith(prefix) && e.path.split('/').length === depth).map((e) => e.data);
const doc = (path) => entries.find((e) => e.path === path)?.data;
const sum = (list, pick) => list.reduce((a, x) => a + pick(x), 0);

const orders = byPrefix('orders/', 2);
const users = byPrefix('users/', 2).filter((u) => u.role === 'STUDENT');
const merchants = byPrefix('merchants/', 2);
const offers = byPrefix('offers/', 2);

describe('Cohérence mathématique des données de démonstration', () => {
  test('toutes les commandes sont terminées, payées et leur CO2 vaut round(grammes × 2,5)', () => {
    assert.ok(orders.length > 0);
    for (const o of orders) {
      assert.equal(o.status, 'COMPLETED');
      assert.equal(o.impact.co2SavedGrams, calculateImpact(o.impact.foodSavedGrams).co2SavedGrams);
      assert.equal(o.pricing.totalMillimes, o.pricing.subtotalMillimes - (o.pricing.reward?.discountMillimes || 0));
      assert.ok(o.pricing.savedMillimes >= 0);
    }
  });

  test('chaque étudiant : stats, points, palier et prochain palier découlent de ses commandes', () => {
    for (const u of users) {
      const own = orders.filter((o) => o.studentId === u.uid);
      assert.equal(u.stats.ordersCompleted, own.length);
      assert.equal(u.totalMealsRescued, sum(own, (o) => o.quantity));
      assert.equal(u.stats.totalSpentMillimes, sum(own, (o) => o.pricing.totalMillimes));
      assert.equal(u.stats.totalSavedMillimes, sum(own, (o) => o.pricing.savedMillimes));
      assert.equal(u.stats.co2SavedGrams, sum(own, (o) => o.impact.co2SavedGrams));
      assert.equal(u.ecoPoints, sum(own, (o) => o.rewards.pointsAwarded));
      assert.equal(u.loyaltyTier, getLoyaltyTier(u.ecoPoints));
      assert.equal(u.nextRewardAt, getNextRewardMilestone(u.ecoPoints));
    }
  });

  test('Yassine : 90 EcoPoints, 1 coupon AVAILABLE appliquable à 20 %, à 10 points du palier 100', () => {
    const y = doc('users/student-yassine');
    assert.equal(y.ecoPoints, 90);
    assert.equal(y.nextRewardAt, 100);
    const available = y.unlockedRewards.filter((r) => r.status === 'AVAILABLE');
    assert.equal(available.length, 1);
    assert.equal(available[0].percentOff, 20);
    assert.ok(y.stats.ordersCompleted >= 1 && y.stats.totalSavedMillimes > 0);
  });

  test('coupons : un coupon USED correspond à une vraie commande remisée, un coupon par palier de 100 points', () => {
    for (const u of users) {
      const milestoneRewards = u.unlockedRewards.filter((r) => r.milestone > 0);
      assert.equal(milestoneRewards.length, Math.floor(u.ecoPoints / 100));
      for (const r of u.unlockedRewards.filter((x) => x.status === 'USED')) {
        const order = orders.find((o) => o.orderId === r.usedOrderId);
        assert.ok(order, `coupon ${r.rewardId} sans commande`);
        assert.equal(order.pricing.reward.rewardId, r.rewardId);
        assert.equal(order.studentId, u.uid);
      }
    }
  });

  test('chaque commerce : stats et note = somme de ses commandes, séries journalières = stats', () => {
    for (const m of merchants) {
      const own = orders.filter((o) => o.merchantId === m.id);
      assert.equal(m.stats.ordersCompleted, own.length, m.id);
      assert.equal(m.stats.revenueMillimes, sum(own, (o) => o.pricing.totalMillimes), m.id);
      assert.equal(m.stats.mealsRescued, sum(own, (o) => o.quantity), m.id);
      const rated = own.filter((o) => o.rating);
      assert.equal(m.ratingCount, rated.length);
      assert.equal(m.ratingSum, sum(rated, (o) => o.rating.stars));
      const daily = entries.filter((e) => e.path.startsWith(`merchants/${m.id}/daily/`)).map((e) => e.data);
      assert.equal(sum(daily, (d) => d.revenueMillimes), m.stats.revenueMillimes, `${m.id} : série ≠ stats`);
      assert.equal(sum(daily, (d) => d.ordersCompleted), own.length);
      assert.equal(m.activeOfferCount, offers.filter((o) => o.merchantId === m.id).length);
    }
  });

  test('le commerce de démonstration a des recettes non nulles sur les 7 derniers jours', () => {
    const daily = entries.filter((e) => e.path.startsWith('merchants/merchant-baguette-baguette/daily/')).map((e) => e.data);
    const last7 = new Set(Array.from({ length: 7 }, (_, i) => getTunisDayKey(NOW - i * 86400000)));
    assert.ok(sum(daily.filter((d) => last7.has(d.date)), (d) => d.revenueMillimes) > 0);
  });

  test('filières, impact global et série du campus s alignent sur les commandes', () => {
    const filieres = byPrefix('filieres/', 2);
    assert.equal(sum(filieres, (f) => f.ordersCompleted), orders.length);
    assert.equal(sum(filieres, (f) => f.co2SavedGrams), sum(orders, (o) => o.impact.co2SavedGrams));
    for (const f of filieres) {
      assert.equal(f.ecoPointsTotal, sum(users.filter((u) => u.filiereId === f.filiereId), (u) => u.ecoPoints));
    }
    const global = doc('campus_impact/global');
    assert.equal(global.ordersCompleted, orders.length);
    assert.equal(global.mealsRescued, sum(orders, (o) => o.quantity));
    assert.equal(global.co2SavedGrams, calculateImpact(global.foodSavedGrams).co2SavedGrams);
    assert.equal(global.moneySavedMillimes, sum(orders, (o) => o.pricing.savedMillimes));
    const daily = byPrefix('campus_impact/global/daily/', 4);
    assert.equal(daily.length, 14);
    assert.equal(sum(daily, (d) => d.ordersCompleted), global.ordersCompleted);
    assert.equal(sum(daily, (d) => d.co2SavedGrams), global.co2SavedGrams);
  });

  test('chaque commerce approuvé a au moins une offre active (le radar affiche toujours « Dès X DT »)', () => {
    for (const m of merchants.filter((x) => x.status === 'APPROVED')) {
      assert.ok(offers.some((o) => o.merchantId === m.id), `${m.id} sans offre active`);
    }
  });

  test('offres : toutes actives, rattachées à un vrai commerce, certaines finissent dans 2 h à 5 h, d autres couvrent jusqu à 24 h', () => {
    const merchantIds = new Set(merchants.map((m) => m.id));
    for (const o of offers) {
      assert.ok(merchantIds.has(o.merchantId), `${o.id} : commerce ${o.merchantId} inconnu`);
      assert.equal(o.status, 'ACTIVE');
      assert.ok(o.pickupEndAt.getTime() > NOW && o.pickupStartAt.getTime() <= NOW);
      assert.equal(o.merchantSnapshot.name, merchants.find((m) => m.id === o.merchantId).name);
    }
    const minutes = offers.map((o) => (o.pickupEndAt.getTime() - NOW) / 60000);
    assert.ok(minutes.filter((m) => m >= 120 && m <= 300).length >= 5, 'au moins 5 offres urgentes (2 h à 5 h)');
    assert.ok(minutes.filter((m) => m >= 1200).length >= 5, 'au moins 5 offres longues (jusqu à 24 h)');
    assert.ok(offers.filter((o) => o.pricing.mode === 'DUTCH_AUCTION' && (o.pickupEndAt.getTime() - NOW) / 60000 <= 300).length >= 2, 'des offres dégressives urgentes pour voir le prix baisser');
  });
});
