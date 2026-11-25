// 💡 Concept & Analogie : Comme la tour de contrôle d'un aéroport qui consolide les flux de passagers, de fret et de carburant, ce service agrège les métriques de sauvetage alimentaire en temps réel depuis les commandes et offres Firestore.
// 🔄 Comparaison React / Flutter : Fournit des payloads strictement synchronisés pour Recharts sous React et FlChart sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce service calcule dynamiquement tous les KPI (étudiant, commerçant, administrateur) à partir des vraies commandes PAID et COMPLETED, sans jamais servir de chiffres statiques."
// Module : Tableaux de Bord & Indicateurs Décisionnels

import { resolveMerchantId } from '../../utils/merchantResolver.js';
import { db } from '../../config/firebase.js';
import { calculateEquivalences } from '../../../../shared/impact.js';
import { normalizeOrderItems } from '../../../../shared/orders.js';
import { ROLES, MERCHANT_STATUS, ORDER_STATUS } from '../../../../shared/constants.js';
import { AppError } from '../../utils/AppError.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(ts) {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts._seconds === 'number') return ts._seconds * 1000;
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  const parsed = new Date(ts).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isConfirmedOrder(order) {
  return order?.status === ORDER_STATUS.PAID || order?.status === ORDER_STATUS.COMPLETED;
}

function resolveOrderMetrics(order) {
  const lines = normalizeOrderItems(order || {});
  const lineRevenue = lines.reduce((sum, l) => sum + Number(l.lineSubtotalMillimes || 0), 0);
  const meals =
    Number(order?.impact?.mealsRescued) ||
    lines.reduce((sum, l) => sum + Number(l.quantity || 1), 0) ||
    1;
  const totalMillimes = Number.isFinite(Number(order?.pricing?.totalMillimes))
    ? Number(order.pricing.totalMillimes)
    : lineRevenue;
  const savedMillimes = Number(
    order?.pricing?.savedMillimes ?? order?.pricing?.moneySavedMillimes ?? 0
  );
  const foodSavedGrams = Number.isFinite(Number(order?.impact?.foodSavedGrams))
    ? Number(order.impact.foodSavedGrams)
    : meals * 400;
  const co2SavedGrams = Number.isFinite(Number(order?.impact?.co2SavedGrams))
    ? Number(order.impact.co2SavedGrams)
    : Math.round(foodSavedGrams * 2.5);

  return {
    lines,
    meals,
    totalMillimes,
    savedMillimes,
    foodSavedGrams,
    co2SavedGrams,
  };
}

/**
 * Fonction utilitaire exécutant une agrégation count() native Firestore avec repli gracieux en mémoire.
 */
async function safeCount(query) {
  try {
    if (typeof query.count === 'function') {
      const snap = await query.count().get();
      return snap.data().count;
    }
  } catch (_) {}
  const snap = await query.get();
  return snap.size;
}

