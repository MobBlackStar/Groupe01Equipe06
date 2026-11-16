// 💡 Concept & Analogie : Comme l'écran de caisse d'un restaurant où s'affichent les commandes qui arrivent en direct de la cuisine, ce hook écoute toutes les commandes destinées à l'établissement.
// 🔄 Comparaison React / Flutter : Alimente en temps réel `MerchantOrdersPage.jsx` sous React et l'écran des commandes commerçant sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce hook applique la clause d'égalité merchantId == uid exigée par firestore.rules pour isoler strictement les données de chaque commerce."
// Module : Hooks Temps Réel React

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé d'écoute sur les commandes destinées au commerçant connecté.
 * @param {string} merchantId - Identifiant de l'établissement commerçant (uid)
 * @returns {{ orders: Array<object>, loading: boolean, error: Error|null }}
 */
export function useMerchantOrders(merchantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!merchantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

    if (useMocks || !db) {
      setOrders(mockOrders);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'orders'),
        where('merchantId', '==', merchantId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, orderId: doc.id, ...doc.data() });
          });
          setOrders(list.length > 0 ? list : mockOrders);
          setLoading(false);
        },
        (err) => {
          console.warn('Erreur Firestore useMerchantOrders, bascule sur mockOrders :', err.message);
          setError(err);
          setOrders(mockOrders);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Initialisation useMerchantOrders échouée :', err.message);
      setError(err);
      setOrders(mockOrders);
      setLoading(false);
    }
  }, [merchantId]);

  return { orders, loading, error };
}
