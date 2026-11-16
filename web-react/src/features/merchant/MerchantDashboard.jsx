// 💡 Concept & Analogie : Comme le tableau de bord financier et logistique du gérant d'une grande enseigne, il mesure la rentabilité du déstockage des invendus et la fidélité étudiante.
// 🔄 Comparaison React / Flutter : En React, `MerchantDashboard` gère le filtre temporel 7d/30d avec `useState` et des barres colorées Recharts ; en Flutter, `MerchantDashboardScreen` utilise `fl_chart` et un `SegmentedButton`.
// 🎯 À retenir pour la soutenance : "Ce tableau de bord prouve au commerçant que lutter contre le gaspillage n'est pas une perte mais une nouvelle source de revenus réguliers et de visibilité auprès des étudiants."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  PackageCheck,
  AlertTriangle,
  Star,
  PlusCircle,
  QrCode,
  Store,
} from 'lucide-react';
import { KpiCard, BarChartCard } from '../../components/charts/index.js';
import { Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Données de démonstration 7 jours
const DEMO_MERCHANT_7D = {
  kpis: {
    revenueMillimes: 184500, // 184,500 DT
    ordersPaid: 48,
    ordersCompleted: 46,
    mealsRescued: 52,
    noShowsPercent: 4.1,
    ratingAvg: 4.8,
    reviewsCount: 38,
  },
  dailySeries: [
    { label: 'Lun', value: 24000, orders: 6, color: '#CCFF00' },
    { label: 'Mar', value: 31500, orders: 8, color: '#CCFF00' },
    { label: 'Mer', value: 28000, orders: 7, color: '#CCFF00' },
    { label: 'Jeu', value: 36000, orders: 9, color: '#CCFF00' },
    { label: 'Ven', value: 42000, orders: 11, color: '#FF5500' },
    { label: 'Sam', value: 15000, orders: 4, color: '#CCFF00' },
    { label: 'Dim', value: 8000, orders: 2, color: '#CCFF00' },
  ],
  topOffers: [
    {
      id: 'top-01',
      title: 'Baguette Farcie Escalope Panée & Double Fromage',
      rescuedCount: 24,
      revenueMillimes: 91200,
      decayType: 'Smart Decay',
    },
    {
      id: 'top-02',
      title: 'Panier Surprise Viennoiseries Pur Beurre',
      rescuedCount: 16,
      revenueMillimes: 40000,
      decayType: 'Prix Fixe',
    },
    {
      id: 'top-03',
      title: 'Makloub Poulet Mariné Frites & Salade',
      rescuedCount: 12,
      revenueMillimes: 53300,
      decayType: 'Smart Decay',
    },
  ],
};

// Données de démonstration 30 jours
const DEMO_MERCHANT_30D = {
  kpis: {
    revenueMillimes: 742000, // 742,000 DT
    ordersPaid: 194,
    ordersCompleted: 188,
    mealsRescued: 215,
    noShowsPercent: 3.1,
    ratingAvg: 4.85,
    reviewsCount: 142,
  },
  dailySeries: [
    { label: 'Sem 1', value: 165000, orders: 42, color: '#CCFF00' },
    { label: 'Sem 2', value: 182000, orders: 47, color: '#CCFF00' },
    { label: 'Sem 3', value: 198000, orders: 51, color: '#FF5500' },
    { label: 'Sem 4', value: 197000, orders: 54, color: '#CCFF00' },
  ],
  topOffers: [
    {
      id: 'top-01',
      title: 'Baguette Farcie Escalope Panée & Double Fromage',
      rescuedCount: 96,
      revenueMillimes: 364800,
      decayType: 'Smart Decay',
    },
    {
      id: 'top-02',
      title: 'Panier Surprise Viennoiseries Pur Beurre',
      rescuedCount: 68,
      revenueMillimes: 170000,
      decayType: 'Prix Fixe',
    },
    {
      id: 'top-03',
      title: 'Makloub Poulet Mariné Frites & Salade',
      rescuedCount: 51,
      revenueMillimes: 207200,
      decayType: 'Smart Decay',
    },
  ],
};

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('7d'); // '7d' ou '30d'
  const [metric, setMetric] = useState('revenue'); // 'revenue' ou 'orders'
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(DEMO_MERCHANT_7D);

  useEffect(() => {
    let isMounted = true;
    async function fetchMerchantDashboard() {
      setLoading(true);
      try {
        const res = await apiClient.get(`${ENDPOINTS.DASHBOARD_MERCHANT}?range=${range}`);
        if (isMounted && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.warn('API Dashboard commerçant indisponible, données démo actives :', err.message);
        if (isMounted) {
          setDashboardData(range === '7d' ? DEMO_MERCHANT_7D : DEMO_MERCHANT_30D);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMerchantDashboard();
    return () => {
      isMounted = false;
    };
  }, [range]);

  const kpis = dashboardData.kpis || {
    revenueMillimes: dashboardData.stats?.revenueMillimes || 0,
    ordersPaid: dashboardData.stats?.ordersPaid || 0,
    ordersCompleted: dashboardData.stats?.ordersCompleted || 0,
    mealsRescued: dashboardData.stats?.mealsRescued || 0,
    noShowsPercent: dashboardData.noShowRate || 0,
    ratingAvg: dashboardData.rating?.avg || 4.8,
    reviewsCount: dashboardData.rating?.count || 42,
  };

  const chartData = (dashboardData.dailySeries || DEMO_MERCHANT_7D.dailySeries).map((item) => ({
    label: item.label || item.date?.slice(5) || 'Jour',
    value: metric === 'revenue'
      ? Math.round((item.value ?? item.revenueMillimes ?? 0) / 1000)
      : (item.orders ?? item.ordersCompleted ?? 0),
    color: item.color || '#CCFF00',
  }));

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête commerçant & Raccourcis d'action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse" />
              <span>Espace Commerçant Partenaire • Montfleury</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Performances & Ventes Anti-Gaspi 📊
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Supervisez vos gains financiers, vos créneaux de sauvetage et l'avis des étudiants de l'ESSECT.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Bascule de période 7d / 30d */}
            <div className="flex rounded-xl bg-[#161920] p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setRange('7d')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  range === '7d'
                    ? 'bg-[#CCFF00] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 derniers jours
              </button>
              <button
                type="button"
                onClick={() => setRange('30d')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  range === '30d'
                    ? 'bg-[#CCFF00] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 derniers jours
              </button>
            </div>

            <Link
              to="/merchant/scan"
              className="px-4 py-2 rounded-xl bg-[#161920] border border-white/10 text-xs font-bold text-slate-200 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#CCFF00]" />
              <span>Scanner QR</span>
            </Link>

            <Link
              to="/merchant/offers/new"
              className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs hover:bg-[#b8e600] transition-colors flex items-center gap-1.5 shadow-lg shadow-[#CCFF00]/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier une offre IA</span>
            </Link>
          </div>
        </div>

        {/* 5 Tuiles KPI Commerçant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Revenu Anti-Gaspi"
            value={formatTND(kpis?.revenueMillimes ?? 0)}
            subtitle="Chiffre d'affaires récupéré"
            icon={<DollarSign className="w-5 h-5" />}
            accent="lime"
            badge={range === '7d' ? '+18% vs sem. passée' : '+24% ce mois'}
            positive={true}
          />
          <KpiCard
            title="Repas Sauvés"
            value={kpis.mealsRescued}
            subtitle="Articles épargnés de la poubelle"
            icon={<TrendingUp className="w-5 h-5" />}
            accent="amber"
            badge="Anti-gaspi"
            positive={true}
          />
          <KpiCard
            title="Taux de Retrait"
            value={`${Math.round((kpis.ordersCompleted / (kpis.ordersPaid || 1)) * 100)}%`}
            subtitle={`${kpis.ordersCompleted} retirées sur ${kpis.ordersPaid} payées`}
            icon={<PackageCheck className="w-5 h-5" />}
            accent="cyan"
            badge="Assiduité"
            positive={true}
          />
          <KpiCard
            title="Non-Présentations"
            value={`${kpis.noShowsPercent}%`}
            subtitle="Commandes non retirées"
            icon={<AlertTriangle className="w-5 h-5" />}
            accent="slate"
            badge="Très faible"
            positive={true}
          />
          <KpiCard
            title="Note des Étudiants"
            value={`${kpis.ratingAvg} / 5`}
            subtitle={`Basée sur ${kpis.reviewsCount} avis`}
            icon={<Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
            accent="amber"
            badge="⭐ Excellent"
            positive={true}
          />
        </div>

        {/* Graphique des Ventes Journalières Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BarChartCard
              title={
                metric === 'revenue'
                  ? `Recettes Journalières Anti-Gaspi (${range.toUpperCase()})`
                  : `Nombre de Commandes Journalières (${range.toUpperCase()})`
              }
              subtitle="Distribution des gains récupérés sur chaque journée"
              data={chartData}
              xKey="label"
              yKey="value"
              name={metric === 'revenue' ? 'Revenu (DT)' : 'Commandes'}
              barColor="#CCFF00"
              yFormatter={(val) => (metric === 'revenue' ? `${val} DT` : val)}
              tooltipFormatter={(val) => (metric === 'revenue' ? `${val} DT` : `${val} commandes`)}
              headerAction={
                <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setMetric('revenue')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      metric === 'revenue'
                        ? 'bg-[#CCFF00] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dinars (TND)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetric('orders')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      metric === 'orders'
                        ? 'bg-[#FF5500] text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Commandes
                  </button>
                </div>
              }
            />
          </div>

          {/* Top 3 des meilleures offres */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Palmarès
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold">
                  Top Ventes
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Offres les Plus Sauvées
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Articles les plus plébiscités par les étudiants voisins.
              </p>

              <div className="mt-5 space-y-3">
                {(dashboardData.topOffers || DEMO_MERCHANT_7D.topOffers).map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-[#CCFF00]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.rescuedCount} repas sauvés • <span className="text-[#FF5500]">{item.decayType}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400 whitespace-nowrap">
                      {formatTND(item?.revenueMillimes ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/merchant/offers"
              className="mt-6 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-xs font-bold text-slate-200 transition-colors"
            >
              Gérer mon catalogue complet →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
