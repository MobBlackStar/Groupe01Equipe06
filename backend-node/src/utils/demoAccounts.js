// 💡 Concept & Analogie : Comme les badges « visiteur » prêtés au jury pour la démo, les comptes démo ouvrent la boutique et le profil de démonstration, et rien d'autre.
// 🔄 Comparaison React / Flutter : Le web (AuthContext) et le mobile (auth_service.dart) connectent l'étudiant `student-yassine` et le commerçant `m-baguette` avec des jetons `test-token:` ; ce module relie ces uids aux vraies données.
// 🎯 À retenir pour la soutenance : "Les jetons de démo sont désactivés par défaut en production (ALLOW_DEMO_TOKENS) ; le repli démo ne concerne QUE les uids de démonstration, jamais un vrai compte."

import { db } from '../config/firebase.js';
import { MERCHANT_STATUS } from '../../../shared/constants.js';

/** Uids des comptes de démonstration (web + mobile). */
export const DEMO_MERCHANT_UID = 'm-baguette';
export const DEMO_STUDENT_UID = 'student-yassine';
export const DEMO_ADMIN_UID = 'admin-uid';

const PREFERRED_DEMO_STORE_ID = 'merchant-baguette-baguette';

export { demoTokensAllowed } from './demoTokenPolicy.js';

export const KNOWN_DEMO_USERS = {
  [DEMO_STUDENT_UID]: {
    uid: DEMO_STUDENT_UID,
    email: 'etudiant@essect.u-tunis.tn',
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
  },
  'student-demo-uid': {
    uid: 'student-demo-uid',
    email: 'etudiant@essect.u-tunis.tn',
    displayName: 'Étudiant Démo ESSECT',
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
  },
  [DEMO_MERCHANT_UID]: {
    uid: DEMO_MERCHANT_UID,
    email: 'commercant@baguette.tn',
    displayName: 'Baguette & Baguette Montfleury',
    role: 'MERCHANT',
    phone: '+21671390111',
    status: 'ACTIVE',
    stats: { offersPublished: 14, ordersPaid: 28, ordersCompleted: 26 },
  },
  'merchant-demo-uid': {
    uid: 'merchant-demo-uid',
    email: 'commercant@baguette.tn',
    displayName: 'Baguette & Baguette Montfleury',
    role: 'MERCHANT',
    phone: '+21671390111',
    status: 'ACTIVE',
    stats: { offersPublished: 14, ordersPaid: 28, ordersCompleted: 26 },
  },
  [DEMO_ADMIN_UID]: {
    uid: DEMO_ADMIN_UID,
    email: 'admin@campussave.tn',
    displayName: 'Direction ESSECT',
    role: 'ADMIN',
    phone: '+21671390000',
    status: 'ACTIVE',
  },
  'admin-demo-uid': {
    uid: 'admin-demo-uid',
    email: 'admin@campussave.tn',
    displayName: 'Direction ESSECT',
    role: 'ADMIN',
    phone: '+21671390000',
    status: 'ACTIVE',
  },
  'test-uid': {
    uid: 'test-uid',
    email: 'test@essect.u-tunis.tn',
    displayName: 'Utilisateur Test',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
};

/**
 * Récupère ou auto-provisionne le profil utilisateur pour les comptes démo reconnus.
 */
export async function getOrProvisionDemoUser(uid) {
  const demoData = KNOWN_DEMO_USERS[uid];
  if (!demoData) return null;

  const ref = db.collection('users').doc(uid);
  try {
    const snap = await ref.get();
    if (snap.exists) {
      return snap.data();
    }
    const now = new Date();
    const docData = { ...demoData, createdAt: now, updatedAt: now };
    await ref.set(docData);
    return docData;
  } catch {
    return { ...demoData, createdAt: new Date(), updatedAt: new Date() };
  }
}

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
  await getOrProvisionDemoUser(DEMO_STUDENT_UID);
  demoStudentReady = true;
}
