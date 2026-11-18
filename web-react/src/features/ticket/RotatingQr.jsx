// 💡 Concept & Analogie : Comme un billet de concert haute sécurité avec un QR code rotatif qui change constamment pour empêcher les copies d'écran illicites.
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

    updateTicket();

    const interval = setInterval(() => {
      const nowMs = Date.now();
      const currentSeconds = Math.floor((nowMs % 30000) / 1000);
      const remaining = 30 - currentSeconds;
      setSecondsRemaining(remaining);

      if (remaining === 30 || !ticketData || ticketData.windowIndex !== getWindowIndex(nowMs)) {
        updateTicket();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ticketKey, orderId]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsRemaining / 30) * circumference;

  return (
    <div className="flex flex-col items-center bg-[#EDE6D7] rounded-3xl p-6 border border-[#111111]/8 shadow-[0_4px_24px_rgba(17,17,17,0.06)] relative overflow-hidden text-[#111111]">
      {/* Pastille Live et statut temps réel */}
      <div className="flex items-center gap-2 mb-4 bg-white px-4 py-1.5 rounded-full border border-[#111111]/10 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] animate-ping" />
        <span className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
          Living Ticket Actif
        </span>
      </div>

      {/* Cadre central du QR Code */}
      <div className="relative p-4 bg-white rounded-2xl border border-[#111111]/10 shadow-sm my-2 flex items-center justify-center">
        {ticketData?.qrPayload ? (
          <QRCodeSVG
            value={ticketData.qrPayload}
            size={220}
            level="H"
            includeMargin={false}
            fgColor="#111111"
            className="transition-opacity duration-300"
          />
        ) : (
          <div className="w-[220px] h-[220px] flex items-center justify-center text-[#777] text-sm font-bold">
            {error ? 'Erreur de génération' : 'Chargement du ticket...'}
          </div>
        )}
      </div>

      {/* Code de secours à 6 chiffres formaté */}
      <div className="mt-4 text-center">
        <span className="text-xs text-[#666] font-bold block mb-1">Code de secours (si caméra indisponible) :</span>
        <div className="inline-flex items-center gap-1 font-anton text-2xl font-black text-[#111111] tracking-widest bg-[#FFD000] px-5 py-1.5 rounded-full border border-[#111111]/15 shadow-sm">
          {ticketData?.code6 ? (
            <>
              <span>{ticketData.code6.slice(0, 3)}</span>
              <span className="text-[#111111]">-</span>
              <span>{ticketData.code6.slice(3, 6)}</span>
            </>
          ) : (
            '------'
          )}
        </div>
      </div>

      {/* Anneau de décompte circulaire 30 secondes */}
      <div className="flex items-center gap-3 mt-5 bg-white px-5 py-2.5 rounded-full border border-[#111111]/10 shadow-sm">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-[#E5E7EB]"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-[#E51C23] transition-all duration-1000 ease-linear"
              fill="transparent"
              strokeDasharray={circumference / 2}
              strokeDashoffset={strokeDashoffset / 2}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-black text-[#111111]">
            {secondsRemaining}
          </span>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-[#111111]">Renouvellement automatique</p>
          <p className="text-[10px] text-[#666] font-medium">Protection anti-capture d'écran</p>
        </div>
      </div>

      {/* Identifiant de commande */}
      {orderCode && (
        <div className="mt-3 text-[11px] font-mono text-[#666] font-bold">
          N° de retrait : <span className="text-[#111111] font-black">{orderCode}</span>
        </div>
      )}
    </div>
  );
}
