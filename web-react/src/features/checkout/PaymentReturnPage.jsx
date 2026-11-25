// 💡 Concept & Analogie : Comme la porte d'embarquement qui valide votre carte d'accès avec un bip vert avant de vous laisser monter dans l'avion, cette page confirme que la transaction bancaire Konnect a bien été scellée.
// 🔄 Comparaison React / Flutter : En React, la page lit les paramètres d'URL (`useSearchParams`) ; en Flutter, la WebView intercepte l'URL de redirection `campussave://payment-return`.
// 🎯 À retenir pour la soutenance : "Le système vérifie immédiatement la preuve de paiement côté serveur via l'endpoint de réconciliation idempotente `/payments/konnect/verify`."

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/ui/index.js';
import { ArrowRight, RotateCcw, Ticket, MailCheck } from 'lucide-react';

// Déduplique les appels stricts en cours (y compris React 18 StrictMode double-mount) sans jamais bloquer l'état
const inFlightVerifications = new Map();

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const orderId = searchParams.get('orderId') || searchParams.get('o') || 'ord-demo-essectx';
  const paymentRef = searchParams.get('payment_ref') || searchParams.get('paymentId');
  const receiptEmail = searchParams.get('receiptEmail') || '';
  const failedParam = searchParams.get('failed') === '1' || searchParams.get('status') === 'failed';
  const displayReceiptEmail = receiptEmail || user?.email || profile?.email || '';

  const [state, setState] = useState('VERIFYING'); // 'VERIFYING', 'SUCCESS', 'FAILED'
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastCompletedKeyRef = useRef('');

  const runVerification = useCallback(async (forceFresh = false) => {
    const key = `${orderId}|${paymentRef || ''}|${receiptEmail}|${failedParam}`;
    if (failedParam || (paymentRef && paymentRef.endsWith('-fail'))) {
      setState('FAILED');
      setErrorMessage('Paiement refusé par la banque (simulation Sandbox). Aucun montant n’a été débité.');
      return { ok: false };
    }

    if (!forceFresh && lastCompletedKeyRef.current === key) {
      return { ok: true };
    }

    let requestPromise = !forceFresh ? inFlightVerifications.get(key) : null;
    if (!requestPromise) {
      requestPromise = apiClient
        .post(
          ENDPOINTS.VERIFY_PAYMENT,
          {
            orderId,
            ...(paymentRef ? { paymentRef } : {}),
            ...(receiptEmail ? { receiptEmail } : {}),
          },
          { timeout: 15000 }
        )
        .finally(() => {
          inFlightVerifications.delete(key);
        });
      inFlightVerifications.set(key, requestPromise);
    }

    return requestPromise;
  }, [orderId, paymentRef, receiptEmail, failedParam]);

  useEffect(() => {
    let isMounted = true;
    const key = `${orderId}|${paymentRef || ''}|${receiptEmail}|${failedParam}`;

    async function verify() {
      if (failedParam || (paymentRef && paymentRef.endsWith('-fail'))) {
        if (isMounted) {
          setState('FAILED');
          setErrorMessage('Paiement refusé par la banque (simulation Sandbox). Aucun montant n’a été débité.');
        }
        return;
      }

      setState('VERIFYING');
      try {
        const res = await runVerification(retryCount > 0);
        if (!isMounted) return;
        lastCompletedKeyRef.current = key;
        if (res?.data?.confirmed === false) {
          setState('FAILED');
          setErrorMessage(`Le paiement n'est pas confirmé par la passerelle (statut : ${res.data.status || 'en attente'}).`);
        } else {
          setState('SUCCESS');
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response) {
          setState('FAILED');
          setErrorMessage(err.response.data?.error?.message || "Le paiement n'a pas pu être vérifié.");
        } else if (!paymentRef || paymentRef.includes('fail')) {
          setState('FAILED');
          setErrorMessage('Le paiement a été interrompu ou refusé par la banque.');
        } else {
          setState('FAILED');
          setErrorMessage('Délai réseau dépassé lors de la vérification. Appuyez sur Réessayer.');
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [orderId, paymentRef, receiptEmail, failedParam, retryCount, runVerification]);

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
                  {displayReceiptEmail && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E7F5EC] border-2 border-[#1F7A3A] px-4 py-2 text-sm font-bold text-[#1F7A3A]">
                      <MailCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>✓ Paiement Konnect validé • Reçu envoyé à {displayReceiptEmail}</span>
                    </div>
                  )}
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
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="cs-btn cs-btn-red cs-btn-lg whitespace-normal text-center"
                  >
                    <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Vérifier à nouveau</span>
                  </button>
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
