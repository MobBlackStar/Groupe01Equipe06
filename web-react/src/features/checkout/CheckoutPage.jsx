// 💡 Concept & Analogie : Comme le ticket de caisse thermique imprimé minute au comptoir (#CS-...), avec sa perforation en dents de scie et son décompte strict de 10 minutes pour sceller le paiement.
// 🔄 Comparaison React / Flutter : En React, `CheckoutPage` reproduit un reçu thermique physique tactile avec `font-mono` et bordure déchirée ; en Flutter, `checkout_screen.dart` intègre la vue WebView de Konnect Sandbox.
// 🎯 À retenir pour la soutenance : "Pendant les 10 minutes de validité de la commande, le prix unitaire reste scellé même si le cours dégressif de l'offre continue de baisser dans le catalogue public (INV-06)."
// Module : Paiement & Réservation (M5, M6)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { formatTunisDate, formatTunisTimeWindow } from '../../lib/formatters.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';
import { Spinner } from '../../components/ui/index.js';
import {
  Clock,
  CreditCard,
  Gift,
  AlertTriangle,
  ArrowLeft,
  Ticket,
} from 'lucide-react';

const MOCK_ORDER_ID = 'ord-demo-essectx';

/** Commande de démonstration : les horaires sont calculés au moment de l'utilisation, pas au chargement du module. */
function buildMockOrder(id = MOCK_ORDER_ID) {
  const t = Date.now();
  return {
    id,
    orderCode: 'CS-8K4M9',
    offerId: 'off-baguette-01',
    offerTitle: 'Baguette Farcie Escalope Panée & Fromage',
    merchantName: 'Baguette & Baguette Montfleury',
    merchantAddress: '14 Rue Abou El Kacem Chebbi, Montfleury, Tunis',
    distanceFromEssectM: 180,
    quantity: 2,
    lockedUnitPriceMillimes: 3800,
    originalUnitPriceMillimes: 7800,
    pickupStartAt: t - 10 * 60 * 1000,
    pickupEndAt: t + 60 * 60 * 1000,
    reservationExpiresAt: t + 10 * 60 * 1000,
    createdAt: t,
    status: 'RESERVED',
  };
}

/** Seuls les identifiants de démo (ou la route sans identifiant) peuvent retomber sur la commande fictive. */
function isDemoOrderId(id) {
  return !id || id.startsWith('demo-') || id.startsWith('ord-demo');
}

/** Extrait la commande de la réponse API : `{ order: {...} }` ou l'objet commande directement. */
function extractOrder(data) {
  const candidate = data?.order || data;
  if (candidate && typeof candidate === 'object' && (candidate.id || candidate.orderId || candidate.orderCode)) {
    return candidate;
  }
  return null;
}

