// 💡 Concept & Analogie : Comme une ligne téléphonique directe reliant le restaurant à la cafétéria de l'ESSECT, ce hook récupère les offres actives et rafraîchit périodiquement le catalogue.
// 🔄 Comparaison React / Flutter : En React, ce hook utilise l'API REST avec un polling doux de 15s et repli gracieux sur mockOffers ; en Flutter, `FirestoreStreams.activeOffers()` alimente un StreamBuilder.
// 🎯 À retenir pour la soutenance : "Ce hook intègre un repli automatique gracieux vers nos données d'émulation (6 commerces de Montfleury) en cas de déconnexion réseau ou si le mode mock est activé."
// Module : Hooks Personnalisés React

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';
import { mockOffers } from '../mocks/index.js';

/**
 * Hook personnalisé récupérant les offres actives avec rafraîchissement périodique.
 * @returns {{ offers: Array<object>, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useActiveOffers() {
  const [offers, setOffers] = useState(mockOffers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.OFFERS);
      const list = res.data?.offers || res.data || [];
      if (isMountedRef.current) {
        setOffers(Array.isArray(list) && list.length > 0 ? list : mockOffers);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.warn('API useActiveOffers indisponible, repli sur mockOffers :', err.message);
        setOffers(mockOffers);
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOffers();

    // Polling doux de 15 secondes
    const interval = setInterval(() => {
      fetchOffers();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchOffers]);

  return { offers, loading, error, refresh: fetchOffers };
}
