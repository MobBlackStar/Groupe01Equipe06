// 💡 Concept & Analogie : Comme le cockpit personnel d'un écocitoyen étudiant, ce tableau de bord agrège l'ensemble de ses victoires quotidiennes : dinars épargnés et kilos de CO₂ évités.
// 🔄 Comparaison React / Flutter : En React, `StudentDashboard` exploite `recharts` avec des graphiques vectoriels interactifs ; en Flutter, `StudentDashboardScreen` utilise les widgets `fl_chart`.
// 🎯 À retenir pour la soutenance : "Ce dashboard concrétise l'impact individuel de l'étudiant en combinant pouvoir d'achat retrouvé et contribution écologique mesurable."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Coins,
  Leaf,
  Award,
  TrendingUp,
  MapPin,
  ExternalLink,
  Star,
} from 'lucide-react';
import { KpiCard, LineChartCard } from '../../components/charts/index.js';
import RatingDialog from '../orders/RatingDialog.jsx';
import { Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { getLoyaltyTier } from '@shared/loyalty.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Données de démonstration réalistes pour la soutenance ESSECT
const DEMO_STUDENT_DASHBOARD = {
  stats: {
    ordersCompleted: 14,
    totalSavedMillimes: 46500, // 46,500 DT
    foodSavedGrams: 5800, // 5.8 kg
    co2SavedGrams: 14500, // 14.5 kg CO2
    ecoPoints: 280,
  },
  savingsHistory: [
    { label: 'Sem 1', value: 7500, co2: 2.2 },
    { label: 'Sem 2', value: 14000, co2: 4.1 },
    { label: 'Sem 3', value: 26000, co2: 7.8 },
    { label: 'Sem 4', value: 36000, co2: 11.2 },
    { label: 'Sem 5', value: 46500, co2: 14.5 },
  ],
  recentOrders: [
    {
      id: 'ord-st-01',
      orderCode: 'CS-8K4M9',
      offerTitle: 'Baguette Farcie Escalope Panée',
      merchantName: 'Baguette & Baguette Montfleury',
      quantity: 2,
      priceMillimes: 7600,
      savedMillimes: 8000,
      status: 'COMPLETED',
      rating: 5,
      date: 'Aujourd’hui, 13:15',
    },
    {
      id: 'ord-st-02',
      orderCode: 'CS-3T7X1',
      offerTitle: 'Panier Surprise Viennoiseries',
      merchantName: "Cafétéria L'Étoile du Savoir",
      quantity: 1,
      priceMillimes: 2500,
      savedMillimes: 3500,
      status: 'COMPLETED',
      rating: null,
      date: 'Hier, 10:45',
    },
    {
      id: 'ord-st-03',
      orderCode: 'CS-9M2K4',
      offerTitle: 'Ojja Royale Merguez & Œuf',
      merchantName: 'Restaurant Le Dôme Montfleury',
      quantity: 1,
      priceMillimes: 4500,
      savedMillimes: 4000,
      status: 'COMPLETED',
      rating: 4,
      date: '18 Nov 2026',
    },
    {
      id: 'ord-st-04',
      orderCode: 'CS-1Z9P8',
      offerTitle: 'Menu Chapati Mahdia Spécial Étudiant',
      merchantName: 'Fast Food Le Phare',
      quantity: 1,
      priceMillimes: 2800,
      savedMillimes: 2200,
      status: 'COMPLETED',
      rating: 5,
      date: '17 Nov 2026',
    },
    {
      id: 'ord-st-05',
      orderCode: 'CS-5V2W0',
      offerTitle: 'Salade César Méditerranéenne',
      merchantName: 'Le Dôme Montfleury',
      quantity: 1,
      priceMillimes: 4000,
      savedMillimes: 3500,
      status: 'COMPLETED',
      rating: null,
      date: '15 Nov 2026',
    },
  ],
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(DEMO_STUDENT_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [metricMode, setMetricMode] = useState('money'); // 'money' ou 'co2'
  const [ratingOrder, setRatingOrder] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.DASHBOARD_STUDENT);
        if (isMounted && res.data) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            stats: { ...prev.stats, ...(res.data.stats || {}) },
          }));
        }
      } catch (err) {
        console.warn('API Dashboard étudiant hors-ligne, données démo actives :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRatingSuccess = ({ orderId, rating }) => {
    setData((prev) => ({
      ...prev,
      recentOrders: prev.recentOrders.map((o) =>
        o.id === orderId ? { ...o, rating } : o
      ),
    }));
  };

  const stats = data.stats || DEMO_STUDENT_DASHBOARD.stats;
  const loyaltyTier = getLoyaltyTier(stats.ecoPoints);

  const chartSeries = (data.savingsHistory || DEMO_STUDENT_DASHBOARD.savingsHistory).map((item) => ({
    label: item.label,
    value: metricMode === 'money' ? Math.round(item.value / 1000) : item.co2,
  }));

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête avec profil & filière */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span>Campus ESSECT • Filière {user?.filiere || '3A E-Business'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tableau de Bord Étudiant 🌱
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Bienvenue, <strong className="text-white">{user?.displayName || 'Ritej Bejaoui'}</strong> ! Suivez vos repas sauvés, vos dinars épargnés et votre score éco-citoyen.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/app/loyalty"
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-xs font-bold text-slate-200 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-all flex items-center gap-2"
            >
              <span>🎟️ Carte Fidélité</span>
              <span className="px-2 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-black">
                {stats.ecoPoints} pts
              </span>
            </Link>

            <Link
              to="/app/radar"
              className="px-4 py-2.5 rounded-xl bg-[#161920] border border-white/10 text-xs font-bold text-slate-200 hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-all flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Radar 3D</span>
            </Link>

            <Link
              to="/app/explore"
              className="px-4 py-2.5 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs hover:bg-[#b8e600] transition-colors shadow-lg shadow-[#CCFF00]/10"
            >
              + Sauver un repas
            </Link>
          </div>
        </div>

        {/* Grille des 5 Tuiles KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Repas Sauvés"
            value={stats.ordersCompleted}
            subtitle="Invendus rachetés à Montfleury"
            icon={<ShoppingBag className="w-5 h-5" />}
            accent="lime"
            badge="+3 cette sem."
            positive={true}
          />
          <KpiCard
            title="Dinars Économisés"
            value={formatTND(stats.totalSavedMillimes)}
            subtitle="Gain net sur vos repas"
            icon={<Coins className="w-5 h-5" />}
            accent="amber"
            badge="Budget étudiant"
            positive={true}
          />
          <KpiCard
            title="Nourriture Sauvée"
            value={`${(stats.foodSavedGrams / 1000).toFixed(1)} kg`}
            subtitle="Évitée de la poubelle"
            icon={<Leaf className="w-5 h-5" />}
            accent="cyan"
            badge="Gaspillage 0"
            positive={true}
          />
          <KpiCard
            title="CO₂e Évité"
            value={`${(stats.co2SavedGrams / 1000).toFixed(1)} kg`}
            subtitle="Ratio officiel FAO (2.5x)"
            icon={<TrendingUp className="w-5 h-5" />}
            accent="purple"
            badge="Climat"
            positive={true}
          />
          <KpiCard
            title="Grade Éco"
            value={loyaltyTier}
            subtitle={`${stats.ecoPoints} EcoPoints cumulés`}
            icon={<Award className="w-5 h-5" />}
            accent="lime"
            badge="Fidélité"
            positive={true}
          />
        </div>

        {/* Section Graphique d'Évolution Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LineChartCard
              title={
                metricMode === 'money'
                  ? 'Évolution Cumulative des Économies (en TND)'
                  : 'Évolution du CO₂ Évité (en kg)'
              }
              subtitle="Progression continue de vos sauvetages semaine après semaine"
              data={chartSeries}
              xKey="label"
              yKey="value"
              name={metricMode === 'money' ? 'Économies (DT)' : 'CO₂ évité (kg)'}
              strokeColor={metricMode === 'money' ? '#CCFF00' : '#00E5FF'}
              gradientId="studentChartGradient"
              yFormatter={(val) => (metricMode === 'money' ? `${val} DT` : `${val} kg`)}
              tooltipFormatter={(val) => (metricMode === 'money' ? `${val} DT` : `${val} kg de CO₂`)}
              headerAction={
                <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setMetricMode('money')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      metricMode === 'money'
                        ? 'bg-[#CCFF00] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dinars (TND)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('co2')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      metricMode === 'co2'
                        ? 'bg-[#00E5FF] text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CO₂ (kg)
                  </button>
                </div>
              }
            />
          </div>

          {/* Raccourci Défi Écologique */}
          <div className="p-6 rounded-2xl bg-[#161920] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Impact Concret
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  Actif
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Équivalences Écologiques Réelles
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Vos <strong>14 repas sauvés</strong> ont évité autant de pollution que si vous aviez :
              </p>

              <div className="mt-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-sm font-black text-white">
                      {Math.round(stats.co2SavedGrams / 10)} charges
                    </p>
                    <p className="text-[11px] text-slate-400">de smartphones complètes (EPA)</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <p className="text-sm font-black text-[#CCFF00]">
                      {(stats.co2SavedGrams / 244).toFixed(1)} km
                    </p>
                    <p className="text-[11px] text-slate-400">de trajet en voiture thermique évités</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/impact"
              className="mt-6 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Voir le classement inter-filières ESSECT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Table des 5 dernières commandes complétées avec bouton "⭐ Noter" */}
        <div className="p-6 rounded-2xl bg-[#161920] border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white">Derniers Repas Récupérés</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Notez vos commandes passées pour aider la communauté étudiante de l'ESSECT.
              </p>
            </div>
            <Link
              to="/app/orders"
              className="text-xs text-[#CCFF00] hover:underline font-bold"
            >
              Voir tout l'historique →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Repas Sauvé</th>
                  <th className="py-3 px-3">Commerce</th>
                  <th className="py-3 px-3 text-right">Payé</th>
                  <th className="py-3 px-3 text-right">Économie</th>
                  <th className="py-3 px-3 text-center">Évaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#CCFF00]">
                      {order.orderCode}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {order.offerTitle}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {order.merchantName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {formatTND(order.priceMillimes)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      +{formatTND(order.savedMillimes)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {order.rating ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-bold">
                          <span>⭐</span>
                          <span>{order.rating}/5</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRatingOrder(order)}
                          className="px-3 py-1 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 font-bold transition-colors"
                        >
                          ⭐ Noter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de notation */}
        <RatingDialog
          isOpen={Boolean(ratingOrder)}
          onClose={() => setRatingOrder(null)}
          order={ratingOrder}
          onSuccess={handleRatingSuccess}
        />
      </div>
    </div>
  );
}
