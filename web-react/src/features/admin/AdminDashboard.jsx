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
  RotateCcw,
} from 'lucide-react';
import { KpiCard, BarChartCard } from '../../components/charts/index.js';
import { Spinner, Button, Modal, Toast } from '../../components/ui/index.js';
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
    { label: 'Complétées (Retirées)', value: 1350, color: '#111111' },
    { label: 'Payées / En cours', value: 42, color: '#FFD000' },
    { label: 'Annulées / Expirées', value: 28, color: '#DA0711' },
  ],
};

export default function AdminDashboard() {
  const [data, setData] = useState(DEMO_ADMIN_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleResetDemo() {
    setResetting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.ADMIN_RESET_DEMO || '/admin/reset-demo');
      setToast({
        type: 'success',
        message: `Plateforme réinitialisée avec succès (${res.data?.offersCount || 20} offres, ${res.data?.merchantsCount || 6} commerces) !`,
      });
      setResetModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('Erreur reset-demo:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Erreur lors de la réinitialisation de la démo.',
      });
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchAdminDashboard() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.DASHBOARD_ADMIN);
        if (isMounted && res.data) {
          const raw = res.data;

          // Valeurs réelles uniquement : un 0 reste 0, une valeur absente devient null ("—" à l'écran)
          const real = (v) => {
            const x = Number(v);
            return v === null || v === undefined || v === '' || !Number.isFinite(x) ? null : x;
          };
          const sumReal = (...vals) => {
            const present = vals.map(real).filter((x) => x !== null);
            return present.length ? present.reduce((a, b) => a + b, 0) : null;
          };

          const usersByRole = Array.isArray(raw.usersByRole)
            ? raw.usersByRole
            : [
                { label: 'Étudiants ESSECT', value: real(raw.usersByRole?.STUDENT), color: '#DA0711' },
                { label: 'Commerçants', value: real(raw.usersByRole?.MERCHANT), color: '#FFD000' },
                { label: 'Administrateurs', value: real(raw.usersByRole?.ADMIN), color: '#111111' },
              ].filter((d) => d.value !== null);

          const ordersByStatus = Array.isArray(raw.ordersByStatus)
            ? raw.ordersByStatus
            : [
                { label: 'Complétées (Retirées)', value: real(raw.ordersByStatus?.COMPLETED), color: '#111111' },
                { label: 'Payées / En cours', value: sumReal(raw.ordersByStatus?.PAID, raw.ordersByStatus?.RESERVED), color: '#FFD000' },
                { label: 'Annulées / Expirées', value: sumReal(raw.ordersByStatus?.CANCELLED, raw.ordersByStatus?.EXPIRED, raw.ordersByStatus?.NO_SHOW), color: '#DA0711' },
              ].filter((d) => d.value !== null);

          const kpis = {
            gmvMillimes: real(raw.kpis?.gmvMillimes ?? raw.globalImpact?.moneySavedMillimes),
            totalUsers: real(raw.usersByRole?.total ?? raw.kpis?.totalUsers),
            studentsCount: real(raw.usersByRole?.STUDENT),
            merchantsCount: real(raw.usersByRole?.MERCHANT),
            adminsCount: real(raw.usersByRole?.ADMIN),
            totalStores: real(raw.merchantsByStatus?.total),
            storesPending: real(raw.merchantsByStatus?.PENDING),
            storesApproved: real(raw.merchantsByStatus?.APPROVED),
            storesRejected: real(raw.merchantsByStatus?.REJECTED),
            totalOrders: real(raw.ordersByStatus?.total),
            ordersCompleted: real(raw.ordersByStatus?.COMPLETED),
            ordersActive: sumReal(raw.ordersByStatus?.RESERVED, raw.ordersByStatus?.PAID),
            ordersCancelled: sumReal(raw.ordersByStatus?.CANCELLED, raw.ordersByStatus?.EXPIRED),
            foodSavedGrams: real(raw.globalImpact?.foodSavedGrams),
            co2SavedGrams: real(raw.globalImpact?.co2SavedGrams),
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

  // Gardes d'affichage : jamais de NaN / undefined à l'écran
  const n = (v) => {
    const x = Number(v);
    return v === null || v === undefined || v === '' || !Number.isFinite(x) ? null : x;
  };
  const show = (v) => (n(v) === null ? '—' : n(v).toLocaleString('fr-FR'));
  const gmv = n(kpis.gmvMillimes) === null ? '—' : formatTND(n(kpis.gmvMillimes));
  const co2T = n(kpis.co2SavedGrams) === null ? '—' : `${(n(kpis.co2SavedGrams) / 1000000).toFixed(2).replace('.', ',')} t`;
  const foodKg = n(kpis.foodSavedGrams) === null ? '—' : Math.round(n(kpis.foodSavedGrams) / 1000).toLocaleString('fr-FR');
  const pending = n(kpis.storesPending) || 0;

  return (
    <div className="bg-[#FAF3E6] text-[#111111] min-h-screen">
      <div className="cs-container cs-page">
        {/* En-tête Administrateur */}
        <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-3xl">
            <p className="cs-eyebrow mb-3 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Console d'administration · ESSECT</span>
            </p>
            <h1 className="cs-display">Supervision globale</h1>
            <p className="cs-lead mt-4">
              Volume d'affaires, validation des commerces et impact environnemental consolidé de la plateforme.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="cs-btn cs-btn-cream text-xs !py-2.5 !px-3.5 hover:!bg-[#FFD000] hover:text-[#111111] transition-colors"
              title="Réinitialiser les données pour la soutenance (20 offres officielles, 6 commerces)"
            >
              <RotateCcw className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
              <span>Réinitialiser la démo</span>
            </button>
            <Link to="/admin/merchants" className="cs-btn cs-btn-cream">
              <Store className="w-5 h-5 text-[#DA0711]" aria-hidden="true" />
              <span>Commerces</span>
              {pending > 0 && <span className="cs-pill cs-pill-mustard">{pending} en attente</span>}
            </Link>
            <Link to="/admin/users" className="cs-btn cs-btn-cream">
              <Users className="w-5 h-5" aria-hidden="true" />
              <span>Utilisateurs</span>
              <span className="cs-pill cs-pill-ink">{show(kpis.totalUsers)}</span>
            </Link>
            <Link to="/impact" className="cs-btn cs-btn-red">
              <span>Impact public</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {loading && (
          <div className="flex items-center gap-3 mb-6 text-[#5E5850] text-base" role="status">
            <Spinner size="sm" />
            <span>Synchronisation des indicateurs…</span>
          </div>
        )}

        {/* Alerte si des commerces attendent validation */}
        {pending > 0 && (
          <section className="mb-12 rounded-[1.25rem] bg-[#FFD000] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 shrink-0 rounded-full bg-[#111111] text-[#FFD000] flex items-center justify-center" aria-hidden="true">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div>
                <h2 className="cs-h3 text-[clamp(1.375rem,2.4vw,1.75rem)]">
                  {pending} commerce{pending > 1 ? 's' : ''} en attente d'approbation
                </h2>
                <p className="text-base mt-1">
                  Des gérants de Montfleury ont soumis leur dossier pour rejoindre CampusSave.
                </p>
              </div>
            </div>
            <Link to="/admin/merchants" className="cs-btn cs-btn-ink shrink-0">
              Examiner les dossiers →
            </Link>
          </section>
        )}

        {/* Tuiles KPI Administrateur */}
        <section className="mb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Indicateurs clés">
          <div className="sm:col-span-2">
            <KpiCard
              title="Volume d'affaires (GMV)"
              value={gmv}
              subtitle="Transactions traitées sur la plateforme"
              icon={<DollarSign className="w-5 h-5" />}
              accent="red"
              badge="Économie campus"
              positive={true}
            />
          </div>
          <KpiCard
            title="Utilisateurs actifs"
            value={show(kpis.totalUsers)}
            subtitle={`${show(kpis.studentsCount)} étudiants · ${show(kpis.merchantsCount)} commerces`}
            icon={<Users className="w-5 h-5" />}
            accent="slate"
            badge="Communauté"
            positive={true}
          />
          <KpiCard
            title="Commerces validés"
            value={`${show(kpis.storesApproved)} / ${show(kpis.totalStores)}`}
            subtitle={`${pending} en attente de revue`}
            icon={<Store className="w-5 h-5" />}
            accent="red"
            badge="Montfleury"
            positive={true}
            onClick={() => window.location.assign('/admin/merchants')}
          />
          <KpiCard
            title="Commandes totales"
            value={show(kpis.totalOrders)}
            subtitle={`${show(kpis.ordersCompleted)} repas retirés avec succès`}
            icon={<ShoppingBag className="w-5 h-5" />}
            accent="yellow"
            badge="Sauvetages"
            positive={true}
          />
          <KpiCard
            title="CO₂e évité"
            value={co2T}
            subtitle={`${foodKg} kg de nourriture sauvée`}
            icon={<Leaf className="w-5 h-5" />}
            accent="green"
            badge="Impact vert"
            positive={true}
          />
        </section>

        {/* Graphiques Recharts : Répartition des utilisateurs & commandes */}
        <section>
          <h2 className="cs-title mb-8">Activité de la plateforme</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartCard
              title="Membres par rôle"
              subtitle="Comptes étudiants, boutiques et administrateurs"
              data={data.usersByRole || DEMO_ADMIN_DASHBOARD.usersByRole}
              xKey="label"
              yKey="value"
              name="Utilisateurs"
              barColor="#DA0711"
              height={300}
              tooltipFormatter={(val) => `${val} membres`}
            />

            <BarChartCard
              title="État des commandes"
              subtitle="Complétion et respect des créneaux de retrait"
              data={data.ordersByStatus || DEMO_ADMIN_DASHBOARD.ordersByStatus}
              xKey="label"
              yKey="value"
              name="Commandes"
              barColor="#111111"
              height={300}
              tooltipFormatter={(val) => `${val} commandes`}
            />
          </div>
        </section>

        {/* Modal de confirmation de réinitialisation démo */}
        <Modal
          isOpen={resetModalOpen}
          onClose={() => !resetting && setResetModalOpen(false)}
          title="Réinitialiser l'environnement de démo ?"
          description="Cette action purgera toutes les commandes et réinjectera les 20 offres officielles, les 6 commerces de Montfleury (dont 1 en attente pour validation live) et réinitialisera le cache 30s."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={resetting}
                onClick={() => setResetModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={resetting}
                onClick={handleResetDemo}
              >
                Confirmer le reset
              </Button>
            </>
          }
        >
          <div className="py-2 text-sm text-[#5E5850]">
            <p>
              Pratique entre deux passages devant le jury pour repartir instantanément d'un état propre.
            </p>
          </div>
        </Modal>

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
