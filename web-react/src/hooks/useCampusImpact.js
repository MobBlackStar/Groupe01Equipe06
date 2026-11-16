// 💡 Concept & Analogie : Comme un baromètre écologique en temps réel qui capte les flux de CO2 et les agrège pour l'ensemble du campus, ce hook fournit les données pour la page publique `/impact`.
// 🔄 Comparaison React / Flutter : Équivalent direct du service Stream d'impact consommé par `ImpactScreen` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce hook assure une résilience totale : il interroge l'API REST `/impact/global` et `/impact/filieres`, tout en fournissant des données de secours complètes si le réseau est indisponible."
// Module : Impact Écologique & Responsabilité Sociétale

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api.js';
import { ENDPOINTS } from '../lib/endpoints.js';

// Données de secours par défaut en cas d'indisponibilité réseau
const FALLBACK_IMPACT = {
  ordersCompleted: 147,
  mealsRescued: 167,
  foodSavedGrams: 66800,
  co2SavedGrams: 167000,
  moneySavedMillimes: 524000,
  studentsParticipating: 112,
  merchantsParticipating: 6,
};

const FALLBACK_EQUIVALENCES = {
  smartphonesCharged: 16700,
  kmCarAvoided: 684.43,
};

const FALLBACK_FILIERES = [
  {
    filiereId: 'EBUSINESS_3A',
    label: '3ème E-Business (Promotion Pilote)',
    studentsCount: 38,
    ordersCompleted: 45,
    mealsRescued: 52,
    foodSavedGrams: 20800,
    co2SavedGrams: 52000,
    ecoPointsTotal: 1240,
  },
  {
    filiereId: 'FINANCE',
    label: 'Licence & Master Finance',
    studentsCount: 65,
    ordersCompleted: 34,
    mealsRescued: 39,
    foodSavedGrams: 15600,
    co2SavedGrams: 39000,
    ecoPointsTotal: 920,
  },
  {
    filiereId: 'MARKETING',
    label: 'Licence & Master Marketing',
    studentsCount: 52,
    ordersCompleted: 28,
    mealsRescued: 31,
    foodSavedGrams: 12400,
    co2SavedGrams: 31000,
    ecoPointsTotal: 760,
  },
  {
    filiereId: 'GESTION',
    label: 'Sciences de Gestion',
    studentsCount: 70,
    ordersCompleted: 22,
    mealsRescued: 25,
    foodSavedGrams: 10000,
    co2SavedGrams: 25000,
    ecoPointsTotal: 580,
  },
  {
    filiereId: 'COMPTABILITE',
    label: 'Comptabilité & CCA',
    studentsCount: 45,
    ordersCompleted: 18,
    mealsRescued: 20,
    foodSavedGrams: 8000,
    co2SavedGrams: 20000,
    ecoPointsTotal: 490,
  },
];

export function useCampusImpact(days = 14) {
  const [globalImpact, setGlobalImpact] = useState(FALLBACK_IMPACT);
  const [equivalences, setEquivalences] = useState(FALLBACK_EQUIVALENCES);
  const [dailySeries, setDailySeries] = useState([]);
  const [filieres, setFilieres] = useState(FALLBACK_FILIERES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImpactData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [globalRes, filieresRes] = await Promise.all([
        apiClient.get(`${ENDPOINTS.IMPACT_GLOBAL || '/impact/global'}?days=${days}`),
        apiClient.get(ENDPOINTS.IMPACT_FILIERES || '/impact/filieres'),
      ]);

      if (globalRes.data?.global) {
        setGlobalImpact(globalRes.data.global);
      }
      if (globalRes.data?.equivalences) {
        setEquivalences(globalRes.data.equivalences);
      }
      if (globalRes.data?.dailySeries) {
        setDailySeries(globalRes.data.dailySeries);
      }
      if (filieresRes.data?.filieres) {
        setFilieres(filieresRes.data.filieres);
      }
    } catch (err) {
      // Repli silencieux et élégant sur les données de démonstration
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchImpactData();
  }, [fetchImpactData]);

  return {
    globalImpact,
    equivalences,
    dailySeries,
    filieres,
    loading,
    error,
    refresh: fetchImpactData,
  };
}
