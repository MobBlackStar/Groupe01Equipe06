// 💡 Concept & Analogie : Comme la remise solennelle des clés du bâtiment au doyen de l'université, ce script est la seule porte d'entrée autorisée pour attribuer le rôle ADMIN suprême dans Firebase.
// 🔄 Comparaison React / Flutter : L'espace d'administration n'existe que sur l'application Web React (`/admin`) ; il est volontairement omis de l'application mobile Flutter conformément aux spécifications.
// 🎯 À retenir pour la soutenance : "Pour des motifs de sécurité critique, aucune route d'API ne permet d'assigner le rôle ADMIN : seul ce script sécurisé exécuté en ligne de commande peut le conférer via l'Admin SDK."
// Module : Sécurité & Administration

import { auth, db } from '../src/config/firebase.js';
import { ROLES, USER_STATUS } from '../../shared/constants.js';

async function createAdmin(email, password, displayName) {
  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`Utilisateur existant trouvé : ${userRecord.uid}`);
    } catch {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });
      console.log(`Nouvel utilisateur créé : ${userRecord.uid}`);
    }

    // Attribution du custom claim ADMIN
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.ADMIN });

    // Création ou mise à jour du document Firestore
    await db.collection('users').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        displayName,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log(`✅ Administrateur configuré avec succès : ${email} (${userRecord.uid})`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Échec de la création de l administrateur :', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'admin@campussave.essect.tn';
const password = process.argv[3] || 'CampusSave2026!';
const displayName = process.argv[4] || 'Admin ESSECT';

createAdmin(email, password, displayName);
