// 💡 Concept & Analogie : Comme la clé maîtresse d'un gestionnaire d'immeuble, le SDK Firebase Admin confère au backend tous les privilèges d'administration nécessaires pour exécuter des transactions atomiques et attribuer les rôles.
// 🔄 Comparaison React / Flutter : Le backend utilise `firebase-admin` avec privilèges complets ; les applications React et Flutter utilisent les SDK clients restreints par `firestore.rules`.
// 🎯 À retenir pour la soutenance : "Le backend est le seul détenteur des privilèges d'écriture grâce au SDK Admin, garantissant que toutes les mutations passent par notre logique métier validée."
// Module : Architecture & Infrastructure

import admin from 'firebase-admin';
import { env } from './env.js';

let app;

if (!admin.apps.length) {
  if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: env.FIREBASE_PROJECT_ID,
      });
    } catch {
      app = admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
    }
  } else {
    // Mode émulateur ou projet par défaut
    app = admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }
} else {
  app = admin.app();
}

export const auth = admin.auth(app);
export const db = admin.firestore(app);
export const messaging = admin.messaging(app);
export default app;
