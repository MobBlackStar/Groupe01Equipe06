// 💡 Concept & Analogie : Comme une barrière de péage qui ne s'ouvre que si le badge est actif, ce composant redirige les utilisateurs non connectés vers la page de connexion.
// 🔄 Comparaison React / Flutter : En React, on utilise une redirection `Navigate` ; en Flutter, la redirection se configure dans `redirect` de `GoRouter`.
// 🎯 À retenir pour la soutenance : "Ce composant de route protégée assure qu'aucun écran privé n'est accessible sans session authentifiée active."
// Module : Structure & Routage

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EFE6] text-[#E51C23] font-bold text-sm">
        Chargement de la session CampusSave...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
