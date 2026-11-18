// 💡 Concept & Analogie : Comme un agent de sécurité à l'entrée d'une zone VIP qui contrôle que le niveau du pass correspond à la zone demandée, ce composant restreint l'accès aux seuls rôles autorisés.
// 🔄 Comparaison React / Flutter : Même filtrage par Custom Claim appliqué dans les routes React et Flutter.
// 🎯 À retenir pour la soutenance : "Ce composant garantit l'étanchéité des espaces Étudiant, Commerçant et Administrateur côté client et redirige intelligemment vers l'espace d'accueil du rôle pour empêcher toute boucle de redirection."
// Module : Structure & Routage

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';

export function RoleRoute({ allowedRoles = [] }) {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EFE6] text-[#E51C23] font-bold text-sm">
        Vérification des autorisations CampusSave...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirection directe et étanche vers l'espace dédié du rôle pour interdire toute oscillation
    if (role === ROLES.MERCHANT) {
      return <Navigate to="/merchant/dashboard" replace />;
    }
    if (role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/app/explore" replace />;
  }

  return <Outlet />;
}
