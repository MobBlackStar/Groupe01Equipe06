// 💡 Concept & Analogie : Client HTTP centralisé (Axios) injectant automatiquement le jeton d'authentification Bearer dans chaque requête vers l'API.
// 🔄 Comparaison React / Flutter : Côté Flutter, le client Dio utilise un intercepteur équivalent.
// 🎯 À retenir pour la soutenance : "Ce client Axios lit son URL de base dans VITE_API_BASE_URL (le backend hébergé) ; il ne devine jamais une adresse à partir de l'hôte de la page."
// Module : Infrastructure

import axios from 'axios';
import { auth } from './firebase.js';
import { updateServerOffset } from './serverClock.js';

// URL de l'API : celle configurée au build (VITE_API_BASE_URL, ex. le backend hébergé) ; localhost seulement en développement.
// Aucune adresse n'est devinée à partir de l'hôte de la page : un site hébergé sur GitHub Pages ne doit jamais viser `http://<hôte>:4000`.
function computeBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
}

export const apiClient = axios.create({
  baseURL: computeBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const authMode = localStorage.getItem('campussave_auth_mode') || 'DEMO';
  const currentUser = auth?.currentUser;

  // 1. En Mode Réel : envoyer UNIQUEMENT le vrai jeton Firebase ID Token
  if (authMode === 'REAL') {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }
      } catch (e) {
        console.warn('Erreur récupération idToken Firebase:', e);
      }
    }
    // Si aucun utilisateur Firebase connecté en mode réel, NE JAMAIS injecter de jeton démo
    delete config.headers.Authorization;
    return config;
  }

  // 2. En Mode Démo : session de démonstration locale (ou utilisateur Firebase si présent)
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    } catch (e) {}
  }

  const savedToken = localStorage.getItem('campussave_token');
  const savedDemo = localStorage.getItem('campussave_demo_session');
  if (savedToken || savedDemo) {
    try {
      const parsed = savedDemo ? JSON.parse(savedDemo) : {};
      const token = savedToken || parsed.token || `test-token:${parsed.uid || 'student-demo-uid'}:${parsed.role || 'STUDENT'}:${parsed.email || 'etudiant@essect.u-tunis.tn'}`;
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch {}
  }

  delete config.headers.Authorization;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.serverTime) {
      updateServerOffset(response.data.serverTime);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
