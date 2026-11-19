// 💡 Concept & Analogie : Comme un vigile qui remet à chaque commerçant la clé de SA boutique et d'aucune autre, ce résolveur retrouve le commerce d'un compte sans jamais en prêter un autre.
// 🔄 Comparaison React / Flutter : Les clients web et mobile envoient simplement leur jeton ; c'est le serveur qui décide quelle boutique leur appartient.
// 🎯 À retenir pour la soutenance : "Un commerçant sans boutique voit une liste vide ; seul le compte de démonstration est relié à la boutique de démo, plus aucun repli ne montre les offres ou le chiffre d'affaires d'un autre commerce."

import { db } from '../config/firebase.js';
import { DEMO_MERCHANT_UID, findDemoMerchant } from './demoAccounts.js';

/**
 * Identifiant du commerce qui appartient au compte `uid`, ou null.
 * Ordre : document `merchants/{uid}` → champ `ownerUid` → (compte démo uniquement) la boutique de démo.
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
export async function resolveMerchantId(uid) {
  const direct = await db.collection('merchants').doc(uid).get();
  if (direct.exists) return uid;

  const owned = await db.collection('merchants').where('ownerUid', '==', uid).limit(1).get();
  if (!owned.empty) return owned.docs[0].id;

  if (uid === DEMO_MERCHANT_UID) {
    const demo = await findDemoMerchant();
    return demo?.id ?? null;
  }
  return null;
}
