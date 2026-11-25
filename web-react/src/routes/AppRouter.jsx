// 💡 Concept & Analogie : Comme le plan d'étage d'un centre commercial qui sépare l'espace client, les boutiques des commerçants et la direction administrative, ce routeur organise les espaces par rôle.
// 🔄 Comparaison React / Flutter : Définit l'arborescence des URLs web (React Router 6) pendant que GoRouter organise les piles d'écrans mobiles.
// 🎯 À retenir pour la soutenance : "Notre routeur segmente strictement l'application en 3 espaces cloisonnés : `/app` pour les étudiants, `/merchant` pour les commerçants et `/admin` pour l'administration, avec une redirection racine immunisée contre les boucles."
// Module : Structure & Routage / Intégration écrans : l'équipe UI

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { RoleRoute } from './RoleRoute.jsx';
import { ROLES } from '@shared/constants.js';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import { Spinner } from '../components/ui/index.js';
import { StudentLayout, MerchantLayout, AdminLayout } from '../components/layout/index.js';

// Découpage dynamique des routes lourdes (React.lazy) pour optimiser le bundle initial
const ProfilePage = lazy(() => import('../features/auth/ProfilePage.jsx'));
const MerchantOnboardingPage = lazy(() => import('../features/merchant/MerchantOnboardingPage.jsx'));
const MerchantStorePage = lazy(() => import('../features/merchant/MerchantStorePage.jsx'));
const MerchantOffersPage = lazy(() => import('../features/merchant/MerchantOffersPage.jsx'));
const OfferFormPage = lazy(() => import('../features/merchant/OfferFormPage.jsx'));
const MerchantScanPage = lazy(() => import('../features/merchant/MerchantScanPage.jsx'));
const AdminMerchantsPage = lazy(() => import('../features/admin/AdminMerchantsPage.jsx'));
const AdminUsersPage = lazy(() => import('../features/admin/AdminUsersPage.jsx'));
const BrowsePage = lazy(() => import('../features/explore/BrowsePage.jsx'));
const OfferDetailPage = lazy(() => import('../features/explore/OfferDetailPage.jsx'));
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage.jsx'));
const PaymentReturnPage = lazy(() => import('../features/checkout/PaymentReturnPage.jsx'));
const LivingTicketPage = lazy(() => import('../features/ticket/LivingTicketPage.jsx'));
const BagPage = lazy(() => import('../features/orders/BagPage.jsx'));
const MyOrdersPage = lazy(() => import('../features/orders/MyOrdersPage.jsx'));
const MerchantOrdersPage = lazy(() => import('../features/merchant/MerchantOrdersPage.jsx'));
const LoyaltyCardPage = lazy(() => import('../features/loyalty/LoyaltyCardPage.jsx'));
const HoloRadarPage = lazy(() => import('../features/radar/HoloRadarPage.jsx'));
const StudentDashboard = lazy(() => import('../features/dashboards/StudentDashboard.jsx'));
const MerchantDashboard = lazy(() => import('../features/merchant/MerchantDashboard.jsx'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard.jsx'));
const ImpactDashboardPage = lazy(() => import('../features/impact/ImpactDashboardPage.jsx'));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8">
      <Spinner size="lg" />
      <span className="text-sm font-semibold text-[#666666]">Chargement de la page...</span>
    </div>
  );
}

/**
 * Aiguillage intelligent de la racine `/` selon l'état d'authentification et le rôle actif
 */
function RootRedirect() {
  const { isAuthenticated, role, merchant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4EFE6] text-[#E51C23] font-bold text-sm">
        Chargement de CampusSave...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === ROLES.MERCHANT) {
    if (!merchant) {
      return <Navigate to="/merchant/onboarding" replace />;
    }
    return <Navigate to="/merchant/dashboard" replace />;
  }

  if (role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/app/explore" replace />;
}

/** Le profil existe pour les trois rôles : il s'affiche dans la mise en page de l'espace du rôle connecté. */
function ProfileRoute() {
  const { role } = useAuth();
  const Layout = role === ROLES.ADMIN ? AdminLayout : role === ROLES.MERCHANT ? MerchantLayout : StudentLayout;
  return (
    <Layout>
      <ProfilePage />
    </Layout>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Route Racine Intelligente */}
        <Route path="/" element={<RootRedirect />} />

        {/* Routes Publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfileRoute />} />
        </Route>
        <Route path="/payment/return" element={<PaymentReturnPage />} />
        <Route path="/impact" element={<StudentLayout><ImpactDashboardPage /></StudentLayout>} />

        {/* Routes Protégées par Authentification */}
        <Route element={<ProtectedRoute />}>
          {/* Espace Étudiant (/app/*) */}
          <Route element={<RoleRoute allowedRoles={[ROLES.STUDENT]} />}>
            <Route element={<StudentLayout><Outlet /></StudentLayout>}>
              <Route path="/app" element={<Navigate to="/app/explore" replace />} />
              <Route path="/app/explore" element={<BrowsePage />} />
              <Route path="/app/dashboard" element={<StudentDashboard />} />
              <Route path="/app/offers/:id" element={<OfferDetailPage />} />
              <Route path="/app/checkout" element={<CheckoutPage />} />
              <Route path="/app/checkout/:orderId" element={<CheckoutPage />} />
              <Route path="/app/bag" element={<BagPage />} />
              <Route path="/app/orders" element={<MyOrdersPage />} />
              <Route path="/app/orders/:id/ticket" element={<LivingTicketPage />} />
              <Route path="/app/loyalty" element={<LoyaltyCardPage />} />
              <Route path="/app/radar" element={<HoloRadarPage />} />
            </Route>
          </Route>

          {/* Espace Commerçant (/merchant/*) */}
          <Route element={<RoleRoute allowedRoles={[ROLES.MERCHANT]} />}>
            <Route element={<MerchantLayout><Outlet /></MerchantLayout>}>
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
          </Route>

          {/* Espace Administrateur (/admin/*) */}
          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<AdminLayout><Outlet /></AdminLayout>}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/merchants" element={<AdminMerchantsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Route de Secours 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
