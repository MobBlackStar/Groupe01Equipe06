// 💡 Concept & Analogie : Comme la tour de contrôle d'un aéroport qui consolide les flux de passagers, de fret et de carburant, ce service agrège les métriques de sauvetage alimentaire selon le profil connecté (Étudiant, Commerçant ou Administrateur).
// 🔄 Comparaison React / Flutter : Fournit les données sources modélisées alimentant les graphiques Recharts sous React et FlChart sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce service utilise les agrégations count() natives de Firestore pour un coût de lecture minimal et offre une rétrocompatibilité complète en mémoire."
// Module : Tableaux de Bord & Indicateurs Décisionnels

import { db } from '../../config/firebase.js';
import { calculateEquivalences } from '../../../../shared/impact.js';
import { ROLES, MERCHANT_STATUS, ORDER_STATUS } from '../../../../shared/constants.js';
import { AppError } from '../../utils/AppError.js';

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
   * Tableau de bord Étudiant : KPIs d'impact personnel, statut de fidélité, équivalences et historique.
   */
  async getStudentDashboard(studentId) {
    const userDoc = await db.collection('users').doc(studentId).get();
    if (!userDoc.exists) {
      throw new AppError('Profil étudiant introuvable', 404, 'USER_NOT_FOUND');
    }

    const userData = userDoc.data() || {};
    const stats = userData.stats || {
      ordersCompleted: 0,
      totalSpentMillimes: 0,
      totalSavedMillimes: 0,
      foodSavedGrams: 0,
      co2SavedGrams: 0,
      noShows: 0,
    };

    // Calcul des équivalences écologiques réelles (EPA / FAO)
    const equivalences = calculateEquivalences(stats.co2SavedGrams || 0);

    // Synthèse du programme de fidélité
    const loyalty = {
      ecoPoints: userData.ecoPoints || 0,
      loyaltyTier: userData.loyaltyTier || 'GRAINE',
      nextRewardAt: userData.nextRewardAt || 100,
      totalMealsRescued: userData.totalMealsRescued || stats.ordersCompleted || 0,
      unlockedRewards: userData.unlockedRewards || [],
    };

    // Récupération des 10 dernières commandes pour la traçabilité
    const recentOrdersSnap = await db
      .collection('orders')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentOrders = [];
    let weeklySavedMillimes = 0;
    let monthlySavedMillimes = 0;

    const nowMs = Date.now();
    const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;

    recentOrdersSnap.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };
      recentOrders.push(order);

      if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.PAID) {
        const orderTimeMs = order.createdAt?.toDate ? order.createdAt.toDate().getTime() : new Date(order.createdAt).getTime();
        const saved = order.pricing?.moneySavedMillimes || 0;

        if (orderTimeMs >= sevenDaysAgoMs) {
          weeklySavedMillimes += saved;
        }
        if (orderTimeMs >= thirtyDaysAgoMs) {
          monthlySavedMillimes += saved;
        }
      }
    });

    return {
      stats,
      loyalty,
      equivalences,
      savingsBreakdown: {
        weeklySavedMillimes,
        monthlySavedMillimes,
      },
      recentOrders,
    };
  },

  /**
   * Tableau de bord Commerçant : Chiffre d'affaires, taux de no-show, série temporelle journalière et top offres.
   */
  async getMerchantDashboard(merchantId, range = '7d') {
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    if (!merchantDoc.exists) {
      throw new AppError('Établissement commerçant introuvable', 404, 'MERCHANT_NOT_FOUND');
    }

    const merchant = merchantDoc.data() || {};
    const rawStats = merchant.stats || {};

    const stats = {
      offersPublished: rawStats.offersPublished || 0,
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

    const numDays = range === '30d' ? 30 : 7;

    // Récupération de la sous-collection journalière merchants/{id}/daily/{YYYY-MM-DD}
    let dailyDocs = [];
    try {
      const dailySnap = await db
        .collection('merchants')
        .doc(merchantId)
        .collection('daily')
        .orderBy('date', 'desc')
        .limit(numDays)
        .get();

      if (!dailySnap.empty) {
        dailyDocs = dailySnap.docs.map((d) => d.data());
      }
    } catch (_) {}

    // Génération ou consolidation chronologique des données pour le tracé graphique
    const dailySeries = [];
    const now = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoDate = dayDate.toISOString().split('T')[0];

      const found = dailyDocs.find((d) => d.date === isoDate);
      if (found) {
        dailySeries.push(found);
      } else {
        dailySeries.push({
          date: isoDate,
          revenueMillimes: 0,
          ordersCompleted: 0,
          mealsRescued: 0,
          foodSavedGrams: 0,
        });
      }
    }

    // Récupération des 5 meilleures ventes de l'établissement
    let topOffers = [];
    try {
      const topOffersSnap = await db
        .collection('offers')
        .where('merchantId', '==', merchantId)
        .orderBy('quantitySold', 'desc')
        .limit(5)
        .get();

      topOffersSnap.forEach((doc) => {
        const off = doc.data();
        topOffers.push({
          id: doc.id,
          title: off.title,
          category: off.category,
          quantitySold: off.quantitySold || 0,
          isSurpriseBasket: off.isSurpriseBasket || false,
          discountedPriceMillimes: off.discountedPriceMillimes || off.pricing?.discountedPriceMillimes || 0,
        });
      });
    } catch (_) {}

    return {
      stats: {
        ...stats,
        ratingAvg,
        ratingCount,
        noShowRate,
      },
      range,
      dailySeries,
      topOffers,
    };
  },

  /**
   * Tableau de bord Administrateur : Agrégations globales d'utilisateurs, de commerces, de commandes et de volume d'affaires.
   */
  async getAdminDashboard() {
    // 1. Décompte des utilisateurs par rôle
    const [studentsCount, merchantsCount, adminsCount] = await Promise.all([
      safeCount(db.collection('users').where('role', '==', ROLES.STUDENT)),
      safeCount(db.collection('users').where('role', '==', ROLES.MERCHANT)),
      safeCount(db.collection('users').where('role', '==', ROLES.ADMIN)),
    ]);

    // 2. Décompte des commerces par statut d'approbation
    const [pendingMerchants, approvedMerchants, rejectedMerchants, suspendedMerchants] = await Promise.all([
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.PENDING)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.APPROVED)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.REJECTED)),
      safeCount(db.collection('merchants').where('status', '==', MERCHANT_STATUS.SUSPENDED)),
    ]);

    // 3. Décompte des commandes par état de cycle de vie
    const [reservedOrders, paidOrders, completedOrders, cancelledOrders, expiredOrders, noShowOrders] = await Promise.all([
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.RESERVED)),
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.PAID)),
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.COMPLETED)),
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.CANCELLED)),
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.EXPIRED)),
      safeCount(db.collection('orders').where('status', '==', ORDER_STATUS.NO_SHOW)),
    ]);

    // 4. Données d'impact global et volume d'affaires
    let globalImpact = {
      ordersCompleted: completedOrders,
      mealsRescued: 0,
      foodSavedGrams: 0,
      co2SavedGrams: 0,
      moneySavedMillimes: 0,
      studentsParticipating: studentsCount,
      merchantsParticipating: approvedMerchants,
    };

    try {
      const globalImpactDoc = await db.collection('campus_impact').doc('global').get();
      if (globalImpactDoc.exists) {
        globalImpact = { ...globalImpact, ...globalImpactDoc.data() };
      }
    } catch (_) {}

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
        total: reservedOrders + paidOrders + completedOrders + cancelledOrders + expiredOrders + noShowOrders,
      },
      platformRevenueMillimes: globalImpact.moneySavedMillimes || 0,
      globalImpact,
    };
  },
};
