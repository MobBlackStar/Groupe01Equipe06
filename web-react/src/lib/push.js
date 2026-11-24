// 💡 Concept & Analogie : Le numéro de téléphone du navigateur : on demande la permission, on l'enregistre auprès du serveur, et les messages arrivent même onglet fermé.
// 🔄 Comparaison React / Flutter : Équivalent web de `lib/services/fcm_service.dart` : même route `POST /users/me/fcm-token`, mêmes types d'événements, route au toucher dans `data.route`.
// 🎯 À retenir pour la soutenance : "Web Push via Firebase Cloud Messaging : clé VAPID publique dans l'environnement (VITE_FIREBASE_VAPID_KEY), service worker configuré par l'URL, aucune clé privée dans le dépôt."

import { app, isFirebaseConfigured } from './firebase.js';
import { apiClient } from './api.js';
import { ENDPOINTS } from './endpoints.js';

const TOKEN_KEY = 'cs.fcm_token';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/** Statuts possibles : `unsupported` | `unconfigured` | `denied` | `default` (jamais demandé) | `granted` (autorisé, pas encore enregistré) | `active`. */
export function getPushStatus() {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (!isFirebaseConfigured || !VAPID_KEY || VAPID_KEY.includes('Example')) return 'unconfigured';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') return localStorage.getItem(TOKEN_KEY) ? 'active' : 'granted';
  return 'default';
}

/** Le service worker reçoit la configuration PUBLIQUE de Firebase par son URL (il ne lit pas `import.meta.env`). */
function swUrl() {
  const q = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  });
  return `/firebase-messaging-sw.js?${q.toString()}`;
}

let foregroundBound = false;

async function obtainAndRegisterToken() {
  const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
  const registration = await navigator.serviceWorker.register(swUrl());
  await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Aucun jeton de notification reçu du navigateur.');
  await apiClient.post(ENDPOINTS.FCM_TOKEN, { token });
  localStorage.setItem(TOKEN_KEY, token);

  // Page au premier plan : FCM n'affiche rien tout seul, on montre la notification via le service worker
  if (!foregroundBound) {
    foregroundBound = true;
    onMessage(messaging, (payload) => {
      const n = payload.notification || {};
      registration.showNotification(n.title || 'CampusSave', { body: n.body || '', icon: '/favicon.png', badge: '/favicon-32x32.png', data: payload.data || {} });
    });
  }
  return token;
}

/** Demande l'autorisation puis enregistre le navigateur. Lève une erreur lisible en cas d'échec. */
export async function enablePush() {
  const status = getPushStatus();
  if (status === 'unsupported') throw new Error('Ce navigateur ne gère pas les notifications push.');
  if (status === 'unconfigured') throw new Error('Notifications web non configurées (clé VAPID manquante).');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Autorisation refusée : activez les notifications dans les réglages du site.');
  return obtainAndRegisterToken();
}

/** Après une connexion : si l'autorisation a déjà été donnée, on (ré)enregistre le navigateur sans rien demander. */
export async function ensurePushRegistered() {
  try {
    if (getPushStatus() === 'granted' || getPushStatus() === 'active') await obtainAndRegisterToken();
  } catch {
    /* silencieux : l'utilisateur peut relancer depuis son profil */
  }
}

/** À la déconnexion : ce navigateur ne doit plus recevoir les notifications de l'ancien compte. */
export async function disablePush() {
  const token = localStorage.getItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  if (!token) return;
  try {
    await apiClient.delete(ENDPOINTS.FCM_TOKEN, { data: { token } });
  } catch {
    /* hors ligne : le serveur élaguera le jeton au prochain échec d'envoi */
  }
}

/** `POST /users/me/fcm-test` : renvoie `{ ok, tokensCount, sentCount, failedCount, mode, diagnostics }`. */
export async function sendTestPush() {
  const res = await apiClient.post(`${ENDPOINTS.FCM_TOKEN.replace('/fcm-token', '/fcm-test')}`);
  return res.data;
}
