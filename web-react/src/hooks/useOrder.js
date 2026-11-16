// 💡 Concept & Analogie : Comme une liaison directe qui informe l'étudiant dès que le commerçant a bipé son billet pour valider le retrait.
// 🔄 Comparaison React / Flutter : Utilise l'API REST sous React avec rafraîchissement périodique ; sous Flutter, `FirestoreStreams.order(orderId)` produit un `Stream<OrderModel>`.
// 🎯 À retenir pour la soutenance : "Ce hook assure la synchronisation de l'état d'une commande unique avec tolérance de panne et repli gracieux."
// Module : Hooks Temps Réel React

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé récupérant les détails d'une commande unique.
 * @param {string} orderId - Identifiant de la commande
 * @returns {{ order: object|null, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      if (isMountedRef.current) {
        setOrder(null);
        setLoading(false);
      }
      return;
    }

    try {
      const res = await apiClient.get(ENDPOINTS.ORDER_BY_ID(orderId));
      const ord = res.data?.order || res.data;
      if (isMountedRef.current) {
        setOrder(ord || mockOrders.find((o) => o.id === orderId || o.orderCode === orderId) || mockOrders[0]);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('API useOrder indisponible, repli sur mockOrders :', err.message);
        const found = mockOrders.find((o) => o.id === orderId || o.orderId === orderId || o.orderCode === orderId) || mockOrders[0];
        setOrder(found);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrder();

    // Polling doux toutes les 10 secondes
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchOrder]);

  return { order, loading, error, refresh: fetchOrder };
}
