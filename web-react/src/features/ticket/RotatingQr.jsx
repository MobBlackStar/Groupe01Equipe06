// 💡 Concept & Analogie : Comme un billet de concert haute sécurité avec un hologramme animé et un code-barres qui change constamment pour empêcher les copies d'écran illicites.
// 🔄 Comparaison React / Flutter : En React, `qrcode.react` rend le QR SVG avec un anneau de compte à rebours SVG ; en Flutter, `qr_flutter` et un `CustomPaint` réalisent l'équivalent.
// 🎯 À retenir pour la soutenance : "Le composant calcule localement la rotation cryptographique 30 secondes et présente à la fois le QR code dynamique et le code de secours à 6 chiffres."
// Module : Interface Living Ticket React

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateClientTicketData, getWindowIndex } from '../../lib/ticketCrypto.js';

export function RotatingQr({ ticketKey, orderId, orderCode }) {
  const [ticketData, setTicketData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketKey || !orderId) return;

    let isMounted = true;

    async function updateTicket() {
      try {
        const nowMs = Date.now();
        const currentWindow = getWindowIndex(nowMs);
        const data = await generateClientTicketData(ticketKey, orderId, currentWindow);
        if (isMounted) {
          setTicketData(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur génération ticket dynamique :', err);
          setError(err.message);
        }
      }
    }

    // Calcul initial immédiat
    updateTicket();

    // Horloge d'animation et de rotation (rafraîchie chaque seconde)
    const interval = setInterval(() => {
      const nowMs = Date.now();
      const currentSeconds = Math.floor((nowMs % 30000) / 1000);
      const remaining = 30 - currentSeconds;
      setSecondsRemaining(remaining);

      // Renouvellement à l'expiration de la fenêtre de 30 secondes
      if (remaining === 30 || !ticketData || ticketData.windowIndex !== getWindowIndex(nowMs)) {
        updateTicket();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ticketKey, orderId]);

  // Rayon et circonférence de l'anneau de progression SVG
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsRemaining / 30) * circumference;

  return (
    <div className="flex flex-col items-center bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Pastille Live et statut temps réel */}
      <div className="flex items-center gap-2 mb-4 bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Living Ticket Actif
        </span>
      </div>

      {/* Cadre central du QR Code avec anneau de synchronisation */}
      <div className="relative p-4 bg-white rounded-2xl shadow-inner my-2 flex items-center justify-center">
        {ticketData?.qrPayload ? (
          <QRCodeSVG
            value={ticketData.qrPayload}
            size={220}
            level="H"
            includeMargin={false}
            className="transition-opacity duration-300"
          />
        ) : (
          <div className="w-[220px] h-[220px] flex items-center justify-center text-gray-500 text-sm">
            {error ? 'Erreur de génération' : 'Chargement du ticket...'}
          </div>
        )}
      </div>

      {/* Code de secours à 6 chiffres formaté pour lecture humaine */}
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-400 block mb-1">Code de secours (si caméra indisponible) :</span>
        <div className="inline-flex items-center gap-1 font-mono text-2xl font-black text-[#CCFF00] tracking-widest bg-gray-800/90 px-4 py-1.5 rounded-xl border border-gray-700">
          {ticketData?.code6 ? (
            <>
              <span>{ticketData.code6.slice(0, 3)}</span>
              <span className="text-gray-500">-</span>
              <span>{ticketData.code6.slice(3, 6)}</span>
            </>
          ) : (
            '------'
          )}
        </div>
      </div>

      {/* Anneau de décompte circulaire 30 secondes */}
      <div className="flex items-center gap-3 mt-5 bg-gray-950/60 px-5 py-2.5 rounded-2xl border border-gray-800/80">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-800"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-[#CCFF00] transition-all duration-1000 ease-linear"
              fill="transparent"
              strokeDasharray={circumference / 2}
              strokeDashoffset={strokeDashoffset / 2}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-gray-300">
            {secondsRemaining}
          </span>
        </div>
        <div className="text-left">
          <p className="text-xs font-medium text-gray-300">Renouvellement automatique</p>
          <p className="text-[10px] text-gray-500">Protection anti-capture d'écran</p>
        </div>
      </div>

      {/* Identifiant de commande */}
      {orderCode && (
        <div className="mt-3 text-[11px] font-mono text-gray-400">
          N° de retrait : <span className="text-gray-200 font-semibold">{orderCode}</span>
        </div>
      )}
    </div>
  );
}
