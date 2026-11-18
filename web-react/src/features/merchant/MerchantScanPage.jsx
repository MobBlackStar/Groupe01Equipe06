// 💡 Concept & Analogie : Comme la douchette laser à la caisse du supermarché qui bipe les articles et valide le reçu, cette page permet au commerçant de scanner instantanément le Living Ticket ou de saisir le code de secours.
// 🔄 Comparaison React / Flutter : Utilise la bibliothèque Web standard `html5-qrcode` sous React ; sous Flutter, `mobile_scanner` assure la capture caméra native.
// 🎯 À retenir pour la soutenance : "Cette interface offre une double voie de validation : le scan caméra haute vitesse pour le flux normal, et la saisie manuelle de secours en cas de faible éclairage ou de caméra indisponible."
// Module : Espace Commerçant React

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { QrCode, KeyRound, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#DA0711] text-white text-xs font-anton uppercase tracking-wider mb-2 shadow-sm">
            <QrCode className="w-3.5 h-3.5" />
            <span>Contrôle &amp; Validation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-anton uppercase tracking-wide text-[#111111] mb-2">
            Validation des Retraits
          </h1>
          <p className="text-xs sm:text-sm text-[#666] font-sans">
            Vérifiez le Living Ticket de l'étudiant pour lui remettre son panier anti-gaspi.
          </p>
        </div>

        {/* Onglets de mode de scan */}
        {!result && (
          <div className="flex bg-[#EDE6D7] border border-[#111111]/8 p-1.5 rounded-full mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setErrorDetails(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-anton uppercase text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#DA0711] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#111111]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Scanner Caméra
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                setErrorDetails(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-anton uppercase text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#DA0711] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#111111]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Saisie de Secours (6 chiffres)
            </button>
          </div>
        )}

        {/* AFFICHAGE DU RÉSULTAT DU RETRAIT */}
        {result ? (
          <div className="bg-[#EDE6D7] border border-[#15803D]/20 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(17,17,17,0.06)] text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-[#DCFCE7] text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="font-anton uppercase text-2xl sm:text-3xl text-[#111111] mb-1">
              Retrait Validé !
            </h2>
            <p className="text-[#15803D] font-bold text-sm mb-6">
              Remettre la commande à l'étudiant dès maintenant.
            </p>

            <div className="bg-white rounded-2xl p-5 border border-[#111111]/10 shadow-sm text-left space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm border-b border-[#111111]/10 pb-2">
                <span className="text-[#666] font-mono text-xs">N° Commande :</span>
                <span className="font-mono font-bold text-[#111111] tracking-wider">
                  {result.order?.orderCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#111111]/10 pb-2">
                <span className="text-[#666] font-mono text-xs">Étudiant :</span>
                <span className="font-bold text-[#111111]">
                  {result.order?.studentSnapshot?.displayName || 'Étudiant ESSECT'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#111111]/10 pb-2">
                <span className="text-[#666] font-mono text-xs">Quantité :</span>
                <span className="font-bold text-[#DA0711]">
                  {result.order?.quantity} portion(s)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#666] font-mono text-xs">EcoPoints attribués :</span>
                <span className="font-bold text-[#15803D]">
                  +{result.pointsAwarded} pts
                </span>
              </div>

              {/* Révélation du panier surprise */}
              {result.isSurprise && result.reveal && (
                <div className="mt-4 pt-3 border-t border-dashed border-[#111111]/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#DA0711] block mb-2 font-mono">
                    🎁 Contenu Mystery Box Dévoilé :
                  </span>
                  <ul className="space-y-1">
                    {result.reveal.items?.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#111111] flex justify-between font-mono">
                        <span>• {item.name}</span>
                        <span className="font-bold text-[#111111]">x{item.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full btn-griddle-primary py-4 rounded-full flex items-center justify-center gap-2 cursor-pointer font-anton uppercase text-base"
            >
              <RotateCcw className="w-5 h-5" />
              Scanner la commande suivante
            </button>
          </div>
        ) : (
          <>
            {/* AFFICHAGE DES ERREURS DE VALIDATION */}
            {errorDetails && (
              <div className="bg-[#FEE2E2] border border-[#DA0711]/20 shadow-sm rounded-3xl p-6 mb-6 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-white text-[#DA0711] rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="font-anton uppercase text-lg text-[#DA0711] mb-1">Refus du Billet</h3>
                <p className="text-[#111111] text-sm mb-4 font-sans">{errorDetails.message}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 bg-white text-[#111111] border border-[#111111]/15 shadow-sm px-5 py-2 rounded-full text-xs font-bold transition-all hover:bg-[#FAF3E6] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réessayer
                </button>
              </div>
            )}

            {/* VUE SCANNER CAMÉRA */}
            {activeTab === 'camera' && (
              <div className="bg-[#EDE6D7] border border-[#111111]/8 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(17,17,17,0.04)] text-center">
                <div className="relative mx-auto rounded-2xl overflow-hidden bg-white max-w-[320px] aspect-square flex items-center justify-center border border-[#111111]/10 shadow-sm">
                  <div id="qr-reader" className="w-full h-full" />
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-[#111111] z-10">
                      <div className="w-8 h-8 border-3 border-[#DA0711] border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs font-bold font-mono">Vérification cryptographique...</span>
                    </div>
                  )}
                </div>

                {cameraError ? (
                  <div className="mt-4 flex items-center gap-2 text-[#DA0711] text-xs bg-[#FEE2E2] border border-[#DA0711]/20 p-3.5 rounded-2xl text-left shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-[#666] mt-4 flex items-center justify-center gap-1.5 font-sans font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                    Cadrez le QR code dynamique de l'étudiant dans le carré
                  </p>
                )}
              </div>
            )}

            {/* VUE SAISIE MANUELLE DE SECOURS */}
            {activeTab === 'manual' && (
              <div className="bg-[#EDE6D7] border border-[#111111]/8 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(17,17,17,0.04)]">
                <form onSubmit={handleManualSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#666] mb-2 font-mono">
                      Code Commande (ex : CS-7H9KZ)
                    </label>
                    <input
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                      placeholder="CS-XXXXX"
                      maxLength={8}
                      required
                      className="w-full bg-white border border-[#111111]/15 shadow-sm rounded-full px-5 py-3 text-[#111111] font-mono text-base uppercase tracking-wider focus:outline-none focus:border-[#DA0711] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#666] mb-2 font-mono">
                      Code de Secours (6 chiffres affichés sous le QR)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={code6}
                      onChange={(e) => setCode6(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="w-full bg-white border border-[#111111]/15 shadow-sm rounded-full px-5 py-3 text-[#DA0711] font-mono text-2xl tracking-widest text-center focus:outline-none focus:border-[#DA0711] font-black transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || orderCode.length < 5 || code6.length !== 6}
                    className="w-full btn-griddle-primary py-4 rounded-full text-base font-anton cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Valider le Retrait
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}