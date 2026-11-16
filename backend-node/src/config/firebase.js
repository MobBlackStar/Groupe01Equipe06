// 💡 Concept & Analogie : Comme la clé maîtresse d'un gestionnaire d'immeuble, le SDK Firebase Admin confère au backend tous les privilèges d'administration nécessaires pour exécuter des transactions atomiques et attribuer les rôles.
// 🔄 Comparaison React / Flutter : Le backend utilise `firebase-admin` avec privilèges complets ; les applications React et Flutter utilisent les SDK clients restreints par `firestore.rules`.
// 🎯 À retenir pour la soutenance : "Le backend est le seul détenteur des privilèges d'écriture grâce au SDK Admin. En l'absence de clé Cloud, un magasin Firestore en mémoire pré-peuplé garantit un fonctionnement 100% interactif."
// Module : Architecture & Infrastructure

import admin from 'firebase-admin';
import { env } from './env.js';
import { InMemoryFirestore, createInMemoryAuth, createInMemoryMessaging } from './inMemoryDb.js';

function checkFirebaseConfigured() {
  if (!env.FIREBASE_SERVICE_ACCOUNT_BASE64) return false;
  const raw = env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim();
  if (!raw || raw.startsWith('<') || raw === 'placeholder') return false;
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    return Boolean(serviceAccount.project_id && (serviceAccount.private_key || serviceAccount.client_email));
  } catch {
    return false;
  }
}

export const isFirebaseConfigured = checkFirebaseConfigured();

let app = null;
let auth;
let db;
let messaging;

if (isFirebaseConfigured) {
  try {
    const decoded = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    if (!admin.apps.length) {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: env.FIREBASE_PROJECT_ID,
      });
    } else {
      app = admin.app();
    }
    auth = admin.auth(app);
    db = admin.firestore(app);
    messaging = admin.messaging(app);
  } catch (err) {
    console.warn('⚠️ Échec initialisation Firebase Admin SDK Cloud, bascule sur le mode mémoire :', err.message);
    const inMem = new InMemoryFirestore();
    inMem.seedDefaultData();
    db = inMem;
    auth = createInMemoryAuth(db);
    messaging = createInMemoryMessaging();
  }
} else {
  // Mode mémoire Firestore pré-peuplé (Démo 100% interactive)
  const inMem = new InMemoryFirestore();
  inMem.seedDefaultData();
  db = inMem;
  auth = createInMemoryAuth(db);
  messaging = createInMemoryMessaging();
}

export { auth, db, messaging };
export default app;
