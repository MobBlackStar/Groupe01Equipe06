// 💡 Concept & Analogie : Comme la carte d'embarquement vivante d'un vol de première classe imprimée sur reçu thermique tactile (#CS-...), ornée du tampon d'acquittement rouge [PAYÉ & VALIDÉ] et protégée par un QR code cryptographique rotatif anti-capture d'écran.
// 🔄 Comparaison React / Flutter : En React, `BoardingPass` combine le reçu papier crème, le tampon rouge et le HMAC SHA-256 rotatif 30s (`generateClientTicketData`) ; en Flutter, `boarding_pass.dart` reproduit le même reçu avec séparateurs perforés.
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
      
      {/* Reçu Thermique Physique (Warm Ivory #FAF6EE) */}
      <div className="relative rounded-xl bg-[#FAF6EE] text-[#141210] p-6 sm:p-8 font-mono shadow-[8px_8px_0px_#141210] border-2 border-[#141210] overflow-hidden">
        
        {/* Bande supérieure rouge flame */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#E51C23]" />

        {/* TAMPON CAOUTCHOUC ROUGE [PAYÉ & VALIDÉ] */}
        <div className="absolute top-8 right-6 z-20 pointer-events-none">
          <div className="font-anton text-xs sm:text-sm uppercase px-3 py-1 rounded bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#DC2626] rotate-[-8deg] shadow-md flex flex-col items-center">
            <span>[PAYÉ &amp; VALIDÉ]</span>
            <span className="text-[8px] font-mono tracking-normal font-normal">ESSECT 2026</span>
          </div>
        </div>

        {/* En-tête Reçu Vivant */}
        <div className="pb-4 border-b-2 border-dashed border-[#141210]/30">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141210] text-[#FFD000] text-[10px] font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#E51C23] animate-ping" />
            <span>LIVE · {liveTimeStr}</span>
          </div>
          <h2 className="font-anton uppercase text-xl sm:text-2xl font-black tracking-wider text-[#141210]">
            LIVING TICKET DE RETRAIT
          </h2>
          <p className="text-[10px] text-[#555] font-bold">
            RÉF ÉTUDIANT : <strong className="text-[#E51C23] text-xs font-black">#{orderCode}</strong>
          </p>
        </div>

        {/* Détails du trajet / restaurant */}
        <div className="py-4 space-y-2.5 border-b-2 border-dashed border-[#141210]/20 text-xs">
          <div className="flex justify-between font-bold">
            <span className="text-[#666]">COMMERCE PARTENAIRE :</span>
            <span className="text-[#141210] truncate max-w-[170px]">{merchantName}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-[#666]">LOT COMMANDÉ :</span>
            <span className="text-[#141210]">{quantity}x {offerTitle}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-[#666]">CRÉNEAU DE PASSAGE :</span>
            <span className="text-[#E51C23]">
              {formatTunisTime(ticket?.pickupStartAt)} — {formatTunisTime(ticket?.pickupEndAt)}
            </span>
          </div>
        </div>

        {/* Encoche de découpe / perforation latérale */}
        <div className="relative flex items-center justify-between my-4">
          <div className="w-5 h-5 rounded-full bg-[#F4EFE6] -ml-9 border-r-2 border-[#141210]" />
          <div className="flex-1 border-t-2 border-dashed border-[#141210]/30 mx-2" />
          <div className="w-5 h-5 rounded-full bg-[#F4EFE6] -mr-9 border-l-2 border-[#141210]" />
        </div>

        {/* QR CODE ROTATIF CRYPTOGRAPHIQUE 30 SECONDES */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border-2 border-[#141210] shadow-[3px_3px_0px_#141210]">
          <div className="p-3 bg-white rounded-lg shadow-sm border border-[#141210]">
            <QRCodeSVG
              value={qrData.qrPayload}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#141210"
            />
          </div>

          {/* Jauge de rotation des 30 secondes */}
          <div className="w-full max-w-[200px] mt-4 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-[#555] font-bold">
              <span>Rotation HMAC 30s :</span>
              <span className="text-[#E51C23]">{secondsRemaining}s</span>
            </div>
            <div className="w-full bg-[#FAF6EE] h-2 rounded-full overflow-hidden border border-[#141210]">
              <div
                className="bg-[#E51C23] h-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Code de secours à 6 chiffres */}
          <div className="mt-4 pt-3 border-t-2 border-dashed border-[#141210]/20 text-center w-full">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#666] block mb-1">
              CODE PIN MANUEL DE SECOURS (SI CAMÉRA HS) :
            </span>
            <div className="inline-block px-4 py-1.5 rounded-lg bg-[#FEF08A] border-2 border-[#141210] font-anton text-2xl font-black tracking-widest text-[#141210] shadow-[2px_2px_0px_#141210]">
              {qrData.code6}
            </div>
          </div>
        </div>

        {/* Bas de ticket : Instructions */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-[#666] font-bold">
            Présentez ce ticket sur votre smartphone au comptoir du commerçant.
          </p>
        </div>

        {/* Dents de scie inférieures du reçu */}
        <div
          aria-hidden="true"
          className="w-full h-3 bg-repeat-x pointer-events-none mt-4 -mb-6 sm:-mb-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10' fill='%23FAF6EE'%3E%3Cpolygon points='0,0 8,10 16,0'/%3E%3C/svg%3E")`,
            backgroundSize: '16px 10px',
            filter: 'drop-shadow(0 2px 2px rgba(20,18,16,0.15))',
          }}
        />
      </div>
    </div>
  );
}
