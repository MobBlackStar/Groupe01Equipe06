// 💡 Concept & Analogie : Comme le pass VIP éco-responsable de l'université ou la carte Gold d'un grand voyageur, elle célèbre l'engagement écologique concret de l'étudiant à chaque repas sauvé.
// 🔄 Comparaison React / Flutter : En React, la carte de fidélité utilise un gradient métallique avec reflet holographique CSS ; en Flutter, `LoyaltyCardScreen` utilise un `Card` à coins arrondis et ombre portée.
// 🎯 À retenir pour la soutenance : "Quatre paliers végétaux vivants (GRAINE ➔ POUSSE ➔ ARBRE ➔ FORET) pour inciter les étudiants de l'ESSECT à persévérer dans la lutte contre le gaspillage alimentaire."

import React, { useState } from 'react';
import StampGrid from './StampGrid.jsx';
import RewardWallet from './RewardWallet.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getLoyaltyTier, getNextRewardMilestone, evaluateMilestones } from '@shared/loyalty.js';
import { LOYALTY_TIERS, REWARD_TYPES, REWARD_STATUS } from '@shared/constants.js';

export default function LoyaltyCardPage() {
  const { user } = useAuth();

  // État interactif de démonstration pour le jury
  const [ecoPoints, setEcoPoints] = useState(240);
  const [mealsRescued, setMealsRescued] = useState(12);
  const [rewards, setRewards] = useState([
    {
      rewardId: 'rw-100-demo',
      milestone: 100,
      type: REWARD_TYPES.PERCENT_OFF,
      status: REWARD_STATUS.USED,
      percentOff: 20,
      maxDiscountMillimes: 2000,
    },
    {
      rewardId: 'rw-200-demo',
      milestone: 200,
      type: REWARD_TYPES.PERCENT_OFF,
      status: REWARD_STATUS.AVAILABLE,
      percentOff: 20,
      maxDiscountMillimes: 2000,
    },
  ]);

  const displayName = user?.displayName || 'Yassine Trabelsi';
  const filiere = user?.filiereId || 'EBUSINESS_3A';

  // Calcul du palier et des seuils
  const tier = getLoyaltyTier(ecoPoints);
  const nextMilestone = getNextRewardMilestone(ecoPoints);
  const prevMilestone = nextMilestone - 100;
  const progressInCycle = Math.min(100, Math.max(0, ((ecoPoints - prevMilestone) / 100) * 100));

  // Configuration visuelle du palier
  let tierIcon = '🌱';
  let tierLabel = 'Graine';
  let tierDesc = 'Début de l aventure éco-citoyenne';
  let cardBg = 'from-[#161920] via-slate-900 to-[#0D0F12] border-emerald-500/30';

  if (tier === LOYALTY_TIERS.FORET) {
    tierIcon = '🌲';
    tierLabel = 'Forêt';
    tierDesc = 'Maître incontesté de l anti-gaspillage';
    cardBg = 'from-emerald-950/40 via-green-900/30 to-[#0D0F12] border-emerald-400/60';
  } else if (tier === LOYALTY_TIERS.ARBRE) {
    tierIcon = '🌳';
    tierLabel = 'Arbre';
    tierDesc = 'Pilier écologique du campus ESSECT';
    cardBg = 'from-emerald-900/30 via-slate-900 to-[#0D0F12] border-emerald-500/50';
  } else if (tier === LOYALTY_TIERS.POUSSE) {
    tierIcon = '🌿';
    tierLabel = 'Pousse';
    tierDesc = 'Sauveur régulier de repas à Montfleury';
    cardBg = 'from-slate-800/60 via-slate-900 to-[#0D0F12] border-[#CCFF00]/40';
  }

  // Simulation interactive d'un sauvetage (+20 pts)
  const handleAddPoints = (amount = 20) => {
    const newPoints = ecoPoints + amount;
    const newMeals = amount === 20 ? mealsRescued + 1 : mealsRescued + Math.floor(amount / 20);

    // Détection des récompenses franchies
    const newUnlocked = evaluateMilestones(ecoPoints, newPoints);
    if (newUnlocked.length > 0) {
      setRewards((prev) => [...prev, ...newUnlocked]);
    }

    setEcoPoints(newPoints);
    setMealsRescued(newMeals);
  };

  const handleResetDemo = () => {
    setEcoPoints(240);
    setMealsRescued(12);
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Carte de Fidélité Éco-Digitale
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Chaque repas sauvé alimente votre compteur de points et fait grandir votre arbre écologique.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 self-start sm:self-auto font-mono">
            Campus ESSECT • 2026
          </div>
        </div>

        {/* 1. La Carte Virtuelle Apple Pass / Métallique */}
        <div className={`relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${cardBg} border-2 shadow-2xl overflow-hidden`}>
          {/* Reflet lumineux en arrière-plan */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-56 sm:h-64">
            {/* Haut de la carte : Logo ESSECT & Puce NFC */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-mono text-[#CCFF00] font-bold block">
                  CAMPUSSAVE PASS VIP
                </span>
                <span className="font-black text-lg text-white">
                  ESSECT SOLIDARITÉ
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-6 rounded bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-[10px] font-mono text-amber-300">
                  CHIP
                </div>
                <span className="text-xs text-slate-400 font-mono">📡</span>
              </div>
            </div>

            {/* Centre de la carte : Niveau d'arbre et Solde */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-5xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  {tierIcon}
                </span>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Palier Éco-Citoyen</span>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    {tierLabel}
                  </span>
                  <span className="text-[11px] text-[#CCFF00] block">{tierDesc}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Solde EcoPoints</span>
                <span className="text-3xl sm:text-4xl font-black text-[#CCFF00] font-mono">
                  {ecoPoints}
                </span>
                <span className="text-[10px] text-slate-400 block">points cumulés</span>
              </div>
            </div>

            {/* Bas de la carte : Nom étudiant, Filière et Repas */}
            <div className="flex items-end justify-between pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="font-bold text-white block text-sm">{displayName}</span>
                <span className="text-[11px] text-slate-400 font-mono">Filière : {filiere}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Repas sauvés</span>
                <span className="font-black text-white text-base">🌱 {mealsRescued} repas</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Barre de progression vers le prochain palier */}
        <div className="p-4 rounded-2xl bg-[#161920] border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Progression vers le palier suivant :</span>
            <span className="font-bold text-[#CCFF00] font-mono">
              {ecoPoints} / {nextMilestone} pts ({Math.round(progressInCycle)}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressInCycle}%` }}
              className="bg-gradient-to-r from-[#CCFF00] to-emerald-400 h-full transition-all duration-500 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Palier précédent ({prevMilestone} pts)</span>
            <span>Récompense débloquée à {nextMilestone} pts</span>
          </div>
        </div>

        {/* 3. Grille des 5 tampons éco-digitaux */}
        <StampGrid ecoPoints={ecoPoints} />

        {/* 4. Portefeuille des Récompenses */}
        <RewardWallet rewards={rewards} />

        {/* 5. Banc d'essai interactif pour la soutenance (Démonstration Jury) */}
        <div className="p-5 rounded-2xl bg-[#0D0F12] border border-dashed border-[#CCFF00]/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#CCFF00] flex items-center gap-1.5">
              <span>⚡</span>
              <span>Banc de Démonstration Live (Soutenance)</span>
            </span>
            <button
              type="button"
              onClick={handleResetDemo}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Réinitialiser à 240 pts
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Cliquez ci-dessous pour simuler en temps réel la validation d'un sauvetage ou le franchissement d'un palier :
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleAddPoints(20)}
              className="px-3.5 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-[#CCFF00] hover:text-black transition-colors"
            >
              +20 EcoPoints (1 repas sauvé)
            </button>

            <button
              type="button"
              onClick={() => handleAddPoints(60)}
              className="px-3.5 py-2 rounded-xl bg-[#CCFF00]/20 border border-[#CCFF00]/50 text-[#CCFF00] font-bold text-xs hover:bg-[#CCFF00] hover:text-black transition-colors"
            >
              +60 EcoPoints (Franchir le palier 300 pts ✨)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
