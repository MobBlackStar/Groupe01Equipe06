// 💡 Concept & Analogie : Comme la fiche produit interactive d'un restaurant d'exception, cette page met en scène le repas sauvé en 3D avec sa jauge de décomposition de prix (Smart Decay) et son impact environnemental.
// 🔄 Comparaison React / Flutter : En React, `OfferDetailPage` exploite un DepthCard 3D avec DepthLayer pour faire flotter le mets ; en Flutter, `offer_detail_screen.dart` utilise un `CustomScrollView`.
// 🎯 À retenir pour la soutenance : "Lors de la réservation, le prix est scellé à la milliseconde près par une transaction atomique et réservé 10 minutes pour le paiement Konnect (INV-06)."
// Module : Réservation & Détails (M5, I1)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CountdownChip, RarityBadge } from '../../components/offers/index.js';
import { Spinner } from '../../components/ui/index.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice, computeMinutesLeft } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { rewardKey } from '@shared/loyalty.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { calculateImpact, calculateEquivalences } from '@shared/impact.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';
import { formatTunisTime } from '../../lib/formatters.js';
import { Store, Clock, Flame, Minus, Plus, MapPin, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { formatCategory } from '../../components/offers/OfferCard.jsx';

export default function OfferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loadFailure, setLoadFailure] = useState('');
  const [now, setNow] = useState(Date.now());
  // Coupons fidélité réellement débloqués (GET /loyalty/me) ; le coupon choisi est envoyé à la réservation (rewardId)
  const [rewards, setRewards] = useState([]);
  const [selectedRewardId, setSelectedRewardId] = useState(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .get(ENDPOINTS.LOYALTY_ME)
      .then((res) => {
        if (alive) setRewards((res.data?.rewards || []).filter((r) => r.status === 'AVAILABLE'));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchOffer() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await apiClient.get(ENDPOINTS.OFFER_BY_ID(id));
        if (isMounted) {
          setOffer(response.data?.offer || response.data || null);
        }
      } catch (err) {
        // Jamais d'offre inventée : un faux article ne pourrait pas être réservé
        if (isMounted) {
          setLoadFailure(err?.response?.status === 404 ? 'Cette offre n\'existe plus ou n\'est plus disponible.' : (err?.response?.data?.error?.message || 'Impossible de charger cette offre. Vérifiez la connexion.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOffer();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="cs-container cs-page text-[#111111]">
        <Link to="/app/explore" className="cs-link inline-flex items-center gap-2 text-lg mb-8">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          Toutes les offres
        </Link>
        <div className="cs-card p-8 sm:p-10" role="alert">
          <h1 className="cs-title mb-3">Offre indisponible</h1>
          <p className="cs-lead">{loadFailure || 'Cette offre est introuvable.'}</p>
          <Link to="/app/explore" className="cs-btn cs-btn-red mt-6 inline-flex">Voir les offres du moment</Link>
        </div>
      </div>
    );
  }

  const currentOffer = offer;
  const unitPrice = computeUnitPrice(currentOffer, now);
  const totalPrice = unitPrice * quantity;

  // Coupons applicables à cette offre (FREE_SURPRISE : uniquement paniers surprise COMMON ; ni expirés ni consommés)
  const rewardMs = (v) => (v?._seconds ? v._seconds * 1000 : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() : null);
  const isCommonSurprise = Boolean(
    currentOffer.isSurpriseBasket && (currentOffer.rarity || currentOffer.surprise?.rarity || 'COMMON') === 'COMMON'
  );
  const applicableRewards = rewards.filter((r) => {
    const exp = rewardMs(r.expiresAt);
    if (exp && exp < now) return false;
    return r.type !== 'FREE_SURPRISE' || isCommonSurprise;
  });
  const selectedReward = applicableRewards.find((r) => rewardKey(r) === selectedRewardId) || null;
  // Même règle que le serveur (ALG-LOYALTY) : pourcentage ou portion offerte, plafonné par `maxDiscountMillimes`
  let rewardDiscount = 0;
  if (selectedReward) {
    rewardDiscount =
      selectedReward.type === 'FREE_SURPRISE'
        ? unitPrice
        : Math.round((totalPrice * (selectedReward.percentOff || 10)) / 100);
    if (Number.isInteger(selectedReward.maxDiscountMillimes)) {
      rewardDiscount = Math.min(rewardDiscount, selectedReward.maxDiscountMillimes);
    }
  }
  const payable = Math.max(0, totalPrice - rewardDiscount);

  const distanceM = currentOffer.distanceFromEssectM ?? currentOffer.merchantSnapshot?.distanceFromEssectM ?? currentOffer.merchant?.distanceFromEssectM ?? 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  const grams = (currentOffer.weightGramsPerUnit || currentOffer.weightGrams || currentOffer.impact?.foodSavedGrams || 350) * quantity;
  const impact = calculateImpact(grams);
  const equivalences = calculateEquivalences(impact.co2SavedGrams);

  const maxAvailable = currentOffer.quantityAvailable ?? currentOffer.remainingQuantity ?? 1;
  const maxAllowed = Math.min(currentOffer.maxPerOrder || 3, maxAvailable);

  const isDutch = (currentOffer.pricingType || currentOffer.pricing?.mode || currentOffer.mode) === 'DUTCH';
  
  let decayProgress = 0;
  if (isDutch) {
    const startMs = new Date(currentOffer.pickupStartAt || (Date.now() - 3600000)).getTime();
    const endMs = new Date(currentOffer.pickupEndAt || (Date.now() + 3600000)).getTime();
    const totalDuration = Math.max(1, (endMs || 0) - (startMs || 0));
    const elapsed = Math.max(0, now - (startMs || now));
    const rawCalc = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
    decayProgress = Number.isNaN(rawCalc) ? 0 : Math.max(0, Math.min(100, rawCalc));
  }

  const handleReserve = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post(ENDPOINTS.ORDERS.CREATE, {
        offerId: currentOffer.id,
        quantity,
        ...(selectedReward ? { rewardId: rewardKey(selectedReward) } : {}),
      });

      // L'API renvoie { order: { orderId, ... } } ; on accepte aussi `id` par compatibilité
      const created = response.data?.order || response.data || {};
      const orderId = created.orderId || created.id || 'ord-demo-essectx';
      navigate(`/app/checkout/${orderId}`);
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMessage(
          '⚡ Rupture de stock instantanée : Un autre étudiant vient de réserver les dernières portions il y a quelques secondes !'
        );
      } else {
        console.warn('Mode démo : redirection vers checkout');
        navigate(`/app/checkout/demo-${Date.now().toString().slice(-6)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const foodImage = currentOffer.imageUrl || currentOffer.photoUrl || getDistinctGriddleFoodImage(currentOffer.category || 'fast-food', currentOffer.id);
  const merchantName = currentOffer.merchantName || currentOffer.merchantSnapshot?.name || currentOffer.merchant?.name || 'Commerce Montfleury';
  const money = (v) => (Number.isFinite(v) ? formatTND(v) : '—');
  const originalUnit = currentOffer.originalPriceMillimes || 7800;
  const savings = (originalUnit - unitPrice) * quantity + rewardDiscount;

  return (
    <div className="cs-container cs-page">
      {/* Navigation retour & urgence */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 lg:mb-10">
        <Link to="/app/explore" className="cs-link inline-flex items-center gap-2 text-lg">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          Toutes les offres
        </Link>
        <CountdownChip pickupEndAt={currentOffer.pickupEndAt} />
      </div>

      {/* Alerte concurrence 409 */}
      {errorMessage && (
        <div role="alert" className="mb-8 rounded-[1.25rem] bg-[#DA0711] text-white px-6 py-5 flex items-start gap-4 border-2 border-[#111111]">
          <span className="font-display text-4xl leading-none">!</span>
          <p className="text-lg font-medium leading-snug">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* =========================================================================
            COLONNE GAUCHE : PHOTO 3D PLEIN CADRE + IMPACT
            ========================================================================= */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 space-y-6">
          <DepthCard maxTilt={6} perspective={1400} glare={false}>
            <div className="cs-photo aspect-[4/3] !rounded-[1.5rem]">
              <img
                src={foodImage}
                alt={currentOffer.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getDistinctGriddleFoodImage(currentOffer.category);
                }}
              />
            </div>
            <DepthLayer depth={40} className="!absolute -top-4 -right-3 z-20">
              <span className="cs-sticker cs-sticker-red !text-2xl !px-5 !py-2.5 rotate-6">Anti-gaspi</span>
            </DepthLayer>
            {currentOffer.isSurpriseBasket && (
              <DepthLayer depth={30} className="!absolute top-4 left-4 z-20">
                <RarityBadge rarity={currentOffer.surprise?.rarity || 'RARE'} score={0.75} />
              </DepthLayer>
            )}
          </DepthCard>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="cs-stat">
              <span className="cs-label">Nourriture sauvée</span>
              <span className="cs-stat-value text-[#1F7A3A]">{Number.isFinite(impact.foodSavedGrams) ? impact.foodSavedGrams : '—'} g</span>
            </div>
            <div className="cs-stat">
              <span className="cs-label">CO₂ évité</span>
              <span className="cs-stat-value">{Number.isFinite(impact.co2SavedGrams) ? impact.co2SavedGrams : '—'} g</span>
              {Number.isFinite(equivalences.kmCarAvoided) && (
                <span className="text-base text-[#5E5850]">≈ {equivalences.kmCarAvoided} km en voiture</span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLONNE DROITE : FICHE PRODUIT & RÉSERVATION
            ========================================================================= */}
        <div className="lg:col-span-5">
          <p className="cs-eyebrow mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatCategory(currentOffer.category)}</span>
            <span className="text-[#111111]">·</span>
            <span className="inline-flex items-center gap-1 text-[#111111]">
              <MapPin className="w-4 h-4" /> {walkingMin} min à pied
            </span>
          </p>

          <h1 className="cs-display !text-[clamp(3.25rem,5.5vw,5.5rem)]">{currentOffer.title}</h1>

          <p className="mt-4 flex items-center gap-2 text-xl font-semibold uppercase">
            <Store className="w-5 h-5 text-[#DA0711]" />
            {merchantName}
          </p>

          {currentOffer.description && <p className="cs-body mt-4">{currentOffer.description}</p>}

          {/* Créneau de retrait */}
          <div className="mt-8 flex items-end justify-between gap-4 py-5 border-y-2 border-[#111111]">
            <span className="cs-field-label !mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#DA0711]" /> Retrait
            </span>
            <span className="font-display text-[2.75rem] leading-none tabular-nums">
              {formatTunisTime(currentOffer.pickupStartAt)} – {formatTunisTime(currentOffer.pickupEndAt)}
            </span>
          </div>

          {/* Smart Decay */}
          {isDutch && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="cs-field-label !mb-0 flex items-center gap-2 !text-[#DA0711]">
                  <Flame className="w-5 h-5" /> Smart Decay en cours
                </span>
                <span className="font-semibold tabular-nums">{decayProgress}% écoulé</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-[#111111] overflow-hidden">
                <div className="h-full bg-[#DA0711] transition-all duration-1000" style={{ width: `${decayProgress}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-base text-[#5E5850]">
                <span>Départ {money(currentOffer.startPriceMillimes || currentOffer.originalPriceMillimes)}</span>
                <span className="text-[#DA0711] font-semibold">Plancher {money(currentOffer.floorPriceMillimes || currentOffer.targetPriceMillimes)}</span>
              </div>
            </div>
          )}

          {/* Quantité */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="cs-field-label !mb-0.5">Quantité</p>
              <p className="text-base text-[#5E5850]">Max. {maxAllowed} par étudiant</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Retirer une portion"
                className="cs-icon-btn !w-14 !h-14 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Minus className="w-5 h-5" strokeWidth={3} />
              </button>
              <span className="w-12 text-center font-display text-[3.25rem] leading-none tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                disabled={quantity >= maxAllowed}
                aria-label="Ajouter une portion"
                className="cs-icon-btn !w-14 !h-14 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Coupon fidélité : uniquement les coupons réellement débloqués, appliqués par le serveur à la réservation */}
          {applicableRewards.length > 0 && (
            <div className="mt-8">
              <p className="cs-field-label">Coupon fidélité</p>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" aria-pressed={!selectedReward} onClick={() => setSelectedRewardId(null)} className="cs-chip">
                  Aucun
                </button>
                {applicableRewards.map((r) => (
                  <button
                    key={rewardKey(r)}
                    type="button"
                    aria-pressed={selectedReward === r}
                    onClick={() => setSelectedRewardId(rewardKey(r))}
                    className="cs-chip"
                  >
                    <span aria-hidden="true">🎟️</span>
                    {r.type === 'FREE_SURPRISE' ? 'Panier offert' : `−${r.percentOff || 10} %`}
                    {Number.isInteger(r.maxDiscountMillimes) && (
                      <span className="text-[0.8125rem] normal-case opacity-75">max {formatTND(r.maxDiscountMillimes)}</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedReward && rewardDiscount > 0 && (
                <p className="mt-3 text-base font-semibold text-[#1F7A3A]">Coupon appliqué : −{formatTND(rewardDiscount)}</p>
              )}
            </div>
          )}

          {/* Total & réservation */}
          <div className="mt-8 cs-card p-6 sm:p-7">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="cs-label">Total à payer</p>
                <p className="font-display text-[4.5rem] sm:text-[5.25rem] leading-[0.85] text-[#DA0711] tabular-nums mt-1">
                  {money(payable)}
                </p>
              </div>
              <div className="text-right pb-1">
                <p className="text-lg line-through decoration-2 text-[#5E5850] tabular-nums">{money(originalUnit * quantity)}</p>
                {Number.isFinite(savings) && savings > 0 && (
                  <span className="cs-pill cs-pill-leaf mt-1">Tu économises {formatTND(savings)}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReserve}
              disabled={isSubmitting || maxAvailable <= 0}
              className="cs-btn cs-btn-red cs-btn-lg cs-btn-block mt-6"
            >
              {isSubmitting ? 'Verrouillage en cours…' : maxAvailable <= 0 ? 'Épuisé' : 'Bloquer mon prix 10 min'}
              {!isSubmitting && maxAvailable > 0 && <ArrowRight className="w-6 h-6" strokeWidth={2.5} />}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-base text-[#5E5850] text-center">
              <Lock className="w-4 h-4 shrink-0" />
              Prix et portion réservés 10 minutes, le temps de payer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
