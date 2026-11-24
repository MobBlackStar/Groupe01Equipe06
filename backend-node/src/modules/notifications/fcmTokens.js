// 💡 Concept & Analogie : L'annuaire des téléphones : pour prévenir un commerçant, il faut retrouver tous les appareils de son compte, même quand le compte et la boutique n'ont pas le même identifiant.
// 🔄 Comparaison React / Flutter : Les jetons sont enregistrés par `POST /users/me/fcm-token` (web et mobile) dans `users/{uid}.fcmTokens` ; ce module les retrouve pour un utilisateur ou pour une boutique.
// 🎯 À retenir pour la soutenance : "Un commerçant réel et le compte de démonstration reçoivent tous deux les notifications de leur boutique : le jeton est cherché sur l'identifiant de la boutique, son propriétaire et l'alias de démo."

import { db } from '../../config/firebase.js';
import { DEMO_MERCHANT_UID } from '../../utils/demoAccounts.js';

const PREFERRED_DEMO_STORE_ID = 'merchant-baguette-baguette';

async function tokensOf(uid) {
  if (!uid) return [];
  try {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data().fcmTokens || [] : [];
  } catch {
    return [];
  }
}

/** Jetons FCM de l'utilisateur `uid`. */
export async function getUserTokens(uid) {
  return [...new Set(await tokensOf(uid))];
}

/** Identifiants de comptes qui possèdent la boutique : son id, son `ownerUid` et, pour la boutique de démo, `m-baguette`. */
export async function getMerchantUserIds(merchantId) {
  const ids = new Set([merchantId]);
  try {
    const snap = await db.collection('merchants').doc(merchantId).get();
    const ownerUid = snap.exists ? snap.data().ownerUid : null;
    if (ownerUid) ids.add(ownerUid);
  } catch {
    /* boutique illisible : on garde l'identifiant seul */
  }
  if (merchantId === PREFERRED_DEMO_STORE_ID) ids.add(DEMO_MERCHANT_UID);
  return [...ids];
}

/** Jetons FCM de tous les appareils liés à la boutique. */
export async function getMerchantTokens(merchantId) {
  const lists = await Promise.all((await getMerchantUserIds(merchantId)).map(tokensOf));
  return [...new Set(lists.flat())];
}
