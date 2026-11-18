// 💡 Concept & Analogie : Comme la ligne d'un relevé bancaire ou d'un suivi de commande qui résume en un coup d'œil l'article, le prix verrouillé et la prochaine action à mener.
// 🔄 Comparaison React / Flutter : En React, `OrderRow` est un composant de carte modulaire ; en Flutter, nous construisons une tuile personnalisée dans un `ListView.separated`.
// 🎯 À retenir pour la soutenance : "L'étudiant dispose d'un accès en 1 clic à son billet Living Ticket dès que le paiement est confirmé."

import React from 'react';
import { Link } from 'react-router-dom';
import { formatTND } from '@shared/money.js';
import { formatTunisDate } from '../../lib/formatters.js';

export default function OrderRow({ order, onRate }) {
  if (!order) return null;

  const id = order.id || order._id;
  const status = order.status || 'RESERVED';
  const orderCode = order.orderCode || 'CS-XXXXX';
  const title = order.offerTitle || order.title || 'Repas Anti-Gaspi';
  const merchantName = order.merchantName || 'Commerce Montfleury';
  const quantity = order.quantity || 1;
  const price = (order.lockedUnitPriceMillimes || order.totalPriceMillimes || 3500) * quantity;
  const userRating = order.rating || order.review?.rating;
  const dateStr = formatTunisDate(order.createdAt || Date.now());

  // Configuration du badge de statut
  let badgeClasses = 'bg-white text-[#141210] border border-[#141210]';
  let badgeText = status;

  if (status === 'RESERVED') {
    badgeClasses = 'bg-[#FEF08A] text-[#854D0E] border-[#A16207] animate-pulse';
    badgeText = '⏳ Réservé (Paiement 10 min)';
  } else if (status === 'PAID') {
    badgeClasses = 'bg-[#DCFCE7] text-[#15803D] border-[#166534]';
    badgeText = '🎟️ Payé • Prêt pour retrait';
  } else if (status === 'COMPLETED') {
    badgeClasses = 'bg-white text-[#15803D] border-[#166534]';
    badgeText = '✓ Récupéré sur place';
  } else if (['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(status)) {
    badgeClasses = 'bg-[#FEE2E2] text-[#B91C1C] border-[#DC2626]';
    badgeText = status === 'CANCELLED' ? 'Annulé' : status === 'EXPIRED' ? 'Expiré (10 min)' : 'Non récupéré';
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:shadow-[5px_5px_0px_#141210] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#141210]">
      {/* Colonne Gauche : Données commande */}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-black text-xs text-[#141210] px-2 py-0.5 rounded bg-white border border-[#141210]">
            {orderCode}
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeClasses}`}>
            {badgeText}
          </span>
          <span className="text-[10px] text-[#666] font-bold">
            {dateStr}
          </span>
        </div>

        <h3 className="text-base font-anton uppercase text-[#141210] tracking-wide pt-1">{title}</h3>

        <div className="flex items-center gap-2 text-xs text-[#555] font-bold flex-wrap">
          <span>🏪 {merchantName}</span>
          <span>•</span>
          <span>Qté : {quantity}</span>
          <span>•</span>
          <span className="font-anton text-sm text-[#E51C23]">{formatTND(price)}</span>
        </div>
      </div>

      {/* Colonne Droite : Action contextuelle */}
      <div className="flex items-center sm:self-center">
        {status === 'RESERVED' && (
          <Link
            to={`/app/checkout/${id}`}
            className="btn-griddle-yellow text-xs py-2 px-4 cursor-pointer"
          >
            Finaliser le paiement →
          </Link>
        )}

        {status === 'PAID' && (
          <Link
            to={`/app/orders/${id}/ticket`}
            className="btn-griddle-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🎟️ Ouvrir Living Ticket</span>
          </Link>
        )}

        {status === 'COMPLETED' && (
          <div className="flex items-center gap-2">
            {userRating ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FEF08A] border-2 border-[#141210] text-[#141210] font-bold text-xs shadow-[1.5px_1.5px_0px_#141210]">
                <span>⭐</span>
                <span>{userRating}/5 Noté</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onRate && onRate(order)}
                className="btn-griddle-yellow text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <span>⭐</span>
                <span>Noter le repas</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
