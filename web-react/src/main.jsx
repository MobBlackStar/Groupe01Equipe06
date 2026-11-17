// 💡 Concept & Analogie : Comme la première étincelle qui allume le moteur du véhicule, `main.jsx` monte le composant racine React dans le DOM du navigateur.
// 🔄 Comparaison React / Flutter : Équivalent direct de la fonction `void main()` dans `lib/main.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée d'amorçage de l'application Web React."
// Module : Structure & Routage

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Désenregistrement défensif des anciens Service Workers pour éviter les caches obsolètes
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
