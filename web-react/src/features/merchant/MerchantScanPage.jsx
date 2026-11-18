// 💡 Concept & Analogie : Comme la douchette laser à la caisse du supermarché qui bipe les articles et valide le reçu, cette page permet au commerçant de scanner instantanément le Living Ticket ou de saisir le code de secours.
// 🔄 Comparaison React / Flutter : Utilise la bibliothèque Web standard `html5-qrcode` sous React ; sous Flutter, `mobile_scanner` assure la capture caméra native.
// 🎯 À retenir pour la soutenance : "Cette interface offre une double voie de validation : le scan caméra haute vitesse pour le flux normal, et la saisie manuelle de secours en cas de faible éclairage ou de caméra indisponible."
// Module : Espace Commerçant React

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { QrCode, KeyRound, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import Spinner from '../../components/ui/Spinner.jsx';

// Valeur affichable sûre (jamais NaN / undefined)
function safeNum(v) {
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : null;
}

export default function MerchantScanPage() {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Formulaire manuel
  const [orderCode, setOrderCode] = useState('');
  const [code6, setCode6] = useState('');

  // États de traitement et résultat
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Démarrage et arrêt du scanner html5-qrcode
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      if (activeTab !== 'camera' || result || loading) return;

      try {
        setCameraError(null);
        if (!html5QrCodeRef.current && document.getElementById('qr-reader')) {
          const html5QrCode = new Html5Qrcode('qr-reader');
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            async (decodedText) => {
              if (isMounted) {
                // Pause du scan dès qu'un code est capturé
                await stopScanner();
                handleScanSubmit(decodedText);
              }
            },
            () => {
              // Ignore les erreurs intermittentes de trame non décodée
            }
          );
          if (isMounted) setScanning(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Accès caméra impossible ou refusé :', err);
          setCameraError('Accès à la caméra non disponible. Utilisez la saisie manuelle ci-dessous.');
          setScanning(false);
        }
      }
    }

    async function stopScanner() {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {
          // Erreur d'arrêt ignorée
        }
        html5QrCodeRef.current = null;
        if (isMounted) setScanning(false);
      }
    }

    if (activeTab === 'camera' && !result && !loading) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [activeTab, result, loading]);

  // Validation par scan QR
  async function handleScanSubmit(qrPayload) {
    setLoading(true);
    setErrorDetails(null);
    setResult(null);

    try {
      const response = await apiClient.post(ENDPOINTS.SCAN_TICKET, { qrPayload });
      setResult(response.data);
    } catch (err) {
      console.error('Échec de validation du billet :', err);
      const msg = err.response?.data?.error?.message || 'Erreur lors de la validation du billet';
      const code = err.response?.data?.error?.code || 'SCAN_ERROR';
      setErrorDetails({ message: msg, code });
    } finally {
      setLoading(false);
    }
  }

  // Validation par code manuel
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!orderCode.trim() || !code6.trim()) return;

    setLoading(true);
    setErrorDetails(null);
    setResult(null);

    try {
      const formattedCode = orderCode.trim().toUpperCase();
      const response = await apiClient.post(ENDPOINTS.REDEEM_CODE, {
        orderCode: formattedCode,
        code6: code6.trim(),
      });
      setResult(response.data);
    } catch (err) {
      console.error('Échec validation manuelle :', err);
      const msg = err.response?.data?.error?.message || 'Code invalide ou commande expirée';
      const code = err.response?.data?.error?.code || 'MANUAL_CODE_ERROR';
      setErrorDetails({ message: msg, code });
    } finally {
      setLoading(false);
    }
  }

  // Réinitialisation pour scanner la commande suivante
  function handleReset() {
    setResult(null);
    setErrorDetails(null);
    setOrderCode('');
    setCode6('');
    setScanning(false);
  }

  const quantity = safeNum(result?.order?.quantity);
  const points = safeNum(result?.pointsAwarded);

  return (
    <div className="cs-container cs-page">
      {/* En-tête */}
      <header className="mb-10 lg:mb-12 max-w-3xl">
        <p className="cs-eyebrow mb-3">Contrôle au comptoir</p>
        <h1 className="cs-display">Valider un retrait</h1>
        <p className="cs-lead mt-4">
          Scannez le Living Ticket de l'étudiant, ou saisissez son code de secours, puis remettez-lui son panier.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
      <div className="lg:col-span-7 min-w-0">
        {/* Onglets de mode de scan */}
        {!result && (
          <div className="flex flex-wrap gap-3 mb-8" role="group" aria-label="Mode de validation">
            <button
              type="button"
              aria-pressed={activeTab === 'camera'}
              onClick={() => {
                setActiveTab('camera');
                setErrorDetails(null);
              }}
              className="cs-chip !min-h-[3rem] !px-5"
            >
              <QrCode className="w-5 h-5" aria-hidden="true" />
              Caméra
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'manual'}
              onClick={() => {
                setActiveTab('manual');
                setErrorDetails(null);
              }}
              className="cs-chip !min-h-[3rem] !px-5"
            >
              <KeyRound className="w-5 h-5" aria-hidden="true" />
              Code de secours
            </button>
          </div>
        )}

        {/* AFFICHAGE DU RÉSULTAT DU RETRAIT */}
        {result ? (
          <div className="cs-card cs-fade-up p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <span
                className="cs-stamp !border-[#1F7A3A] !text-[#1F7A3A] !text-[2.5rem] !px-5 self-start"
                aria-hidden="true"
              >
                Validé
              </span>
              <div>
                <h2 className="cs-title-lg">Retrait validé !</h2>
                <p className="cs-lead mt-2 text-[#1F7A3A]">Remettez la commande à l'étudiant maintenant.</p>
              </div>
            </div>

            <div className="cs-receipt px-6 pt-6 mb-8">
              <dl className="space-y-3 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#5E5850]">N° commande</dt>
                  <dd className="font-bold tracking-wider text-right">{result.order?.orderCode || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#5E5850]">Étudiant</dt>
                  <dd className="font-bold text-right">
                    {result.order?.studentSnapshot?.displayName || 'Étudiant ESSECT'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#5E5850]">Quantité</dt>
                  <dd className="font-bold text-[#DA0711] text-right">
                    {quantity != null ? `${quantity} portion(s)` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#5E5850]">EcoPoints</dt>
                  <dd className="font-bold text-[#1F7A3A] text-right">{points != null ? `+${points} pts` : '—'}</dd>
                </div>
              </dl>

              {/* Révélation du panier surprise */}
              {result.isSurprise && result.reveal && (
                <>
                  <hr className="cs-receipt-rule" />
                  <p className="font-bold uppercase text-[#DA0711] mb-3">🎁 Contenu du panier surprise</p>
                  <ul className="space-y-2 text-base">
                    {result.reveal.items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-4">
                        <span>{item.name}</span>
                        <span className="font-bold">x{safeNum(item.qty) ?? 1}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <button type="button" onClick={handleReset} className="cs-btn cs-btn-red cs-btn-lg cs-btn-block">
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
              Commande suivante
            </button>
          </div>
        ) : (
          <>
            {/* AFFICHAGE DES ERREURS DE VALIDATION */}
            {errorDetails && (
              <div
                role="alert"
                className="cs-fade-up mb-8 rounded-[1.25rem] bg-[#DA0711] text-[#FAF3E6] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6"
              >
                <span
                  className="cs-stamp !border-[#FAF3E6] !text-[#FAF3E6] !text-[2.25rem] !px-5 self-start"
                  aria-hidden="true"
                >
                  Refusé
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="cs-h3 !text-2xl">Ticket refusé</h3>
                  <p className="text-lg mt-1">{errorDetails.message}</p>
                  <button type="button" onClick={handleReset} className="cs-btn cs-btn-cream cs-btn-sm mt-5 min-h-[44px]">
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {/* VUE SCANNER CAMÉRA : guichet encadré */}
            {activeTab === 'camera' && (
              <div className="cs-card-ink p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <span className="font-sans font-semibold uppercase tracking-[0.08em] text-[15px] text-[#FFD000]">
                    Guichet de retrait
                  </span>
                  <span className="cs-pill cs-pill-mustard">
                    <span
                      className={`w-2 h-2 rounded-full ${scanning ? 'bg-[#DA0711] animate-pulse' : 'bg-[#111111]/40'}`}
                      aria-hidden="true"
                    />
                    {scanning ? 'Caméra active' : 'Caméra en veille'}
                  </span>
                </div>

                <div className="relative mx-auto w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden bg-[#FAF3E6]">
                  <div
                    id="qr-reader"
                    className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
                  />

                  {/* Coins de visée */}
                  <div className="pointer-events-none absolute inset-6" aria-hidden="true">
                    <span className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#FFD000] rounded-tl-2xl" />
                    <span className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#FFD000] rounded-tr-2xl" />
                    <span className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#FFD000] rounded-bl-2xl" />
                    <span className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#FFD000] rounded-br-2xl" />
                  </div>

                  {!scanning && !loading && !cameraError && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center text-[#111111]/50">
                      <QrCode className="w-20 h-20" aria-hidden="true" />
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 bg-[#FAF3E6]/95 flex flex-col items-center justify-center gap-3 text-[#111111] z-10">
                      <Spinner size="lg" />
                      <span className="text-base font-semibold">Vérification du ticket…</span>
                    </div>
                  )}
                </div>

                {cameraError ? (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#DA0711] text-[#FAF3E6] p-4 text-base">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{cameraError}</span>
                  </div>
                ) : (
                  <p className="mt-6 flex items-center justify-center gap-2 text-base text-[#FAF3E6]/85 text-center">
                    <ShieldCheck className="w-5 h-5 text-[#FFD000] shrink-0" aria-hidden="true" />
                    Cadrez le QR code de l'étudiant dans le carré
                  </p>
                )}
              </div>
            )}

            {/* VUE SAISIE MANUELLE DE SECOURS */}
            {activeTab === 'manual' && (
              <div className="cs-card p-6 sm:p-10">
                <form onSubmit={handleManualSubmit} className="space-y-7">
                  <div>
                    <label htmlFor="scan-order-code" className="cs-field-label">
                      Code commande
                    </label>
                    <input
                      id="scan-order-code"
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                      placeholder="CS-XXXXX"
                      maxLength={8}
                      required
                      autoComplete="off"
                      className="cs-input cs-mono !min-h-[4rem] !text-2xl !font-bold uppercase tracking-[0.15em] text-center"
                    />
                    <p className="cs-help-text">Exemple : CS-7H9KZ</p>
                  </div>

                  <div>
                    <label htmlFor="scan-code6" className="cs-field-label">
                      Code de secours (6 chiffres sous le QR)
                    </label>
                    <input
                      id="scan-code6"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={code6}
                      onChange={(e) => setCode6(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                      className="cs-input cs-mono !min-h-[4.5rem] !text-[2.25rem] !font-bold tracking-[0.35em] text-center text-[#DA0711]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || orderCode.length < 5 || code6.length !== 6}
                    className="cs-btn cs-btn-red cs-btn-lg cs-btn-block"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" variant="white" />
                        Vérification…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                        Valider le retrait
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

        {/* Mode d'emploi du guichet */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24" aria-label="Comment valider un retrait">
          <h2 className="cs-title mb-8">Comment ça marche</h2>
          <ol className="space-y-6">
            {[
              {
                title: "L'étudiant présente son ticket",
                text: 'Le Living Ticket affiche un QR code qui change toutes les 30 secondes : une capture d\'écran ne passe pas.',
              },
              {
                title: 'Scannez ou saisissez le code',
                text: 'Caméra par défaut. Si la lumière manque, utilisez le code commande et les 6 chiffres affichés sous le QR.',
              },
              {
                title: 'Remettez la commande',
                text: 'Dès le tampon « Validé », donnez le panier. Les EcoPoints de l\'étudiant sont crédités automatiquement.',
              },
            ].map((step, i) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="cs-dot-badge shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="cs-h3 !text-lg">{step.title}</p>
                  <p className="text-base text-[#5E5850] mt-1 leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/merchant/orders" className="cs-btn cs-btn-cream mt-8">
            Voir les retraits du jour →
          </Link>
        </aside>
      </div>
    </div>
  );
}
