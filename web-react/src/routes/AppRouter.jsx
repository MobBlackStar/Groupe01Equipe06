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
import MerchantOnboardingPage from '../features/merchant/MerchantOnboardingPage.jsx';
import MerchantStorePage from '../features/merchant/MerchantStorePage.jsx';
import MerchantOffersPage from '../features/merchant/MerchantOffersPage.jsx';
import OfferFormPage from '../features/merchant/OfferFormPage.jsx';
import AdminMerchantsPage from '../features/admin/AdminMerchantsPage.jsx';
import AdminUsersPage from '../features/admin/AdminUsersPage.jsx';
import BrowsePage from '../features/explore/BrowsePage.jsx';
import OfferDetailPage from '../features/explore/OfferDetailPage.jsx';

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
          <Route path="/app" element={<BrowsePage />} />
          <Route path="/app/explore" element={<BrowsePage />} />
          <Route path="/app/offers/:id" element={<OfferDetailPage />} />
          <Route
            path="/app/checkout/:orderId"
            element={
              <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
                <div className="p-8 max-w-md w-full bg-[#161920] border border-[#CCFF00]/30 rounded-3xl text-center space-y-4 text-white shadow-2xl">
                  <span className="text-5xl block animate-bounce">🔒</span>
                  <h2 className="text-xl font-black text-[#CCFF00]">Réservation Bloquée (10 min)</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Votre commande a été verrouillée au prix de la seconde exacte. Vous disposez de 10 minutes pour régler via Konnect.
                  </p>
                  <div className="pt-4 flex flex-col gap-2">
                    <a
                      href="/app/explore"
                      className="w-full py-3 rounded-2xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors"
                    >
                      Retour au catalogue
                    </a>
                  </div>
                </div>
              </div>
            }
          />
        </Route>

        {/* Espace Commerçant (/merchant/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.MERCHANT]} />}>
          <Route path="/merchant" element={<Navigate to="/merchant/offers" replace />} />
          <Route path="/merchant/onboarding" element={<MerchantOnboardingPage />} />
          <Route path="/merchant/store" element={<MerchantStorePage />} />
          <Route path="/merchant/offers" element={<MerchantOffersPage />} />
          <Route path="/merchant/offers/new" element={<OfferFormPage />} />
          <Route path="/merchant/offers/:id/edit" element={<OfferFormPage />} />
        </Route>

        {/* Espace Administrateur (/admin/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<Navigate to="/admin/merchants" replace />} />
          <Route path="/admin/merchants" element={<AdminMerchantsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
