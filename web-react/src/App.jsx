// 💡 Concept & Analogie : Comme le châssis d'une voiture sur lequel se fixent le moteur, les sièges et la carrosserie, `App.jsx` enveloppe l'application des contextes globaux (AuthContext) et du routeur principal.
// 🔄 Comparaison React / Flutter : Équivalent du widget racine `MaterialApp.router` en Flutter enveloppé par les `ChangeNotifierProvider`.
// 🎯 À retenir pour la soutenance : "Ce composant racine fournit le contexte d'authentification et injecte le routeur avec protection par rôles."
// Module : Structure & Routage

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppRouter } from './routes/AppRouter.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