/** Convertit une date (ms, ISO, Date, Timestamp Firestore sérialisé) en millisecondes, ou null. */
function toMillis(value) {
  if (value == null) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    const secs = value._seconds ?? value.seconds;
    if (Number.isFinite(secs)) return secs * 1000;
    return null;
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Montant affichable : jamais NaN / undefined. */
function money(millimes) {
  return Number.isFinite(millimes) ? formatTND(millimes) : '—';
}

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedReward, setSelectedReward] = useState('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const demo = isDemoOrderId(orderId);

    async function fetchOrder() {
      setLoading(true);
      setLoadError(false);
      if (!orderId) {
        if (isMounted) {
          setOrder(buildMockOrder());
          setLoading(false);
        }
        return;
      }
      try {
        const response = await apiClient.get(ENDPOINTS.ORDER_BY_ID(orderId));
        const fetched = extractOrder(response.data);
        if (isMounted) {
          if (fetched) {
            setOrder(fetched);
          } else if (demo) {
            setOrder(buildMockOrder(orderId));
          } else {
            setOrder(null);
            setLoadError(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (demo) {
            console.warn('API non disponible, utilisation de la commande démo :', err.message);
            setOrder(buildMockOrder(orderId));
          } else {
            console.warn('Commande introuvable :', err.message);
            setOrder(null);
            setLoadError(true);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="cs-container cs-page min-h-[60vh] flex flex-col items-center justify-center gap-5 text-[#111111]">
        <Spinner size="lg" />
        <p className="cs-lead text-center">Édition de votre reçu sécurisé...</p>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="cs-container cs-page text-[#111111]">
        <header className="max-w-3xl">
          <p className="cs-eyebrow mb-3">Réservation</p>
          <h1 className="cs-display">
            Commande <span className="text-[#DA0711]">introuvable.</span>
          </h1>
          <p className="cs-lead mt-5 max-w-2xl">
            Nous n'avons pas pu charger cette réservation. Elle a peut-être expiré, été annulée, ou le lien est incorrect.
          </p>
          {orderId && (
            <p className="cs-mono text-base text-[#5E5850] mt-4 break-all">Référence : {orderId}</p>
          )}
        </header>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link to="/app/orders" className="cs-btn cs-btn-red cs-btn-lg whitespace-normal text-center">
            <Ticket className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Mes tickets</span>
          </Link>
          <Link to="/app/explore" className="cs-btn cs-btn-cream cs-btn-lg whitespace-normal text-center">
            <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Retour au catalogue</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentOrder = order;

  // Normalisation d'affichage : l'API renvoie `pricing`, `offerSnapshot`, `merchantSnapshot`
  // alors que la démo utilise des champs à plat.
  const pricing = currentOrder.pricing || {};
  const offerSnap = currentOrder.offerSnapshot || {};
  const orderRef = currentOrder.id || currentOrder.orderId || orderId || MOCK_ORDER_ID;
  const quantity = Number(currentOrder.quantity) || 1;
  const lockedUnit = Number(currentOrder.lockedUnitPriceMillimes ?? pricing.lockedUnitPriceMillimes);
  const originalUnit = Number(currentOrder.originalUnitPriceMillimes ?? pricing.originalUnitPriceMillimes);
  const offerTitle = currentOrder.offerTitle || currentOrder.title || offerSnap.title || 'Offre anti-gaspi';
  const merchantName = currentOrder.merchantName || currentOrder.merchantSnapshot?.name || 'Commerce partenaire';
  const pickupStart = toMillis(currentOrder.pickupStartAt ?? offerSnap.pickupStartAt);
  const pickupEnd = toMillis(currentOrder.pickupEndAt ?? offerSnap.pickupEndAt);
  const offerPhoto =
    currentOrder.offerPhotoUrl ||
    currentOrder.photoUrl ||
    offerSnap.photoUrl ||
    offerSnap.imageUrl ||
    getDistinctGriddleFoodImage(offerSnap.category || currentOrder.category || 'fast-food', currentOrder.offerId || orderRef);

  const expiresAtMs = toMillis(currentOrder.reservationExpiresAt) ?? (Date.now() + 600000);
  const secondsLeft = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = secondsLeft <= 0;

  const minStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secStr = String(secondsLeft % 60).padStart(2, '0');

  const subtotalMillimes = lockedUnit * quantity;
  const originalTotal = (Number.isFinite(originalUnit) ? originalUnit : lockedUnit) * quantity;
  const baseSaved = Math.max(0, originalTotal - subtotalMillimes);

  let discountAmount = 0;
  if (selectedReward === 'DISCOUNT_20') {
    discountAmount = Math.round(subtotalMillimes * 0.2);
  } else if (selectedReward === 'FREE_BASKET') {
    discountAmount = subtotalMillimes;
  }

  const finalTotalMillimes = Math.max(0, subtotalMillimes - discountAmount);
  const totalSavedMillimes = baseSaved + discountAmount;
  const discountPct =
    Number.isFinite(originalUnit) && Number.isFinite(lockedUnit) && originalUnit > lockedUnit
      ? Math.round((1 - lockedUnit / originalUnit) * 100)
      : null;
  const totalLabel =
    Number.isFinite(finalTotalMillimes) && finalTotalMillimes === 0 && discountAmount > 0
      ? 'OFFERT'
      : money(finalTotalMillimes);

  const handleCancel = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler votre réservation ? Le stock sera remis en vente pour d autres étudiants.')) {
      return;
    }
    setIsCancelling(true);
    try {
      await apiClient.post(ENDPOINTS.CANCEL_ORDER(orderRef));
    } catch (err) {
      console.warn('Annulation locale :', err.message);
    } finally {
      setIsCancelling(false);
      navigate('/app/explore');
    }
  };

  const handlePay = async () => {
    if (isExpired) {
      setErrorMessage("Cette réservation a expiré. Veuillez retourner au catalogue pour choisir une nouvelle offre.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post(ENDPOINTS.INIT_PAYMENT, {
        orderId: orderRef,
        rewardApplied: selectedReward !== 'NONE' ? selectedReward : null,
      });

      const payUrl = response.data?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        navigate(`/payment/return?orderId=${orderRef}&payment_ref=demo-success`);
      }
    } catch (err) {
      console.warn('Mode démo / Konnect sandbox simulation :', err.message);
      navigate(`/payment/return?orderId=${orderRef}&payment_ref=demo-success`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Couleur du panneau de décompte selon l'urgence
  const timerPanelClass = isExpired
    ? 'bg-[#DA0711] text-white'
    : secondsLeft < 180
    ? 'bg-[#FFD000] text-[#111111]'
    : 'bg-[#111111] text-[#FAF3E6]';

  const rewards = [
    { key: 'DISCOUNT_20', label: '-20% immédiat', cost: '100 pts', icon: '🎟️' },
    { key: 'FREE_BASKET', label: 'Panier offert', cost: '300 pts', icon: '🎁' },
  ];

  return (
    <div className="cs-container cs-page text-[#111111]">
      {/* Navigation retour */}
      <Link to="/app/explore" className="cs-link inline-flex items-center gap-2 min-h-[44px] mb-6">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        Retour au catalogue
      </Link>

      <header className="mb-10 lg:mb-14">
        <p className="cs-eyebrow mb-3">Réservation en cours</p>
        <h1 className="cs-display">
          Presque <span className="text-[#DA0711]">à vous.</span>
        </h1>
        <p className="cs-lead mt-4 max-w-2xl">
          Le prix et le stock sont verrouillés pendant 10 minutes. Vérifiez votre reçu puis finalisez le paiement avant la fin du décompte.
        </p>
      </header>

      {/* Mobile : décompte → reçu → paiement. Desktop : reçu à gauche, décompte + paiement à droite. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-8 lg:gap-x-14 lg:gap-y-6 items-start">
        {/* =========================================================================
            DÉCOMPTE 10 MINUTES
            ========================================================================= */}
        <div
          className={`lg:col-start-8 lg:col-span-5 lg:row-start-1 rounded-[1.25rem] p-7 sm:p-8 transition-colors ${timerPanelClass}`}
          role="timer"
          aria-label="Temps restant pour payer"
        >
          <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-base">
            <Clock className="w-5 h-5 shrink-0" aria-hidden="true" />
            {isExpired ? 'Réservation expirée' : 'Prix et stock verrouillés'}
          </p>
          <p
            className={`cs-figure text-[clamp(5.5rem,14vw,9rem)] mt-2 ${!isExpired && secondsLeft < 180 ? 'animate-pulse' : ''}`}
          >
            {minStr}:{secStr}
          </p>
          <p className="text-base mt-2 opacity-90">
            {isExpired
              ? 'Le créneau de 10 min est dépassé. Le stock a été libéré.'
              : 'Finalisez votre paiement avant la fin du décompte.'}
          </p>
        </div>

        {/* =========================================================================
            REÇU THERMIQUE (cs-receipt)
            ========================================================================= */}
        <div className="lg:col-start-1 lg:col-span-7 lg:row-start-1 lg:row-span-2">
          <article className="cs-receipt rounded-t-[1.25rem] p-5 sm:p-10 text-[15px] leading-relaxed" aria-label="Reçu de commande">
            {/* Photo de l'offre */}
            <div className="cs-photo aspect-[16/9] rounded-xl">
              <img
                src={offerPhoto}
                alt={offerTitle}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/griddle/food/teriyaki-poulet-bowl.webp';
                }}
              />
              {discountPct !== null && (
                <span className="cs-sticker cs-sticker-red absolute top-4 right-4 z-10 text-[1.6rem] px-5 py-2.5">
                  -{discountPct}%
                </span>
              )}
            </div>

            {/* En-tête du reçu */}
            <div className="text-center mt-8">
              <p className="font-display uppercase text-[2.75rem] sm:text-[3.5rem] leading-[0.9]">
                CampusSave
              </p>
              <p className="text-[13px] uppercase tracking-[0.18em] text-[#5E5850] mt-2">
                Reçu de caisse · ESSECT Montfleury
              </p>
              <p className="mt-4 inline-flex items-center rounded-full bg-[#111111] text-[#FAF3E6] px-4 py-1.5 text-[14px] font-bold break-all">
                CODE #{currentOrder.orderCode || orderRef}
              </p>
            </div>

            <hr className="cs-receipt-rule !my-6" />

            {/* Métadonnées service */}
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-[#5E5850] uppercase shrink-0">Commerce</dt>
                <dd className="text-right font-bold">{merchantName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5E5850] uppercase shrink-0">Date</dt>
                <dd className="text-right">{formatTunisDate(toMillis(currentOrder.createdAt) ?? now, { includeYear: true })}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5E5850] uppercase shrink-0">Retrait</dt>
                <dd className="text-right">{formatTunisTimeWindow(pickupStart, pickupEnd)}</dd>
              </div>
            </dl>

            <hr className="cs-receipt-rule !my-6" />

            {/* Lignes d'articles */}
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-[17px] break-words min-w-0">
                  {quantity}× {offerTitle}
                </span>
                <span className="font-bold text-[17px] whitespace-nowrap">{money(subtotalMillimes)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[#5E5850] pl-4">
                <span>Prix unitaire scellé</span>
                <span className="whitespace-nowrap">{money(lockedUnit)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between gap-4 text-[#1F7A3A] font-bold pl-4">
                  <span>Avantage ÉcoPoints</span>
                  <span className="whitespace-nowrap">-{money(discountAmount)}</span>
                </div>
              )}
            </div>

            <hr className="cs-receipt-rule !my-6" />

            {/* Totaux & économie */}
            <div className="space-y-2">
              {originalTotal > subtotalMillimes && (
                <div className="flex justify-between gap-4 text-[#5E5850]">
                  <span className="uppercase">Prix public initial</span>
                  <span className="line-through whitespace-nowrap">{money(originalTotal)}</span>
                </div>
              )}
              {totalSavedMillimes > 0 && (
                <div className="flex justify-between gap-4 text-[#1F7A3A] font-bold">
                  <span className="uppercase">Économie totale</span>
                  <span className="whitespace-nowrap">{money(totalSavedMillimes)}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-5 border-t-2 border-[#1B1B1B] flex flex-wrap justify-between items-end gap-x-4 gap-y-1">
              <span className="font-bold uppercase text-[17px]">Total net</span>
              <span className="font-display text-[#DA0711] text-[3.75rem] sm:text-[4.5rem] leading-[0.85] tabular-nums">
                {totalLabel}
              </span>
            </div>

            {/* Code-barres simulé */}
            <div className="mt-8 flex flex-col items-center" aria-hidden="true">
              <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#111111,#111111_2px,transparent_2px,transparent_5px)] opacity-80" />
              <span className="text-[13px] tracking-[0.2em] text-[#5E5850] mt-2 break-all text-center">
                CS-{orderRef}-SECURE-HOLD
              </span>
            </div>
          </article>
        </div>

        {/* =========================================================================
            RÉCOMPENSE + PAIEMENT
            ========================================================================= */}
        <aside className="lg:col-start-8 lg:col-span-5 lg:row-start-2 space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border-2 border-[#DA0711] bg-white px-5 py-4 text-base font-semibold text-[#DA0711]"
            >
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sélecteur récompense ÉcoPoints */}
          <div className="cs-card p-6 sm:p-7">
            <h2 className="cs-h3 flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-[#DA0711]" aria-hidden="true" />
              Avantage fidélité
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {rewards.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  aria-pressed={selectedReward === r.key}
                  onClick={() => setSelectedReward(selectedReward === r.key ? 'NONE' : r.key)}
                  className="cs-chip justify-between w-full min-h-[3.25rem] whitespace-normal text-left"
                >
                  <span>
                    <span aria-hidden="true">{r.icon}</span> {r.label}
                  </span>
                  <span className="cs-mono text-[13px] normal-case opacity-80 whitespace-nowrap">{r.cost}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions : payer Konnect / annuler */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePay}
              disabled={isSubmitting || isExpired}
              className="cs-btn cs-btn-red cs-btn-lg cs-btn-block whitespace-normal text-center py-3"
            >
              <CreditCard className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span>{isSubmitting ? 'Paiement en cours...' : `Payer via Konnect Test (${totalLabel}) →`}</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full min-h-[44px] text-center text-base font-semibold text-[#5E5850] underline underline-offset-4 hover:text-[#DA0711] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isCancelling ? 'Annulation...' : 'Annuler et libérer la réservation'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
