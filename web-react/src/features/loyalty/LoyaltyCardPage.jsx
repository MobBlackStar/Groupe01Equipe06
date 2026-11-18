// 💡 Concept & Analogie : Comme la carte d'adhérent exclusive d'un club street-food de renom (StreetWok BOWL CLUB / CAMPUSSAVE CLUB - image9.png), avec son inclinaison tactile -2deg, ses tampons rouge vif et ses coupons détachables.
// 🔄 Comparaison React / Flutter : En React, la page met en valeur le `DepthCard` avec inclinaison 3D et perforation ticket ; en Flutter, `loyalty_card_screen.dart` reproduit la même ambiance vintage.
// 🎯 À retenir pour la soutenance : "Quatre paliers végétaux vivants (GRAINE ➔ POUSSE ➔ ARBRE ➔ FORET) avec simulation interactive 1-clic pour démontrer le passage de seuils devant le jury."
// Module : Gamification & Fidélité (B3, I4)

import React, { useState, useEffect } from 'react';
import StampGrid from './StampGrid.jsx';
import RewardWallet from './RewardWallet.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DepthCard } from '../../components/common/DepthCard.jsx';
import { getLoyaltyTier, getNextRewardMilestone, evaluateMilestones } from '@shared/loyalty.js';
import { LOYALTY_TIERS, REWARD_TYPES, REWARD_STATUS } from '@shared/constants.js';
import { Sparkles, Award, Plus, RotateCcw } from 'lucide-react';

