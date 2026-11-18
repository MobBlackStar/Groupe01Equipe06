// 💡 Concept & Analogie : Comme les badges « visiteur » prêtés au jury pour la démo, les comptes démo ouvrent la boutique et le profil de démonstration, et rien d'autre.
// 🔄 Comparaison React / Flutter : Le web (AuthContext) et le mobile (auth_service.dart) connectent l'étudiant `student-yassine` et le commerçant `m-baguette` avec des jetons `test-token:` ; ce module relie ces uids aux vraies données.
// 🎯 À retenir pour la soutenance : "Les jetons de démo sont désactivés par défaut en production (ALLOW_DEMO_TOKENS) ; le repli démo ne concerne QUE les uids de démonstration, jamais un vrai compte."

import { db } from '../config/firebase.js';
import { MERCHANT_STATUS } from '../../../shared/constants.js';

/** Uids des comptes de démonstration (web + mobile). */
export const DEMO_MERCHANT_UID = 'm-baguette';
export const DEMO_STUDENT_UID = 'student-yassine';

const PREFERRED_DEMO_STORE_ID = 'merchant-baguette-baguette';

export { demoTokensAllowed } from './demoTokenPolicy.js';

/** Document du commerce relié au compte commerçant démo : `m-baguette`, sinon la boutique seed, sinon le 1er approuvé. */
export async function findDemoMerchant() {
  const direct = await db.collection('merchants').doc(DEMO_MERCHANT_UID).get();
  if (direct.exists) return direct.data();

  const preferred = await db.collection('merchants').doc(PREFERRED_DEMO_STORE_ID).get();
  if (preferred.exists && preferred.data().status === MERCHANT_STATUS.APPROVED) return preferred.data();

  const anyApproved = await db.collection('merchants').where('status', '==', MERCHANT_STATUS.APPROVED).limit(1).get();
  return anyApproved.empty ? null : anyApproved.docs[0].data();
}

let demoStudentReady = false;

/**
 * Crée le profil de l'étudiant démo s'il n'existe pas (les seeds ne contiennent que `student-demo-uid`).
 * Sans ce profil, un scan qui crédite des EcoPoints échouait en 500 (« No document to update »).
 */
export async function ensureDemoStudent() {
  if (demoStudentReady) return;
  const ref = db.collection('users').doc(DEMO_STUDENT_UID);
  const snap = await ref.get();
  if (!snap.exists) {
    const now = new Date();
    await ref.set({
      uid: DEMO_STUDENT_UID,
      email: 'yassine@essect.u-tunis.tn',
      displayName: 'Yassine Trabelsi',
      role: 'STUDENT',
      filiereId: 'EBUSINESS_3A',
      phone: '+21698123456',
      ecoPoints: 90,
      loyaltyTier: 'GRAINE',
      nextRewardAt: 100,
      totalMealsRescued: 4,
      status: 'ACTIVE',
      unlockedRewards: [],
      stats: { ordersCompleted: 0, totalSpentMillimes: 0, totalSavedMillimes: 0, foodSavedGrams: 0, co2SavedGrams: 0, noShows: 0 },
      createdAt: now,
      updatedAt: now,
    });
  }
  demoStudentReady = true;
}
