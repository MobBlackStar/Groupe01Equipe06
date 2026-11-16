// 💡 Concept & Analogie : Connexion sécurisée de l'application cliente au projet Firebase pour l'authentification et les écoutes temps réel Firestore.
// 🔄 Comparaison React / Flutter : Utilise le SDK Web standard `firebase/app`, `firebase/auth`, `firebase/firestore`.
// 🎯 À retenir pour la soutenance : "Ce module initialise le SDK Firebase client avec les variables d'environnement publiques et bascule gracieusement sur les mocks en mode démonstration."
// Module : Infrastructure

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isConfigured = Boolean(
  rawApiKey &&
  rawApiKey.trim() !== '' &&
  !rawApiKey.includes('<') &&
  rawApiKey !== 'undefined' &&
  rawApiKey !== 'placeholder' &&
  rawApiKey !== 'AIzaSyExampleApiKeyForCampusSaveWeb'
);

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('⚠️ Échec d initialisation Firebase Client, activation automatique du mode mock local :', err.message);
    app = null;
    auth = null;
    db = null;
  }
}

export const isFirebaseConfigured = isConfigured && app !== null;
export { app, auth, db };
export default app;
