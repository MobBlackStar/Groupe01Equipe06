// 💡 Concept & Analogie : Comme une liaison talkie-walkie en continu qui prévient l'étudiant à la milliseconde près dès que le commerçant a bipé son billet pour valider le retrait.
// 🔄 Comparaison React / Flutter : Utilise `onSnapshot` de Firestore JS SDK sous React ; sous Flutter, `FirestoreStreams.order(orderId)` produit un `Stream<OrderModel>`.
// 🎯 À retenir pour la soutenance : "Ce listener réactif élimine tout rechargement manuel de la page : dès que le QR code est scanné, l'état de la commande bascule instantanément vers COMPLETED."
// Module : Hooks Temps Réel React

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { mockOrders } from '../mocks/index.js';

/**
 * Hook personnalisé d'écoute temps réel sur une commande unique.
 * @param {string} orderId - Identifiant du document commande Firestore
 * @returns {{ order: object|null, loading: boolean, error: Error|null }}
 */
export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

    // Repli de démonstration hors ligne ou sans Firebase initialisé
    if (useMocks || !db) {
      const found = mockOrders.find((o) => o.orderId === orderId) || mockOrders[0] || null;
      setOrder(found);
      setLoading(false);
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(
        orderRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setOrder({ id: snapshot.id, orderId: snapshot.id, ...snapshot.data() });
          } else {
            // Document inexistant
            setOrder(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Erreur listener Firestore useOrder :', err.message);
          setError(err);
          // Repli sur mock
          const found = mockOrders.find((o) => o.orderId === orderId) || mockOrders[0];
          setOrder(found);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Initialisation useOrder échouée :', err.message);
      setError(err);
      setOrder(mockOrders[0] || null);
      setLoading(false);
    }
  }, [orderId]);

  return { order, loading, error };
}
