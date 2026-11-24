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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [unboxingOrder, setUnboxingOrder] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);

  const handleCancel = async (order) => {
    const id = order.id || order._id;
    if (!window.confirm('Annuler cette réservation ? Le stock sera libéré et votre coupon éventuel restitué.')) return;
    try {
      await apiClient.post(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => ((o.id || o._id) === id ? { ...o, status: 'CANCELLED' } : o)));
    } catch (err) {
      setLoadError(err?.response?.data?.error?.message || 'Annulation impossible : réessayez.');
    }
  };

  const handleRatingSuccess = ({ orderId, rating }) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rating } : o))
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      setLoading(true);
      setLoadError('');
      try {
        const response = await apiClient.get('/orders/my-orders');
        const data = response.data?.orders || response.data || [];
        if (isMounted) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        // Jamais de commandes inventées : l'erreur est affichée avec un bouton pour réessayer
        if (isMounted) setLoadError(err?.response?.data?.error?.message || 'Impossible de charger vos commandes.');
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
  }, [reloadKey]);

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
      ) : loadError ? (
        <EmptyState
          icon="📡"
          title="Connexion impossible"
          description={loadError}
          action={
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="cs-btn cs-btn-red">
              Réessayer
            </button>
          }
        />
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
              <OrderRow order={order} onRate={(o) => setRatingOrder(o)} onCancel={handleCancel} />
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
