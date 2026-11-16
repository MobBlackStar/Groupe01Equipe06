// 💡 Concept & Analogie : Comme la fiche descriptive d'un vol avec sa carte d'embarquement en préparation, cette page rassemble tous les détails du sauvetage : prix dégressif en temps réel, impact carbone calculé au gramme près et réservation verrouillée pendant 10 minutes.
// 🔄 Comparaison React / Flutter : En React, `OfferDetailPage` utilise `useParams` de React Router et le hook d'actualisation de prix ; en Flutter, `OfferDetailScreen` présente une disposition `CustomScrollView` avec un bouton flottant en bas d'écran (`bottomNavigationBar`).
// 🎯 À retenir pour la soutenance : "Lors de la réservation, une transaction atomique verrouille le stock pendant 10 minutes au prix unitaire de la seconde exacte où l'étudiant a cliqué, protégeant contre toute concurrence d'achat (erreur 409 gérée avec élégance)."

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PriceTicker, CountdownChip, RarityBadge } from '../../components/offers/index.js';
import { Button, Card, Spinner, Badge, Stepper } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice, computeMinutesLeft } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { calculateImpact, calculateEquivalences } from '@shared/impact.js';
import { BUSINESS_RULES } from '@shared/constants.js';

// Offre de secours si API hors-ligne
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
  imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
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

  // Horloge 1s pour le calcul du prix et de la progression
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Récupération de l'offre
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
          // Offre de secours enrichie avec l'id
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
      <div className="min-h-screen bg-[#0D0F12] flex flex-col items-center justify-center gap-4 py-20 text-white">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Chargement des détails de l offre...</p>
      </div>
    );
  }

  const currentOffer = offer || FALLBACK_OFFER;
  const unitPrice = computeUnitPrice(currentOffer, now);
  const totalPrice = unitPrice * quantity;
  const maxAvailable = currentOffer.quantityAvailable ?? currentOffer.remainingQuantity ?? 1;
  const maxAllowed = Math.min(currentOffer.maxPerOrder || 4, maxAvailable);

  // Calcul impact écologique
  const weightGrams = (currentOffer.weightGramsPerUnit || 350) * quantity;
  const impact = calculateImpact(weightGrams);
  const equivalences = calculateEquivalences(impact.co2SavedGrams);

  // Temps de marche
  const distanceM = currentOffer.distanceFromEssectM || 180;
  const walkingMin = calculateWalkingMinutes(distanceM);

  // Formatage créneau horaire
  const formatTime = (isoString) => {
    if (!isoString) return '--h--';
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Progression de l'enchère dégressive (Smart Decay)
  const isDutch = (currentOffer.pricing?.mode || currentOffer.pricingType) === 'DUTCH' ||
                  (currentOffer.pricing?.mode || currentOffer.pricingType) === 'DUTCH_AUCTION';
  const startMs = new Date(currentOffer.pickupStartAt || currentOffer.decayStartAt || (now - 30 * 60 * 1000)).getTime();
  const endMs = new Date(currentOffer.pickupEndAt).getTime();
  const decayProgress = Math.min(100, Math.max(0, Math.round(((now - startMs) / (endMs - startMs)) * 100)));

  // Réservation
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
      // Gestion de la concurrence (409 OFFER_SOLD_OUT)
      if (err.response?.status === 409) {
        setErrorMessage(
          '⚡ Rupture de stock instantanée : Un autre étudiant vient de réserver les dernières portions de cette offre il y a quelques secondes !'
        );
      } else {
        // Mode démonstration résilient si le backend n'est pas démarré
        console.warn('Mode démo : redirection vers checkout suite à réponse offline');
        navigate(`/app/checkout/demo-${Date.now().toString().slice(-6)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Fil d'Ariane & Retour */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/explore"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#CCFF00] transition-colors"
          >
            ← Retour au catalogue des offres
          </Link>
          <CountdownChip pickupEndAt={currentOffer.pickupEndAt} />
        </div>

        {/* Alerte d'erreur éventuelle (notamment 409) */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#FF1744]/15 border border-[#FF1744]/40 text-[#FF1744] text-xs flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Grille principale : Visuel & Infos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Colonne Gauche : Image / Coffre Mystère */}
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-[#161920] border border-white/10 aspect-square shadow-xl">
              <img
                src={currentOffer.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'}
                alt={currentOffer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161920] via-transparent to-black/30" />

              {/* Badges sur l'image */}
              {currentOffer.isSurpriseBasket && (
                <div className="absolute top-4 left-4 z-10">
                  <RarityBadge rarity={currentOffer.surprise?.rarity || 'RARE'} score={0.68} />
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white font-medium border border-white/10">
                  📦 {maxAvailable} portion{maxAvailable > 1 ? 's' : ''} disponible{maxAvailable > 1 ? 's' : ''}
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#CCFF00]/20 border border-[#CCFF00]/40 text-[#CCFF00] font-bold">
                  {currentOffer.category}
                </span>
              </div>
            </div>

            {/* Encart Panier Mystère le cas échéant */}
            {currentOffer.isSurpriseBasket && currentOffer.surprise && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-1.5 text-yellow-300 font-bold text-xs">
                  <span>✨</span>
                  <span>Teaser du Panier Mystère</span>
                </div>
                <p className="text-xs text-yellow-100/80 leading-relaxed">
                  {currentOffer.surprise.teaser || "Assortiment surprise d'invendus de première fraîcheur à découvrir au moment du déballage !"}
                </p>
                <div className="mt-2 text-[11px] text-yellow-400 font-medium">
                  🎯 Contient environ {currentOffer.surprise.itemCountHint || 3} délices
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite : Données de commande */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              {/* Restaurant & Distance */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">
                  🏪 {currentOffer.merchantName}
                </span>
                <span className="text-[#CCFF00] font-medium">
                  📍 {distanceM} m de l'ESSECT (~{walkingMin} min à pied)
                </span>
              </div>

              {/* Titre */}
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {currentOffer.title}
              </h1>

              {/* Description */}
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {currentOffer.description}
              </p>

              {/* Horaires de retrait */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#161920] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🕒</span>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Créneau de retrait sur place</span>
                    <span className="font-bold text-white">
                      Aujourd'hui : {formatTime(currentOffer.pickupStartAt)} – {formatTime(currentOffer.pickupEndAt)}
                    </span>
                  </div>
                </div>
                <span className="text-slate-500 text-[11px]">Montfleury</span>
              </div>

              {/* Ticker de Prix Grand Format */}
              <div className="mt-6 p-4 rounded-2xl bg-[#161920] border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Prix unitaire en direct :</div>
                <PriceTicker offer={currentOffer} size="lg" />

                {/* Barre de progression Smart Decay si enchère dégressive */}
                {isDutch && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Début de l'enchère</span>
                      <span className="text-[#CCFF00] font-bold">Progression : {decayProgress}%</span>
                      <span>Fermeture (Plancher)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${decayProgress}%` }}
                        className="bg-gradient-to-r from-[#CCFF00] to-[#FF5500] h-full transition-all duration-1000"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sélecteur de Quantité & Réservation */}
            <div className="p-5 rounded-3xl bg-[#161920] border border-[#CCFF00]/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-slate-300">
                    Nombre de portions
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Max {maxAllowed} par étudiant
                  </span>
                </div>

                {/* Boutons Compteur */}
                <div className="flex items-center gap-3 bg-[#0D0F12] p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-xl bg-white/5 text-white font-bold flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    -
                  </button>
                  <span className="font-bold text-base px-2 text-[#CCFF00]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxAllowed, q + 1))}
                    disabled={quantity >= maxAllowed}
                    className="w-8 h-8 rounded-xl bg-white/5 text-white font-bold flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total & Bouton d'action */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total à régler :</span>
                  <span className="text-2xl font-black text-[#CCFF00]">
                    {formatTND(totalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={isSubmitting || maxAvailable <= 0}
                  className="px-6 py-3 rounded-2xl bg-[#CCFF00] text-black font-black text-sm hover:bg-[#b8e600] active:scale-95 transition-all shadow-lg shadow-[#CCFF00]/20 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Verrouillage (10 min)...</span>
                    </>
                  ) : maxAvailable <= 0 ? (
                    <span>Épuisé</span>
                  ) : (
                    <span>⚡ Réserver Maintenant</span>
                  )}
                </button>
              </div>

              {/* Règle des 10 minutes */}
              <p className="text-[11px] text-slate-400 text-center">
                🔒 Le stock est bloqué à votre nom pendant <strong className="text-white">10 minutes</strong> pour finaliser votre commande.
              </p>
            </div>
          </div>
        </div>

        {/* Encart Impact Écologique & Commerce */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Impact Écologique */}
          <div className="p-5 rounded-2xl bg-[#161920] border border-white/5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🌱</span>
              <span>Votre Impact Écologique en sauvant cette offre</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block">Aliments sauvés</span>
                <span className="text-base font-black text-white">{weightGrams} g</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Non gaspillés</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[11px] text-slate-400 block">CO₂ Évité (FAO)</span>
                <span className="text-base font-black text-cyan-400">{impact.co2SavedGrams} g</span>
                <span className="text-[10px] text-cyan-300/70 block mt-0.5">
                  ≈ {equivalences.smartphonesCharged} recharges tel
                </span>
              </div>
            </div>
          </div>

          {/* Coordonnées & Accès Restaurant */}
          <div className="p-5 rounded-2xl bg-[#161920] border border-white/5 space-y-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>📍</span>
              <span>Lieu de Retrait à Montfleury</span>
            </h3>
            <p className="text-xs text-slate-300">
              {currentOffer.merchantAddress || 'Montfleury, à proximité immédiate de l ESSECT'}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span>📞 {currentOffer.merchantPhone || '+216 71 390 000'}</span>
              <span>•</span>
              <span className="text-[#CCFF00]">🚶 {walkingMin} min depuis l'entrée principale ESSECT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
