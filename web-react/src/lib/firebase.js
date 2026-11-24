// 💡 Concept & Analogie : Connexion sécurisée de l'application cliente au projet Firebase pour l'authentification et les écoutes temps réel Firestore.
// 🔄 Comparaison React / Flutter : Utilise le SDK Web standard `firebase/app`, `firebase/auth`, `firebase/firestore`.
// 🎯 À retenir pour la soutenance : "Ce module initialise le SDK Firebase client avec les variables d'environnement publiques et bascule gracieusement sur les mocks en mode démonstration."
// Module : Infrastructure

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyDfgGOud941Mf8uBdMKxdjbyGRpyNOM-ug',
  authDomain: 'campussave-dev.firebaseapp.com',
  projectId: 'campussave-dev',
  storageBucket: 'campussave-dev.firebasestorage.app',
  messagingSenderId: '219958634271',
  appId: '1:219958634271:web:bbd4887b9f1ba29391722a',
};

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey;
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
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
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
