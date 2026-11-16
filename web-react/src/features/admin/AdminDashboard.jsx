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
    { label: 'Étudiants ESSECT', value: 812, color: '#CCFF00' },
    { label: 'Commerçants', value: 28, color: '#FF5500' },
    { label: 'Administrateurs', value: 2, color: '#00E5FF' },
  ],
  ordersByStatus: [
    { label: 'Complétées (Retirées)', value: 1350, color: '#CCFF00' },
    { label: 'Payées / En cours', value: 42, color: '#00E5FF' },
    { label: 'Annulées / Expirées', value: 28, color: '#EF4444' },
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
                { label: 'Étudiants ESSECT', value: raw.usersByRole?.STUDENT || 0, color: '#CCFF00' },
                { label: 'Commerçants', value: raw.usersByRole?.MERCHANT || 0, color: '#FF5500' },
                { label: 'Administrateurs', value: raw.usersByRole?.ADMIN || 0, color: '#00E5FF' },
              ];

          const ordersByStatus = Array.isArray(raw.ordersByStatus)
            ? raw.ordersByStatus
            : [
                { label: 'Complétées (Retirées)', value: raw.ordersByStatus?.COMPLETED || 0, color: '#CCFF00' },
                { label: 'Payées / En cours', value: (raw.ordersByStatus?.PAID || 0) + (raw.ordersByStatus?.RESERVED || 0), color: '#00E5FF' },
                { label: 'Annulées / Expirées', value: (raw.ordersByStatus?.CANCELLED || 0) + (raw.ordersByStatus?.EXPIRED || 0), color: '#EF4444' },
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
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête Administrateur */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Console d'Administration & Modération ESSECT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Supervision Globale de la Plateforme 🛡️
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Surveillance du volume d'affaires, validation des commerces et impact environnemental consolidé.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/admin/merchants"
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-xs font-bold text-slate-200 hover:border-yellow-400/50 hover:text-yellow-300 transition-all flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-yellow-400" />
              <span>Modération Commerces</span>
              {kpis.storesPending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 text-[10px] font-black animate-pulse">
                  {kpis.storesPending} en attente
                </span>
              )}
            </Link>

            <Link
              to="/admin/users"
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-xs font-bold text-slate-200 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-[#CCFF00]" />
              <span>Utilisateurs ({kpis.totalUsers})</span>
            </Link>

            <Link
              to="/impact"
              className="px-4 py-2.5 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs hover:bg-[#b8e600] transition-colors flex items-center gap-1.5 shadow-lg shadow-[#CCFF00]/10"
            >
              <span>Vue Impact Public</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Alerte si des commerces attendent validation */}
        {kpis.storesPending > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {kpis.storesPending} commerce{kpis.storesPending > 1 ? 's' : ''} en attente d'approbation
                </h4>
                <p className="text-xs text-slate-300">
                  Des gérants de Montfleury ont soumis leur dossier pour rejoindre CampusSave.
                </p>
              </div>
            </div>
            <Link
              to="/admin/merchants"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-colors whitespace-nowrap"
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
            icon={<DollarSign className="w-5 h-5" />}
            accent="lime"
            badge="Économie campus"
            positive={true}
          />
          <KpiCard
            title="Utilisateurs Actifs"
            value={kpis.totalUsers}
            subtitle={`${kpis.studentsCount} étudiants • ${kpis.merchantsCount} commerces`}
            icon={<Users className="w-5 h-5" />}
            accent="cyan"
            badge="Communauté"
            positive={true}
          />
          <KpiCard
            title="Commerces Validés"
            value={`${kpis.storesApproved} / ${kpis.totalStores}`}
            subtitle={`${kpis.storesPending} en attente de revue`}
            icon={<Store className="w-5 h-5" />}
            accent="amber"
            badge="Montfleury"
            positive={true}
            onClick={() => window.location.assign('/admin/merchants')}
          />
          <KpiCard
            title="Commandes Totales"
            value={kpis.totalOrders}
            subtitle={`${kpis.ordersCompleted} repas retirés avec succès`}
            icon={<ShoppingBag className="w-5 h-5" />}
            accent="purple"
            badge="Sauvetages"
            positive={true}
          />
          <KpiCard
            title="Empreinte CO₂e Évitée"
            value={`${(kpis.co2SavedGrams / 1000000).toFixed(2)} t`}
            subtitle={`${Math.round(kpis.foodSavedGrams / 1000)} kg de nourriture sauvée`}
            icon={<Leaf className="w-5 h-5" />}
            accent="lime"
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
            barColor="#00E5FF"
            tooltipFormatter={(val) => `${val} membres`}
          />

          <BarChartCard
            title="État des Commandes Passées sur la Plateforme"
            subtitle="Suivi de la complétion et du respect des créneaux de retrait"
            data={data.ordersByStatus || DEMO_ADMIN_DASHBOARD.ordersByStatus}
            xKey="label"
            yKey="value"
            name="Commandes"
            barColor="#CCFF00"
            tooltipFormatter={(val) => `${val} commandes`}
          />
        </div>
      </div>
    </div>
  );
}
