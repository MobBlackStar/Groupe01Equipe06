// 💡 Concept & Analogie : Comme la carte d'adhérent exclusive d'un club street-food de renom (StreetWok BOWL CLUB - image9.png), avec son inclinaison tactile -2deg, ses tampons rouge vif et ses coupons détachables.
// 🔄 Comparaison React / Flutter : En React, la page met en valeur le `DepthCard` avec inclinaison 3D et perforation ticket ; en Flutter, `loyalty_card_screen.dart` reproduit la même ambiance vintage.
// 🎯 À retenir pour la soutenance : "Quatre paliers végétaux vivants (GRAINE ➔ POUSSE ➔ ARBRE ➔ FORET) avec simulation interactive 1-clic pour démontrer le passage de seuils devant le jury."
// Module : Gamification & Fidélité (B3, I4)

import React, { useState } from 'react';
import StampGrid from './StampGrid.jsx';
import RewardWallet from './RewardWallet.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import { getLoyaltyTier, getNextRewardMilestone, evaluateMilestones } from '@shared/loyalty.js';
import { LOYALTY_TIERS, REWARD_TYPES, REWARD_STATUS } from '@shared/constants.js';
import { Flame, Sparkles, Award, Plus, RotateCcw, ShieldCheck, Ticket } from 'lucide-react';

export default function LoyaltyCardPage() {
  const { user } = useAuth();

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
  const filiere = user?.filiereId || '3A E-Business';

  const tier = getLoyaltyTier(ecoPoints);
  const nextMilestone = getNextRewardMilestone(ecoPoints);
  const prevMilestone = nextMilestone - 100;
  const progressInCycle = Math.min(100, Math.max(0, ((ecoPoints - prevMilestone) / 100) * 100));

  let tierIcon = '🌱';
  let tierLabel = 'GRAINE';
  let tierBadgeColor = 'bg-stone-800 text-stone-300';

  if (tier === LOYALTY_TIERS.FORET) {
    tierIcon = '🌲';
    tierLabel = 'FORÊT';
    tierBadgeColor = 'bg-[#2E6F40] text-white';
  } else if (tier === LOYALTY_TIERS.ARBRE) {
    tierIcon = '🌳';
    tierLabel = 'ARBRE';
    tierBadgeColor = 'bg-emerald-600 text-white';
  } else if (tier === LOYALTY_TIERS.POUSSE) {
    tierIcon = '🌿';
    tierLabel = 'POUSSE';
    tierBadgeColor = 'bg-[#F5C400] text-[#0E0D0C] font-black';
  }

  const handleAddPoints = (amount = 20) => {
    const newPoints = ecoPoints + amount;
    const newMeals = amount === 20 ? mealsRescued + 1 : mealsRescued + Math.floor(amount / 20);

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
    <div className="min-h-screen bg-[#0E0D0C] text-[#F6F1E7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* En-tête éditorial */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EE3124]/10 text-[#EE3124] text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Programme de Récompenses Anti-Gaspi</span>
            </div>
            <h1 className="font-oswald uppercase text-3xl sm:text-4xl font-black tracking-tight text-white">
              BOWL CLUB · CARTE DE FIDÉLITÉ
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-sans mt-1">
              Chaque repas sauvé alimente votre compteur de tampons et attribue des points à votre filière à l'ESSECT.
            </p>
          </div>

          {/* Badge Profil Étudiant */}
          <div className="p-3 rounded-2xl bg-[#161412] border border-white/10 text-right">
            <span className="text-[10px] font-mono uppercase text-stone-400 block">MEMBRE OFFICIEL :</span>
            <span className="font-bold text-white text-xs">{displayName}</span>
            <span className="text-[10px] text-[#F5C400] font-mono block">{filiere}</span>
          </div>
        </div>

        {/* =========================================================================
            STREETWOK BOWL CLUB STAMP CARD TILTED -2deg (image9.png)
            ========================================================================= */}
        <div className="relative py-2">
          <DepthCard
            maxTilt={8}
            perspective={1200}
            className="w-full relative transform -rotate-1 sm:-rotate-2 hover:rotate-0 transition-transform duration-500"
          >
            <StampGrid ecoPoints={ecoPoints} />
          </DepthCard>
        </div>

        {/* Métriques du Palier Actuel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#161412] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Palier Végétal</span>
              <p className="font-oswald text-xl font-black text-white mt-0.5 flex items-center gap-1.5">
                <span>{tierIcon}</span>
                <span>{tierLabel}</span>
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tierBadgeColor}`}>
              Niveau Actif
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#161412] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Repas Sauvés</span>
              <p className="font-oswald text-2xl font-black text-[#F5C400] mt-0.5">
                {mealsRescued} <span className="text-xs font-sans text-stone-400 font-normal">repas</span>
              </p>
            </div>
            <span className="p-2 rounded-xl bg-white/5 text-[#F5C400]">
              🥗
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#161412] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Prochain Palier</span>
              <p className="font-oswald text-2xl font-black text-[#EE3124] mt-0.5">
                {nextMilestone} <span className="text-xs font-sans text-stone-400 font-normal">pts</span>
              </p>
            </div>
            <span className="p-2 rounded-xl bg-white/5 text-[#EE3124]">
              🎯
            </span>
          </div>
        </div>

        {/* Barre de Progression vers le Prochain Coupon */}
        <div className="p-5 rounded-3xl bg-[#161412] border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-white font-bold">Progression vers le prochain coupon :</span>
            <span className="text-[#F5C400] font-black">{Math.round(progressInCycle)}% ({ecoPoints} / {nextMilestone} pts)</span>
          </div>
          <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#F5C400] to-[#EE3124] h-full transition-all duration-700"
              style={{ width: `${progressInCycle}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-stone-500">
            <span>Palier précédent ({prevMilestone} pts)</span>
            <span>Objectif coupon ({nextMilestone} pts)</span>
          </div>
        </div>

        {/* Coupons et Récompenses Débloqués */}
        <RewardWallet rewards={rewards} />

        {/* Panneau de Simulation Démo pour le Jury */}
        <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5C400]" />
            <span className="text-xs font-mono font-bold text-stone-300">
              Contrôles de Simulation Démo (Jury Soutenance) :
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddPoints(20)}
              className="px-3 py-1.5 rounded-xl bg-[#EE3124] text-white font-mono text-xs font-bold hover:bg-[#d6281c] transition-all flex items-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+1 Repas (20 pts)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddPoints(100)}
              className="px-3 py-1.5 rounded-xl bg-[#F5C400] text-[#0E0D0C] font-mono text-xs font-black hover:bg-[#e0b300] transition-all flex items-center gap-1 shadow-md"
            >
              <Award className="w-3.5 h-3.5" />
              <span>+100 pts (Palier)</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              title="Réinitialiser"
              className="p-1.5 rounded-xl bg-white/10 text-stone-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
