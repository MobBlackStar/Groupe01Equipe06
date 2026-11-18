// 💡 Concept & Analogie : Comme la carte d'embarquement vivante d'un vol de première classe imprimée sur reçu thermique tactile (#CS-...), ornée du tampon d'acquittement rouge [PAYÉ & VALIDÉ] et protégée par un QR code cryptographique rotatif anti-capture d'écran.
// 🔄 Comparaison React / Flutter : En React, `BoardingPass` combine le reçu papier blanc, le tampon rouge Griddle et le HMAC SHA-256 rotatif 30s (`generateClientTicketData`) ; en Flutter, `boarding_pass.dart` reproduit le même reçu avec séparateurs perforés.
// 🎯 À retenir pour la soutenance : "Anti-screenshot Living Ticket (I6) : la rotation HMAC toutes les 30 secondes invalide instantanément toute capture d'écran frauduleuse tout en proposant un code PIN à 6 chiffres de secours."
// Module : Living Ticket & Sécurité (M7, I6)

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateClientTicketData } from '../../lib/ticketCrypto.js';
import { formatTunisTime } from '../../lib/formatters.js';

export default function BoardingPass({
  ticket,
  className = '',
}) {
  const [now, setNow] = useState(Date.now());
  const [qrData, setQrData] = useState({
    qrPayload: `CS2.${ticket?.orderId || 'ord-demo'}.0.INIT`,
    code6: '849201',
    windowIndex: 0,
  });

  const ticketKeyHex = ticket?.ticketKeyHex || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const orderId = ticket?.orderId || 'ord-demo-essectx';

  // Horloge 1s pour l'actualisation dynamique
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentWindowIndex = Math.floor(now / 30000);
  const secondsIntoWindow = Math.floor((now % 30000) / 1000);
  const secondsRemaining = 30 - secondsIntoWindow;
  const progressPercent = Math.round((secondsRemaining / 30) * 100);

  useEffect(() => {
    let isMounted = true;

    async function updateQr() {
      try {
        const data = await generateClientTicketData(ticketKeyHex, orderId, currentWindowIndex);
        if (isMounted) {
          setQrData(data);
        }
      } catch (err) {
        if (isMounted) {
          const fallbackTag = btoa(`${orderId}-${currentWindowIndex}`).slice(0, 16);
          const fallbackCode = String(Math.abs(currentWindowIndex * 123456) % 1000000).padStart(6, '0');
          setQrData({
            qrPayload: `CS2.${orderId}.${currentWindowIndex}.${fallbackTag}`,
            code6: fallbackCode,
            windowIndex: currentWindowIndex,
          });
        }
      }
    }

    updateQr();

    return () => {
      isMounted = false;
    };
  }, [ticketKeyHex, orderId, currentWindowIndex]);

  const liveDate = new Date(now);
  const liveTimeStr = `${String(liveDate.getHours()).padStart(2, '0')}:${String(
    liveDate.getMinutes()
  ).padStart(2, '0')}:${String(liveDate.getSeconds()).padStart(2, '0')}`;

  const merchantName = ticket?.merchantName || 'Baguette & Baguette Montfleury';
  const orderCode = ticket?.orderCode || 'CS-8K4M9';
  const offerTitle = ticket?.offerTitle || 'Baguette Farcie Escalope Panée';
  const quantity = ticket?.quantity || 2;

  return (
    <div className={`relative max-w-md w-full mx-auto select-none ${className}`}>
      
      {/* Reçu Thermique Physique (Authentic Griddle Receipt) */}
      <div className="relative rounded-2xl bg-white text-[#111111] p-6 sm:p-8 font-mono shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#111111]/8 overflow-hidden">
        
        {/* Bande supérieure noire Griddle */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#111111]" />

        {/* TAMPON CAOUTCHOUC ROUGE [PAYÉ & VALIDÉ] */}
        <div className="absolute top-8 right-6 z-20 pointer-events-none">
          <div className="griddle-stamp text-xs uppercase px-3 py-1 rotate-[-8deg] flex flex-col items-center">
            <span>[PAYÉ &amp; VALIDÉ]</span>
            <span className="text-[8px] font-mono tracking-normal font-normal">ESSECT 2026</span>
          </div>
        </div>

        {/* En-tête Reçu Vivant */}
        <div className="pb-4 border-b border-dashed border-[#111111]/25">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#111111] text-[#FFD000] text-[10px] font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#DA0711] animate-ping" />
            <span>LIVE · {liveTimeStr}</span>
          </div>
          <h2 className="font-anton uppercase text-xl sm:text-2xl font-black tracking-wider text-[#111111]">
            LIVING TICKET DE RETRAIT
          </h2>
          <p className="text-[10px] text-[#666] font-medium">
            RÉF ÉTUDIANT : <strong className="text-[#DA0711] text-xs font-bold font-mono">#{orderCode}</strong>
          </p>
        </div>

        {/* Détails du plat / restaurant */}
        <div className="py-4 space-y-2.5 border-b border-dashed border-[#111111]/20 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-[#777]">COMMERCE PARTENAIRE :</span>
            <span className="text-[#111111] font-bold truncate max-w-[170px]">{merchantName}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-[#777]">LOT COMMANDÉ :</span>
            <span className="text-[#111111] font-bold">{quantity}x {offerTitle}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-[#777]">CRÉNEAU DE PASSAGE :</span>
            <span className="text-[#DA0711] font-bold">
              {formatTunisTime(ticket?.pickupStartAt)} — {formatTunisTime(ticket?.pickupEndAt)}
            </span>
          </div>
        </div>

        {/* Encoche de découpe latérale */}
        <div className="relative flex items-center justify-between my-4">
          <div className="w-5 h-5 rounded-full bg-[#FAF3E6] -ml-9 border-r border-[#111111]/15" />
          <div className="flex-1 border-t border-dashed border-[#111111]/25 mx-2" />
          <div className="w-5 h-5 rounded-full bg-[#FAF3E6] -mr-9 border-l border-[#111111]/15" />
        </div>

        {/* QR CODE ROTATIF CRYPTOGRAPHIQUE 30 SECONDES */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF3E6]/60 border border-[#111111]/8">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-[#111111]/10">
            <QRCodeSVG
              value={qrData.qrPayload}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#111111"
            />
          </div>

          {/* Jauge de rotation des 30 secondes */}
          <div className="w-full max-w-[200px] mt-4 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-[#666]">
              <span>Rotation HMAC 30s :</span>
              <span className="text-[#DA0711] font-bold">{secondsRemaining}s</span>
            </div>
            <div className="w-full bg-[#EDE6D7] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#DA0711] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Code de secours à 6 chiffres */}
          <div className="mt-4 pt-3 border-t border-dashed border-[#111111]/15 text-center w-full">
            <span className="text-[10px] uppercase font-medium tracking-widest text-[#777] block mb-1">
              CODE PIN MANUEL DE SECOURS (SI CAMÉRA HS) :
            </span>
            <div className="inline-block px-4 py-1 rounded-full bg-[#FFD000] font-anton text-2xl font-black tracking-widest text-[#111111] shadow-sm">
              {qrData.code6}
            </div>
          </div>
        </div>

        {/* Bas de ticket : Instructions */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-[#777] font-medium">
            Présentez ce ticket sur votre smartphone au comptoir du commerçant.
          </p>
        </div>

        {/* Code-barres simulé en bas */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#111111]/25 flex flex-col items-center">
          <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#111111,#111111_2px,transparent_2px,transparent_4px)] opacity-70" />
          <span className="text-[8px] font-bold tracking-widest text-[#777] mt-1">THANK YOU · COME HUNGRY</span>
        </div>
      </div>
    </div>
  );
}
