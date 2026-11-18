// 💡 Concept & Analogie : Comme la ligne d'un relevé bancaire ou d'un suivi de commande qui résume en un coup d'œil l'article, le prix verrouillé et la prochaine action à mener.
// 🔄 Comparaison React / Flutter : En React, `OrderRow` est un composant de carte modulaire ; en Flutter, nous construisons une tuile personnalisée dans un `ListView.separated`.
// 🎯 À retenir pour la soutenance : "L'étudiant dispose d'un accès en 1 clic à son billet Living Ticket dès que le paiement est confirmé."

import React from 'react';
import { Link } from 'react-router-dom';
import { formatTND } from '@shared/money.js';
import { formatTunisDate, formatTunisTimeWindow } from '../../lib/formatters.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

// Accepte Date, ISO, millisecondes ou Timestamp Firestore sérialisé ({ _seconds } / { seconds }).
function toDateInput(value) {
  if (!value) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    if (typeof value.toDate === 'function') return value.toDate();
    const secs = value._seconds ?? value.seconds;
    return Number.isFinite(secs) ? secs * 1000 : null;
  }
  return value;
}

// Montant affichable : jamais NaN / 0,000 DT, sinon tiret cadratin.
function displayMoney(millimes) {
  const n = Number(millimes);
  return Number.isFinite(n) && n > 0 ? formatTND(Math.round(n)) : '—';
}

// Vignettes ciblées par catégorie d'offre (OFFER_CATEGORIES) — évite burger/frites pour une baguette.
const CATEGORY_IMAGES = {
  SANDWICH: ['/assets/griddle/food/sandwich-hot-chicken.png', '/assets/griddle/food/sandwich-crispy-chicken.png'],
  VIENNOISERIE: [
    '/assets/griddle/food/croissant-amande.png',
    '/assets/griddle/food/croissant-beurre.png',
    '/assets/griddle/food/morning-bun.png',
    '/assets/griddle/food/cinnamon-bun.png',
  ],
  PATISSERIE: [
    '/assets/griddle/food/tarte-citron-meringuee.png',
    '/assets/griddle/food/burnt-cheesecake.png',
    '/assets/griddle/food/gateau-chocolat-drip.png',
    '/assets/griddle/food/layer-cake-fraise.png',
  ],
  PIZZA: ['/assets/griddle/food/pain-campagne-levain.png'],
};

// Catégorie déduite du titre quand l'offre n'en fournit pas.
function inferCategory(title = '') {
  const t = String(title).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/baguette|sandwich|panini|wrap|chapati|libanais/.test(t)) return 'SANDWICH';
  if (/viennoiserie|croissant|pain au chocolat|brioche|chausson/.test(t)) return 'VIENNOISERIE';
  if (/pizza|calzone/.test(t)) return 'PIZZA';
  if (/patisserie|gateau|tarte|cheesecake|baklava|cake/.test(t)) return 'PATISSERIE';
  if (/ojja|couscous|plat|lablabi|riz|pates/.test(t)) return 'PLAT_CHAUD';
  return null;
}

function hashKey(key) {
  const str = String(key ?? '');
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function fallbackImage(category, key) {
  const pool = CATEGORY_IMAGES[String(category || '').toUpperCase()];
  if (pool) return pool[hashKey(key) % pool.length];
  const helperCategory = String(category || '').toUpperCase() === 'PLAT_CHAUD' ? 'restaurant' : category || 'fast-food';
  return getDistinctGriddleFoodImage(helperCategory, key);
}

// Minutes restantes avant expiration de la réservation (null si inconnu).
function minutesLeft(expiresAt) {
  const input = toDateInput(expiresAt);
  if (!input) return null;
  const ms = new Date(input).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil((ms - Date.now()) / 60000));
}

const STATUS_PILLS = {
  RESERVED: { className: 'cs-pill-mustard', label: 'À payer' },
  PAID: { className: 'cs-pill-red', label: 'Prêt pour retrait' },
  COMPLETED: { className: 'cs-pill-leaf', label: '✓ Récupéré' },
  CANCELLED: { className: 'cs-pill-outline', label: 'Annulé' },
  EXPIRED: { className: 'cs-pill-outline', label: 'Expiré' },
  PAYMENT_FAILED: { className: 'cs-pill-outline', label: 'Paiement échoué' },
  NO_SHOW: { className: 'cs-pill-outline', label: 'Non récupéré' },
};

