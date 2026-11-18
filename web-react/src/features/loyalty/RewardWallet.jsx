// 💡 Concept & Analogie : Comme le compartiment zippé de votre portefeuille où sont rangés les bons d'achat et coupons de réduction prêts à être sortis à la caisse du magasin.
// 🔄 Comparaison React / Flutter : En React, les coupons sont présentés sous forme de cartes découpées avec bordure en tirets ; en Flutter, nous utilisons des `Card` avec des pastilles d'état colorées.
// 🎯 À retenir pour la soutenance : "Deux types de récompenses exclusives : -20% plafonné à 2 DT tous les 100 points, et le prestigieux Panier Surprise 100% Offert tous les 300 points."

import React from 'react';
import { Link } from 'react-router-dom';
import { REWARD_TYPES, REWARD_STATUS } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';

export default function RewardWallet({
  rewards = [],
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-anton uppercase text-base text-[#141210] flex items-center gap-2 tracking-wide">
          <span>🎟️</span>
          <span>Portefeuille de Coupons &amp; Récompenses</span>
        </h3>
        <span className="text-xs font-mono font-bold text-[#141210]/60">
          {rewards.filter((r) => r.status === REWARD_STATUS.AVAILABLE || r.status === 'AVAILABLE').length} disponible(s)
        </span>
      </div>

      {rewards.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 text-center text-xs font-medium text-[#666]">
          Aucun coupon débloqué pour le moment. Sauvez votre premier repas pour accumuler des tampons !
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rewards.map((r) => {
            const isAvailable = r.status === REWARD_STATUS.AVAILABLE || r.status === 'AVAILABLE';
            const isFreeSurprise = r.type === REWARD_TYPES.FREE_SURPRISE || r.type === 'FREE_SURPRISE';

            return (
              <div
                key={r.rewardId || r.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAvailable
                    ? isFreeSurprise
                      ? 'bg-[#FEF08A] border-[#A16207]/30 shadow-sm'
                      : 'bg-white border-[#111111]/10 shadow-sm'
                    : 'bg-[#EDE6D7] border-[#111111]/8 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{isFreeSurprise ? '🎁' : '🔖'}</span>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${
                        isAvailable
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20'
                          : r.status === 'LOCKED'
                          ? 'bg-[#FEF08A] text-[#854D0E] border-[#A16207]/20'
                          : 'bg-[#EDE6D7] text-[#666] border-[#111111]/10'
                      }`}
                    >
                      {isAvailable
                        ? 'DISPONIBLE'
                        : r.status === 'LOCKED'
                        ? 'VERROUILLÉ EN COURS'
                        : 'UTILISÉ'}
                    </span>
                  </div>

                  <h4 className="font-anton uppercase text-base text-[#111111] mt-2 tracking-wide">
                    {isFreeSurprise
                      ? 'Panier Surprise 100% Offert ✨'
                      : '-20% de Réduction Immédiate'}
                  </h4>

                  <p className="text-[11px] text-[#666] font-sans mt-0.5">
                    {isFreeSurprise
                      ? `Offert jusqu'à ${formatTND(r.maxDiscountMillimes || 4000)} sur un panier mystère.`
                      : `Plafonné à ${formatTND(r.maxDiscountMillimes || 2000)} sur votre commande.`}
                  </p>

                  <div className="mt-2 text-[10px] text-[#666] font-mono font-medium">
                    Palier {r.milestone || 100} EcoPoints • Non cumulable
                  </div>
                </div>

                {isAvailable && (
                  <div className="pt-2 border-t border-dashed border-[#111111]/15">
                    <Link
                      to="/app/explore"
                      className="w-full btn-griddle-primary py-2.5 rounded-full block text-center text-xs"
                    >
                      <span>Utiliser au Catalogue →</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}