// 💡 Concept & Analogie : Comme un billet de concert haute sécurité avec un QR code rotatif qui change constamment pour empêcher les copies d'écran illicites.
// 🔄 Comparaison React / Flutter : En React, `qrcode.react` rend le QR SVG avec un anneau de compte à rebours SVG ; en Flutter, `qr_flutter` et un `CustomPaint` réalisent l'équivalent.
// 🎯 À retenir pour la soutenance : "Le composant calcule localement la rotation cryptographique 30 secondes et présente à la fois le QR code dynamique et le code de secours à 6 chiffres."
// Module : Interface Living Ticket React

import React, { useState, useEffect } from 'react';
import HalftoneMascotQr from './HalftoneMascotQr.jsx';
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
    <div className="cs-card-paper flex flex-col items-center p-6 sm:p-8 text-[#111111]">
      {/* Pastille Live et statut temps réel */}
      <div className="cs-pill cs-pill-leaf mb-5">
        <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-[#1F7A3A] animate-ping" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-[#1F7A3A]" />
        </span>
        <span>Living Ticket actif</span>
      </div>

      {/* Cadre central du QR Code */}
      <div className="relative p-3 sm:p-4 bg-white rounded-2xl border-2 border-[#111111] flex items-center justify-center">
        {ticketData?.qrPayload ? (
          <HalftoneMascotQr
            value={ticketData.qrPayload}
            size={300}
            className="block w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] transition-opacity duration-300"
          />
        ) : (
          <div className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] flex items-center justify-center text-[#5E5850] text-base font-semibold text-center px-6">
            {error ? 'Erreur de génération' : 'Chargement du ticket...'}
          </div>
        )}
      </div>

      {/* Code de secours à 6 chiffres formaté */}
      <div className="mt-7 text-center">
        <span className="cs-label block mb-3">Code de secours (si caméra indisponible)</span>
        <div className="inline-flex items-center gap-2 cs-mono text-[34px] sm:text-[40px] font-bold leading-tight tracking-[0.15em] text-[#111111] bg-[#FFD000] px-6 py-2 rounded-xl border-2 border-[#111111]">
          {ticketData?.code6 ? (
            <>
              <span>{ticketData.code6.slice(0, 3)}</span>
              <span>-</span>
              <span>{ticketData.code6.slice(3, 6)}</span>
            </>
          ) : (
            '------'
          )}
        </div>
      </div>

      {/* Anneau de décompte circulaire 30 secondes */}
      <div className="flex items-center gap-4 mt-7">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-[#E2D8C5]"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r={radius / 2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-[#DA0711] transition-all duration-1000 ease-linear"
              fill="transparent"
              strokeDasharray={circumference / 2}
              strokeDashoffset={strokeDashoffset / 2}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[14px] font-bold text-[#111111]">
            {secondsRemaining}
          </span>
        </div>
        <div className="text-left">
          <p className="text-base font-semibold uppercase text-[#111111]">Renouvellement automatique</p>
          <p className="text-[14px] text-[#5E5850]">Protection anti-capture d'écran</p>
        </div>
      </div>

      {/* Identifiant de commande */}
      {orderCode && (
        <div className="mt-5 cs-mono text-[15px] text-[#5E5850] font-bold">
          N° de retrait : <span className="text-[#DA0711]">{orderCode}</span>
        </div>
      )}
    </div>
  );
}
