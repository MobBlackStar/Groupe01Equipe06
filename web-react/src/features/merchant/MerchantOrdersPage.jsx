// 💡 Concept & Analogie : Comme le ticket de commande qui sort de l'imprimante thermique en cuisine, cette vue alerte le commerçant sur les repas réservés et payés en attente de présentation du client au comptoir.
// 🔄 Comparaison React / Flutter : En React, les commandes sont classées par statut avec badge en temps réel ; en Flutter, `MerchantOrdersScreen` offre une expérience tactile similaire avec accès direct au scanner caméra.
// 🎯 À retenir pour la soutenance : "Le commerçant identifie immédiatement les commandes payées prêtes à remettre grâce au code alphanumérique unique `orderCode` et peut valider le retrait en scannant le QR code ou en saisissant le code à 6 chiffres."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { EmptyState, Spinner } from '../../components/ui/index.js';

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

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'PAID') return o.status === 'PAID';
    if (activeTab === 'RESERVED') return o.status === 'RESERVED';
    return o.status === 'COMPLETED';
  });

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* En-tête commerçant */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Commandes & Retraits des Étudiants
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gérez les retraits d'invendus au comptoir et vérifiez les Living Tickets.
            </p>
          </div>

          <Link
            to="/merchant/scan"
            className="px-5 py-2.5 rounded-2xl bg-[#CCFF00] text-black font-black text-xs hover:bg-[#b8e600] transition-colors shadow-lg shadow-[#CCFF00]/15 flex items-center gap-2 self-start sm:self-auto"
          >
            <span>📷 Scanner un QR Code</span>
          </Link>
        </div>

        {/* Onglets statut */}
        <div className="flex rounded-2xl bg-[#161920] p-1.5 border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('PAID')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'PAID'
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎟️ Payées — À Remettre ({orders.filter((o) => o.status === 'PAID').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESERVED')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'RESERVED'
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏳ Réservées (10 min) ({orders.filter((o) => o.status === 'RESERVED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Remises sur place ({orders.filter((o) => o.status === 'COMPLETED').length})
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400">Synchronisation des retraits en direct...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Aucune commande dans cette section"
            description="Les nouvelles réservations des étudiants apparaîtront ici dès confirmation."
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                className="p-5 rounded-2xl bg-[#161920] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#CCFF00] px-2 py-0.5 rounded bg-black/50 border border-[#CCFF00]/30">
                      {o.orderCode}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      👤 {o.customerName || 'Étudiant ESSECT'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base pt-1">{o.offerTitle}</h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Quantité : <strong className="text-white">{o.quantity}</strong></span>
                    <span>•</span>
                    <span>Total réglé : <strong className="text-[#CCFF00] font-mono">{formatTND(o.totalPriceMillimes)}</strong></span>
                    <span>•</span>
                    <span>Créneau : {o.pickupSlot}</span>
                  </div>
                </div>

                <div className="flex items-center sm:self-center">
                  {o.status === 'PAID' && (
                    <Link
                      to="/merchant/scan"
                      className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors shadow-md shadow-[#CCFF00]/10 flex items-center gap-1.5"
                    >
                      <span>Valider le retrait →</span>
                    </Link>
                  )}

                  {o.status === 'RESERVED' && (
                    <span className="text-xs text-amber-400 font-medium animate-pulse">
                      ⏳ En attente de règlement Konnect
                    </span>
                  )}

                  {o.status === 'COMPLETED' && (
                    <span className="text-xs text-emerald-400 font-medium">
                      ✓ Remis avec succès
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
