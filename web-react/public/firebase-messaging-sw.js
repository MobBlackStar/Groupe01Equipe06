// 💡 Concept & Analogie : Le veilleur de nuit : il reste éveillé même navigateur fermé et affiche les alertes de commandes, tickets et retraits.
// 🔄 Comparaison React / Flutter : Équivalent web du service natif Android (`fcm_service.dart` + canal `campussave_high_importance`).
// 🎯 À retenir pour la soutenance : "Aucune clé privée ici : la configuration PUBLIQUE de Firebase est passée dans l'URL d'enregistrement par `src/lib/push.js` (variables VITE_*)."

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Configuration publique transmise par l'URL du service worker
const params = new URL(self.location.href).searchParams;
if (params.get('apiKey') && params.get('messagingSenderId') && params.get('appId')) {
  firebase.initializeApp({
    apiKey: params.get('apiKey'),
    projectId: params.get('projectId'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
  });
  // Les messages avec bloc `notification` sont affichés par le SDK ; ce gestionnaire couvre les messages « données seules »
  firebase.messaging().onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const d = payload.data || {};
    self.registration.showNotification(d.title || 'CampusSave', { body: d.body || '', icon: '/favicon.png', badge: '/favicon-32x32.png', data: d });
  });
}

// Toucher sur la notification : ouvre (ou ramène au premier plan) la page indiquée par le serveur dans `data.route`
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const fcm = data.FCM_MSG && data.FCM_MSG.data ? data.FCM_MSG.data : {};
  const route = data.route || fcm.route || '/';
  const target = new URL(route, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client && 'navigate' in client) {
          return client.navigate(target).then((c) => (c || client).focus());
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
      return undefined;
    })
  );
});
