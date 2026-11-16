// 💡 Concept & Analogie : Comme le carnet de commandes d'un client où s'affichent l'historique complet et les réservations en cours, toujours synchronisé avec les données du serveur.
// 🔄 Comparaison React / Flutter : Alimente les onglets de statut de `MyOrdersPage.jsx` sous React et `my_orders_screen.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce hook applique la clause d'égalité studentId == uid exigée par nos règles de sécurité Firestore pour autoriser la lecture temps réel."
// Module : Hooks Temps Réel React

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé d'écoute sur toutes les commandes de l'étudiant connecté.
 * @param {string} studentId - Identifiant de l'étudiant connecté (uid)
 * @returns {{ orders: Array<object>, loading: boolean, error: Error|null }}
 */
export function useMyOrders(studentId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
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
        where('studentId', '==', studentId),
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
          console.warn('Erreur Firestore useMyOrders, bascule sur mockOrders :', err.message);
          setError(err);
          setOrders(mockOrders);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Initialisation useMyOrders échouée :', err.message);
      setError(err);
      setOrders(mockOrders);
      setLoading(false);
    }
  }, [studentId]);

  return { orders, loading, error };
}
