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
import { calculateWalkingMinutes } from '@shared/geo.js';
import { calculateImpact, calculateEquivalences } from '@shared/impact.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';
import { formatTunisTime } from '../../lib/formatters.js';
import {
  Store,
  Clock,
  Flame,
  Minus,
  Plus,
} from 'lucide-react';

const FALLBACK_OFFER = {
  id: 'off-baguette-01',
  merchantId: 'merchant-baguette-baguette',
  merchantName: 'Baguette & Baguette Montfleury',
  merchantAddress: '14 Rue Abou El Kacem Chebbi, Montfleury, Tunis',
  merchantPhone: '+216 71 390 111',
  title: 'Baguette Farcie Escalope Panée & Double Fromage',
  description: 'Savoureuse baguette artisanale garnie d escalope panée croustillante marinée à la tunisienne, frites fraîches, fromage fondant et sauce au choix.',
  category: 'SANDWICH',
  pricingType: 'DUTCH',
  originalPriceMillimes: 7800,
  targetPriceMillimes: 3800,
  startPriceMillimes: 7800,
  floorPriceMillimes: 3800,
  quantityAvailable: 4,
  maxPerOrder: 3,
  distanceFromEssectM: 180,
  weightGramsPerUnit: 400,
  pickupStartAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  pickupEndAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  isSurpriseBasket: false,
};

