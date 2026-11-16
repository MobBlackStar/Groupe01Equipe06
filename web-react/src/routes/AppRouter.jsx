// 💡 Concept & Analogie : Comme le plan d'étage d'un centre commercial qui sépare l'espace client, les boutiques des commerçants et la direction administrative, ce routeur organise les espaces par rôle.
// 🔄 Comparaison React / Flutter : Définit l'arborescence des URLs web (React Router 6) pendant que GoRouter organise les piles d'écrans mobiles.
// 🎯 À retenir pour la soutenance : "Notre routeur segmente strictement l'application en 3 espaces cloisonnés : `/app` pour les étudiants, `/merchant` pour les commerçants et `/admin` pour l'administration."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { RoleRoute } from './RoleRoute.jsx';
import { ROLES } from '@shared/constants.js';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import ProfilePage from '../features/auth/ProfilePage.jsx';

export function AppRouter() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route
        path="/impact"
        element={
          <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-campus-lime">Tableau d'Impact CampusSave 🌱</h1>
            <p className="text-slate-400 mt-2">Indicateurs écologiques et classement des filières ESSECT.</p>
          </div>
        }
      />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        {/* Espace Étudiant (/app/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
          <Route
            path="/app/*"
            element={
              <div className="p-6">
                <h2 className="text-xl font-bold text-campus-lime">Espace Étudiant</h2>
                <p className="text-sm text-slate-400">Catalogue des offres, réservation et radar 3D.</p>
              </div>
            }
          />
        </Route>

        {/* Espace Commerçant (/merchant/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.MERCHANT]} />}>
          <Route
            path="/merchant/*"
            element={
              <div className="p-6">
                <h2 className="text-xl font-bold text-campus-lime">Espace Commerçant</h2>
                <p className="text-sm text-slate-400">Gestion de boutique, publication d'offres et scan des tickets.</p>
              </div>
            }
          />
        </Route>

        {/* Espace Administrateur (/admin/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route
            path="/admin/*"
            element={
              <div className="p-6">
                <h2 className="text-xl font-bold text-campus-lime">Espace Administration</h2>
                <p className="text-sm text-slate-400">Validation des commerces et supervision globale.</p>
              </div>
            }
          />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
