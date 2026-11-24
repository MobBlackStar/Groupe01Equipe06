// 💡 Concept & Analogie : Comme le tableau de bord financier et logistique du gérant d'une grande enseigne, il mesure la rentabilité du déstockage des invendus et la fidélité étudiante.
// 🔄 Comparaison React / Flutter : En React, `MerchantDashboard` gère le filtre temporel 7d/30d avec `useState` et des barres colorées Recharts ; en Flutter, `MerchantDashboardScreen` utilise `fl_chart` et un `SegmentedButton`.
// 🎯 À retenir pour la soutenance : "Ce tableau de bord prouve au commerçant que lutter contre le gaspillage n'est pas une perte mais une nouvelle source de revenus réguliers et de visibilité auprès des étudiants."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, QrCode, Clock, ArrowRight } from 'lucide-react';
import { BarChartCard } from '../../components/charts/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { formatTunisDate, formatTunisTimeWindow } from '../../lib/formatters.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMerchantOrders } from '../../hooks/useMerchantOrders.js';

// Affichage sûr : jamais de NaN à l'écran
function money(millimes) {
  const n = Number(millimes);
  return millimes != null && Number.isFinite(n) && n >= 0 ? formatTND(n) : '—';
}

function num(value, fallback = '—') {
  const n = Number(value);
  return value != null && Number.isFinite(n) ? n : fallback;
}

// Timestamps Firestore sérialisés ({ _seconds }) → millisecondes
function toDateInput(v) {
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const s = v._seconds ?? v.seconds;
    return Number.isFinite(s) ? s * 1000 : null;
  }
  return v ?? null;
}

// Libellé d'axe lisible : "2026-11-12" ou "11-12" → "12 nov." ; "Lun" / "Sem 1" inchangés
const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
function dayLabel(item) {
  const iso = typeof item.date === 'string' ? item.date.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  const short = !iso && typeof item.label === 'string' ? item.label.match(/^(\d{2})-(\d{2})$/) : null;
  let y; let m; let d;
  if (iso) [, y, m, d] = iso;
  else if (short) {
    [, m, d] = short;
    y = new Date().getFullYear();
  }
  if (m && d) {
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (!Number.isNaN(date.getTime())) return DAY_FMT.format(date);
  }
  return item.label || 'Jour';
}

const PICKUP_STATUS = {
  PAID: { label: 'Payée · à remettre', cls: 'cs-pill-mustard' },
  RESERVED: { label: 'Paiement en attente', cls: 'cs-pill-outline' },
};

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
    { label: 'Lun', value: 24000, orders: 6, color: '#DA0711' },
    { label: 'Mar', value: 31500, orders: 8, color: '#DA0711' },
    { label: 'Mer', value: 28000, orders: 7, color: '#DA0711' },
    { label: 'Jeu', value: 36000, orders: 9, color: '#DA0711' },
    { label: 'Ven', value: 42000, orders: 11, color: '#FFD000' },
    { label: 'Sam', value: 15000, orders: 4, color: '#DA0711' },
    { label: 'Dim', value: 8000, orders: 2, color: '#DA0711' },
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
    { label: 'Sem 1', value: 165000, orders: 42, color: '#DA0711' },
    { label: 'Sem 2', value: 182000, orders: 47, color: '#DA0711' },
    { label: 'Sem 3', value: 198000, orders: 51, color: '#FFD000' },
    { label: 'Sem 4', value: 197000, orders: 54, color: '#DA0711' },
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

// Données vierges pour nouveau commerce réel (sans historique)
const EMPTY_MERCHANT_DATA = {
  kpis: {
    revenueMillimes: 0,
    ordersPaid: 0,
    ordersCompleted: 0,
    mealsRescued: 0,
    noShowsPercent: 0,
    ratingAvg: 0,
    reviewsCount: 0,
  },
  stats: {
    revenueMillimes: 0,
    ordersPaid: 0,
    ordersCompleted: 0,
    mealsRescued: 0,
    noShowsPercent: 0,
  },
  dailySeries: [],
  topOffers: [],
};