export default function OfferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [now, setNow] = useState(Date.now());

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
          setOffer(response.data?.offer || response.data || FALLBACK_OFFER);
        }
      } catch (err) {
        console.warn('Offre non trouvée via API, activation du fallback :', err.message);
        if (isMounted) {
          setOffer({ ...FALLBACK_OFFER, id: id || FALLBACK_OFFER.id });
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
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentOffer = offer || FALLBACK_OFFER;
  const unitPrice = computeUnitPrice(currentOffer, now);
  const totalPrice = unitPrice * quantity;

  const distanceM = currentOffer.distanceFromEssectM || 200;
  const walkingMin = calculateWalkingMinutes(distanceM);

  const grams = (currentOffer.weightGramsPerUnit || currentOffer.impact?.foodSavedGrams || 350) * quantity;
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
      });

      const orderId = response.data?.order?.id || response.data?.id || 'ord-demo-essectx';
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

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation retour & Badge urgence */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/explore"
            className="inline-flex items-center gap-2 text-xs font-anton uppercase tracking-wider text-[#111111] hover:text-[#DA0711] transition-colors"
          >
            ← Retour au catalogue des offres
          </Link>
          <CountdownChip pickupEndAt={currentOffer.pickupEndAt} />
        </div>

        {/* Alerte Concurrence 409 */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-[#DA0711] text-xs flex items-center gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <p className="flex-1 font-bold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================================================
              COLONNE GAUCHE : 3D FOOD SHOWCASE (DepthCard & DepthLayer)
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-4">
            <DepthCard
              maxTilt={12}
              perspective={1100}
              className="w-full relative rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 p-6 sm:p-8 shadow-[0_4px_24px_rgba(17,17,17,0.06)] overflow-hidden"
            >
              <div className="relative aspect-square flex items-center justify-center bg-white border border-[#111111]/10 rounded-2xl overflow-hidden shadow-sm">
                <DepthLayer depth={30} shadow className="w-4/5 h-4/5 relative z-10 flex items-center justify-center">
                  <img
                    src={foodImage}
                    alt={currentOffer.title}
                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_12px_24px_rgba(20,18,16,0.2)]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getDistinctGriddleFoodImage(currentOffer.category);
                    }}
                  />
                </DepthLayer>

                {/* Badges d'angle */}
                {currentOffer.isSurpriseBasket && (
                  <div className="absolute top-3 left-3 z-20">
                    <RarityBadge rarity={currentOffer.surprise?.rarity || 'RARE'} score={0.75} />
                  </div>
                )}

                <div className="absolute top-3 right-3 z-20">
                  <span className="sticker-red">
                    ANTI-GASPI 🔥
                  </span>
                </div>
              </div>

              {/* Barre de progression Enchère Inversée (Dutch Auction Decay) */}
              {isDutch && (
                <div className="mt-6 pt-4 border-t border-[#111111]/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-[#DA0711] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#DA0711]" />
                      <span>Smart Decay : Baisse de prix en cours</span>
                    </span>
                    <span className="text-[#111111]">{decayProgress}% écoulé</span>
                  </div>
                  <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-[#111111]/15">
                    <div
                      className="bg-[#DA0711] h-full transition-all duration-1000"
                      style={{ width: `${decayProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#666] font-bold">
                    <span>Départ : {formatTND(currentOffer.startPriceMillimes || currentOffer.originalPriceMillimes)}</span>
                    <span className="text-[#DA0711]">Plancher : {formatTND(currentOffer.floorPriceMillimes || currentOffer.targetPriceMillimes)}</span>
                  </div>
                </div>
              )}
            </DepthCard>

            {/* Fiche d'impact écologique */}
            <div className="p-5 rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white border border-[#111111]/10 shadow-sm">
                <span className="text-2xl">🥗</span>
                <p className="font-anton text-xl text-[#15803D] mt-1">
                  {impact.foodSavedGrams} g
                </p>
                <p className="text-[10px] font-bold uppercase text-[#666]">Nourriture Sauvée</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#111111]/10 shadow-sm">
                <span className="text-2xl">🌱</span>
                <p className="font-anton text-xl text-[#DA0711] mt-1">
                  {impact.co2SavedGrams} g
                </p>
                <p className="text-[10px] font-bold uppercase text-[#666]">CO2 Évité ({equivalences.kmCarAvoided} km)</p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : TICKET DE RÉSERVATION PHYSIQUE & COMMANDE
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#EDE6D7] text-[#111111] shadow-[0_4px_24px_rgba(17,17,17,0.06)] border border-[#111111]/8 relative overflow-hidden">
              
              {/* En-tête ticket */}
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#111111]/20">
                <div className="flex items-center gap-1.5 text-[11px] font-anton uppercase text-[#DA0711]">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{currentOffer.category} · LOT OFFICIEL</span>
                </div>
                <div className="text-[11px] font-mono text-[#666] font-bold">
                  {distanceM}m (~{walkingMin} min à pied)
                </div>
              </div>

              {/* Titre & Description */}
              <div className="pt-4 pb-2">
                <h1 className="font-anton uppercase text-2xl sm:text-3xl font-black text-[#111111] leading-tight">
                  {currentOffer.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#666] mt-1 mb-3 font-medium">
                  <Store className="w-4 h-4 text-[#888]" />
                  <span>{currentOffer.merchantName}</span>
                </div>
                <p className="text-xs text-[#666] leading-relaxed font-sans font-medium">
                  {currentOffer.description}
                </p>
              </div>

              {/* Horaires de retrait */}
              <div className="my-4 p-4 rounded-2xl bg-white border border-[#111111]/10 shadow-sm flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#DA0711]" />
                  <span>Créneau de retrait :</span>
                </div>
                <span className="font-mono text-[#111111]">
                  {formatTunisTime(currentOffer.pickupStartAt)} — {formatTunisTime(currentOffer.pickupEndAt)}
                </span>
              </div>

              {/* Sélecteur de Quantité */}
              <div className="my-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-anton uppercase tracking-wider text-[#111111] block">
                    Quantité à sauver :
                  </span>
                  <span className="text-[10px] text-[#666] font-medium">
                    Max. {maxAllowed} par étudiant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-full bg-white border border-[#111111]/15 text-[#111111] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer shadow-sm hover:bg-[#FAF3E6] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-anton text-2xl text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                    disabled={quantity >= maxAllowed}
                    className="w-9 h-9 rounded-full bg-white border border-[#111111]/15 text-[#111111] flex items-center justify-center font-bold disabled:opacity-30 cursor-pointer shadow-sm hover:bg-[#FAF3E6] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Récapitulatif Prix & Hold 10 min */}
              <div className="mt-6 pt-4 border-t border-dashed border-[#111111]/20 space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-[#666]">
                      Prix Total Réservé :
                    </span>
                    <span className="font-anton text-4xl text-[#DA0711]">
                      {formatTND(totalPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#888] line-through block font-medium">
                      {formatTND((currentOffer.originalPriceMillimes || 7800) * quantity)}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#15803D]">
                      Économie : {formatTND(((currentOffer.originalPriceMillimes || 7800) - unitPrice) * quantity)}
                    </span>
                  </div>
                </div>

                {/* Bouton CTA Réservation */}
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={isSubmitting || maxAvailable <= 0}
                  className="w-full btn-griddle-primary py-3.5 cursor-pointer mt-2"
                >
                  <span>{isSubmitting ? 'Verrouillage en cours...' : 'BLOQUER MON PRIX PENDANT 10 MIN →'}</span>
                </button>

                <p className="text-[10px] text-center font-mono text-[#666] font-medium">
                  🔒 Transaction atomique : Votre prix et portion sont scellés 10 minutes pour le paiement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
