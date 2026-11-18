// 💡 Concept & Analogie : Comme le ticket de commande qui sort de l'imprimante thermique en cuisine, cette vue alerte le commerçant sur les repas réservés et payés en attente de présentation du client au comptoir.
// 🔄 Comparaison React / Flutter : En React, les commandes sont classées par statut avec badge en temps réel ; en Flutter, `MerchantOrdersScreen` offre une expérience tactile similaire avec accès direct au scanner caméra.
// 🎯 À retenir pour la soutenance : "Le commerçant identifie immédiatement les commandes payées prêtes à remettre grâce au code alphanumérique unique `orderCode` et peut valider le retrait en scannant le QR code ou en saisissant le code à 6 chiffres."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { formatTunisDate, formatTunisTime, formatTunisTimeWindow } from '../../lib/formatters.js';
import { EmptyState, Spinner, Tabs } from '../../components/ui/index.js';
import { QrCode, Clock, User, ArrowRight } from 'lucide-react';

// Timestamps Firestore sérialisés ({ _seconds }) → millisecondes
function toDateInput(v) {
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const s = v._seconds ?? v.seconds;
    return Number.isFinite(s) ? s * 1000 : null;
  }
  return v ?? null;
}

// Normalise une commande (mock ou API) pour l'affichage : jamais de NaN / ISO brut / 0,000 DT
function orderView(o) {
  const snap = o.offerSnapshot || {};
  const start = toDateInput(o.pickupStartAt ?? snap.pickupStartAt);
  const end = toDateInput(o.pickupEndAt ?? snap.pickupEndAt);
  const totalRaw = o.totalPriceMillimes ?? o.pricing?.totalMillimes;
  const totalNum = Number(totalRaw);
  const created = toDateInput(o.createdAt);
  const createdTime = formatTunisTime(created);
  const qty = Number(o.quantity);

  return {
    key: o.id || o.orderId || o.orderCode,
    code: o.orderCode || '—',
    title: o.offerTitle || snap.title || 'Offre anti-gaspi',
    customer: o.customerName || o.studentSnapshot?.displayName || 'Étudiant ESSECT',
    quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
    total: totalRaw != null && Number.isFinite(totalNum) && totalNum > 0 ? formatTND(totalNum) : '—',
    window: start || end ? formatTunisTimeWindow(start, end) : o.pickupSlot || 'Créneau flexible',
    created: createdTime !== '--:--' ? `${formatTunisDate(created)} à ${createdTime}` : null,
  };
}

const STATUS_VIEW = {
  PAID: { label: 'Payée', cls: 'cs-pill-mustard' },
  RESERVED: { label: 'Paiement en attente', cls: 'cs-pill-outline' },
  COMPLETED: { label: 'Remise', cls: 'cs-pill-leaf' },
};

