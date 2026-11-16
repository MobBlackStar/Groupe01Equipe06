// 💡 Concept & Analogie : Comme une ligne téléphonique directe reliant le restaurant à la cafétéria de l'ESSECT, ce hook maintient une écoute Firestore en temps réel (onSnapshot) pour répercuter instantanément chaque nouvelle offre ou décrémentation de stock.
// 🔄 Comparaison React / Flutter : En React, `onSnapshot` déclenche la mise à jour du state React ; en Flutter, `FirestoreStreams.activeOffers()` alimente un `StreamBuilder`.
// 🎯 À retenir pour la soutenance : "Ce hook intègre un repli automatique gracieux vers nos données d'émulation (6 commerces de Montfleury) en cas de déconnexion réseau ou si le mode mock est activé."
// Module : Hooks Personnalisés React

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { mockOffers } from '../mocks/index.js';

/**
 * Hook personnalisé écoutant le flux des offres actives en temps réel.
 * @returns {{ offers: Array<object>, loading: boolean, error: Error|null }}
 */
export function useActiveOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

    // Mode simulation locale ou absence de configuration Firestore
    if (useMocks || !db) {
      setOffers(mockOffers);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'offers'),
        where('status', '==', 'ACTIVE')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ id: doc.id, ...data });
          });

          // Si la base est encore vierge, alimenter avec les offres types pour la démonstration
          setOffers(list.length > 0 ? list : mockOffers);
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore onSnapshot en échec, repli sur mockOffers :', err.message);
          setOffers(mockOffers);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Erreur d initialisation Firestore, bascule sur mockOffers :', err.message);
      setOffers(mockOffers);
      setLoading(false);
    }
  }, []);

  return { offers, loading, error };
}
