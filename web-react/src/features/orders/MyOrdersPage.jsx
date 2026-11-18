// 💡 Concept & Analogie : Comme le classeur de vos tickets où vos réservations actives sont prêtes à être compostées et vos repas passés archivés.
// 🔄 Comparaison React / Flutter : En React, les onglets filtrent l'état local avec `useState` ; en Flutter, `MyOrdersScreen` utilise un `DefaultTabController`.
// 🎯 À retenir pour la soutenance : "Une vision claire scindée en 3 états : En cours, Terminées et Annulées."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrderRow from './OrderRow.jsx';
import UnboxingReveal from '../surprise/UnboxingReveal.jsx';
import RatingDialog from './RatingDialog.jsx';
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
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [unboxingOrder, setUnboxingOrder] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);

  const handleRatingSuccess = ({ orderId, rating }) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating } : o))
    );
  };

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
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#111111]/10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-anton uppercase text-[#111111] tracking-wide">
              Mes Commandes &amp; Sauvetages
            </h1>
            <p className="text-xs text-[#666] font-medium mt-1">
              Retrouvez vos réservations en cours et vos Living Tickets pour retrait sur place à Montfleury.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUnboxingOrder({ id: 'demo-unboxing', reveal: null })}
              className="btn-griddle-yellow text-xs py-2 px-4"
            >
              <span>🎁</span>
              <span>Déballer Panier</span>
            </button>

            <Link
              to="/app/explore"
              className="btn-griddle-primary text-xs py-2 px-5"
            >
              + Sauver un repas
            </Link>
          </div>
        </div>

        {/* Onglets Pills Griddle */}
        <div className="flex rounded-full bg-[#EDE6D7] p-1.5 border border-[#111111]/8 text-xs font-anton uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 py-2 px-3 rounded-full transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-[#DA0711] text-white shadow-sm'
                : 'text-[#111111] hover:bg-black/5'
            }`}
          >
            ⚡ En cours ({orders.filter((o) => ['RESERVED', 'PAID'].includes(o.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-2 px-3 rounded-full transition-all cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-[#DA0711] text-white shadow-sm'
                : 'text-[#111111] hover:bg-black/5'
            }`}
          >
            ✓ Terminées ({orders.filter((o) => o.status === 'COMPLETED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVED')}
            className={`flex-1 py-2 px-3 rounded-full transition-all cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-[#DA0711] text-white shadow-sm'
                : 'text-[#111111] hover:bg-black/5'
            }`}
          >
            ✕ Annulées / Expirées
          </button>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-xs text-[#666] font-bold">Chargement de vos commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="Aucune commande dans cet onglet"
            description="Vous n'avez actuellement aucune commande correspondant à ce statut."
            action={
              <Link
                to="/app/explore"
                className="btn-griddle-primary text-xs"
              >
                Explorer les offres actives
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onRate={(o) => setRatingOrder(o)}
              />
            ))}
          </div>
        )}

        {/* Modal Unboxing Reveal */}
        <UnboxingReveal
          isOpen={Boolean(unboxingOrder)}
          onClose={() => setUnboxingOrder(null)}
          order={unboxingOrder}
        />

        {/* Modal Notation Étoiles */}
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
