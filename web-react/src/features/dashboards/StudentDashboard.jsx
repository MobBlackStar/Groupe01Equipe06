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
    async function fetchStudentDashboard() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.DASHBOARD_STUDENT);
        if (isMounted && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('API Dashboard étudiant indisponible, fallback démo actif :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStudentDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRatingSuccess = ({ orderId, rating }) => {
    setData((prev) => ({
      ...prev,
      recentOrders: (prev.recentOrders || []).map((o) =>
        o.id === orderId ? { ...o, rating } : o
      ),
    }));
  };

  const stats = data.stats || DEMO_STUDENT_DASHBOARD.stats;
  const loyaltyTier = getLoyaltyTier(stats.ecoPoints);

  const chartSeries = (data.savingsHistory || DEMO_STUDENT_DASHBOARD.savingsHistory).map((item) => ({
    label: item.label,
    value: metricMode === 'money' ? Math.round(Number(item.value || 0) / 1000) : Number(item.co2 || 0),
  }));

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête avec profil & filière */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#111111]/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD000] text-[#111111] text-xs font-anton uppercase tracking-wider mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#DA0711] animate-pulse" />
              <span>Campus ESSECT • Filière {user?.filiere || '3A E-Business'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-anton uppercase text-[#111111] tracking-wide">
              Tableau de Bord Étudiant 🌱
            </h1>
            <p className="text-sm text-[#666] font-medium mt-1">
              Bienvenue, <strong className="text-[#111111]">{user?.displayName || 'Ritej Bejaoui'}</strong> ! Suivez vos repas sauvés, vos dinars épargnés et votre score éco-citoyen.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/app/loyalty"
              className="btn-griddle-outline text-xs py-2 px-4 flex items-center gap-2"
            >
              <span>🎟️ Carte Fidélité</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFD000] text-[#111111] text-[10px] font-anton">
                {stats.ecoPoints} pts
              </span>
            </Link>

            <Link
              to="/app/radar"
              className="btn-griddle-outline text-xs py-2 px-4 flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-[#DA0711]" />
              <span>Radar 3D</span>
            </Link>

            <Link
              to="/app/explore"
              className="btn-griddle-primary text-xs py-2 px-5"
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
            icon={<ShoppingBag className="w-5 h-5 text-[#DA0711]" />}
            accent="red"
            badge="+3 cette sem."
            positive={true}
          />
          <KpiCard
            title="Dinars Économisés"
            value={formatTND(stats.totalSavedMillimes)}
            subtitle="Gain net sur vos repas"
            icon={<Coins className="w-5 h-5 text-[#854D0E]" />}
            accent="yellow"
            badge="Budget étudiant"
            positive={true}
          />
          <KpiCard
            title="Nourriture Sauvée"
            value={`${(stats.foodSavedGrams / 1000).toFixed(1)} kg`}
            subtitle="Évitée de la poubelle"
            icon={<Leaf className="w-5 h-5 text-[#15803D]" />}
            accent="green"
            badge="Gaspillage 0"
            positive={true}
          />
          <KpiCard
            title="CO₂e Évité"
            value={`${(stats.co2SavedGrams / 1000).toFixed(1)} kg`}
            subtitle="Ratio officiel FAO (2.5x)"
            icon={<TrendingUp className="w-5 h-5 text-[#C2410C]" />}
            accent="amber"
            badge="Climat"
            positive={true}
          />
          <KpiCard
            title="Grade Éco"
            value={loyaltyTier}
            subtitle={`${stats.ecoPoints} EcoPoints cumulés`}
            icon={<Award className="w-5 h-5 text-[#15803D]" />}
            accent="green"
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
              strokeColor="#DA0711"
              gradientId="studentChartGradient"
              yFormatter={(val) => (metricMode === 'money' ? `${val} DT` : `${val} kg`)}
              tooltipFormatter={(val) => (metricMode === 'money' ? `${val} DT` : `${val} kg de CO₂`)}
              headerAction={
                <div className="inline-flex rounded-full bg-white p-1 border border-[#111111]/8 text-xs font-anton uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setMetricMode('money')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      metricMode === 'money'
                        ? 'bg-[#DA0711] text-white shadow-sm'
                        : 'text-[#111111] hover:bg-black/5'
                    }`}
                  >
                    Dinars (TND)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('co2')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      metricMode === 'co2'
                        ? 'bg-[#FFD000] text-[#111111] shadow-sm'
                        : 'text-[#111111] hover:bg-black/5'
                    }`}
                  >
                    CO₂ (kg)
                  </button>
                </div>
              }
            />
          </div>

          {/* Raccourci Défi Écologique */}
          <div className="p-6 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] flex flex-col justify-between text-[#111111]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-anton uppercase tracking-wider text-[#666]">
                  Impact Concret
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Actif
                </span>
              </div>
              <h3 className="text-xl font-anton uppercase text-[#111111]">
                Équivalences Écologiques Réelles
              </h3>
              <p className="text-xs text-[#666] mt-1 font-medium leading-relaxed">
                Vos <strong>{stats.ordersCompleted} repas sauvés</strong> ont évité autant de pollution que si vous aviez :
              </p>

              <div className="mt-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#111111]/8 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="text-base font-anton text-[#111111]">
                      {Math.round(stats.co2SavedGrams / 10)} charges
                    </p>
                    <p className="text-[11px] text-[#666] font-medium">de smartphones complètes (EPA)</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#111111]/8 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <p className="text-base font-anton text-[#DA0711]">
                      {(stats.co2SavedGrams / 244).toFixed(1)} km
                    </p>
                    <p className="text-[11px] text-[#666] font-medium">de trajet en voiture thermique évités</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/impact"
              className="mt-6 w-full py-2.5 rounded-full bg-white hover:bg-[#FAF3E6] border border-[#111111]/10 text-center text-xs font-anton uppercase tracking-wider text-[#111111] shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <span>Voir le classement inter-filières ESSECT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Table des 5 dernières commandes complétées */}
        <div className="p-6 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] space-y-4 text-[#111111]">
          <div className="flex items-center justify-between pb-2 border-b border-[#111111]/10">
            <div>
              <h3 className="text-lg font-anton uppercase text-[#111111]">Derniers Repas Récupérés</h3>
              <p className="text-xs text-[#666] font-medium mt-0.5">
                Notez vos commandes passées pour aider la communauté étudiante de l'ESSECT.
              </p>
            </div>
            <Link
              to="/app/orders"
              className="text-xs text-[#DA0711] hover:underline font-anton uppercase tracking-wide"
            >
              Voir tout l'historique →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#111111]/10 text-[#666] font-anton uppercase tracking-wider">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Repas Sauvé</th>
                  <th className="py-3 px-3">Commerce</th>
                  <th className="py-3 px-3 text-right">Payé</th>
                  <th className="py-3 px-3 text-right">Économie</th>
                  <th className="py-3 px-3 text-center">Évaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111111]/8">
                {data.recentOrders.map((order) => {
                  const title = order.offerTitle || order.offerSnapshot?.title || order.title || 'Panier Anti-Gaspi';
                  const merchant = order.merchantName || order.merchantSnapshot?.name || 'Commerçant Montfleury';
                  const price = order.priceMillimes || order.pricing?.lockedUnitPriceMillimes || order.totalPriceMillimes || 3500;
                  const original = order.pricing?.originalUnitPriceMillimes || (price * 2);
                  const saved = order.savedMillimes || Math.max(1500, original - price);

                  return (
                    <tr key={order.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                        {order.orderCode}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#111111]">
                        {title}
                      </td>
                      <td className="py-3 px-3 text-[#555] font-medium">
                        {merchant}
                      </td>
                      <td className="py-3 px-3 text-right font-anton text-sm text-[#111111]">
                        {formatTND(price)}
                      </td>
                      <td className="py-3 px-3 text-right font-anton text-sm text-[#15803D]">
                        +{formatTND(saved)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {order.rating ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#111111]/10 text-[#111111] font-bold">
                            <span>⭐</span>
                            <span>{order.rating}/5</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRatingOrder(order)}
                            className="btn-griddle-yellow text-xs py-1 px-3 shadow-none"
                          >
                            ⭐ Noter
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