// Commandes commerçant de démonstration
const MOCK_MERCHANT_ORDERS = [
  {
    id: 'ord-m-01',
    orderCode: 'CS-8K4M9',
    customerName: 'Yassine Trabelsi (ESSECT 3A)',
    offerTitle: 'Baguette Farcie Escalope Panée & Fromage',
    quantity: 2,
    totalPriceMillimes: 7600,
    status: 'PAID',
    pickupSlot: 'Aujourd hui 17h00 – 18h30',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-m-02',
    orderCode: 'CS-3T7X1',
    customerName: 'Sarra Ben Salem (ESSECT 2A)',
    offerTitle: 'Panier Surprise Salés du Midi',
    quantity: 1,
    totalPriceMillimes: 2500,
    status: 'RESERVED',
    pickupSlot: 'Aujourd hui 17h30 – 19h00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-m-03',
    orderCode: 'CS-9M2K4',
    customerName: 'Mohamed Dridi (ESSECT 1A)',
    offerTitle: 'Makloub Escalope Panée',
    quantity: 1,
    totalPriceMillimes: 3800,
    status: 'COMPLETED',
    pickupSlot: 'Hier 18h15',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PAID'); // 'PAID', 'RESERVED', 'COMPLETED'

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await apiClient.get(ENDPOINTS.MERCHANT_ORDERS);
        const data = response.data?.orders || response.data || [];
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
          } else {
            setOrders(MOCK_MERCHANT_ORDERS);
          }
        }
      } catch (err) {
        console.warn('API commandes commerçant offline, utilisation des mocks :', err.message);
        if (isMounted) {
          setOrders(MOCK_MERCHANT_ORDERS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Onglet par défaut : le premier qui contient des commandes (une seule fois, au premier chargement)
  const [autoTabDone, setAutoTabDone] = useState(false);
  useEffect(() => {
    if (autoTabDone || loading) return;
    setAutoTabDone(true);
    if (orders.some((o) => o.status === activeTab)) return;
    const firstWithData = ['PAID', 'RESERVED', 'COMPLETED'].find((s) => orders.some((o) => o.status === s));
    if (firstWithData) setActiveTab(firstWithData);
  }, [autoTabDone, loading, orders, activeTab]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'PAID') return o.status === 'PAID';
    if (activeTab === 'RESERVED') return o.status === 'RESERVED';
    return o.status === 'COMPLETED';
  });

  const countBy = (status) => orders.filter((o) => o.status === status).length;
  const tabs = [
    { id: 'PAID', label: 'À remettre', count: countBy('PAID') },
    { id: 'RESERVED', label: 'Réservées', count: countBy('RESERVED') },
    { id: 'COMPLETED', label: 'Remises', count: countBy('COMPLETED') },
  ];

  return (
    <div className="cs-container cs-page">
      {/* En-tête commerçant */}
      <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="cs-eyebrow mb-3">Espace commerçant</p>
          <h1 className="cs-display">Retraits</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Les commandes des étudiants à remettre au comptoir. Vérifiez le code, puis validez le Living Ticket.
          </p>
        </div>
        <Link to="/merchant/scan" className="cs-btn cs-btn-red cs-btn-lg shrink-0 self-start lg:self-auto">
          <QrCode className="w-5 h-5" aria-hidden="true" />
          <span>Scanner un ticket</span>
        </Link>
      </header>

      {/* Onglets statut */}
      <div className="mb-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Spinner size="lg" />
          <p className="cs-body text-[#5E5850]">Synchronisation des retraits…</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Rien dans cette section"
          description="Les nouvelles réservations des étudiants apparaîtront ici dès confirmation."
        />
      ) : (
        <ul className="space-y-4">
          {filteredOrders.map((raw, i) => {
            const o = orderView(raw);
            const st = STATUS_VIEW[raw.status] || { label: raw.status, cls: '' };
            return (
              <li
                key={o.key}
                className="cs-card cs-fade-up p-6 sm:p-7 grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-center"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Code de retrait */}
                <div>
                  <span className="cs-label block mb-2">Code retrait</span>
                  <span className="cs-mono font-bold text-[30px] leading-none tracking-wider break-all">
                    {o.code}
                  </span>
                </div>

                {/* Détails */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`cs-pill ${st.cls}`}>{st.label}</span>
                    <span className="inline-flex items-center gap-1.5 text-[15px] text-[#5E5850]">
                      <User className="w-4 h-4" aria-hidden="true" />
                      {o.customer}
                    </span>
                  </div>
                  <h3 className="cs-h3 line-clamp-2">{o.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <Clock className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                      {o.window}
                    </span>
                    <span>
                      <span className="text-[#5E5850]">Qté </span>
                      <strong>{o.quantity}</strong>
                    </span>
                    <span className="cs-figure text-[28px] text-[#DA0711]">{o.total}</span>
                  </div>
                  {o.created && (
                    <p className="mt-2 text-[15px] text-[#5E5850]">Commandé {o.created}</p>
                  )}
                </div>

                {/* Action */}
                <div className="md:justify-self-end">
                  {raw.status === 'PAID' && (
                    <Link to="/merchant/scan" className="cs-btn cs-btn-red w-full md:w-auto">
                      <span>Valider le retrait</span>
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Link>
                  )}
                  {raw.status === 'RESERVED' && (
                    <span className="text-[15px] font-semibold text-[#5E5850]">En attente du paiement Konnect</span>
                  )}
                  {raw.status === 'COMPLETED' && (
                    <span className="text-[15px] font-semibold text-[#1F7A3A]">✓ Remis avec succès</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