export default function OrderRow({ order, onRate }) {
  if (!order) return null;

  const id = order.id || order._id;
  const status = order.status || 'RESERVED';
  const snapshot = order.offerSnapshot || {};
  const orderCode = order.orderCode || 'CS-XXXXX';
  const title = order.offerTitle || order.title || snapshot.title || 'Repas Anti-Gaspi';
  const merchantName = order.merchantName || order.merchantSnapshot?.name || 'Commerce Montfleury';
  const quantityRaw = Number(order.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;

  const unitPrice = order.lockedUnitPriceMillimes ?? order.pricing?.lockedUnitPriceMillimes;
  const total =
    order.pricing?.totalMillimes ??
    order.totalPriceMillimes ??
    (Number.isFinite(Number(unitPrice)) ? Number(unitPrice) * quantity : null);
  const totalLabel = displayMoney(total);

  const userRating = order.rating || order.review?.rating;
  const dateStr = formatTunisDate(toDateInput(order.createdAt) || Date.now());
  const pickupWindow = formatTunisTimeWindow(
    toDateInput(order.pickupStartAt || snapshot.pickupStartAt),
    toDateInput(order.pickupEndAt || snapshot.pickupEndAt)
  );

  const offer = order.offer || {};
  const category = snapshot.category || order.category || offer.category || inferCategory(title);
  const imageKey = order.offerId || offer.id || title;
  const fallbackPhoto = fallbackImage(category, imageKey);
  const photo = snapshot.photoUrl || offer.photoUrl || offer.imageUrl || order.photoUrl || fallbackPhoto;

  const basePill = STATUS_PILLS[status] || { className: 'cs-pill-outline', label: status };
  let pill = basePill;
  if (status === 'RESERVED') {
    const mins = minutesLeft(order.reservationExpiresAt);
    pill = {
      ...basePill,
      label: mins === null ? 'À payer' : mins > 0 ? `À payer · ${mins} min` : 'À payer · délai écoulé',
    };
  }

  return (
    <article className="cs-card cs-card-hover group p-4 sm:p-6 grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[120px_minmax(0,1fr)_auto] gap-x-5 sm:gap-x-7 gap-y-5 items-center text-[#111111]">
      {/* Vignette photo (couvre son cadre) */}
      <div className="cs-photo cs-photo-zoom aspect-square w-full self-start lg:self-center">
        <img
          src={photo}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPhoto;
          }}
        />
      </div>

      {/* Données commande */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`cs-pill ${pill.className}`}>{pill.label}</span>
          <span className="cs-mono text-[14px] font-bold text-[#5E5850]">#{orderCode}</span>
        </div>

        <h3 className="cs-h3 line-clamp-3 sm:line-clamp-2 break-words">{title}</h3>

        <p className="text-base sm:text-lg font-medium text-[#5E5850] mt-1.5 line-clamp-2">{merchantName}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] sm:text-base">
          <span className="font-semibold">
            <span className="cs-label !text-[13px] mr-1.5">Retrait</span>
            {pickupWindow}
          </span>
          <span className="text-[#5E5850]">Commandé {dateStr}</span>
        </div>
      </div>

      {/* Total & action contextuelle */}
      <div className="col-span-2 lg:col-span-1 flex flex-wrap sm:flex-nowrap items-center lg:flex-col lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t-2 border-dashed border-[#111111]/15 lg:border-t-0 lg:min-w-[220px]">
        <div className="lg:text-right">
          <span className="cs-label block">Total · Qté {quantity}</span>
          <span className="cs-figure block text-[40px] sm:text-[44px] text-[#DA0711] mt-1">{totalLabel}</span>
        </div>

        <div className="w-full sm:w-auto">
          {status === 'RESERVED' && (
            <Link to={`/app/checkout/${id}`} className="cs-btn cs-btn-mustard w-full sm:w-auto">
              Finaliser le paiement →
            </Link>
          )}

          {status === 'PAID' && (
            <Link to={`/app/tickets/${id}`} className="cs-btn cs-btn-red w-full sm:w-auto">
              Voir mon ticket 🎟️
            </Link>
          )}

          {status === 'COMPLETED' &&
            (userRating ? (
              <span className="cs-pill cs-pill-leaf !min-h-[2.75rem] !px-5 !text-base">⭐ Noté {userRating}/5</span>
            ) : (
              <button
                type="button"
                onClick={() => onRate(order)}
                className="cs-btn cs-btn-cream w-full sm:w-auto"
              >
                Laisser un avis ⭐
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
