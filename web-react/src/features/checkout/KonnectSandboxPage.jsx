// 💡 Concept & Analogie : Comme le terminal TPE de démonstration Monétique Tunisie au comptoir, cette passerelle Konnect Sandbox intégrée permet de tester Carte Bancaire, e-DINAR ou Wallet sans dépendre d'un portail externe.
// 🔄 Comparaison React / Flutter : En React, `/payment/konnect-sandbox` offre le sélecteur de moyen de paiement et l'adresse e-mail du reçu ; en Flutter, la WebView embarque exactement cette page et intercepte `/payment/return`.
// 🎯 À retenir pour la soutenance : "Même si le serveur externe de test Konnect est hors ligne, notre passerelle Sandbox intégrée simule CIB, e-DINAR, Flouci, le refus bancaire et déclenche l'envoi d'un vrai reçu HTML par e-mail."
// Module : Paiement & Passerelle Konnect Sandbox

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Landmark,
  Smartphone,
  Mail,
  Lock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatTND } from '@shared/money.js';
import { normalizeOrderItems } from '@shared/orders.js';
import { Spinner } from '../../components/ui/index.js';

const PAYMENT_TABS = [
  {
    id: 'card',
    label: 'Carte Bancaire',
    sublabel: 'CIB / Visa / Mastercard',
    Icon: CreditCard,
  },
  {
    id: 'edinar',
    label: 'Carte e-DINAR',
    sublabel: 'La Poste Tunisienne',
    Icon: Landmark,
  },
  {
    id: 'wallet',
    label: 'Wallet Konnect / Flouci',
    sublabel: 'Paiement mobile instantané',
    Icon: Smartphone,
  },
];

