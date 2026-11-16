// 💡 Concept & Analogie : Comme un agent de sécurité à l'entrée d'une zone VIP qui contrôle que le niveau du pass correspond à la zone demandée, ce composant restreint l'accès aux seuls rôles autorisés.
// 🔄 Comparaison React / Flutter : Même filtrage par Custom Claim appliqué dans les routes React et Flutter.
// 🎯 À retenir pour la soutenance : "Ce composant garantit l'étanchéité des espaces Étudiant, Commerçant et Administrateur côté client."
// Module : Structure & Routage

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function RoleRoute({ allowedRoles = [] }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-campus-dark text-campus-lime">
        Vérification des autorisations...
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
