// 💡 Concept & Analogie : Connexion de l'application cliente au projet Firebase pour l'authentification et les écoutes temps réel Firestore.
// 🔄 Comparaison React / Flutter : Utilise le SDK Web standard `firebase/app`, `firebase/auth`, `firebase/firestore`.
// 🎯 À retenir pour la soutenance : "Ce module initialise le SDK Firebase client avec les variables d'environnement publiques."
// Module : Infrastructure

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
