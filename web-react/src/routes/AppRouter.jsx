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
import MerchantScanPage from '../features/merchant/MerchantScanPage.jsx';
import AdminMerchantsPage from '../features/admin/AdminMerchantsPage.jsx';
import AdminUsersPage from '../features/admin/AdminUsersPage.jsx';
import BrowsePage from '../features/explore/BrowsePage.jsx';
import OfferDetailPage from '../features/explore/OfferDetailPage.jsx';
import CheckoutPage from '../features/checkout/CheckoutPage.jsx';
import PaymentReturnPage from '../features/checkout/PaymentReturnPage.jsx';
import LivingTicketPage from '../features/ticket/LivingTicketPage.jsx';
import MyOrdersPage from '../features/orders/MyOrdersPage.jsx';
import MerchantOrdersPage from '../features/merchant/MerchantOrdersPage.jsx';
import LoyaltyCardPage from '../features/loyalty/LoyaltyCardPage.jsx';
import HoloRadarPage from '../features/radar/HoloRadarPage.jsx';
import StudentDashboard from '../features/dashboards/StudentDashboard.jsx';
import MerchantDashboard from '../features/merchant/MerchantDashboard.jsx';
import AdminDashboard from '../features/admin/AdminDashboard.jsx';
import ImpactDashboardPage from '../features/impact/ImpactDashboardPage.jsx';

export function AppRouter() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/payment/return" element={<PaymentReturnPage />} />
      <Route path="/impact" element={<ImpactDashboardPage />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        {/* Espace Étudiant (/app/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
          <Route path="/app" element={<BrowsePage />} />
          <Route path="/app/explore" element={<BrowsePage />} />
          <Route path="/app/dashboard" element={<StudentDashboard />} />
          <Route path="/app/offers/:id" element={<OfferDetailPage />} />
          <Route path="/app/checkout/:orderId" element={<CheckoutPage />} />
          <Route path="/app/orders" element={<MyOrdersPage />} />
          <Route path="/app/orders/:id/ticket" element={<LivingTicketPage />} />
          <Route path="/app/loyalty" element={<LoyaltyCardPage />} />
          <Route path="/app/radar" element={<HoloRadarPage />} />
        </Route>

        {/* Espace Commerçant (/merchant/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.MERCHANT]} />}>
          <Route path="/merchant" element={<Navigate to="/merchant/dashboard" replace />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/merchant/onboarding" element={<MerchantOnboardingPage />} />
          <Route path="/merchant/store" element={<MerchantStorePage />} />
          <Route path="/merchant/offers" element={<MerchantOffersPage />} />
          <Route path="/merchant/offers/new" element={<OfferFormPage />} />
          <Route path="/merchant/offers/:id/edit" element={<OfferFormPage />} />
          <Route path="/merchant/orders" element={<MerchantOrdersPage />} />
          <Route path="/merchant/scan" element={<MerchantScanPage />} />
        </Route>

        {/* Espace Administrateur (/admin/*) */}
        <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/merchants" element={<AdminMerchantsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
