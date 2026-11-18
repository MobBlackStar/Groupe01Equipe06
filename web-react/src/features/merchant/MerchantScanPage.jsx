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
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E51C23] text-white text-xs font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0px_#141210]">
            <QrCode className="w-3.5 h-3.5" />
            <span>Contrôle &amp; Validation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-anton uppercase tracking-wide text-[#141210] mb-2">
            Validation des Retraits
          </h1>
          <p className="text-xs sm:text-sm text-[#141210]/70 font-sans">
            Vérifiez le Living Ticket de l'étudiant pour lui remettre son panier anti-gaspi.
          </p>
        </div>

        {/* Onglets de mode de scan */}
        {!result && (
          <div className="flex bg-[#FAF6EE] border-2 border-[#141210] p-1 rounded-2xl mb-6 shadow-[3px_3px_0px_#141210]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setErrorDetails(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'camera'
                  ? 'bg-[#E51C23] text-white shadow-[2px_2px_0px_#141210]'
                  : 'text-[#141210]/70 hover:text-[#141210]'
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                activeTab === 'manual'
                  ? 'bg-[#E51C23] text-white shadow-[2px_2px_0px_#141210]'
                  : 'text-[#141210]/70 hover:text-[#141210]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Saisie de Secours (6 chiffres)
            </button>
          </div>
        )}

        {/* AFFICHAGE DU RÉSULTAT DU RETRAIT */}
        {result ? (
          <div className="bg-[#FAF6EE] border-2 border-[#15803D] rounded-3xl p-6 shadow-[6px_6px_0px_#141210] text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-[#DCFCE7] text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="font-anton uppercase text-2xl sm:text-3xl text-[#141210] mb-1">
              Retrait Validé !
            </h2>
            <p className="text-[#15803D] font-black text-sm mb-6">
              Remettre la commande à l'étudiant dès maintenant.
            </p>

            <div className="bg-white rounded-2xl p-4 border-2 border-[#141210] shadow-[3px_3px_0px_#141210] text-left space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm border-b border-[#141210]/15 pb-2">
                <span className="text-[#141210]/60 font-mono text-xs">N° Commande :</span>
                <span className="font-mono font-black text-[#141210] tracking-wider">
                  {result.order?.orderCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#141210]/15 pb-2">
                <span className="text-[#141210]/60 font-mono text-xs">Étudiant :</span>
                <span className="font-bold text-[#141210]">
                  {result.order?.studentSnapshot?.displayName || 'Étudiant ESSECT'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[#141210]/15 pb-2">
                <span className="text-[#141210]/60 font-mono text-xs">Quantité :</span>
                <span className="font-black text-[#E51C23]">
                  {result.order?.quantity} portion(s)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#141210]/60 font-mono text-xs">EcoPoints attribués :</span>
                <span className="font-black text-[#15803D]">
                  +{result.pointsAwarded} pts
                </span>
              </div>

              {/* Révélation du panier surprise */}
              {result.isSurprise && result.reveal && (
                <div className="mt-4 pt-3 border-t-2 border-dashed border-[#141210]/20">
                  <span className="text-xs font-black uppercase tracking-wider text-[#E51C23] block mb-2 font-mono">
                    🎁 Contenu Mystery Box Dévoilé :
                  </span>
                  <ul className="space-y-1">
                    {result.reveal.items?.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#141210] flex justify-between font-mono">
                        <span>• {item.name}</span>
                        <span className="font-black text-[#141210]">x{item.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-[#E51C23] text-white font-anton uppercase text-lg py-3.5 px-6 rounded-xl border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Scanner la commande suivante
            </button>
          </div>
        ) : (
          <>
            {/* AFFICHAGE DES ERREURS DE VALIDATION */}
            {errorDetails && (
              <div className="bg-[#FEE2E2] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] rounded-2xl p-5 mb-6 text-center animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-white text-[#991B1B] rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-[#141210]">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="font-anton uppercase text-lg text-[#991B1B] mb-1">Refus du Billet</h3>
                <p className="text-[#141210] text-sm mb-4 font-sans">{errorDetails.message}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 bg-white text-[#141210] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] px-4 py-2 rounded-lg text-xs font-black transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réessayer
                </button>
              </div>
            )}

            {/* VUE SCANNER CAMÉRA */}
            {activeTab === 'camera' && (
              <div className="bg-[#FAF6EE] border-2 border-[#141210] rounded-3xl p-6 shadow-[4px_4px_0px_#141210] text-center">
                <div className="relative mx-auto rounded-2xl overflow-hidden bg-white max-w-[320px] aspect-square flex items-center justify-center border-2 border-[#141210] shadow-[3px_3px_0px_#141210]">
                  <div id="qr-reader" className="w-full h-full" />
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-[#141210] z-10">
                      <div className="w-8 h-8 border-3 border-[#E51C23] border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-xs font-black font-mono">Vérification cryptographique...</span>
                    </div>
                  )}
                </div>

                {cameraError ? (
                  <div className="mt-4 flex items-center gap-2 text-[#991B1B] text-xs bg-[#FEE2E2] border-2 border-[#141210] p-3 rounded-xl text-left shadow-[2px_2px_0px_#141210]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-[#141210]/70 mt-4 flex items-center justify-center gap-1.5 font-sans font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                    Cadrez le QR code dynamique de l'étudiant dans le carré
                  </p>
                )}
              </div>
            )}

            {/* VUE SAISIE MANUELLE DE SECOURS */}
            {activeTab === 'manual' && (
              <div className="bg-[#FAF6EE] border-2 border-[#141210] rounded-3xl p-6 shadow-[4px_4px_0px_#141210]">
                <form onSubmit={handleManualSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#141210]/70 mb-2 font-mono">
                      Code Commande (ex : CS-7H9KZ)
                    </label>
                    <input
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                      placeholder="CS-XXXXX"
                      maxLength={8}
                      required
                      className="w-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] rounded-xl px-4 py-3 text-[#141210] font-mono text-lg uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#141210] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#141210]/70 mb-2 font-mono">
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
                      className="w-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] rounded-xl px-4 py-3 text-[#E51C23] font-mono text-2xl tracking-widest text-center focus:outline-none focus:shadow-[4px_4px_0px_#141210] font-black transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || orderCode.length < 5 || code6.length !== 6}
                    className="w-full bg-[#E51C23] text-white font-anton uppercase text-lg py-3.5 rounded-xl border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:shadow-[1px_1px_0px_#141210] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
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