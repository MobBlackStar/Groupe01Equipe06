// 💡 Concept & Analogie : Comme la ligne d'un relevé bancaire ou d'un suivi de colis qui résume en un coup d'œil l'article, le prix verrouillé et la prochaine action à mener.
// 🔄 Comparaison React / Flutter : En React, `OrderRow` est un composant de carte modulaire ; en Flutter, nous construisons une tuile personnalisée dans un `ListView.separated`.
// 🎯 À retenir pour la soutenance : "L'étudiant dispose d'un accès en 1 clic à son billet Living Ticket dès que le paiement est confirmé, ou vers le paiement s'il est encore dans les 10 minutes."

import React from 'react';
import { Link } from 'react-router-dom';
import { formatTND } from '@shared/money.js';

export default function OrderRow({ order }) {
  if (!order) return null;

  const id = order.id || order._id;
  const status = order.status || 'RESERVED';
  const orderCode = order.orderCode || 'CS-XXXXX';
  const title = order.offerTitle || order.title || 'Repas Anti-Gaspi';
  const merchantName = order.merchantName || 'Commerce Montfleury';
  const quantity = order.quantity || 1;
  const price = (order.lockedUnitPriceMillimes || order.totalPriceMillimes || 3500) * quantity;

  // Configuration du badge de statut
  let badgeClasses = 'bg-white/10 text-slate-300 border-white/10';
  let badgeText = status;

  if (status === 'RESERVED') {
    badgeClasses = 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/40 animate-pulse';
    badgeText = '⏳ Réservé (Paiement 10 min)';
  } else if (status === 'PAID') {
    badgeClasses = 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/40';
    badgeText = '🎟️ Payé • Prêt pour retrait';
  } else if (status === 'COMPLETED') {
    badgeClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    badgeText = '✓ Récupéré sur place';
  } else if (['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(status)) {
    badgeClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    badgeText = status === 'CANCELLED' ? 'Annulé' : status === 'EXPIRED' ? 'Expiré (10 min)' : 'Non récupéré';
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#161920] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Colonne Gauche : Données commande */}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-xs text-[#CCFF00] px-2 py-0.5 rounded bg-black/40 border border-[#CCFF00]/20">
            {orderCode}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badgeText}
          </span>
        </div>

        <h3 className="text-base font-bold text-white pt-1">{title}</h3>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>🏪 {merchantName}</span>
          <span>•</span>
          <span>Quantité : {quantity}</span>
          <span>•</span>
          <span className="font-mono text-slate-300 font-bold">{formatTND(price)}</span>
        </div>
      </div>

      {/* Colonne Droite : Action contextuelle */}
      <div className="flex items-center sm:self-center">
        {status === 'RESERVED' && (
          <Link
            to={`/app/checkout/${id}`}
            className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors shadow-md shadow-[#CCFF00]/10"
          >
            Finaliser le paiement →
          </Link>
        )}

        {status === 'PAID' && (
          <Link
            to={`/app/orders/${id}/ticket`}
            className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors shadow-md shadow-[#CCFF00]/10 flex items-center gap-1.5"
          >
            <span>🎟️ Ouvrir Living Ticket</span>
          </Link>
        )}

        {status === 'COMPLETED' && (
          <span className="text-xs text-slate-400 italic">
            Commande clôturée
          </span>
        )}

        {['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(status) && (
          <Link
            to="/app/explore"
            className="text-xs text-[#CCFF00] hover:underline"
          >
            Sauver une autre offre
          </Link>
        )}
      </div>
    </div>
  );
}
