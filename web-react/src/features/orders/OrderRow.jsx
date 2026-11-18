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
  let badgeClasses = 'bg-white text-[#111111] border border-[#111111]/10';
  let badgeText = status;

  if (status === 'RESERVED') {
    badgeClasses = 'bg-[#FFD000]/20 text-[#854D0E] border-[#FFD000]/40 animate-pulse';
    badgeText = '⏳ Réservé (Paiement 10 min)';
  } else if (status === 'PAID') {
    badgeClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    badgeText = '🎟️ Payé • Prêt pour retrait';
  } else if (status === 'COMPLETED') {
    badgeClasses = 'bg-white text-[#15803D] border-emerald-200';
    badgeText = '✓ Récupéré sur place';
  } else if (['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(status)) {
    badgeClasses = 'bg-rose-100 text-rose-800 border-rose-200';
    badgeText = status === 'CANCELLED' ? 'Annulé' : status === 'EXPIRED' ? 'Expiré (10 min)' : 'Non récupéré';
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_16px_rgba(17,17,17,0.03)] hover:shadow-[0_8px_24px_rgba(17,17,17,0.06)] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#111111]">
      {/* Colonne Gauche : Données commande */}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-xs text-[#111111] px-2.5 py-0.5 rounded-full bg-white border border-[#111111]/10">
            {orderCode}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClasses}`}>
            {badgeText}
          </span>
          <span className="text-[10px] text-[#666] font-medium">
            {dateStr}
          </span>
        </div>

        <h3 className="text-base font-anton uppercase text-[#111111] tracking-wide pt-1">{title}</h3>

        <div className="flex items-center gap-2 text-xs text-[#555] font-medium flex-wrap">
          <span>🏪 {merchantName}</span>
          <span>•</span>
          <span>Qté : {quantity}</span>
          <span>•</span>
          <span className="font-anton text-sm text-[#DA0711]">{formatTND(price)}</span>
        </div>
      </div>

      {/* Colonne Droite : Action contextuelle */}
      <div className="flex items-center sm:self-center">
        {status === 'RESERVED' && (
          <Link
            to={`/app/checkout/${id}`}
            className="btn-griddle-yellow text-xs py-2 px-5 cursor-pointer shadow-sm"
          >
            Finaliser le paiement →
          </Link>
        )}

        {status === 'PAID' && (
          <Link
            to={`/app/tickets/${id}`}
            className="btn-griddle-primary text-xs py-2 px-5 cursor-pointer shadow-sm"
          >
            Voir mon Living Ticket 🎟️
          </Link>
        )}

        {status === 'COMPLETED' && (
          <div>
            {userRating ? (
              <span className="text-xs font-bold text-[#15803D] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                ⭐ Noté {userRating}/5
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onRate(order)}
                className="btn-griddle-outline text-xs py-1.5 px-4 cursor-pointer"
              >
                Laisser un avis ⭐
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
