// 💡 Concept & Analogie : Comme un veilleur de nuit qui reste éveillé même lorsque le magasin est fermé, ce Service Worker écoute les notifications push en arrière-plan lorsque l'application Web est fermée.
// 🔄 Comparaison React / Flutter : En React, la réception d'alertes en tâche de fond nécessite ce script dédié ; en Flutter, le service natif Android gère les intents via le SDK `firebase_messaging`.
// 🎯 À retenir pour la soutenance : "Ce Service Worker permet à l'application Web de recevoir les alertes de commandes payées et de tickets prêts même lorsque l'onglet est inactif."
// Module : Infrastructure & Notifications

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Configuration Firebase Service Worker (sera initialisée avec les credentials publics)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.notification?.title || 'CampusSave';
  const options = {
    body: data.notification?.body || 'Nouvelle notification CampusSave',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const type = event.notification.data?.type;
  let targetUrl = '/';

  if (type === 'ORDER_PAID') {
    targetUrl = '/merchant/orders';
  } else if (type === 'TICKET_READY' || type === 'PICKUP_REMINDER') {
    targetUrl = '/app/orders';
  } else if (type === 'ORDER_COMPLETED' || type === 'REWARD_UNLOCKED') {
    targetUrl = '/app/loyalty';
  } else if (type === 'NEW_OFFER') {
    targetUrl = '/app/explore';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