export default function LoyaltyCardPage() {
  const { user, profile } = useAuth();

  // Les points du profil vivent dans `profile.ecoPoints` (pas ecoPointsBalance) ; 240 = valeur démo.
  const profilePoints = Number(profile?.ecoPoints);
  const profileMeals = Number(profile?.totalMealsRescued);
  const hasProfilePoints = Number.isFinite(profilePoints) && profilePoints >= 0;
  const hasProfileMeals = Number.isFinite(profileMeals) && profileMeals >= 0;

  const [ecoPoints, setEcoPoints] = useState(hasProfilePoints ? profilePoints : 240);
  const [mealsRescued, setMealsRescued] = useState(hasProfileMeals ? profileMeals : 12);

  // Synchronise la carte quand le profil arrive après le premier rendu
  useEffect(() => {
    if (hasProfilePoints) setEcoPoints(profilePoints);
    if (hasProfileMeals) setMealsRescued(profileMeals);
  }, [hasProfilePoints, profilePoints, hasProfileMeals, profileMeals]);
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

  const displayName = profile?.displayName || user?.displayName || 'Yassine Trabelsi';
  const filiere = profile?.filiereId || user?.filiereId || '3A E-Business';

  const safePoints = Number.isFinite(ecoPoints) ? ecoPoints : 0;
  const safeMeals = Number.isFinite(mealsRescued) ? mealsRescued : 0;

  const tier = getLoyaltyTier(safePoints);
  const nextMilestone = getNextRewardMilestone(safePoints);
  const prevMilestone = nextMilestone - 100;
  const progressInCycle = Math.min(100, Math.max(0, ((safePoints - prevMilestone) / 100) * 100));
  const pointsToCoupon = Math.max(0, nextMilestone - safePoints);

  let tierIcon = '🌱';
  let tierLabel = 'GRAINE';
  let tierBadgeColor = 'cs-pill-outline';

  if (tier === LOYALTY_TIERS.FORET) {
    tierIcon = '🌲';
    tierLabel = 'FORÊT';
    tierBadgeColor = 'cs-pill-leaf';
  } else if (tier === LOYALTY_TIERS.ARBRE) {
    tierIcon = '🌳';
    tierLabel = 'ARBRE';
    tierBadgeColor = 'cs-pill-leaf';
  } else if (tier === LOYALTY_TIERS.POUSSE) {
    tierIcon = '🌿';
    tierLabel = 'POUSSE';
    tierBadgeColor = 'cs-pill-mustard';
  }

  const handleAddPoints = (amount = 20) => {
    const newPoints = safePoints + amount;
    const newMeals = amount === 20 ? safeMeals + 1 : safeMeals + Math.floor(amount / 20);

    const newUnlocked = evaluateMilestones(safePoints, newPoints);
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
    <div className="cs-container cs-page text-[#111111]">
      {/* En-tête éditorial */}
      <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="max-w-3xl">
          <p className="cs-eyebrow mb-3">CampusSave Club · Fidélité</p>
          <h1 className="cs-display">Ma carte de fidélité</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Chaque repas sauvé tamponne votre carte et rapporte des points à votre filière à l'ESSECT.
          </p>
        </div>

        {/* Profil étudiant */}
        <div className="flex items-center gap-4">
          <span className="cs-dot-badge !w-14 !h-14 !text-2xl shrink-0" aria-hidden="true">
            {tierIcon}
          </span>
          <div className="min-w-0">
            <span className="cs-label block">Membre officiel</span>
            <span className="cs-h3 block line-clamp-2">{displayName}</span>
            <span className="cs-mono text-[14px] font-bold text-[#DA0711]">{filiere}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start mb-16 lg:mb-24">
        {/* =========================================================================
            CAMPUSSAVE CLUB STAMP CARD (carte papier tamponnée)
            ========================================================================= */}
        <div className="py-2">
          <DepthCard maxTilt={6} perspective={1200} glare={false} className="w-full">
            <StampGrid ecoPoints={safePoints} className="-rotate-1 sm:-rotate-[1.5deg]" />
          </DepthCard>
        </div>

        {/* Métriques du Palier Actuel */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="cs-stat col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="cs-label">Palier végétal</span>
                <span className={`cs-pill ${tierBadgeColor}`}>Niveau actif</span>
              </div>
              <span className="cs-stat-value flex items-center gap-3">
                <span className="text-[0.7em]" aria-hidden="true">{tierIcon}</span>
                <span>{tierLabel}</span>
              </span>
            </div>

            <div className="cs-stat">
              <span className="cs-label">EcoPoints</span>
              <span className="cs-stat-value text-[#DA0711]">{safePoints}</span>
            </div>

            <div className="cs-stat">
              <span className="cs-label">Repas sauvés</span>
              <span className="cs-stat-value">{safeMeals}</span>
            </div>
          </div>

          {/* Barre de Progression vers le Prochain Coupon */}
          <div className="cs-card p-6 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="cs-label block">Prochain coupon</span>
                <span className="cs-figure block text-[44px] mt-1">
                  {nextMilestone} <span className="text-[0.55em] text-[#5E5850]">pts</span>
                </span>
              </div>
              <span className="cs-figure text-[44px] text-[#DA0711]">{Math.round(progressInCycle)}%</span>
            </div>
            <div
              className="w-full bg-[#FAF3E6] h-3.5 rounded-full overflow-hidden mt-5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressInCycle)}
            >
              <div
                className="bg-[#DA0711] h-full rounded-full transition-all duration-700"
                style={{ width: `${progressInCycle}%` }}
              />
            </div>
            <p className="text-base text-[#5E5850] mt-4">
              Encore <strong className="text-[#111111]">{pointsToCoupon} pts</strong> pour débloquer votre coupon
              ({prevMilestone} → {nextMilestone} pts).
            </p>
          </div>
        </div>
      </div>

      {/* Coupons et Récompenses Débloqués */}
      <RewardWallet rewards={rewards} className="mb-16 lg:mb-24" />

      {/* Panneau de Simulation Démo pour le Jury */}
      <section className="pt-8 border-t-2 border-[#111111] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#DA0711] shrink-0" aria-hidden="true" />
          <div>
            <p className="cs-h3">Simulation démo</p>
            <p className="text-base text-[#5E5850]">Contrôles réservés à la soutenance (jury).</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => handleAddPoints(20)} className="cs-btn cs-btn-red">
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>+1 repas (20 pts)</span>
          </button>

          <button type="button" onClick={() => handleAddPoints(100)} className="cs-btn cs-btn-mustard">
            <Award className="w-5 h-5" aria-hidden="true" />
            <span>+100 pts (palier)</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            title="Réinitialiser"
            aria-label="Réinitialiser la démo"
            className="cs-icon-btn !w-[52px] !h-[52px]"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
