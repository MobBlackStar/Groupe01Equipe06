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
        <div className="p-6 rounded-2xl bg-[#FAF6EE] border-2 border-dashed border-[#141210] text-center text-xs font-bold text-[#141210]/60 shadow-[2px_2px_0px_#141210]">
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
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                  isAvailable
                    ? isFreeSurprise
                      ? 'bg-[#FEF08A] border-[#141210] shadow-[4px_4px_0px_#141210]'
                      : 'bg-white border-[#141210] shadow-[4px_4px_0px_#141210]'
                    : 'bg-[#FAF6EE] border-[#141210]/30 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{isFreeSurprise ? '🎁' : '🔖'}</span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#141210] shadow-[1px_1px_0px_#141210] ${
                        isAvailable
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : r.status === 'LOCKED'
                          ? 'bg-[#FEF08A] text-[#141210]'
                          : 'bg-[#F4EFE6] text-[#141210]/60'
                      }`}
                    >
                      {isAvailable
                        ? 'DISPONIBLE'
                        : r.status === 'LOCKED'
                        ? 'VERROUILLÉ EN COURS'
                        : 'UTILISÉ'}
                    </span>
                  </div>

                  <h4 className="font-anton uppercase text-base text-[#141210] mt-2 tracking-wide">
                    {isFreeSurprise
                      ? 'Panier Surprise 100% Offert ✨'
                      : '-20% de Réduction Immédiate'}
                  </h4>

                  <p className="text-[11px] text-[#141210]/70 font-sans mt-0.5">
                    {isFreeSurprise
                      ? `Offert jusqu'à ${formatTND(r.maxDiscountMillimes || 4000)} sur un panier mystère.`
                      : `Plafonné à ${formatTND(r.maxDiscountMillimes || 2000)} sur votre commande.`}
                  </p>

                  <div className="mt-2 text-[10px] text-[#141210]/60 font-mono font-bold">
                    Palier {r.milestone || 100} EcoPoints • Non cumulable
                  </div>
                </div>

                {isAvailable && (
                  <div className="pt-2 border-t-2 border-dashed border-[#141210]/20">
                    <Link
                      to="/app/explore"
                      className="w-full py-2 px-3 rounded-xl bg-[#E51C23] text-white font-black text-xs border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] transition-all flex items-center justify-center gap-1.5"
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