export default function KonnectSandboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const orderId = searchParams.get('orderId') || searchParams.get('o') || 'ord-demo-essectx';
  const paymentRef = searchParams.get('payment_ref') || `demo-ksb-${Date.now().toString(36)}`;

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [activeTab, setActiveTab] = useState('card');
  const [receiptEmail, setReceiptEmail] = useState(() => user?.email || profile?.email || '');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Pré-remplit l'adresse e-mail étudiant dès que l'authentification est chargée (sans écraser une saisie manuelle jury)
  useEffect(() => {
    const authEmail = user?.email || profile?.email || '';
    if (!emailTouched && authEmail) {
      setReceiptEmail(authEmail);
    }
  }, [user?.email, profile?.email, emailTouched]);

  useEffect(() => {
    let alive = true;
    async function loadOrder() {
      if (!orderId || orderId.startsWith('ord-demo')) {
        setLoadingOrder(false);
        return;
      }
      try {
        const res = await apiClient.get(ENDPOINTS.ORDER_BY_ID(orderId));
        if (alive) {
          setOrder(res.data?.order || res.data || null);
        }
      } catch {
        // Mode démo ou accès WebView sans en-tête navigateur : la page reste pleinement opérationnelle
      } finally {
        if (alive) setLoadingOrder(false);
      }
    }
    loadOrder();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const items = order ? normalizeOrderItems(order) : [];
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0) || Number(order?.quantity) || 1;
  const merchantName =
    order?.merchantSnapshot?.name || order?.merchantName || 'Commerce Partenaire ESSECT';
  const orderCode = order?.orderCode || orderId;
  const totalMillimes = Number.isFinite(Number(order?.pricing?.totalMillimes))
    ? Number(order.pricing.totalMillimes)
    : Number.isFinite(Number(order?.lockedUnitPriceMillimes))
    ? Number(order.lockedUnitPriceMillimes) * itemCount
    : 3800;
  const totalLabel = formatTND(totalMillimes);

  const handleConfirmTestPayment = () => {
    const trimmed = receiptEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Veuillez saisir une adresse e-mail valide ou laisser le champ vide.');
      return;
    }
    setEmailError('');
    setIsProcessing(true);

    setTimeout(() => {
      const qs = new URLSearchParams({
        orderId,
        payment_ref: paymentRef,
      });
      if (trimmed) {
        qs.set('receiptEmail', trimmed);
      }
      navigate(`/payment/return?${qs.toString()}`);
    }, 900);
  };

  const handleSimulateRefusal = () => {
    const qs = new URLSearchParams({
      orderId,
      payment_ref: `${paymentRef}-fail`,
      status: 'failed',
    });
    navigate(`/payment/return?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] overflow-x-hidden">
      {/* Bandeau supérieur Konnect Sandbox */}
      <div className="bg-[#111111] text-[#FFD000] border-b-2 border-[#111111] px-4 py-2.5 text-center">
        <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex flex-wrap items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>KONNECT NETWORK • ENVIRONNEMENT SANDBOX (MODE TEST — ZÉRO DÉBIT RÉEL)</span>
        </p>
      </div>

      <main className="cs-container py-6 sm:py-10 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            to={orderId ? `/app/checkout/${orderId}` : '/app/explore'}
            className="cs-link inline-flex items-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Retour à la commande</span>
          </Link>

          <div className="inline-flex items-center gap-2.5 rounded-full bg-white border-2 border-[#111111] px-3.5 py-1.5 shadow-[2px_2px_0_#111111]">
            <img
              src="/assets/brand/mascot-sticker-256.png"
              alt="CampusSave"
              width="28"
              height="28"
              className="w-7 h-7 object-contain rounded-md"
            />
            <span className="font-display uppercase text-base tracking-wide">
              Campus<span className="text-[#DA0711]">Save</span>
            </span>
            <span className="text-[#5E5850]" aria-hidden="true">×</span>
            <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded bg-[#FFD000] border border-[#111111]">
              Konnect Test
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Colonne gauche : Récapitulatif commande */}
          <section
            aria-label="Récapitulatif de la transaction Konnect"
            className="lg:col-span-5 rounded-3xl bg-[#FAF6EE] border-2 border-[#111111] shadow-[4px_4px_0_#111111] p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#5E5850]">
                  Monétique Tunisie · Sandbox
                </p>
                <h1 className="font-display text-3xl uppercase leading-none mt-1">
                  Récapitulatif
                </h1>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#111111] text-[#FFD000] font-mono text-xs font-bold px-3 py-1">
                #{orderCode}
              </span>
            </div>

            {loadingOrder ? (
              <div className="py-6 flex items-center gap-3 text-sm text-[#5E5850]">
                <Spinner size="sm" />
                <span>Chargement des détails de la commande...</span>
              </div>
            ) : (
              <>
                <dl className="space-y-2.5 text-sm border-y border-dashed border-[#111111]/25 py-4">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#5E5850] uppercase text-xs font-bold">Commerce</dt>
                    <dd className="font-bold text-right">{merchantName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#5E5850] uppercase text-xs font-bold">Articles</dt>
                    <dd className="font-bold text-right">
                      {itemCount} portion{itemCount > 1 ? 's' : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#5E5850] uppercase text-xs font-bold">Référence</dt>
                    <dd className="font-mono text-xs text-right break-all">{paymentRef}</dd>
                  </div>
                </dl>

                {items.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {items.map((line, i) => (
                      <li key={`${line.offerId}-${i}`} className="flex justify-between gap-3">
                        <span className="font-semibold text-[#111111] min-w-0 break-words">
                          {line.quantity}× {line.title}
                        </span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          {formatTND(line.lineSubtotalMillimes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <div className="rounded-2xl bg-[#111111] text-[#FAF3E6] p-4 flex items-center justify-between gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#FFD000]">
                Total à payer
              </span>
              <span className="font-display text-3xl sm:text-4xl text-white tabular-nums">
                {totalLabel}
              </span>
            </div>

            <p className="text-xs text-[#5E5850] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0 text-[#1F7A3A]" aria-hidden="true" />
              <span>Session chiffrée TLS 1.3 · Simulation sécurisée sans carte réelle requise</span>
            </p>
          </section>

          {/* Colonne droite : Terminal de paiement interactif */}
          <section
            aria-label="Sélecteur de moyen de paiement Sandbox"
            className="lg:col-span-7 rounded-3xl bg-white border-2 border-[#111111] shadow-[4px_4px_0_#111111] p-6 sm:p-7 space-y-6"
          >
            <div>
              <h2 className="cs-h3 text-xl uppercase mb-3">1. Moyen de paiement (Mode Test)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="tablist" aria-label="Méthodes Konnect">
                {PAYMENT_TABS.map(({ id, label, sublabel, Icon }) => {
                  const selected = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5 ${
                        selected
                          ? 'bg-[#FFD000] border-[#111111] shadow-[2px_2px_0_#111111]'
                          : 'bg-[#FAF3E6] border-[#111111]/30 hover:border-[#111111]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block font-bold text-sm leading-tight">{label}</span>
                        <span className="block text-[11px] text-[#5E5850] leading-tight mt-0.5">{sublabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Détails pré-remplis de la méthode sélectionnée */}
            <div className="rounded-2xl bg-[#FAF3E6] border-2 border-[#111111] p-4 space-y-3" role="tabpanel">
              {activeTab === 'card' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="sm:col-span-3">
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">
                      Numéro de carte test (CIB / Visa / Mastercard)
                    </span>
                    <div className="font-mono font-bold text-base bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2.5">
                      4000 •••• •••• 1091
                    </div>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">Expiration</span>
                    <div className="font-mono font-bold bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2">
                      12/28
                    </div>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">CVV</span>
                    <div className="font-mono font-bold bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2">
                      123
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A3A]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      3D-Secure Test OK
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'edinar' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">
                      Carte e-DINAR (La Poste Tunisienne)
                    </span>
                    <div className="font-mono font-bold text-base bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2.5">
                      5359 •••• •••• 8821
                    </div>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">
                      Code Secret Test
                    </span>
                    <div className="font-mono font-bold text-base bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2.5">
                      1984
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block font-mono text-[11px] uppercase text-[#5E5850] mb-1">
                      Identifiant Wallet Konnect / Flouci
                    </span>
                    <div className="font-mono font-bold text-base bg-white border border-[#111111]/30 rounded-xl px-3.5 py-2.5">
                      +216 22 345 678
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A3A] py-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      Solde Sandbox vérifié
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Champ E-mail dynamique pour le reçu HTML */}
            <div>
              <label htmlFor="sandbox-receipt-email" className="cs-field-label flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
                <span>Recevoir le reçu de paiement par e-mail</span>
              </label>
              <input
                id="sandbox-receipt-email"
                type="email"
                value={receiptEmail}
                onChange={(e) => {
                  setEmailTouched(true);
                  setEmailError('');
                  setReceiptEmail(e.target.value);
                }}
                placeholder="etudiant@essect.u-tunis.tn (modifiable pour la démo jury)"
                className="cs-input !min-h-[3rem] !text-[15px]"
              />
              {emailError ? (
                <p role="alert" className="cs-error-text mt-1.5">
                  {emailError}
                </p>
              ) : (
                <p className="text-xs text-[#5E5850] mt-1.5">
                  Un reçu thermique HTML CampusSave avec le lien vers votre Living Ticket QR y sera envoyé automatiquement.
                </p>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleConfirmTestPayment}
                disabled={isProcessing}
                className="cs-btn cs-btn-red cs-btn-lg cs-btn-block whitespace-normal text-center py-3.5"
              >
                {isProcessing ? (
                  <>
                    <Spinner size="sm" variant="white" />
                    <span>Vérification cryptographique Konnect...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>PAYER {totalLabel} (VALIDER PAIEMENT TEST)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateRefusal}
                disabled={isProcessing}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#5E5850] hover:text-[#DA0711] underline underline-offset-4 transition-colors cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Simuler un refus bancaire</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
