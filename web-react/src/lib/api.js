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
  const currentUser = auth?.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch {}
  }

  // Si session de démonstration locale dans localStorage
  const savedDemo = localStorage.getItem('campussave_demo_session');
  if (savedDemo) {
    try {
      const parsed = JSON.parse(savedDemo);
      const role = parsed.role || 'STUDENT';
      const uid = parsed.uid || 'demo-uid';
      const email = parsed.email || 'demo@essect.tn';
      config.headers.Authorization = `Bearer test-token:${uid}:${role}:${email}`;
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
