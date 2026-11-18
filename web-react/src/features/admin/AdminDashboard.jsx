// 💡 Concept & Analogie : Comme la tour de contrôle d'un aéroport international régulant l'ensemble des pistes et des vols, cette console supervise l'écosystème global de CampusSave.
// 🔄 Comparaison React / Flutter : En React, `AdminDashboard` est une application web desktop haute résolution avec graphiques et alertes d'approbation ; les actions d'urgence sont réservées aux profils `ADMIN`.
// 🎯 À retenir pour la soutenance : "Ce panneau de contrôle permet aux autorités universitaires et aux administrateurs de piloter la modération des boutiques partenaires et de quantifier la réussite de l'initiative anti-gaspillage."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Store,
  ShoppingBag,
  Leaf,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { KpiCard, BarChartCard } from '../../components/charts/index.js';
import { Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';

// Données de démonstration réalistes pour la console d'administration
const DEMO_ADMIN_DASHBOARD = {
  kpis: {
    gmvMillimes: 12450000, // 12,450.000 DT de volume d'affaires total
    totalUsers: 842,
    studentsCount: 812,
    merchantsCount: 28,
    adminsCount: 2,
    totalStores: 28,
    storesPending: 3,
    storesApproved: 23,
    storesRejected: 2,
    totalOrders: 1420,
    ordersCompleted: 1350,
    ordersActive: 42,
    ordersCancelled: 28,
    foodSavedGrams: 568000, // 568 kg
    co2SavedGrams: 1420000, // 1.42 tonne
  },
  usersByRole: [
    { label: 'Étudiants ESSECT', value: 812, color: '#DA0711' },
    { label: 'Commerçants', value: 28, color: '#FFD000' },
    { label: 'Administrateurs', value: 2, color: '#111111' },
  ],
  ordersByStatus: [
    { label: 'Complétées (Retirées)', value: 1350, color: '#15803D' },
    { label: 'Payées / En cours', value: 42, color: '#FFD000' },
    { label: 'Annulées / Expirées', value: 28, color: '#DA0711' },
  ],
};

export default function AdminDashboard() {
  const [data, setData] = useState(DEMO_ADMIN_DASHBOARD);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchAdminDashboard() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.DASHBOARD_ADMIN);
        if (isMounted && res.data) {
          const raw = res.data;
          const usersByRole = Array.isArray(raw.usersByRole)
            ? raw.usersByRole
            : [
                { label: 'Étudiants ESSECT', value: raw.usersByRole?.STUDENT || 812, color: '#DA0711' },
                { label: 'Commerçants', value: raw.usersByRole?.MERCHANT || 28, color: '#FFD000' },
                { label: 'Administrateurs', value: raw.usersByRole?.ADMIN || 2, color: '#111111' },
              ];

          const ordersByStatus = Array.isArray(raw.ordersByStatus)
            ? raw.ordersByStatus
            : [
                { label: 'Complétées (Retirées)', value: raw.ordersByStatus?.COMPLETED || 1350, color: '#15803D' },
                { label: 'Payées / En cours', value: (raw.ordersByStatus?.PAID || 0) + (raw.ordersByStatus?.RESERVED || 0) || 42, color: '#FFD000' },
                { label: 'Annulées / Expirées', value: (raw.ordersByStatus?.CANCELLED || 0) + (raw.ordersByStatus?.EXPIRED || 0) || 28, color: '#DA0711' },
              ];

          const kpis = {
            gmvMillimes: raw.kpis?.gmvMillimes ?? raw.globalImpact?.moneySavedMillimes ?? 12450000,
            totalUsers: raw.usersByRole?.total ?? 842,
            studentsCount: raw.usersByRole?.STUDENT ?? 812,
            merchantsCount: raw.usersByRole?.MERCHANT ?? 28,
            adminsCount: raw.usersByRole?.ADMIN ?? 2,
            totalStores: raw.merchantsByStatus?.total ?? 6,
            storesPending: raw.merchantsByStatus?.PENDING ?? 1,
            storesApproved: raw.merchantsByStatus?.APPROVED ?? 5,
            storesRejected: raw.merchantsByStatus?.REJECTED ?? 0,
            totalOrders: raw.ordersByStatus?.total ?? 248,
            ordersCompleted: raw.ordersByStatus?.COMPLETED ?? 248,
            ordersActive: (raw.ordersByStatus?.RESERVED || 0) + (raw.ordersByStatus?.PAID || 0),
            ordersCancelled: (raw.ordersByStatus?.CANCELLED || 0) + (raw.ordersByStatus?.EXPIRED || 0),
            foodSavedGrams: raw.globalImpact?.foodSavedGrams ?? 114000,
            co2SavedGrams: raw.globalImpact?.co2SavedGrams ?? 285000,
          };

          setData({ kpis, usersByRole, ordersByStatus });
        }
      } catch (err) {
        console.warn('API Dashboard Admin hors-ligne, données démo actives :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAdminDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = data.kpis || DEMO_ADMIN_DASHBOARD.kpis;

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête Administrateur */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#111111]/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#111111] text-white text-xs font-anton uppercase tracking-wider mb-2 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFD000]" />
              <span>Console d'Administration &amp; Modération ESSECT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-anton uppercase tracking-wide text-[#111111]">
              Supervision Globale de la Plateforme 🛡️
            </h1>
            <p className="text-sm text-[#666] mt-1 font-medium">
              Surveillance du volume d'affaires, validation des commerces et impact environnemental consolidé.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/admin/merchants"
              className="btn-griddle-outline text-xs py-2 px-4 flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-[#DA0711]" />
              <span>Modération Commerces</span>
              {kpis.storesPending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FFD000] text-[#111111] text-[10px] font-anton animate-pulse">
                  {kpis.storesPending} en attente
                </span>
              )}
            </Link>

            <Link
              to="/admin/users"
              className="btn-griddle-outline text-xs py-2 px-4 flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-[#15803D]" />
              <span>Utilisateurs ({kpis.totalUsers})</span>
            </Link>

            <Link
              to="/impact"
              className="btn-griddle-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>Vue Impact Public</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Alerte si des commerces attendent validation */}
        {kpis.storesPending > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFD000]/15 border border-[#FFD000]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#111111] text-[#FFD000]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-anton uppercase text-base text-[#111111]">
                  {kpis.storesPending} commerce{kpis.storesPending > 1 ? 's' : ''} en attente d'approbation
                </h4>
                <p className="text-xs text-[#666] font-medium">
                  Des gérants de Montfleury ont soumis leur dossier pour rejoindre CampusSave.
                </p>
              </div>
            </div>
            <Link
              to="/admin/merchants"
              className="btn-griddle-primary text-xs py-2 px-5 whitespace-nowrap"
            >
              Examiner les dossiers →
            </Link>
          </div>
        )}

        {/* 5 Tuiles KPI Administrateur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Volume d'Affaires (GMV)"
            value={formatTND(kpis.gmvMillimes)}
            subtitle="Transactions traitées"
            icon={<DollarSign className="w-5 h-5 text-[#DA0711]" />}
            badge="Économie campus"
            positive={true}
          />
          <KpiCard
            title="Utilisateurs Actifs"
            value={kpis.totalUsers}
            subtitle={`${kpis.studentsCount} étudiants • ${kpis.merchantsCount} commerces`}
            icon={<Users className="w-5 h-5 text-[#15803D]" />}
            badge="Communauté"
            positive={true}
          />
          <KpiCard
            title="Commerces Validés"
            value={`${kpis.storesApproved} / ${kpis.totalStores}`}
            subtitle={`${kpis.storesPending} en attente de revue`}
            icon={<Store className="w-5 h-5 text-[#DA0711]" />}
            badge="Montfleury"
            positive={true}
            onClick={() => window.location.assign('/admin/merchants')}
          />
          <KpiCard
            title="Commandes Totales"
            value={kpis.totalOrders}
            subtitle={`${kpis.ordersCompleted} repas retirés avec succès`}
            icon={<ShoppingBag className="w-5 h-5 text-[#854D0E]" />}
            badge="Sauvetages"
            positive={true}
          />
          <KpiCard
            title="Empreinte CO₂e Évitée"
            value={`${(kpis.co2SavedGrams / 1000000).toFixed(2)} t`}
            subtitle={`${Math.round(kpis.foodSavedGrams / 1000)} kg de nourriture sauvée`}
            icon={<Leaf className="w-5 h-5 text-[#15803D]" />}
            badge="Impact vert"
            positive={true}
          />
        </div>

        {/* Graphiques Recharts : Répartition des utilisateurs & commandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartCard
            title="Répartition des Membres Inscrits par Rôle"
            subtitle="Volume des comptes étudiants, boutiques et administrateurs"
            data={data.usersByRole || DEMO_ADMIN_DASHBOARD.usersByRole}
            xKey="label"
            yKey="value"
            name="Utilisateurs"
            barColor="#DA0711"
            tooltipFormatter={(val) => `${val} membres`}
          />

          <BarChartCard
            title="État des Commandes Passées sur la Plateforme"
            subtitle="Suivi de la complétion et du respect des créneaux de retrait"
            data={data.ordersByStatus || DEMO_ADMIN_DASHBOARD.ordersByStatus}
            xKey="label"
            yKey="value"
            name="Commandes"
            barColor="#15803D"
            tooltipFormatter={(val) => `${val} commandes`}
          />
        </div>
      </div>
    </div>
  );
}
