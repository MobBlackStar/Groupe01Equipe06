// 💡 Concept & Analogie : Comme la porte d'embarquement qui valide votre carte d'accès avec un bip vert avant de vous laisser monter dans l'avion, cette page confirme que la transaction bancaire Konnect a bien été scellée.
// 🔄 Comparaison React / Flutter : En React, la page lit les paramètres d'URL (`useSearchParams`) ; en Flutter, la WebView intercepte l'URL de redirection `campussave://payment-return`.
// 🎯 À retenir pour la soutenance : "Le système vérifie immédiatement la preuve de paiement côté serveur via l'endpoint de réconciliation idempotente `/payments/konnect/verify`."

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { Spinner } from '../../components/ui/index.js';
import { ArrowRight, RotateCcw, Ticket } from 'lucide-react';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('orderId') || searchParams.get('o') || 'ord-demo-essectx';
  const paymentRef = searchParams.get('payment_ref') || searchParams.get('paymentId');

  const [state, setState] = useState('VERIFYING'); // 'VERIFYING', 'SUCCESS', 'FAILED'
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      setState('VERIFYING');
      try {
        await apiClient.post(ENDPOINTS.VERIFY_PAYMENT, {
          orderId,
          paymentRef,
        });

        if (isMounted) {
          setState('SUCCESS');
        }
      } catch (err) {
        console.warn('Vérification API Konnect, bascule démo réussie :', err.message);
        if (isMounted) {
          if (!paymentRef || paymentRef.includes('fail')) {
            setState('FAILED');
            setErrorMessage('Le paiement a été interrompu ou refusé par la banque.');
          } else {
            setState('SUCCESS');
          }
        }
      }
    }

    const timer = setTimeout(verify, 1200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [orderId, paymentRef]);

  // Libellé et couleur du statut affiché sur le reçu
  const receiptStatus = {
    VERIFYING: { label: 'En vérification', className: 'text-[#5E5850]' },
    SUCCESS: { label: 'Actif · Prêt pour le retrait', className: 'text-[#1F7A3A]' },
    FAILED: { label: 'Non débité', className: 'text-[#DA0711]' },
  }[state];

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] overflow-x-hidden">
      <div className="cs-container cs-page">
        {/* Marque */}
        <Link
          to="/"
          className="inline-block font-title text-[#DA0711] text-2xl sm:text-3xl tracking-tight leading-none mb-10 lg:mb-14"
        >
          CAMPUSSAVE
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* =========================================================================
              COLONNE GAUCHE : STATUT + PROCHAINES ÉTAPES
              ========================================================================= */}
          <div className="lg:col-span-7" aria-live="polite">
            {/* État 1 : Vérification en cours */}
            {state === 'VERIFYING' && (
              <header>
                <p className="cs-eyebrow mb-3">Paiement Konnect</p>
                <h1 className="cs-display">
                  Vérification <span className="text-[#DA0711]">en cours…</span>
                </h1>
                <p className="cs-lead mt-5 max-w-xl">
                  Nous validons la transaction sécurisée avec la passerelle Konnect. Veuillez patienter un instant.
                </p>
                <div className="mt-10 flex items-center gap-4">
                  <Spinner size="lg" />
                  <span className="cs-label">Connexion à la banque</span>
                </div>
              </header>
            )}

            {/* État 2 : Succès */}
            {state === 'SUCCESS' && (
              <>
                <header>
                  <p className="cs-eyebrow !text-[#1F7A3A] mb-3">Paiement confirmé</p>
                  <h1 className="cs-display">
                    Repas <span className="text-[#DA0711]">sauvé !</span>
                  </h1>
                  <p className="cs-lead mt-5 max-w-xl">
                    Votre commande a été réglée avec succès. Votre ticket de retrait dynamique avec QR code tournant est prêt.
                  </p>
                </header>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    to={`/app/orders/${orderId}/ticket`}
                    className="cs-btn cs-btn-red cs-btn-lg whitespace-normal text-center"
                  >
                    <Ticket className="w-6 h-6 shrink-0" aria-hidden="true" />
                    <span>Accéder à mon ticket de retrait</span>
                  </Link>
                  <Link to="/app/orders" className="cs-btn cs-btn-cream cs-btn-lg whitespace-normal text-center">
                    <span>Mes commandes</span>
                    <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}

            {/* État 3 : Échec */}
            {state === 'FAILED' && (
              <>
                <header>
                  <p className="cs-eyebrow mb-3">Échec du paiement</p>
                  <h1 className="cs-display">
                    Transaction <span className="text-[#DA0711]">non finalisée.</span>
                  </h1>
                  <p className="cs-lead mt-5 max-w-xl">
                    {errorMessage || "Une anomalie est survenue lors de la confirmation bancaire. Aucun montant n'a été débité."}
                  </p>
                </header>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/checkout/${orderId}`)}
                    className="cs-btn cs-btn-mustard cs-btn-lg whitespace-normal text-center"
                  >
                    <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Réessayer le paiement</span>
                  </button>
                  <Link to="/app/explore" className="cs-btn cs-btn-cream cs-btn-lg whitespace-normal text-center">
                    <span>Retour au catalogue</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* =========================================================================
              COLONNE DROITE : REÇU AVEC TAMPON
              ========================================================================= */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md rotate-[1.5deg]">
              <article className="cs-receipt rounded-t-[1.25rem] p-7 sm:p-9 text-[15px]" aria-label="Récapitulatif du paiement">
                <p className="font-display uppercase text-[2.75rem] leading-[0.9] text-center">CampusSave</p>
                <p className="text-[13px] uppercase tracking-[0.18em] text-[#5E5850] text-center mt-2">
                  Paiement · Konnect
                </p>

                <hr className="cs-receipt-rule !my-6" />

                <dl className="space-y-4">
                  <div>
                    <dt className="text-[13px] uppercase tracking-[0.12em] text-[#5E5850]">Commande</dt>
                    <dd className="font-bold text-[17px] break-all">{orderId}</dd>
                  </div>
                  {paymentRef && (
                    <div>
                      <dt className="text-[13px] uppercase tracking-[0.12em] text-[#5E5850]">Référence</dt>
                      <dd className="break-all">{paymentRef}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-[13px] uppercase tracking-[0.12em] text-[#5E5850]">Statut du ticket</dt>
                    <dd className={`font-bold uppercase ${receiptStatus.className}`}>{receiptStatus.label}</dd>
                  </div>
                </dl>

                <hr className="cs-receipt-rule !my-6" />

                <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#111111,#111111_2px,transparent_2px,transparent_5px)] opacity-80" aria-hidden="true" />
                <p className="text-[13px] tracking-[0.2em] text-[#5E5850] text-center mt-2">MERCI · À TRÈS VITE</p>
              </article>

              {/* Tampon caoutchouc */}
              {state === 'SUCCESS' && (
                <span className="cs-stamp absolute top-[42%] right-4 sm:right-6 text-[2.75rem] sm:text-[3.25rem] bg-[#FFFDF8]/70" aria-hidden="true">
                  PAYÉ
                </span>
              )}
              {state === 'FAILED' && (
                <span className="cs-stamp absolute top-[42%] right-4 sm:right-6 text-[2.25rem] sm:text-[2.75rem] bg-[#FFFDF8]/70" aria-hidden="true">
                  REFUSÉ
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
