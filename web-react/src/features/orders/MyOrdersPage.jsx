// 💡 Concept & Analogie : Comme le classeur de vos tickets où vos réservations actives sont prêtes à être compostées et vos repas passés archivés.
// 🔄 Comparaison React / Flutter : En React, les onglets filtrent l'état local avec `useState` ; en Flutter, `MyOrdersScreen` utilise un `DefaultTabController`.
// 🎯 À retenir pour la soutenance : "Une vision claire scindée en 3 états : En cours, Terminées et Annulées."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrderRow from './OrderRow.jsx';
import UnboxingReveal from '../surprise/UnboxingReveal.jsx';
import RatingDialog from './RatingDialog.jsx';
import { EmptyState, Spinner, Tabs } from '../../components/ui/index.js';
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
    category: 'SANDWICH',
    pickupStartAt: new Date(Date.now() + 30 * 60 * 1000),
    pickupEndAt: new Date(Date.now() + 90 * 60 * 1000),
    createdAt: new Date(),
  },
  {
    id: 'ord-demo-02',
    orderCode: 'CS-3T7X1',
    offerTitle: 'Panier Surprise Viennoiseries du Matin',
    merchantName: "Cafétéria L'Étoile du Savoir",
    quantity: 1,
    lockedUnitPriceMillimes: 2500,
    status: 'RESERVED',
    category: 'VIENNOISERIE',
    reservationExpiresAt: new Date(Date.now() + 8 * 60 * 1000),
    pickupStartAt: new Date(Date.now() + 60 * 60 * 1000),
    pickupEndAt: new Date(Date.now() + 120 * 60 * 1000),
    createdAt: new Date(),
  },
  {
    id: 'ord-demo-03',
    orderCode: 'CS-9M2K4',
    offerTitle: 'Ojja Royale aux Merguez & Œuf',
    merchantName: 'Restaurant Le Dôme Montfleury',
    quantity: 1,
    lockedUnitPriceMillimes: 4500,
    status: 'COMPLETED',
    category: 'PLAT_CHAUD',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'ord-demo-04',
    orderCode: 'CS-1Z9P8',
    offerTitle: 'Pizza Calzone Tunisienne Soufflée',
    merchantName: 'Pizzeria Bella Napoli Montfleury',
    quantity: 1,
    lockedUnitPriceMillimes: 4500,
    status: 'EXPIRED',
    category: 'PIZZA',
    createdAt: new Date(Date.now() - 172800000),
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

  const tabs = [
    {
      id: 'ACTIVE',
      label: 'En cours',
      count: orders.filter((o) => ['RESERVED', 'PAID'].includes(o.status)).length,
    },
    {
      id: 'COMPLETED',
      label: 'Terminées',
      count: orders.filter((o) => o.status === 'COMPLETED').length,
    },
    {
      id: 'ARCHIVED',
      label: 'Annulées / Expirées',
      count: orders.filter((o) => ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(o.status)).length,
    },
  ];

  return (
    <div className="cs-container cs-page text-[#111111]">
      {/* En-tête */}
      <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="max-w-3xl">
          <p className="cs-eyebrow mb-3">Espace étudiant · Commandes</p>
          <h1 className="cs-display">Mes tickets</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Vos réservations en cours, vos Living Tickets de retrait et l'historique de vos repas sauvés à Montfleury.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setUnboxingOrder({ id: 'demo-unboxing', reveal: null })}
            className="cs-btn cs-btn-mustard"
          >
            <span aria-hidden="true">🎁</span>
            <span>Déballer un panier</span>
          </button>

          <Link to="/app/explore" className="cs-btn cs-btn-red">
            + Sauver un repas
          </Link>
        </div>
      </header>

      {/* Filtres de statut */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8 lg:mb-10" />

      {/* Liste des commandes */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-5">
          <Spinner size="lg" />
          <p className="cs-body text-[#5E5850]">Chargement de vos commandes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="Aucune commande ici"
          description="Vous n'avez actuellement aucune commande correspondant à ce statut."
          action={
            <Link to="/app/explore" className="cs-btn cs-btn-red">
              Explorer les offres actives
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order, i) => (
            <div key={order.id} className="cs-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <OrderRow order={order} onRate={(o) => setRatingOrder(o)} />
            </div>
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
  );
}
