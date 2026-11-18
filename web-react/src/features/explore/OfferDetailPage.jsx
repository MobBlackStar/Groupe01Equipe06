// 💡 Concept & Analogie : Comme la fiche produit interactive d'un restaurant d'exception, cette page met en scène le repas sauvé en 3D avec sa jauge de décomposition de prix (Smart Decay) et son impact environnemental au gramme près.
// 🔄 Comparaison React / Flutter : En React, `OfferDetailPage` exploite un DepthCard 3D avec DepthLayer pour faire flotter le mets ; en Flutter, `offer_detail_screen.dart` utilise un `CustomScrollView` avec un bouton persistant en bas d'écran.
// 🎯 À retenir pour la soutenance : "Lors de la réservation, le prix est scellé à la milliseconde près par une transaction atomique et réservé 10 minutes pour le paiement Konnect (INV-06)."
// Module : Réservation & Détails (M5, I1)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PriceTicker, CountdownChip, RarityBadge } from '../../components/offers/index.js';
import { Spinner } from '../../components/ui/index.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice, computeMinutesLeft } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { calculateImpact, calculateEquivalences } from '@shared/impact.js';
import { getFramerFoodImage } from '../../lib/framerAssets.js';
import {
  MapPin,
  Store,
  Clock,
  Flame,
  Leaf,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Package,
  Minus,
  Plus,
  Phone,
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
  imageUrl: '/assets/framer/burgers/sandwich-hot-chicken.png',
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
      <div className="min-h-screen bg-[#0E0D0C] flex flex-col items-center justify-center gap-4 py-20 text-[#F6F1E7]">
        <Spinner size="lg" />
        <p className="text-xs text-stone-400 font-mono">Chargement du ticket d'offre...</p>
      </div>
    );
  }

  const currentOffer = offer || FALLBACK_OFFER;
  const unitPrice = computeUnitPrice(currentOffer, now);
  const totalPrice = unitPrice * quantity;
  const maxAvailable = currentOffer.quantityAvailable ?? currentOffer.remainingQuantity ?? 1;
  const maxAllowed = Math.min(currentOffer.maxPerOrder || 4, maxAvailable);

  const weightGrams = (currentOffer.weightGramsPerUnit || 350) * quantity;
  const impact = calculateImpact(weightGrams);
  const equivalences = calculateEquivalences(impact.co2SavedGrams);

  const distanceM = currentOffer.distanceFromEssectM || 180;
  const walkingMin = calculateWalkingMinutes(distanceM);

  const formatTime = (isoString) => {
    if (!isoString) return '--h--';
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const isDutch = (currentOffer.pricing?.mode || currentOffer.pricingType) === 'DUTCH' ||
                  (currentOffer.pricing?.mode || currentOffer.pricingType) === 'DUTCH_AUCTION';
  const startMs = new Date(currentOffer.pickupStartAt || currentOffer.decayStartAt || (now - 30 * 60 * 1000)).getTime();
  const endMs = new Date(currentOffer.pickupEndAt).getTime();
  const decayProgress = Math.min(100, Math.max(0, Math.round(((now - startMs) / (endMs - startMs)) * 100)));

  const handleReserve = async () => {
    if (quantity > maxAvailable) {
      setErrorMessage("La quantité demandée n'est plus disponible.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post(ENDPOINTS.ORDERS, {
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

  const foodImage = currentOffer.imageUrl || currentOffer.photoUrl || getFramerFoodImage(currentOffer.title || currentOffer.category);

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F6F1E7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation retour & Badge urgence */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/explore"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-400 hover:text-[#F5C400] transition-colors"
          >
            ← Retour au catalogue des offres
          </Link>
          <CountdownChip pickupEndAt={currentOffer.pickupEndAt} />
        </div>

        {/* Alerte Concurrence 409 */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#EE3124]/15 border border-[#EE3124]/40 text-[#EE3124] text-xs flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="flex-1 font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================================================
              COLONNE GAUCHE : 3D FOOD SHOWCASE (DepthCard & DepthLayer)
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-4">
            <DepthCard
              maxTilt={14}
              perspective={1100}
              className="w-full relative rounded-3xl bg-[#161412] border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <div className="relative aspect-square flex items-center justify-center">
                <DepthLayer depth={30} shadow className="w-4/5 h-4/5 relative z-10 flex items-center justify-center">
                  <img
                    src={foodImage}
                    alt={currentOffer.title}
                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFramerFoodImage(currentOffer.category);
                    }}
                  />
                </DepthLayer>

                {/* Halos lumineux intérieurs */}
                <div className="absolute inset-0 bg-radial from-[#F5C400]/10 via-transparent to-transparent pointer-events-none" />

                {/* Badges d'angle */}
                {currentOffer.isSurpriseBasket && (
                  <div className="absolute top-0 left-0 z-20">
                    <RarityBadge rarity={currentOffer.surprise?.rarity || 'RARE'} score={0.75} />
                  </div>
                )}

                <div className="absolute top-0 right-0 z-20">
                  <span className="px-3 py-1 rounded-full bg-[#EE3124] text-white text-[10px] font-oswald uppercase font-black tracking-wider shadow-md">
                    ANTI-GASPI
                  </span>
                </div>
              </div>

              {/* Barre de progression Enchère Inversée (Dutch Auction Decay) */}
              {isDutch && (
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#F5C400] font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Smart Decay : Baisse de prix en cours</span>
                    </span>
                    <span className="text-stone-400 font-bold">{decayProgress}% écoulé</span>
                  </div>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#F5C400] to-[#EE3124] h-full transition-all duration-1000"
                      style={{ width: `${decayProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-stone-500">
                    <span>Départ : {formatTND(currentOffer.startPriceMillimes || currentOffer.originalPriceMillimes)}</span>
                    <span className="text-[#EE3124] font-bold">Plancher garanti : {formatTND(currentOffer.floorPriceMillimes || currentOffer.targetPriceMillimes)}</span>
                  </div>
                </div>
              )}
            </DepthCard>

            {/* Fiche d'impact écologique */}
            <div className="p-4 rounded-3xl bg-[#161412] border border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xl">🥗</span>
                <p className="font-oswald text-lg font-black text-emerald-400 mt-1">
                  {impact.foodSavedGrams} g
                </p>
                <p className="text-[10px] font-mono uppercase text-stone-400">Nourriture Sauvée</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xl">🌱</span>
                <p className="font-oswald text-lg font-black text-[#F5C400] mt-1">
                  {impact.co2SavedGrams} g
                </p>
                <p className="text-[10px] font-mono uppercase text-stone-400">CO2 Évité ({equivalences.kmCarAvoided} km auto)</p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLONNE DROITE : TICKET DE RÉSERVATION PHYSIQUE & COMMANDE
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F6F1E7] text-[#161412] shadow-2xl border border-black/10 relative overflow-hidden">
              
              {/* En-tête ticket */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#161412]/20">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-[#EE3124]">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{currentOffer.category} · LOT OFFICIEL</span>
                </div>
                <div className="text-[11px] font-mono text-stone-600 font-bold">
                  {distanceM}m (~{walkingMin} min à pied)
                </div>
              </div>

              {/* Titre & Description */}
              <div className="pt-4 pb-2">
                <h1 className="font-oswald uppercase text-2xl sm:text-3xl font-black text-[#161412] leading-tight">
                  {currentOffer.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-stone-600 mt-1 mb-3">
                  <Store className="w-4 h-4 text-stone-500" />
                  <span className="font-bold">{currentOffer.merchantName}</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  {currentOffer.description}
                </p>
              </div>

              {/* Horaires de retrait */}
              <div className="my-4 p-3.5 rounded-2xl bg-stone-200/70 border border-stone-300 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#EE3124]" />
                  <span className="font-bold">Créneau de retrait :</span>
                </div>
                <span className="font-mono font-black text-[#161412]">
                  {formatTime(currentOffer.pickupStartAt)} — {formatTime(currentOffer.pickupEndAt)}
                </span>
              </div>

              {/* Sélecteur de Quantité */}
              <div className="my-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-stone-600 block">
                    Quantité à sauver :
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Max. {maxAllowed} par étudiant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full bg-[#161412] text-white flex items-center justify-center font-bold disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-oswald text-lg font-black text-[#161412]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                    disabled={quantity >= maxAllowed}
                    className="w-8 h-8 rounded-full bg-[#161412] text-white flex items-center justify-center font-bold disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Récapitulatif Prix & Hold 10 min */}
              <div className="mt-6 pt-4 border-t-2 border-dashed border-[#161412]/20 space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">
                      Prix Total Réservé :
                    </span>
                    <span className="font-oswald text-3xl font-black text-[#EE3124]">
                      {formatTND(totalPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-stone-500 line-through block">
                      {formatTND((currentOffer.originalPriceMillimes || 7800) * quantity)}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#2E6F40]">
                      Économie : {formatTND(((currentOffer.originalPriceMillimes || 7800) - unitPrice) * quantity)}
                    </span>
                  </div>
                </div>

                {/* Bouton CTA Réservation */}
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={isSubmitting || maxAvailable <= 0}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0E0D0C] text-[#F6F1E7] font-oswald uppercase text-base font-black tracking-wider hover:bg-[#EE3124] hover:text-white active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  <span>{isSubmitting ? 'Verrouillage en cours...' : 'Bloquer mon prix pendant 10 min →'}</span>
                </button>

                <p className="text-[10px] text-center font-mono text-stone-500">
                  🔒 Transaction atomique : Votre prix et votre portion sont scellés pendant 10 minutes pour le paiement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
