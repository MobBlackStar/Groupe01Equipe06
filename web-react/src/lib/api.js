// 💡 Concept & Analogie : Client HTTP centralisé (Axios) injectant automatiquement le jeton d'authentification Bearer dans chaque requête vers l'API.
// 🔄 Comparaison React / Flutter : Côté Flutter, le client Dio utilise un intercepteur équivalent.
// 🎯 À retenir pour la soutenance : "Ce client Axios intercepte chaque requête sortante pour injecter le token ID Firebase et extrait le serverTime des réponses."
// Module : Infrastructure

import axios from 'axios';
import { auth } from './firebase.js';
import { updateServerOffset } from './serverClock.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  // 1. Priorité aux jetons de session locale / démo 1-clic pour fluidifier la soutenance
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

  // 2. Si utilisateur Firebase réel connecté
  const currentUser = auth?.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch {}
  }

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
