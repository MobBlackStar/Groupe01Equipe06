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

// Garde d'affichage : un nombre fini, sinon null
function finiteOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Montant en millimes -> "4,500 DT", ou "—" si absent
function moneyOrDash(millimes) {
  const n = finiteOrNull(millimes);
  return n === null ? '—' : formatTND(n);
}

// Grammes -> "5.8 kg", ou "—" si absent
function kgOrDash(grams) {
  const n = finiteOrNull(grams);
  return n === null ? '—' : `${(n / 1000).toFixed(1).replace('.', ',')} kg`;
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
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

  // Les EcoPoints vivent dans profile.ecoPoints (l'API dashboard les expose sous loyalty.ecoPoints,
  // pas dans stats) : on lit la bonne source au lieu d'afficher "undefined EcoPoints".
  const ecoPoints =
    finiteOrNull(profile?.ecoPoints) ??
    finiteOrNull(data.loyalty?.ecoPoints) ??
    finiteOrNull(stats.ecoPoints) ??
    0;
  const loyaltyTier = getLoyaltyTier(ecoPoints);

  const studentName = user?.displayName || profile?.fullName || 'Ritej Bejaoui';
  const filiere = user?.filiere || profile?.filiere || '3A E-Business';

  const mealsSaved = finiteOrNull(stats.ordersCompleted);
  const co2Grams = finiteOrNull(stats.co2SavedGrams);

  const chartSeries = (data.savingsHistory || DEMO_STUDENT_DASHBOARD.savingsHistory).map((item) => ({
    label: item.label,
    value: metricMode === 'money' ? Math.round(Number(item.value || 0) / 1000) : Number(item.co2 || 0),
  }));

  const recentOrders = data.recentOrders || [];

  return (
    <div className="bg-[#FAF3E6] text-[#111111] min-h-screen">
      <div className="cs-container cs-page">
        {/* En-tête avec profil & filière */}
        <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-3xl">
            <p className="cs-eyebrow mb-3">Espace étudiant · Filière {filiere}</p>
            <h1 className="cs-display">Mon impact</h1>
            <p className="cs-lead mt-4">
              Bienvenue, <strong className="font-semibold">{studentName}</strong> ! Suivez vos repas sauvés,
              vos dinars épargnés et votre score éco-citoyen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app/loyalty" className="cs-btn cs-btn-cream">
              <span>Carte fidélité</span>
              <span className="cs-pill cs-pill-mustard">{ecoPoints} pts</span>
            </Link>
            <Link to="/app/radar" className="cs-btn cs-btn-cream">
              <MapPin className="w-5 h-5 text-[#DA0711]" aria-hidden="true" />
              <span>Radar 3D</span>
            </Link>
            <Link to="/app/explore" className="cs-btn cs-btn-red">
              + Sauver un repas
            </Link>
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-3 mb-6 text-[#5E5850] text-base" role="status">
            <Spinner size="sm" />
            <span>Mise à jour de vos chiffres…</span>
          </div>
        )}

        {/* Rangée de tuiles KPI */}
        <section className="mb-16 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6" aria-label="Indicateurs clés">
          <KpiCard
            title="Repas sauvés"
            value={mealsSaved}
            subtitle="Invendus rachetés à Montfleury"
            icon={<ShoppingBag className="w-5 h-5" />}
            accent="red"
            badge="+3 cette sem."
            positive={true}
          />
          <KpiCard
            title="Dinars économisés"
            value={moneyOrDash(stats.totalSavedMillimes)}
            subtitle="Gain net sur vos repas"
            icon={<Coins className="w-5 h-5" />}
            accent="yellow"
            badge="Budget étudiant"
            positive={true}
          />
          <KpiCard
            title="Nourriture sauvée"
            value={kgOrDash(stats.foodSavedGrams)}
            subtitle="Évitée de la poubelle"
            icon={<Leaf className="w-5 h-5" />}
            accent="green"
            badge="Gaspillage 0"
            positive={true}
          />
          <KpiCard
            title="CO₂e évité"
            value={kgOrDash(stats.co2SavedGrams)}
            subtitle="Ratio officiel FAO (2.5x)"
            icon={<TrendingUp className="w-5 h-5" />}
            accent="slate"
            badge="Climat"
            positive={true}
          />
        </section>

        {/* Graphique d'évolution + Grade éco */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <LineChartCard
              title={
                metricMode === 'money'
                  ? 'Économies cumulées (TND)'
                  : 'CO₂ évité cumulé (kg)'
              }
              subtitle="Progression de vos sauvetages semaine après semaine"
              data={chartSeries}
              xKey="label"
              yKey="value"
              name={metricMode === 'money' ? 'Économies' : 'CO₂ évité'}
              strokeColor={metricMode === 'money' ? '#DA0711' : '#111111'}
              gradientId="studentChartGradient"
              height={300}
              yFormatter={(val) => (metricMode === 'money' ? `${val} DT` : `${val} kg`)}
              tooltipFormatter={(val) =>
                metricMode === 'money' ? formatTND(Number(val) * 1000) : `${val} kg de CO₂`
              }
              headerAction={
                <div className="flex flex-wrap gap-2" role="group" aria-label="Unité du graphique">
                  <button
                    type="button"
                    onClick={() => setMetricMode('money')}
                    aria-pressed={metricMode === 'money'}
                    className="cs-chip"
                  >
                    Dinars
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('co2')}
                    aria-pressed={metricMode === 'co2'}
                    className="cs-chip"
                  >
                    CO₂
                  </button>
                </div>
              }
            />
          </div>

          {/* Grade éco : panneau encre */}
          <div className="cs-card-ink p-8 flex flex-col justify-between gap-8">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="cs-label !text-[#FAF3E6]/70">Grade éco</span>
                <span className="w-11 h-11 rounded-full bg-[#FFD000] text-[#111111] flex items-center justify-center" aria-hidden="true">
                  <Award className="w-5 h-5" />
                </span>
              </div>
              <p className="cs-figure text-[clamp(4rem,8vw,6.5rem)] text-[#FFD000] mt-4 break-words">{loyaltyTier}</p>
              <p className="text-lg mt-3 text-[#FAF3E6]">
                <span className="cs-figure text-4xl align-baseline mr-2">{ecoPoints}</span>
                EcoPoints cumulés
              </p>
            </div>
            <Link to="/app/loyalty" className="cs-btn cs-btn-mustard cs-btn-block">
              Ma carte fidélité →
            </Link>
          </div>
        </section>

        {/* Équivalences écologiques */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="cs-title">Équivalences réelles</h2>
              <p className="cs-body mt-3 max-w-2xl text-[#5E5850]">
                Vos <strong className="font-semibold text-[#111111]">{mealsSaved ?? '—'} repas sauvés</strong> ont
                évité autant de pollution que si vous aviez :
              </p>
            </div>
            <Link to="/impact" className="cs-btn cs-btn-cream cs-btn-sm self-start sm:self-auto">
              <span>Classement inter-filières</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="cs-card p-8 flex items-center gap-6">
              <span className="text-5xl shrink-0" aria-hidden="true">📱</span>
              <div className="min-w-0">
                <p className="cs-figure text-[clamp(3rem,5vw,4.5rem)] text-[#111111]">
                  {co2Grams === null ? '—' : Math.round(co2Grams / 10)}
                </p>
                <p className="text-lg text-[#5E5850] mt-1">charges complètes de smartphone (EPA)</p>
              </div>
            </div>
            <div className="cs-card p-8 flex items-center gap-6">
              <span className="text-5xl shrink-0" aria-hidden="true">🚗</span>
              <div className="min-w-0">
                <p className="cs-figure text-[clamp(3rem,5vw,4.5rem)] text-[#DA0711]">
                  {co2Grams === null ? '—' : `${(co2Grams / 244).toFixed(1).replace('.', ',')} km`}
                </p>
                <p className="text-lg text-[#5E5850] mt-1">de trajet en voiture thermique évités</p>
              </div>
            </div>
          </div>
        </section>

        {/* Table des dernières commandes */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="cs-title">Derniers repas récupérés</h2>
              <p className="cs-body mt-3 text-[#5E5850]">
                Notez vos commandes passées pour aider la communauté étudiante de l'ESSECT.
              </p>
            </div>
            <Link to="/app/orders" className="cs-btn cs-btn-cream cs-btn-sm self-start sm:self-auto">
              Tout l'historique →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="cs-card p-8 text-center">
              <p className="cs-h3">Aucune commande pour l'instant</p>
              <p className="cs-body text-[#5E5850] mt-2">Votre premier repas sauvé apparaîtra ici.</p>
            </div>
          ) : (
            <div className="cs-card p-2 overflow-x-auto">
              <table className="cs-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Repas sauvé</th>
                    <th>Commerce</th>
                    <th className="!text-right">Payé</th>
                    <th className="!text-right">Économie</th>
                    <th className="!text-center">Évaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const title = order.offerTitle || order.offerSnapshot?.title || order.title || 'Panier Anti-Gaspi';
                    const merchant = order.merchantName || order.merchantSnapshot?.name || 'Commerçant Montfleury';
                    const price =
                      finiteOrNull(order.priceMillimes) ??
                      finiteOrNull(order.pricing?.totalMillimes) ??
                      finiteOrNull(order.pricing?.lockedUnitPriceMillimes) ??
                      finiteOrNull(order.totalPriceMillimes);
                    const original = finiteOrNull(order.pricing?.originalUnitPriceMillimes);
                    const saved =
                      finiteOrNull(order.savedMillimes) ??
                      finiteOrNull(order.pricing?.savedMillimes) ??
                      finiteOrNull(order.pricing?.moneySavedMillimes) ??
                      (price !== null && original !== null ? Math.max(0, original - price) : null);

                    return (
                      <tr key={order.id}>
                        <td className="cs-mono font-bold whitespace-nowrap">{order.orderCode || '—'}</td>
                        <td className="font-semibold text-[17px] min-w-[200px]">
                          <span className="line-clamp-2">{title}</span>
                        </td>
                        <td className="text-[#5E5850] min-w-[160px]">
                          <span className="line-clamp-2">{merchant}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="cs-figure text-2xl">{moneyOrDash(price)}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="cs-figure text-2xl text-[#1F7A3A]">
                            {saved === null ? '—' : `+${formatTND(saved)}`}
                          </span>
                        </td>
                        <td className="text-center whitespace-nowrap">
                          {order.rating ? (
                            <span className="cs-pill cs-pill-mustard">⭐ {order.rating}/5</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRatingOrder(order)}
                              className="cs-btn cs-btn-mustard cs-btn-sm"
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
          )}
        </section>

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
