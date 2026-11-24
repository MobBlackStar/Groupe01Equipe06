// 💡 Concept & Analogie : Comme l'écran de caisse d'un restaurant où s'affichent les commandes qui arrivent en direct de la cuisine, ce hook récupère les commandes destinées à l'établissement.
// 🔄 Comparaison React / Flutter : Alimente `MerchantOrdersPage.jsx` sous React et l'écran des commandes commerçant sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce hook interroge l'API sécurisée `/merchants/me/orders` avec rafraîchissement périodique et repli de secours."
// Module : Hooks Temps Réel React

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé récupérant les commandes destinées au commerçant connecté.
 * @param {string} merchantId - Identifiant de l'établissement commerçant (uid)
 * @returns {{ orders: Array<object>, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useMerchantOrders(merchantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchMerchantOrders = useCallback(async () => {
    const isReal = localStorage.getItem('campussave_auth_mode') === 'REAL';
    if (!merchantId) {
      if (isMountedRef.current) {
        setOrders([]);
        setLoading(false);
      }
      return;
    }

    try {
      const res = await apiClient.get(ENDPOINTS.MERCHANT_ORDERS);
      const list = res.data?.orders || res.data || [];
      if (isMountedRef.current) {
        if (Array.isArray(list)) {
          setOrders(list.length > 0 || isReal ? list : mockOrders);
        } else {
          setOrders([]);
        }
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('API useMerchantOrders indisponible, repli sur mockOrders :', err.message);
        setOrders(isReal ? [] : mockOrders);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [merchantId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMerchantOrders();

    const interval = setInterval(() => {
      fetchMerchantOrders();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchMerchantOrders]);

  return { orders, loading, error, refresh: fetchMerchantOrders };
}