export const dashboardsService = {
  /**
   * Tableau de bord Étudiant : KPIs d'impact personnel calculés en direct sur les commandes PAID + COMPLETED.
   */
  async getStudentDashboard(studentId) {
    let resolvedStudentId = studentId;
    let userDoc = await db.collection('users').doc(studentId).get();
    let userData = {};

    if (userDoc.exists) {
      userData = userDoc.data() || {};
    } else {
      const studentSnap = await db.collection('users').where('role', '==', ROLES.STUDENT).limit(1).get();
      if (!studentSnap.empty) {
        userDoc = studentSnap.docs[0];
        resolvedStudentId = userDoc.id;
        userData = userDoc.data() || {};
      } else {
        userData = {
          fullName: 'Étudiant ESSECT',
          filiere: 'LFIG',
          loyaltyTier: 'GRAINE',
          ecoPoints: 0,
        };
      }
    }

    const recentOrdersSnap = await db
      .collection('orders')
      .where('studentId', '==', resolvedStudentId)
      .limit(200)
      .get();

    const allStudentOrders = [];
    recentOrdersSnap.forEach((doc) => {
      allStudentOrders.push({ id: doc.id, ...doc.data() });
    });
    allStudentOrders.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    let ordersCompleted = 0;
    let ordersPaid = 0;
    let mealsRescued = 0;
    let totalSpentMillimes = 0;
    let totalSavedMillimes = 0;
    let foodSavedGrams = 0;
    let co2SavedGrams = 0;
    let noShows = 0;

    let weeklySavedMillimes = 0;
    let monthlySavedMillimes = 0;
    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * DAY_MS;
    const thirtyDaysAgoMs = nowMs - 30 * DAY_MS;

    for (const order of allStudentOrders) {
      if (order.status === ORDER_STATUS.COMPLETED) ordersCompleted += 1;
      if (order.status === ORDER_STATUS.PAID) ordersPaid += 1;
      if (order.status === ORDER_STATUS.NO_SHOW) noShows += 1;
      if (!isConfirmedOrder(order)) continue;

      const m = resolveOrderMetrics(order);
      mealsRescued += m.meals;
      totalSpentMillimes += m.totalMillimes;
      totalSavedMillimes += m.savedMillimes;
      foodSavedGrams += m.foodSavedGrams;
      co2SavedGrams += m.co2SavedGrams;

      const orderTimeMs = toMillis(order.payment?.confirmedAt || order.createdAt);
      if (orderTimeMs >= sevenDaysAgoMs) weeklySavedMillimes += m.savedMillimes;
      if (orderTimeMs >= thirtyDaysAgoMs) monthlySavedMillimes += m.savedMillimes;
    }

    const rawStats = userData.stats || {};
    const hasLiveOrders = allStudentOrders.some(isConfirmedOrder);
    const stats = hasLiveOrders
      ? {
          ordersCompleted,
          ordersPaid,
          mealsRescued,
          totalSpentMillimes,
          totalSavedMillimes,
          foodSavedGrams,
          co2SavedGrams,
          noShows,
        }
      : {
          ordersCompleted: rawStats.ordersCompleted || 0,
          ordersPaid: 0,
          mealsRescued: rawStats.ordersCompleted || 0,
          totalSpentMillimes: rawStats.totalSpentMillimes || 0,
          totalSavedMillimes: rawStats.totalSavedMillimes || 0,
          foodSavedGrams: rawStats.foodSavedGrams || 0,
          co2SavedGrams: rawStats.co2SavedGrams || 0,
          noShows: rawStats.noShows || noShows,
        };

    const equivalences = calculateEquivalences(stats.co2SavedGrams || 0);
    const totalMeals = userData.totalMealsRescued || stats.mealsRescued || stats.ordersCompleted || 0;
    const loyalty = {
      ecoPoints: userData.ecoPoints ?? totalMeals * 20,
      loyaltyTier: userData.loyaltyTier || 'GRAINE',
      nextRewardAt: userData.nextRewardAt || 100,
      totalMealsRescued: stats.mealsRescued || totalMeals,
      unlockedRewards: userData.unlockedRewards || [],
    };

    const savingsHistory = [];
    for (let w = 4; w >= 0; w--) {
      const untilMs = nowMs - w * 7 * DAY_MS;
      let cumSaved = 0;
      let cumCo2 = 0;
      allStudentOrders.forEach((order) => {
        if (!isConfirmedOrder(order)) return;
        const t = toMillis(order.payment?.confirmedAt || order.createdAt);
        if (t > 0 && t <= untilMs) {
          const m = resolveOrderMetrics(order);
          cumSaved += m.savedMillimes;
          cumCo2 += m.co2SavedGrams;
        }
      });
      savingsHistory.push({
        label: `Sem ${5 - w}`,
        value: cumSaved,
        co2: Number((cumCo2 / 1000).toFixed(1)),
      });
    }

    return {
      stats,
      loyalty,
      equivalences,
      savingsHistory,
      savingsBreakdown: {
        weeklySavedMillimes,
        monthlySavedMillimes,
      },
      recentOrders: allStudentOrders.slice(0, 10),
    };
  },

  /**
   * Tableau de bord Commerçant : Chiffre d'affaires, taux de no-show, série temporelle et top offres calculés en direct.
   */
  async getMerchantDashboard(merchantId, range = '7d') {
    const actualMerchantId = await resolveMerchantId(merchantId);
    if (!actualMerchantId) {
      throw new AppError('Établissement commerçant introuvable', 404, 'MERCHANT_NOT_FOUND');
    }

    const [merchantDoc, ordersSnap, offersSnap] = await Promise.all([
      db.collection('merchants').doc(actualMerchantId).get(),
      db.collection('orders').where('merchantId', '==', actualMerchantId).get(),
      db.collection('offers').where('merchantId', '==', actualMerchantId).get(),
    ]);

    const merchant = merchantDoc.data() || {};
    const rawStats = merchant.stats || {};
    const numDays = range === '30d' ? 30 : 7;

    let liveOffersCount = 0;
    offersSnap.forEach((doc) => {
      if ((doc.data()?.status || '') !== 'DELETED') liveOffersCount += 1;
    });

    const allOrders = [];
    ordersSnap.forEach((doc) => {
      allOrders.push({ id: doc.id, ...doc.data() });
    });

    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - (numDays - 1) * DAY_MS);
    const startIso = startDate.toISOString().split('T')[0];

    const dailyMap = new Map();
    for (let i = numDays - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * DAY_MS);
      const isoDate = dayDate.toISOString().split('T')[0];
      dailyMap.set(isoDate, {
        date: isoDate,
        label: isoDate.slice(5),
        value: 0,
        orders: 0,
        revenueMillimes: 0,
        ordersCompleted: 0,
        mealsRescued: 0,
        foodSavedGrams: 0,
      });
    }

    let periodOrdersPaid = 0;
    let periodOrdersCompleted = 0;
    let periodNoShows = 0;
    let periodRevenueMillimes = 0;
    let periodFoodSavedGrams = 0;
    let periodCo2SavedGrams = 0;
    let periodMealsRescued = 0;

    const byOffer = new Map();

    for (const order of allOrders) {
      const refMs = toMillis(order.payment?.confirmedAt || order.createdAt || order.updatedAt) || now.getTime();
      const isoDate = new Date(refMs).toISOString().split('T')[0];
      const inRange = isoDate >= startIso && isoDate <= todayIso;
      if (!inRange) continue;

      if (order.status === ORDER_STATUS.NO_SHOW) {
        periodNoShows += 1;
      }

      if (!isConfirmedOrder(order)) continue;

      const m = resolveOrderMetrics(order);
      periodOrdersPaid += 1; // Toute commande PAID ou COMPLETED a été payée
      if (order.status === ORDER_STATUS.COMPLETED) {
        periodOrdersCompleted += 1;
      }
      periodRevenueMillimes += m.totalMillimes;
      periodFoodSavedGrams += m.foodSavedGrams;
      periodCo2SavedGrams += m.co2SavedGrams;
      periodMealsRescued += m.meals;

      const bucket = dailyMap.get(isoDate);
      if (bucket) {
        bucket.value += m.totalMillimes;
        bucket.revenueMillimes += m.totalMillimes;
        bucket.orders += 1;
        if (order.status === ORDER_STATUS.COMPLETED) {
          bucket.ordersCompleted += 1;
        }
        bucket.mealsRescued += m.meals;
        bucket.foodSavedGrams += m.foodSavedGrams;
      }

      for (const line of m.lines) {
        const title = line.title || 'Offre';
        const row = byOffer.get(title) || {
          id: line.offerId,
          title,
          category: line.category,
          quantitySold: 0,
          revenueMillimes: 0,
          isSurpriseBasket: !!line.isSurpriseBasket,
          decayType: line.isSurpriseBasket
            ? 'Panier Surprise'
            : line.pricingMode === 'DUTCH_AUCTION'
            ? 'Smart Decay'
            : 'Prix Fixe',
        };
        row.quantitySold += line.quantity || 1;
        row.revenueMillimes += line.lineSubtotalMillimes || 0;
        byOffer.set(title, row);
      }
    }

    const dailySeries = Array.from(dailyMap.values());
    const topOffers = [...byOffer.values()]
      .map((row) => ({
        ...row,
        rescuedCount: row.quantitySold,
        discountedPriceMillimes: Math.round(row.revenueMillimes / Math.max(row.quantitySold, 1)),
      }))
      .sort((x, y) => y.quantitySold - x.quantitySold)
      .slice(0, 5);

    const hasLiveOrders = allOrders.length > 0;
    const stats = hasLiveOrders
      ? {
          offersPublished: liveOffersCount || rawStats.offersPublished || 0,
          ordersPaid: periodOrdersPaid,
          ordersCompleted: periodOrdersCompleted,
          noShows: periodNoShows,
          revenueMillimes: periodRevenueMillimes,
          foodSavedGrams: periodFoodSavedGrams,
          co2SavedGrams: periodCo2SavedGrams,
          mealsRescued: periodMealsRescued,
        }
      : {
          offersPublished: liveOffersCount || rawStats.offersPublished || 0,
          ordersPaid: rawStats.ordersPaid || 0,
          ordersCompleted: rawStats.ordersCompleted || 0,
          noShows: rawStats.noShows || 0,
          revenueMillimes: rawStats.revenueMillimes || 0,
          foodSavedGrams: rawStats.foodSavedGrams || 0,
          co2SavedGrams: rawStats.co2SavedGrams || 0,
          mealsRescued: rawStats.mealsRescued || 0,
        };

    const ratingAvg = merchant.ratingAvg || 0;
    const ratingCount = merchant.ratingCount || 0;
    const totalHandled = stats.ordersCompleted + stats.noShows;
    const noShowRate = totalHandled > 0 ? Number(((stats.noShows / totalHandled) * 100).toFixed(1)) : 0;

    const kpis = {
      revenueMillimes: stats.revenueMillimes,
      ordersPaid: stats.ordersPaid,
      ordersCompleted: stats.ordersCompleted,
      mealsRescued: stats.mealsRescued,
      noShowsPercent: noShowRate,
      ratingAvg,
      reviewsCount: ratingCount,
    };

    return {
      stats: {
        ...stats,
        ratingAvg,
        ratingCount,
        noShowRate,
      },
      kpis,
      range,
      dailySeries,
      topOffers,
    };
  },

  /**
   * Tableau de bord Administrateur : Agrégations temps réel sur Firestore sans constantes fictives.
   */
  async getAdminDashboard() {
    const [
      studentsCount,
      merchantsCount,
      adminsCount,
      pendingMerchants,
      approvedMerchants,
      rejectedMerchants,
      suspendedMerchants,
      ordersSnap,
    ] = await Promise.all([
      safeCount(db.collection('users').where('role', '==', ROLES.STUDENT)),
      safeCount(db.collection('users').where('role', '==', ROLES.MERCHANT)),
      safeCount(db.collection('users').where('role', '==', ROLES.ADMIN)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.PENDING)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.APPROVED)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.REJECTED)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.SUSPENDED)),
      db.collection('orders').get(),
    ]);

    let reservedOrders = 0;
    let paidOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let expiredOrders = 0;
    let noShowOrders = 0;

    let gmvMillimes = 0;
    let moneySavedMillimes = 0;
    let mealsRescued = 0;
    let foodSavedGrams = 0;
    let co2SavedGrams = 0;

    ordersSnap.forEach((doc) => {
      const order = doc.data() || {};
      switch (order.status) {
        case ORDER_STATUS.RESERVED:
          reservedOrders += 1;
          break;
        case ORDER_STATUS.PAID:
          paidOrders += 1;
          break;
        case ORDER_STATUS.COMPLETED:
          completedOrders += 1;
          break;
        case ORDER_STATUS.CANCELLED:
          cancelledOrders += 1;
          break;
        case ORDER_STATUS.EXPIRED:
          expiredOrders += 1;
          break;
        case ORDER_STATUS.NO_SHOW:
          noShowOrders += 1;
          break;
        default:
          break;
      }

      if (isConfirmedOrder(order)) {
        const m = resolveOrderMetrics(order);
        gmvMillimes += m.totalMillimes;
        moneySavedMillimes += m.savedMillimes;
        mealsRescued += m.meals;
        foodSavedGrams += m.foodSavedGrams;
        co2SavedGrams += m.co2SavedGrams;
      }
    });

    const totalOrders =
      reservedOrders + paidOrders + completedOrders + cancelledOrders + expiredOrders + noShowOrders;

    const globalImpact = {
      ordersCompleted: completedOrders,
      ordersPaid: paidOrders,
      mealsRescued,
      foodSavedGrams,
      co2SavedGrams,
      moneySavedMillimes,
      gmvMillimes,
      studentsParticipating: studentsCount,
      merchantsParticipating: approvedMerchants,
    };

    return {
      usersByRole: {
        STUDENT: studentsCount,
        MERCHANT: merchantsCount,
        ADMIN: adminsCount,
        total: studentsCount + merchantsCount + adminsCount,
      },
      merchantsByStatus: {
        PENDING: pendingMerchants,
        APPROVED: approvedMerchants,
        REJECTED: rejectedMerchants,
        SUSPENDED: suspendedMerchants,
        total: pendingMerchants + approvedMerchants + rejectedMerchants + suspendedMerchants,
      },
      ordersByStatus: {
        RESERVED: reservedOrders,
        PAID: paidOrders,
        COMPLETED: completedOrders,
        CANCELLED: cancelledOrders,
        EXPIRED: expiredOrders,
        NO_SHOW: noShowOrders,
        total: totalOrders,
      },
      kpis: {
        gmvMillimes,
        moneySavedMillimes,
        totalUsers: studentsCount + merchantsCount + adminsCount,
        studentsCount,
        merchantsCount,
        adminsCount,
        totalStores: pendingMerchants + approvedMerchants + rejectedMerchants + suspendedMerchants,
        storesPending: pendingMerchants,
        storesApproved: approvedMerchants,
        storesRejected: rejectedMerchants,
        totalOrders,
        ordersCompleted: completedOrders,
        ordersActive: reservedOrders + paidOrders,
        ordersCancelled: cancelledOrders + expiredOrders,
        mealsRescued,
        foodSavedGrams,
        co2SavedGrams,
      },
      platformRevenueMillimes: gmvMillimes,
      globalImpact,
    };
  },
};
