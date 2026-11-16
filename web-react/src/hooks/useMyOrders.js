// 💡 Concept & Analogie : Comme le carnet de commandes d'un client où s'affichent l'historique complet et les réservations en cours, synchronisé avec les données du serveur.
// 🔄 Comparaison React / Flutter : Alimente les onglets de statut de `MyOrdersPage.jsx` sous React et `my_orders_screen.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce hook interroge l'API REST `/orders/my-orders` de manière stable et périodique avec repli sur mockOrders."
// Module : Hooks Temps Réel React

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé récupérant les commandes de l'étudiant connecté.
 * @param {string} studentId - Identifiant de l'étudiant connecté (uid)
 * @returns {{ orders: Array<object>, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useMyOrders(studentId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!studentId) {
      if (isMountedRef.current) {
        setOrders([]);
        setLoading(false);
      }
      return;
    }

    try {
      const res = await apiClient.get('/orders/my-orders');
      const list = res.data?.orders || res.data || [];
      if (isMountedRef.current) {
        setOrders(Array.isArray(list) && list.length > 0 ? list : mockOrders);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('API useMyOrders indisponible, repli sur mockOrders :', err.message);
        setOrders(mockOrders);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [studentId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchOrders]);

  return { orders, loading, error, refresh: fetchOrders };
}
