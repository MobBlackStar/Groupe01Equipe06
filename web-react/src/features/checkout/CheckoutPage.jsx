// 💡 Concept & Analogie : Comme le ticket de caisse thermique imprimé minute au comptoir (#CS-...), avec sa perforation en dents de scie et son décompte strict de 10 minutes pour sceller le paiement.
// 🔄 Comparaison React / Flutter : En React, `CheckoutPage` reproduit un reçu thermique physique tactile avec `font-mono` et bordure déchirée ; en Flutter, `checkout_screen.dart` intègre la vue WebView de Konnect Sandbox.
// 🎯 À retenir pour la soutenance : "Pendant les 10 minutes de validité de la commande, le prix unitaire reste scellé même si le cours dégressif de l'offre continue de baisser dans le catalogue public (INV-06)."
// Module : Paiement & Réservation (M5, M6)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { formatTunisTime } from '../../lib/formatters.js';
import { Spinner } from '../../components/ui/index.js';
import {
  Clock,
  CreditCard,
  Gift,
  AlertTriangle,
} from 'lucide-react';

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

    async function fetchOrder() {
      setLoading(true);
      if (!orderId) {
        if (isMounted) {
          setOrder(MOCK_ORDER);
          setLoading(false);
        }
        return;
      }
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
      <div className="min-h-screen bg-[#F4EFE6] flex flex-col items-center justify-center gap-4 text-[#141210]">
        <Spinner size="lg" />
        <p className="text-xs text-[#555] font-bold">Édition de votre reçu thermique sécurisé...</p>
      </div>
    );
  }

  const currentOrder = order || MOCK_ORDER;
  const expiresAtMs = new Date(currentOrder.reservationExpiresAt || (Date.now() + 600000)).getTime();
  const secondsLeft = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = secondsLeft <= 0;

  const minStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secStr = String(secondsLeft % 60).padStart(2, '0');

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
        navigate(`/payment/return?orderId=${currentOrder.id}&payment_ref=demo-success`);
      }
    } catch (err) {
      console.warn('Mode démo / Konnect sandbox simulation :', err.message);
      navigate(`/payment/return?orderId=${currentOrder.id}&payment_ref=demo-success`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/explore"
            className="text-xs font-anton uppercase tracking-wider text-[#141210] hover:text-[#E51C23] transition-colors"
          >
            ← Retour au catalogue
          </Link>
          <span className="text-xs font-mono font-bold text-[#E51C23]">
            RÉSERVATION EN COURS
          </span>
        </div>

        {/* Bannière 10 minutes décompte */}
        <div
          className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all shadow-[4px_4px_0px_#141210] ${
            isExpired
              ? 'bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C]'
              : secondsLeft < 180
              ? 'bg-[#FEF08A] border-[#141210] text-[#854D0E] animate-pulse'
              : 'bg-[#DCFCE7] border-[#141210] text-[#15803D]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="font-anton uppercase text-sm tracking-wide">
                {isExpired ? 'Réservation Expirée' : 'Prix et stock verrouillés :'}
              </h3>
              <p className="text-[11px] font-mono font-bold">
                {isExpired
                  ? 'Le créneau de 10 min est dépassé. Le stock a été libéré.'
                  : 'Finalisez votre paiement avant la fin du décompte.'}
              </p>
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-widest pl-2">
            {minStr}:{secStr}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FEE2E2] border-2 border-[#DC2626] text-[#B91C1C] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#DC2626]">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =========================================================================
            REÇU THERMIQUE PHYSIQUE SERRATÉ
            ========================================================================= */}
        <div className="relative rounded-xl bg-[#FAF6EE] text-[#141210] p-6 sm:p-8 font-mono text-xs shadow-[6px_6px_0px_#141210] border-2 border-[#141210]">
          
          {/* En-tête du Reçu */}
          <div className="text-center pb-4 border-b-2 border-dashed border-[#141210]/30">
            <p className="font-anton uppercase text-2xl font-black tracking-wider text-[#141210]">
              CAMPUSSAVE · REÇU DE CAISSE
            </p>
            <p className="text-[10px] text-[#555] mt-0.5 font-bold">
              ESSECT MONTFLEURY · TUNIS (2026)
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-[#141210] text-white font-bold text-[11px]">
              CODE RÉSERVATION : #{currentOrder.orderCode || 'CS-8K4M9'}
            </div>
          </div>

          {/* Métadonnées service */}
          <div className="py-3 flex justify-between text-[11px] text-[#555] font-bold border-b-2 border-dashed border-[#141210]/20">
            <span>COMMERCE : {currentOrder.merchantName}</span>
            <span>DATE : 18/11/2026</span>
          </div>

          {/* Lignes d'articles décomposées */}
          <div className="py-4 space-y-2 border-b-2 border-dashed border-[#141210]/30 text-xs">
            <div className="flex justify-between font-black text-sm text-[#141210]">
              <span>{currentOrder.quantity}x {currentOrder.offerTitle || currentOrder.title}</span>
              <span>{formatTND(subtotalMillimes)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#555] font-bold pl-4">
              <span>Prix unitaire scellé :</span>
              <span>{formatTND(currentOrder.lockedUnitPriceMillimes)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#555] font-bold pl-4">
              <span>Créneau retrait sur place :</span>
              <span>{formatTunisTime(currentOrder.pickupStartAt)} – {formatTunisTime(currentOrder.pickupEndAt)}</span>
            </div>

            {/* Récompense déduite si sélectionnée */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#15803D] font-black pt-1">
                <span>Avantage EcoPoints appliqué :</span>
                <span>-{formatTND(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Sélecteur Récompense EcoPoints */}
          <div className="my-4 p-3.5 rounded-lg bg-white border-2 border-[#141210] space-y-2 font-sans shadow-[2px_2px_0px_#141210]">
            <span className="text-[11px] font-anton uppercase text-[#141210] flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-[#E51C23]" />
              <span>Avantage Fidélité Disponible :</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedReward(selectedReward === 'DISCOUNT_20' ? 'NONE' : 'DISCOUNT_20')}
                className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  selectedReward === 'DISCOUNT_20'
                    ? 'bg-[#15803D] text-white border-[#141210] font-black shadow-[2px_2px_0px_#141210]'
                    : 'bg-[#FAF6EE] text-[#141210] border-[#141210] hover:bg-white font-bold'
                }`}
              >
                🎟️ -20% Immédiat (100 pts)
              </button>
              <button
                type="button"
                onClick={() => setSelectedReward(selectedReward === 'FREE_BASKET' ? 'NONE' : 'FREE_BASKET')}
                className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  selectedReward === 'FREE_BASKET'
                    ? 'bg-[#15803D] text-white border-[#141210] font-black shadow-[2px_2px_0px_#141210]'
                    : 'bg-[#FAF6EE] text-[#141210] border-[#141210] hover:bg-white font-bold'
                }`}
              >
                🎁 Panier Offert (300 pts)
              </button>
            </div>
          </div>

          {/* Totaux & Économie */}
          <div className="pt-2 pb-4 space-y-1.5 font-mono">
            <div className="flex justify-between text-xs text-[#555] font-bold">
              <span>PRIX INITIAL PUBLIC :</span>
              <span className="line-through">{formatTND(originalTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#15803D] font-black">
              <span>ÉCONOMIE TOTALE SAUVÉE :</span>
              <span>{formatTND(totalSavedMillimes)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t-2 border-dashed border-[#141210]/30">
              <span className="font-anton uppercase text-base text-[#141210]">
                TOTAL NET À RÉGLER :
              </span>
              <span className="font-anton text-3xl text-[#E51C23]">
                {formatTND(finalTotalMillimes)}
              </span>
            </div>
          </div>

          {/* Code-barres simulé en bas */}
          <div className="my-4 pt-3 border-t-2 border-dashed border-[#141210]/30 flex flex-col items-center">
            <div className="h-7 w-full bg-[repeating-linear-gradient(90deg,#141210,#141210_2px,transparent_2px,transparent_4px)] opacity-80" />
            <span className="text-[8px] font-bold tracking-widest text-[#555] mt-1">CS-{currentOrder.id}-SECURE-HOLD</span>
          </div>

          {/* Actions : Payer Konnect / Annuler */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handlePay}
              disabled={isSubmitting || isExpired}
              className="w-full btn-griddle-primary py-3.5 cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-white" />
              <span>{isSubmitting ? 'Paiement en cours...' : `Payer via Konnect Test (${formatTND(finalTotalMillimes)}) →`}</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full py-2.5 text-center text-xs font-mono font-bold text-[#555] hover:text-[#E51C23] transition-colors cursor-pointer"
            >
              {isCancelling ? 'Annulation...' : 'Annuler et libérer la réservation'}
            </button>
          </div>

          {/* Dents de scie inférieures du reçu */}
          <div
            aria-hidden="true"
            className="w-full h-3 bg-repeat-x pointer-events-none mt-4 -mb-6 sm:-mb-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' fill='%23FAF6EE'%3E%3Cpolygon points='0,0 8,10 16,0'/%3E%3C/svg%3E")`,
              backgroundSize: '16px 10px',
              filter: 'drop-shadow(0 2px 2px rgba(20,18,16,0.15))',
            }}
          />
        </div>
      </div>
    </div>
  );
}
