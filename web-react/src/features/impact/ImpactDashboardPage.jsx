// 💡 Concept & Analogie : Comme le grand panneau lumineux à l'entrée d'une smart-city affichant en direct l'énergie verte produite et les déchets recyclés par l'ensemble des citoyens.
// 🔄 Comparaison React / Flutter : En React, `ImpactDashboardPage` est une page vitrine responsive haute fidélité Recharts ; en Flutter, `ImpactScreen` adapte cette vue pour un affichage sur smartphone avec podium d'honneur.
// 🎯 À retenir pour la soutenance : "Cette page publique accessible sans compte permet d'ouvrir notre présentation devant le jury en affichant l'impact sociétal et environnemental global de l'ESSECT."

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Leaf,
  ShoppingBag,
  Coins,
  Users,
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import EquivalenceTiles from './EquivalenceTiles.jsx';
import FiliereLeaderboard from './FiliereLeaderboard.jsx';
import { LineChartCard } from '../../components/charts/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Données consolidées de démonstration pour le campus de l'ESSECT
const DEMO_GLOBAL_IMPACT = {
  stats: {
    ordersCompleted: 1420,
    mealsRescued: 1680,
    foodSavedGrams: 580000, // 580 kg
    co2SavedGrams: 1450000, // 1.45 t
    moneySavedMillimes: 5240000, // 5,240.000 DT
    studentsParticipating: 620,
    merchantsParticipating: 18,
  },
  trend14d: [
    { label: 'J1', value: 45, co2: 112 },
    { label: 'J2', value: 92, co2: 230 },
    { label: 'J3', value: 140, co2: 350 },
    { label: 'J4', value: 198, co2: 495 },
    { label: 'J5', value: 260, co2: 650 },
    { label: 'J6', value: 330, co2: 825 },
    { label: 'J7', value: 395, co2: 987 },
    { label: 'J8', value: 470, co2: 1175 },
    { label: 'J9', value: 550, co2: 1375 },
    { label: 'J10', value: 640, co2: 1600 },
    { label: 'J11', value: 735, co2: 1837 },
    { label: 'J12', value: 830, co2: 2075 },
    { label: 'J13', value: 940, co2: 2350 },
    { label: 'J14', value: 1050, co2: 2625 },
  ],
};

export default function ImpactDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(DEMO_GLOBAL_IMPACT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchImpact() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.IMPACT_GLOBAL);
        if (isMounted && res.data) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            stats: { ...prev.stats, ...(res.data.stats || {}) },
          }));
        }
      } catch (err) {
        console.warn('API Impact hors-ligne, données démo ESSECT actives :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchImpact();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = data.stats || DEMO_GLOBAL_IMPACT.stats;

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* En-tête Héroïque */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-black tracking-wide">
            <Globe className="w-3.5 h-3.5" />
            <span>BILAN ÉCOLOGIQUE & SOLIDAIRE DU CAMPUS ESSECT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Chaque repas sauvé est une victoire pour la planète 🌱
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Mesurez l'empreinte environnementale consolidée de notre communauté : aliments détournés du gaspillage, pouvoir d'achat préservé pour les étudiants et gaz à effet de serre épargnés.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/app/explore"
              className="px-6 py-3 rounded-2xl bg-[#CCFF00] text-black font-extrabold text-sm hover:bg-[#b8e600] transition-colors flex items-center gap-2 shadow-xl shadow-[#CCFF00]/15"
            >
              <span>Sauver un repas à Montfleury</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="px-6 py-3 rounded-2xl bg-[#161920] border border-white/10 hover:border-white/20 text-white font-bold text-sm transition-colors"
              >
                Rejoindre le mouvement
              </Link>
            )}
          </div>
        </div>

        {/* 6 Grands Compteurs Animés de Synthèse */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats.mealsRescued.toLocaleString('fr-FR')}
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Repas Sauvés</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-[#FF5500]/10 text-[#FF5500] flex items-center justify-center mb-2">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#FF5500]">
              {formatTND(stats.moneySavedMillimes)}
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Épargne Étudiante</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {(stats.foodSavedGrams / 1000).toFixed(0)} kg
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Nourriture Sauvée</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[#CCFF00]">
              {(stats.co2SavedGrams / 1000).toFixed(0)} kg
            </span>
            <p className="text-[11px] font-semibold text-slate-400">CO₂e Évité</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats.studentsParticipating}
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Étudiants Actifs</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#161920] border border-white/10 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-2">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stats.merchantsParticipating}
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Commerces Partenaires</p>
          </div>
        </div>

        {/* Section 1 : Tuiles d'Équivalences Scientifiques FAO / EPA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#CCFF00]" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ce que ces chiffres représentent concrètement
            </h2>
          </div>
          <EquivalenceTiles
            co2SavedGrams={stats.co2SavedGrams}
            foodSavedGrams={stats.foodSavedGrams}
          />
        </div>

        {/* Section 2 : Graphique d'Impact Temporel Recharts sur 14 Jours */}
        <div className="space-y-4">
          <LineChartCard
            title="Dynamique Cumulative des Repas Sauvés (14 Derniers Jours)"
            subtitle="Accélération des sauvetages alimentaires sur le quartier de Montfleury"
            data={data.trend14d || DEMO_GLOBAL_IMPACT.trend14d}
            xKey="label"
            yKey="value"
            name="Repas Sauvés"
            strokeColor="#CCFF00"
            gradientId="impactGlobalGradient"
            yFormatter={(val) => `${val}`}
            tooltipFormatter={(val) => `${val} repas`}
          />
        </div>

        {/* Section 3 : Challenge Inter-Filières ESSECT */}
        <div className="space-y-4">
          <FiliereLeaderboard userFiliere={user?.filiere} />
        </div>
      </div>
    </div>
  );
}
