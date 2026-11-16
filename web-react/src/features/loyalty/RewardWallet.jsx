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
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <span>🎟️</span>
          <span>Portefeuille de Coupons & Récompenses</span>
        </h3>
        <span className="text-xs text-slate-400">
          {rewards.filter((r) => r.status === REWARD_STATUS.AVAILABLE || r.status === 'AVAILABLE').length} disponible(s)
        </span>
      </div>

      {rewards.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[#0D0F12] border border-white/5 text-center text-xs text-slate-400">
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
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAvailable
                    ? isFreeSurprise
                      ? 'bg-amber-500/10 border-amber-400/50 shadow-md shadow-amber-500/10'
                      : 'bg-[#161920] border-[#CCFF00]/40 shadow-md shadow-[#CCFF00]/5'
                    : 'bg-white/5 border-white/5 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl">{isFreeSurprise ? '🎁' : '🔖'}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isAvailable
                          ? 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/40'
                          : r.status === 'LOCKED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/10 text-slate-400 border-white/10'
                      }`}
                    >
                      {isAvailable
                        ? 'DISPONIBLE'
                        : r.status === 'LOCKED'
                        ? 'VERROUILLÉ EN COURS'
                        : 'UTILISÉ'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm mt-2">
                    {isFreeSurprise
                      ? 'Panier Surprise 100% Offert ✨'
                      : '-20% de Réduction Immédiate'}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFreeSurprise
                      ? `Offert jusqu'à ${formatTND(r.maxDiscountMillimes || 4000)} sur un panier mystère.`
                      : `Plafonné à ${formatTND(r.maxDiscountMillimes || 2000)} sur votre commande.`}
                  </p>

                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Palier {r.milestone || 100} EcoPoints • Non cumulable
                  </div>
                </div>

                {isAvailable && (
                  <div className="pt-2 border-t border-white/10">
                    <Link
                      to="/app/explore"
                      className="w-full py-2 px-3 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
