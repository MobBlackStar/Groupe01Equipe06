// 💡 Concept & Analogie : Comme le comptoir d'embarquement à l'aéroport où votre place est bloquée pendant 10 minutes pendant que vous préparez votre billet et appliquez vos miles de fidélité.
// 🔄 Comparaison React / Flutter : En React, `useEffect` synchronise le décompte de 10 minutes chaque seconde (`setInterval`) ; en Flutter, `CheckoutScreen` utilise un `Timer.periodic` avec une barre de progression circulaire.
// 🎯 À retenir pour la soutenance : "Le prix unitaire est verrouillé au moment du clic pour protéger l'étudiant de l'enchère dégressive pendant ses 10 minutes de paiement sur Konnect."

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { calculateWalkingMinutes } from '@shared/geo.js';
import { Spinner } from '../../components/ui/index.js';

// Commande de secours si backend hors-ligne
const MOCK_ORDER = {
  id: 'ord-demo-essectx',
  orderCode: 'CS-8K4M9',
  offerId: 'off-baguette-01',
  offerTitle: 'Baguette Farcie Escalope Panée & Fromage',
  merchantName: 'Baguette & Baguette Montfleury',
  merchantAddress: '14 Rue Abou El Kacem Chebbi, Montfleury, Tunis',
  distanceFromEssectM: 180,
  quantity: 2,
  lockedUnitPriceMillimes: 3800,
  originalUnitPriceMillimes: 7800,
  pickupStartAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  pickupEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  reservationExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  status: 'RESERVED',
};

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState('NONE'); // 'NONE', 'DISCOUNT_20', 'FREE_BASKET'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Horloge 1 seconde pour le compte à rebours de 10 min
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Chargement des détails de la commande
  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      setLoading(true);
      try {
        const response = await apiClient.get(ENDPOINTS.ORDER_BY_ID(orderId));
        if (isMounted) {
          setOrder(response.data?.order || response.data || MOCK_ORDER);
        }
      } catch (err) {
        console.warn('API non disponible, utilisation de la commande démo :', err.message);
        if (isMounted) {
          setOrder({ ...MOCK_ORDER, id: orderId || MOCK_ORDER.id });
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
      <div className="min-h-screen bg-[#0D0F12] flex flex-col items-center justify-center gap-4 text-white">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400">Récupération de votre réservation sécurisée...</p>
      </div>
    );
  }

  const currentOrder = order || MOCK_ORDER;
  const expiresAtMs = new Date(currentOrder.reservationExpiresAt || (Date.now() + 600000)).getTime();
  const secondsLeft = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = secondsLeft <= 0;

  const minStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secStr = String(secondsLeft % 60).padStart(2, '0');

  // Calcul financier
  const subtotalMillimes = currentOrder.lockedUnitPriceMillimes * currentOrder.quantity;
  const originalTotal = (currentOrder.originalUnitPriceMillimes || currentOrder.lockedUnitPriceMillimes) * currentOrder.quantity;
  const baseSaved = Math.max(0, originalTotal - subtotalMillimes);

  let discountAmount = 0;
  if (selectedReward === 'DISCOUNT_20') {
    discountAmount = Math.round(subtotalMillimes * 0.2);
  } else if (selectedReward === 'FREE_BASKET') {
    discountAmount = subtotalMillimes;
  }

  const finalTotalMillimes = Math.max(0, subtotalMillimes - discountAmount);
  const totalSavedMillimes = baseSaved + discountAmount;

  // Formatage créneau horaire
  const formatTime = (isoString) => {
    if (!isoString) return '--h--';
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Annulation
  const handleCancel = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler votre réservation ? Le stock sera remis en vente pour d autres étudiants.')) {
      return;
    }
    setIsCancelling(true);
    try {
      await apiClient.post(ENDPOINTS.CANCEL_ORDER(currentOrder.id));
    } catch (err) {
      console.warn('Annulation locale :', err.message);
    } finally {
      setIsCancelling(false);
      navigate('/app/explore');
    }
  };

  // Paiement Konnect ou Gratuit
  const handlePay = async () => {
    if (isExpired) {
      setErrorMessage("Cette réservation a expiré. Veuillez retourner au catalogue pour choisir une nouvelle offre.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.post(ENDPOINTS.INIT_PAYMENT, {
        orderId: currentOrder.id,
        rewardApplied: selectedReward !== 'NONE' ? selectedReward : null,
      });

      const payUrl = response.data?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        // Redirection vers confirmation (simulation / mode gratuit)
        navigate(`/payment/return?orderId=${currentOrder.id}&payment_ref=demo-success`);
      }
    } catch (err) {
      console.warn('Mode démo / Konnect offline, simulation du retour paiement :', err.message);
      navigate(`/payment/return?orderId=${currentOrder.id}&payment_ref=demo-success`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/explore"
            className="text-xs font-semibold text-slate-400 hover:text-[#CCFF00] transition-colors"
          >
            ← Retour au catalogue
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Réf: <strong className="text-[#CCFF00]">{currentOrder.orderCode || 'CS-8K4M9'}</strong>
          </span>
        </div>

        {/* Compte à rebours 10 minutes */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            isExpired
              ? 'bg-[#FF1744]/15 border-[#FF1744]/40 text-[#FF1744]'
              : secondsLeft < 180
              ? 'bg-[#FF5500]/15 border-[#FF5500]/40 text-[#FF5500]'
              : 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⏳</span>
            <div>
              <h3 className="font-bold text-sm">
                {isExpired ? 'Réservation Expirée' : 'Temps restant pour finaliser :'}
              </h3>
              <p className="text-xs opacity-80">
                {isExpired
                  ? 'Le créneau de 10 min est dépassé. Le stock a été libéré.'
                  : 'Votre stock et votre prix unitaire sont verrouillés.'}
              </p>
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-wider">
            {minStr}:{secStr}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#FF1744]/20 border border-[#FF1744]/50 text-[#FF1744] text-xs">
            {errorMessage}
          </div>
        )}

        {/* Récapitulatif de la commande */}
        <div className="p-6 rounded-3xl bg-[#161920] border border-white/10 space-y-5 shadow-xl">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Récapitulatif de votre sauvetage
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {currentOrder.offerTitle || currentOrder.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>🏪 {currentOrder.merchantName}</span>
              <span>•</span>
              <span className="text-[#CCFF00]">📍 {currentOrder.distanceFromEssectM || 180}m de l ESSECT</span>
            </div>
          </div>

          {/* Lignes de détail */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Quantité réservée :</span>
              <span className="font-bold text-white">x {currentOrder.quantity} portion(s)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Prix unitaire verrouillé :</span>
              <span className="font-mono font-bold text-[#CCFF00]">
                {formatTND(currentOrder.lockedUnitPriceMillimes)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Sous-total articles :</span>
              <span className="font-mono text-white">{formatTND(subtotalMillimes)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Créneau de retrait sur place :</span>
              <span className="font-bold text-white">
                {formatTime(currentOrder.pickupStartAt)} – {formatTime(currentOrder.pickupEndAt)}
              </span>
            </div>
          </div>

          {/* Sélecteur de Récompense Fidélité */}
          <div className="p-4 rounded-2xl bg-[#0D0F12] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🌱</span>
                <span>Appliquer un avantage EcoPoints Fidélité :</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedReward('NONE')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                  selectedReward === 'NONE'
                    ? 'border-[#CCFF00] bg-[#CCFF00]/10 text-white font-bold'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>Aucun avantage</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReward('DISCOUNT_20')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                  selectedReward === 'DISCOUNT_20'
                    ? 'border-[#CCFF00] bg-[#CCFF00]/10 text-white font-bold'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-[#CCFF00] font-bold">-20% Réduction</span>
                <span className="text-[10px] text-slate-500">Palier Pousse (200 pts)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReward('FREE_BASKET')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                  selectedReward === 'FREE_BASKET'
                    ? 'border-[#CCFF00] bg-[#CCFF00]/10 text-white font-bold'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-yellow-400 font-bold">100% Offert ✨</span>
                <span className="text-[10px] text-slate-500">Palier Forêt (500 pts)</span>
              </button>
            </div>
          </div>

          {/* Total Net et Économie */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-yellow-400 font-medium">
                <span>Avantage fidélité déduit :</span>
                <span>-{formatTND(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-300">Net à payer :</span>
              <span className="text-3xl font-black text-[#CCFF00]">
                {formatTND(finalTotalMillimes)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex justify-between items-center">
              <span>🎉 Économie totale réalisée :</span>
              <span className="font-bold text-sm">{formatTND(totalSavedMillimes)}</span>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={isSubmitting || isExpired}
            className="flex-1 py-4 px-6 rounded-2xl bg-[#CCFF00] text-black font-black text-sm hover:bg-[#b8e600] active:scale-95 transition-all shadow-lg shadow-[#CCFF00]/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Connexion à Konnect...</span>
              </>
            ) : finalTotalMillimes === 0 ? (
              <span>✨ Valider la Commande Gratuite</span>
            ) : (
              <span>💳 Payer {formatTND(finalTotalMillimes)} avec Konnect</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 text-xs font-bold transition-all disabled:opacity-40"
          >
            {isCancelling ? 'Annulation...' : 'Annuler la réservation'}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          🔒 Paiement sécurisé par carte bancaire tunisienne ou e-Dinar via la passerelle Konnect.
        </p>
      </div>
    </div>
  );
}