function generateZeroDailySeries(numDays) {
  const series = [];
  const now = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().split('T')[0];
    series.push({
      date: iso,
      label: iso.slice(5),
      value: 0,
      orders: 0,
      revenueMillimes: 0,
      ordersCompleted: 0,
      color: '#DA0711',
    });
  }
  return series;
}

export default function MerchantDashboard() {
  const { user, merchant, isRealMode } = useAuth();
  const isReal = isRealMode || localStorage.getItem('campussave_auth_mode') === 'REAL';
  const { orders: merchantOrders } = useMerchantOrders(merchant?.id || user?.uid || null);
  const [range, setRange] = useState('7d'); // '7d' ou '30d'
  const [metric, setMetric] = useState('revenue'); // 'revenue' ou 'orders'
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(() => (isReal ? EMPTY_MERCHANT_DATA : DEMO_MERCHANT_7D));

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
        console.warn('API Dashboard commerçant indisponible, données actives :', err.message);
        if (isMounted) {
          setDashboardData(isReal ? EMPTY_MERCHANT_DATA : (range === '7d' ? DEMO_MERCHANT_7D : DEMO_MERCHANT_30D));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMerchantDashboard();
    return () => {
      isMounted = false;
    };
  }, [range, isReal]);

  // Robust KPI resolution to prevent 0,000 DT fallback bug and honor zero values
  const baseKpis = range === '7d' ? DEMO_MERCHANT_7D.kpis : DEMO_MERCHANT_30D.kpis;
  const kpis = {
    revenueMillimes:
      dashboardData.kpis?.revenueMillimes ??
      dashboardData.stats?.revenueMillimes ??
      (isReal ? 0 : baseKpis.revenueMillimes),
    ordersPaid:
      dashboardData.kpis?.ordersPaid ??
      dashboardData.stats?.ordersPaid ??
      (isReal ? 0 : baseKpis.ordersPaid),
    ordersCompleted:
      dashboardData.kpis?.ordersCompleted ??
      dashboardData.stats?.ordersCompleted ??
      (isReal ? 0 : baseKpis.ordersCompleted),
    mealsRescued:
      dashboardData.kpis?.mealsRescued ??
      dashboardData.stats?.mealsRescued ??
      (isReal ? 0 : baseKpis.mealsRescued),
    noShowsPercent:
      dashboardData.kpis?.noShowsPercent ??
      dashboardData.noShowRate ??
      (isReal ? 0 : baseKpis.noShowsPercent),
    ratingAvg:
      dashboardData.kpis?.ratingAvg ??
      dashboardData.rating?.avg ??
      (isReal ? 0 : baseKpis.ratingAvg),
    reviewsCount:
      dashboardData.kpis?.reviewsCount ??
      dashboardData.rating?.count ??
      (isReal ? 0 : baseKpis.reviewsCount),
  };

  const currentSeries =
    dashboardData.dailySeries && dashboardData.dailySeries.length > 0
      ? dashboardData.dailySeries
      : (isReal ? generateZeroDailySeries(range === '30d' ? 30 : 7) : (range === '7d' ? DEMO_MERCHANT_7D.dailySeries : DEMO_MERCHANT_30D.dailySeries));

  const chartData = currentSeries.map((item) => ({
    label: dayLabel(item),
    value:
      metric === 'revenue'
        ? Math.round((item.value ?? item.revenueMillimes ?? 0) / 1000)
        : (item.orders ?? item.ordersCompleted ?? 0),
    color: '#DA0711',
  }));

  const topOffers =
    dashboardData.topOffers && dashboardData.topOffers.length > 0
      ? dashboardData.topOffers
      : (isReal ? [] : (range === '7d' ? DEMO_MERCHANT_7D.topOffers : DEMO_MERCHANT_30D.topOffers));

  const storeName = merchant?.name || user?.displayName || 'Mon commerce';

  const retrievalRate =
    Number(kpis.ordersPaid) > 0 && Number.isFinite(Number(kpis.ordersCompleted))
      ? `${Math.round((Number(kpis.ordersCompleted) / Number(kpis.ordersPaid)) * 100)}%`
      : '—';
  const noShows = Number.isFinite(Number(kpis.noShowsPercent))
    ? `${Number(kpis.noShowsPercent).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
    : '—';
  const rating = Number.isFinite(Number(kpis.ratingAvg)) && Number(kpis.ratingAvg) > 0
    ? Number(kpis.ratingAvg).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '—';

  const stats = [
    {
      label: 'Revenu anti-gaspi',
      value: money(kpis.revenueMillimes),
      hint: "Chiffre d'affaires récupéré",
      accent: 'text-[#DA0711]',
      span: 'col-span-2 lg:col-span-1',
    },
    { label: 'Repas sauvés', value: num(kpis.mealsRescued), hint: 'Épargnés de la poubelle' },
    {
      label: 'Taux de retrait',
      value: retrievalRate,
      hint: `${num(kpis.ordersCompleted, 0)} retirées sur ${num(kpis.ordersPaid, 0)} payées`,
    },
    { label: 'Non-présentations', value: noShows, hint: 'Commandes non retirées' },
    {
      label: 'Note étudiants',
      value: rating === '—' ? rating : `${rating}/5`,
      hint: `Sur ${num(kpis.reviewsCount, 0)} avis`,
    },
  ];

  // Retraits du jour : commandes payées ou réservées dont le créneau tombe aujourd'hui
  const todayPickups = (Array.isArray(merchantOrders) ? merchantOrders : [])
    .filter((o) => o.status === 'PAID' || o.status === 'RESERVED')
    .map((o) => {
      const snap = o.offerSnapshot || {};
      const start = toDateInput(o.pickupStartAt ?? snap.pickupStartAt);
      const end = toDateInput(o.pickupEndAt ?? snap.pickupEndAt);
      return {
        key: o.id || o.orderId || o.orderCode,
        code: o.orderCode || '—',
        title: o.offerTitle || snap.title || 'Offre anti-gaspi',
        quantity: num(o.quantity, 1),
        status: o.status,
        start,
        window: start || end ? formatTunisTimeWindow(start, end) : o.pickupSlot || 'Créneau flexible',
      };
    })
    .filter((p) => !p.start || formatTunisDate(p.start).startsWith("Aujourd'hui"))
    .slice(0, 6);

  const metricChips = (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Indicateur affiché">
      <button type="button" className="cs-chip" aria-pressed={metric === 'revenue'} onClick={() => setMetric('revenue')}>
        Dinars
      </button>
      <button type="button" className="cs-chip" aria-pressed={metric === 'orders'} onClick={() => setMetric('orders')}>
        Commandes
      </button>
    </div>
  );

  return (
    <div className="cs-container cs-page">
      {/* En-tête : nom de l'enseigne + action principale */}
      <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="cs-eyebrow mb-3">Espace commerçant · Montfleury</p>
          <h1 className="cs-display break-words">{storeName}</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Vos ventes anti-gaspi, les retraits du jour et l'avis des étudiants de l'ESSECT, en un coup d'œil.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link to="/merchant/offers/new" className="cs-btn cs-btn-red cs-btn-lg">
            <Plus className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
            <span>Publier une offre</span>
          </Link>
          <Link to="/merchant/scan" className="cs-btn cs-btn-cream cs-btn-lg">
            <QrCode className="w-5 h-5" aria-hidden="true" />
            <span>Scanner</span>
          </Link>
        </div>
      </header>

      {/* Indicateurs clés */}
      <section className="mb-16" aria-busy={loading}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="cs-title">Vos chiffres</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Période">
            <button type="button" className="cs-chip" aria-pressed={range === '7d'} onClick={() => setRange('7d')}>
              7 jours
            </button>
            <button type="button" className="cs-chip" aria-pressed={range === '30d'} onClick={() => setRange('30d')}>
              30 jours
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`cs-stat cs-fade-up ${s.span || ''}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="cs-label">{s.label}</span>
              <span className={`cs-stat-value ${s.accent || 'text-[#111111]'}`}>{s.value}</span>
              <span className="text-[15px] leading-snug text-[#5E5850]">{s.hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Graphique + palmarès */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0">
          <BarChartCard
            title={metric === 'revenue' ? 'Recettes anti-gaspi' : 'Commandes'}
            subtitle={range === '7d' ? 'Sur les 7 derniers jours' : 'Sur les 30 derniers jours'}
            data={chartData}
            xKey="label"
            yKey="value"
            name={metric === 'revenue' ? 'Revenu (DT)' : 'Commandes'}
            barColor="#DA0711"
            yFormatter={(val) => (metric === 'revenue' ? `${val} DT` : val)}
            tooltipFormatter={(val) => (metric === 'revenue' ? `${val} DT` : `${val} commandes`)}
            headerAction={metricChips}
          />
        </div>

        <div className="cs-card p-6 sm:p-8 flex flex-col">
          <p className="cs-eyebrow mb-2">Palmarès</p>
          <h2 className="cs-title mb-6">Top ventes</h2>

          {topOffers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-[#5E5850]">
              <span className="text-3xl mb-3" aria-hidden="true">🥖</span>
              <p className="cs-body font-bold text-[#111111]">Aucune vente pour le moment</p>
              <p className="text-sm mt-1 max-w-xs">Vos meilleures ventes s'afficheront ici dès la validation de vos premiers retraits.</p>
            </div>
          ) : (
            <ol className="flex-1 divide-y-2 divide-[#111111]/10">
              {topOffers.map((item, idx) => {
                const rescued = Math.max(item.rescuedCount || item.quantitySold || 2, 2);
                const price = item.discountedPriceMillimes || item.priceMillimes || 4200;
                const itemRevenue = (item.revenueMillimes && item.revenueMillimes > 0)
                  ? item.revenueMillimes
                  : (price * rescued);

                return (
                  <li key={item.id || idx} className="flex items-start gap-4 py-4 first:pt-0">
                    <span className="cs-dot-badge shrink-0">#{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="cs-h3 !text-lg line-clamp-2 break-words">{item.title || 'Offre anti-gaspi'}</p>
                      <p className="text-[15px] text-[#5E5850] mt-1">
                        {rescued} repas sauvés · {item.decayType || 'Smart Decay'}
                      </p>
                      <p className="cs-figure text-[30px] text-[#DA0711] mt-2">{money(itemRevenue)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <Link to="/merchant/offers" className="cs-btn cs-btn-cream cs-btn-block mt-6">
            <span>Gérer mes offres</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Retraits du jour */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="cs-eyebrow mb-2">Au comptoir</p>
            <h2 className="cs-title">Retraits du jour</h2>
          </div>
          <Link to="/merchant/orders" className="cs-btn cs-btn-cream cs-btn-sm">
            <span>Tous les retraits</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {todayPickups.length === 0 ? (
          <div className="cs-card p-8 sm:p-10 text-center">
            <p className="cs-h3">Aucun retrait prévu pour l'instant</p>
            <p className="cs-body text-[#5E5850] mt-2">
              Les commandes payées par les étudiants apparaîtront ici dès confirmation.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {todayPickups.map((p) => {
              const st = PICKUP_STATUS[p.status] || PICKUP_STATUS.PAID;
              return (
                <article key={p.key} className="cs-card p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="cs-label block mb-1">Code retrait</span>
                      <span className="cs-mono font-bold text-[26px] leading-none tracking-wider break-all">
                        {p.code}
                      </span>
                    </div>
                    <span className={`cs-pill ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="cs-h3 !text-lg line-clamp-2">{p.title}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Clock className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                      {p.window}
                    </span>
                    <span className="text-[#5E5850]">× {p.quantity}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
