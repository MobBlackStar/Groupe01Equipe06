// 💡 Concept & Analogie : Comme le classeur de vos billets de train ou concerts où vos réservations actives sont prêtes à être compostées et vos voyages passés archivés.
// 🔄 Comparaison React / Flutter : En React, les onglets filtrent l'état local avec `useState` ; en Flutter, `MyOrdersScreen` utilise un `DefaultTabController` avec des vues `TabBarView`.
// 🎯 À retenir pour la soutenance : "Une vision claire scindée en 3 états : En cours (retraits imminents), Terminées (historique d'impact) et Annulées (transparence totale)."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrderRow from './OrderRow.jsx';
import { EmptyState, Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';

// Commandes de démonstration réalistes pour la soutenance
const DEMO_ORDERS = [
  {
    id: 'ord-demo-01',
    orderCode: 'CS-8K4M9',
    offerTitle: 'Baguette Farcie Escalope Panée & Double Fromage',
    merchantName: 'Baguette & Baguette Montfleury',
    quantity: 2,
    lockedUnitPriceMillimes: 3800,
    status: 'PAID',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-demo-02',
    orderCode: 'CS-3T7X1',
    offerTitle: 'Panier Surprise Viennoiseries du Matin',
    merchantName: "Cafétéria L'Étoile du Savoir",
    quantity: 1,
    lockedUnitPriceMillimes: 2500,
    status: 'RESERVED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-demo-03',
    orderCode: 'CS-9M2K4',
    offerTitle: 'Ojja Royale aux Merguez & Œuf',
    merchantName: 'Restaurant Le Dôme Montfleury',
    quantity: 1,
    lockedUnitPriceMillimes: 4500,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ord-demo-04',
    orderCode: 'CS-1Z9P8',
    offerTitle: 'Pizza Calzone Tunisienne Soufflée',
    merchantName: 'Pizzeria Bella Napoli Montfleury',
    quantity: 1,
    lockedUnitPriceMillimes: 4500,
    status: 'EXPIRED',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'COMPLETED', 'ARCHIVED'

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await apiClient.get('/orders/my-orders');
        const data = response.data?.orders || response.data || [];
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
          } else {
            setOrders(DEMO_ORDERS);
          }
        }
      } catch (err) {
        console.warn('API commandes offline, utilisation des commandes démo :', err.message);
        if (isMounted) {
          setOrders(DEMO_ORDERS);
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

  // Filtrage selon onglet
  const filteredOrders = orders.filter((order) => {
    const s = order.status || 'RESERVED';
    if (activeTab === 'ACTIVE') {
      return ['RESERVED', 'PAID'].includes(s);
    }
    if (activeTab === 'COMPLETED') {
      return s === 'COMPLETED';
    }
    return ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(s);
  });

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Mes Commandes & Sauvetages
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Retrouvez vos réservations en cours et vos Living Tickets pour retrait sur place à Montfleury.
            </p>
          </div>

          <Link
            to="/app/explore"
            className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors self-start sm:self-auto"
          >
            + Sauver un repas
          </Link>
        </div>

        {/* Onglets */}
        <div className="flex rounded-2xl bg-[#161920] p-1.5 border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'ACTIVE'
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ En cours ({orders.filter((o) => ['RESERVED', 'PAID'].includes(o.status)).length})
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
            ✓ Terminées ({orders.filter((o) => o.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVED')}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'ARCHIVED'
                ? 'bg-[#CCFF00] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✕ Annulées / Expirées
          </button>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400">Chargement de vos commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="Aucune commande dans cet onglet"
            description="Vous n'avez actuellement aucune commande correspondant à ce statut."
            action={
              <Link
                to="/app/explore"
                className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs"
              >
                Explorer les offres actives
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
