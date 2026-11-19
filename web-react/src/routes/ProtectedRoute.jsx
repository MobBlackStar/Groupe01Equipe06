// 💡 Concept & Analogie : Comme une barrière de péage qui ne s'ouvre que si le badge est actif, ce composant redirige les utilisateurs non connectés vers la page de connexion.
// 🔄 Comparaison React / Flutter : En React, on utilise une redirection `Navigate` ; en Flutter, la redirection se configure dans `redirect` de `GoRouter`.
// 🎯 À retenir pour la soutenance : "Ce composant de route protégée assure qu'aucun écran privé n'est accessible sans session authentifiée active."
// Module : Structure & Routage

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isEmbedded, postToHost } from '../lib/embed.js';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF3E6] text-[#DA0711] font-bold text-base">
        Chargement de la session CampusSave...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isEmbedded()) {
      // Dans l'application mobile : on prévient l'hôte (il bascule sur la carte native) au lieu d'afficher une page de connexion web
      postToHost({ type: 'auth-required' });
      return (
        <div className="flex h-screen items-center justify-center bg-[#FAF3E6] text-[#111111] font-bold text-base px-6 text-center">
          Session expirée : reconnectez-vous dans l'application.
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
