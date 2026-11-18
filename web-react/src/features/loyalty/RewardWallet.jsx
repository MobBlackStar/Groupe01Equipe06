// 💡 Concept & Analogie : Comme le compartiment zippé de votre portefeuille où sont rangés les bons d'achat et coupons de réduction prêts à être sortis à la caisse du magasin.
// 🔄 Comparaison React / Flutter : En React, les coupons sont présentés sous forme de cartes découpées avec bordure en tirets ; en Flutter, nous utilisons des `Card` avec des pastilles d'état colorées.
// 🎯 À retenir pour la soutenance : "Deux types de récompenses exclusives : -20% plafonné à 2 DT tous les 100 points, et le prestigieux Panier Surprise 100% Offert tous les 300 points."

import React from 'react';
import { Link } from 'react-router-dom';
import { REWARD_TYPES, REWARD_STATUS } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { EmptyState } from '../../components/ui/index.js';

export default function RewardWallet({
  rewards = [],
  className = '',
}) {
  const availableCount = rewards.filter(
    (r) => r.status === REWARD_STATUS.AVAILABLE || r.status === 'AVAILABLE'
  ).length;

  // Plafond affichable : jamais NaN / 0,000 DT
  const cap = (millimes, fallback) => {
    const n = Number(millimes);
    return formatTND(Number.isFinite(n) && n > 0 ? Math.round(n) : fallback);
  };

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h2 className="cs-title">Mes coupons</h2>
        <span className={`cs-pill ${availableCount > 0 ? 'cs-pill-red' : 'cs-pill-outline'} !min-h-[2.25rem] !px-4 !text-base`}>
          {availableCount} disponible{availableCount > 1 ? 's' : ''}
        </span>
      </div>

      {rewards.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="Aucun coupon pour l'instant"
          description="Sauvez votre premier repas pour accumuler des tampons et débloquer vos premières réductions."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewards.map((r) => {
            const isAvailable = r.status === REWARD_STATUS.AVAILABLE || r.status === 'AVAILABLE';
            const isLocked = r.status === 'LOCKED';
            const isFreeSurprise = r.type === REWARD_TYPES.FREE_SURPRISE || r.type === 'FREE_SURPRISE';
            const percentOff = Number.isFinite(Number(r.percentOff)) && Number(r.percentOff) > 0 ? Number(r.percentOff) : 20;
            const milestone = Number.isFinite(Number(r.milestone)) && Number(r.milestone) > 0 ? Number(r.milestone) : 100;

            const statusPill = isAvailable
              ? { className: 'cs-pill-leaf', label: 'Disponible' }
              : isLocked
              ? { className: 'cs-pill-mustard', label: 'Verrouillé en cours' }
              : { className: 'cs-pill-outline', label: 'Utilisé' };

            return (
              <article
                key={r.rewardId || r.id}
                className={`relative flex rounded-[1.25rem] border-2 border-[#111111] bg-[#FFFDF8] overflow-hidden ${
                  isAvailable ? 'cs-card-hover' : 'opacity-60'
                }`}
              >
                {/* Talon du coupon */}
                <div
                  className={`relative w-[104px] sm:w-[128px] shrink-0 flex flex-col items-center justify-center text-center px-2 py-6 ${
                    isFreeSurprise ? 'bg-[#FFD000] text-[#111111]' : 'bg-[#DA0711] text-[#FAF3E6]'
                  }`}
                >
                  {isFreeSurprise ? (
                    <>
                      <span className="text-4xl leading-none" aria-hidden="true">🎁</span>
                      <span className="cs-figure text-[34px] sm:text-[40px] mt-2">OFFERT</span>
                    </>
                  ) : (
                    <>
                      <span className="cs-figure text-[56px] sm:text-[64px]">-{percentOff}%</span>
                      <span className="font-sticker text-[14px] mt-1">Réduc</span>
                    </>
                  )}
                </div>

                {/* Perforation verticale avec encoches */}
                <div className="relative w-0 border-l-[3px] border-dotted border-[#111111]/40" aria-hidden="true">
                  <span className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#FAF3E6] border-2 border-[#111111]" />
                  <span className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#FAF3E6] border-2 border-[#111111]" />
                </div>

                {/* Corps du coupon */}
                <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
                  <span className={`cs-pill ${statusPill.className} self-start`}>{statusPill.label}</span>

                  <h3 className="cs-h3 mt-3">
                    {isFreeSurprise ? 'Panier surprise offert ✨' : `-${percentOff}% immédiat`}
                  </h3>

                  <p className="text-base text-[#5E5850] mt-1.5 leading-snug">
                    {isFreeSurprise
                      ? `Offert jusqu'à ${cap(r.maxDiscountMillimes, 4000)} sur un panier mystère.`
                      : `Plafonné à ${cap(r.maxDiscountMillimes, 2000)} sur votre commande.`}
                  </p>

                  <p className="cs-mono text-[13px] text-[#5E5850] mt-3">
                    Palier {milestone} EcoPoints · Non cumulable
                  </p>

                  {isAvailable && (
                    <Link to="/app/explore" className="cs-btn cs-btn-red cs-btn-block mt-5">
                      Utiliser →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
