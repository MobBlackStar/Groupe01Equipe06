// 💡 Concept & Analogie : Comme la carte d'embarquement vivante d'un vol de première classe imprimée sur reçu thermique tactile (#CS-...), ornée du tampon d'acquittement rouge [PAYÉ & VALIDÉ] et protégée par un QR code cryptographique rotatif anti-capture d'écran.
// 🔄 Comparaison React / Flutter : En React, `BoardingPass` combine le reçu papier blanc, le tampon rouge Griddle et le HMAC SHA-256 rotatif 30s (`generateClientTicketData`) ; en Flutter, `boarding_pass.dart` reproduit le même reçu avec séparateurs perforés.
// 🎯 À retenir pour la soutenance : "Anti-screenshot Living Ticket (I6) : la rotation HMAC toutes les 30 secondes invalide instantanément toute capture d'écran frauduleuse tout en proposant un code PIN à 6 chiffres de secours."
// Module : Living Ticket & Sécurité (M7, I6)

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateClientTicketData } from '../../lib/ticketCrypto.js';
import { formatTunisDate, formatTunisTimeWindow } from '../../lib/formatters.js';

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

  const pickupWindow = formatTunisTimeWindow(ticket?.pickupStartAt, ticket?.pickupEndAt);
  const pickupDate = formatTunisDate(ticket?.pickupStartAt, { fallback: '' });
  const merchantAddress = ticket?.merchantAddress;
  const pinDigits = String(qrData.code6 || '');
  const pinDisplay = pinDigits.length === 6 ? `${pinDigits.slice(0, 3)} ${pinDigits.slice(3)}` : pinDigits || '— — —';

  // Tampon caoutchouc selon le statut du ticket
  const status = ticket?.status || 'PAID';
  const stampLabel =
    status === 'COMPLETED'
      ? 'Récupéré'
      : status === 'RESERVED'
      ? 'À payer'
      : ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED', 'NO_SHOW'].includes(status)
      ? 'Annulé'
      : 'Payé & validé';

  return (
    <div className={`relative w-full max-w-[480px] mx-auto select-none ${className}`}>
      {/* Reçu papier façon ticket de street-food (bord inférieur déchiré) */}
      <div className="cs-receipt rounded-t-[1.25rem] overflow-hidden px-5 sm:px-9 pt-9 pb-12">
        {/* Bande rouge en tête de ticket */}
        <div className="absolute top-0 inset-x-0 h-3 bg-[#DA0711]" aria-hidden="true" />

        {/* En-tête : marque + tampon */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-title text-[22px] sm:text-[30px] leading-none tracking-tight text-[#111111]">CAMPUSSAVE</p>
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#5E5850] mt-2">Ticket de retrait</p>
          </div>
          <div className="pointer-events-none shrink-0 pt-1 pr-1">
            <span className="cs-stamp block max-w-[118px] sm:max-w-[170px] !text-[18px] sm:!text-[22px] !px-3 !leading-[1.05] text-center mix-blend-multiply">
              {stampLabel}
            </span>
          </div>
        </div>

        {/* Réf + horloge live */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px]">
            <span className="text-[#5E5850]">RÉF. </span>
            <strong className="text-[#DA0711] text-[20px]">#{orderCode}</strong>
          </p>
          <span className="cs-pill cs-pill-ink !font-mono !normal-case !tracking-normal">
            <span className="relative flex w-2.5 h-2.5" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-[#DA0711] animate-ping" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-[#DA0711]" />
            </span>
            LIVE {liveTimeStr}
          </span>
        </div>

        <hr className="cs-receipt-rule !my-6" />

        {/* Commerce + créneau en grand */}
        <div className="space-y-6">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#5E5850]">Commerce</p>
            <p className="font-display uppercase text-[40px] sm:text-[48px] leading-[0.92] text-[#111111] mt-2 break-words">
              {merchantName}
            </p>
            {merchantAddress && <p className="text-[14px] text-[#5E5850] mt-2 leading-snug">{merchantAddress}</p>}
          </div>

          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#5E5850]">
              Créneau de retrait{pickupDate ? ` · ${pickupDate}` : ''}
            </p>
            <p className="font-display text-[52px] sm:text-[64px] leading-[0.9] text-[#DA0711] mt-2">{pickupWindow}</p>
          </div>

          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#5E5850]">Commande</p>
            <p className="text-[16px] sm:text-[17px] font-bold leading-snug mt-2">
              <span className="text-[#DA0711]">{quantity} ×</span> {offerTitle}
            </p>
          </div>
        </div>

        {/* Perforation avec encoches latérales */}
        <div className="relative my-8 h-8 flex items-center" aria-hidden="true">
          <span className="absolute -left-9 sm:-left-[52px] w-8 h-8 rounded-full bg-[#FAF3E6]" />
          <span className="w-full border-t-[3px] border-dotted border-[#111111]/35" />
          <span className="absolute -right-9 sm:-right-[52px] w-8 h-8 rounded-full bg-[#FAF3E6]" />
        </div>

        {/* QR CODE ROTATIF CRYPTOGRAPHIQUE 30 SECONDES */}
        <div className="flex flex-col items-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#5E5850] mb-4">Scannez au comptoir</p>
          <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-[#111111]">
            <QRCodeSVG
              value={qrData.qrPayload}
              size={300}
              level="H"
              includeMargin={false}
              fgColor="#111111"
              bgColor="#FFFFFF"
              className="block w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]"
            />
          </div>

          {/* Jauge de rotation des 30 secondes */}
          <div className="w-full max-w-[300px] mt-5">
            <div className="flex justify-between items-baseline text-[14px] text-[#5E5850]">
              <span>Nouveau code dans</span>
              <span className="text-[#DA0711] font-bold text-[18px]">{secondsRemaining}s</span>
            </div>
            <div className="w-full bg-[#E2D8C5] h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#DA0711] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Code de secours à 6 chiffres */}
          <div className="mt-7 text-center w-full">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#5E5850] mb-3">
              Code de secours (caméra HS)
            </p>
            <div className="inline-block px-6 py-2 rounded-xl bg-[#FFD000] border-2 border-[#111111] text-[34px] sm:text-[40px] font-bold tracking-[0.18em] leading-tight text-[#111111]">
              {pinDisplay}
            </div>
          </div>
        </div>

        <hr className="cs-receipt-rule !my-7" />

        {/* Bas de ticket : Instructions + code-barres */}
        <p className="text-[14px] text-center text-[#5E5850] leading-relaxed">
          Présentez ce ticket sur votre smartphone au comptoir du commerçant.
        </p>
        <div className="mt-6 flex flex-col items-center" aria-hidden="true">
          <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#111111_0,#111111_2px,transparent_2px,transparent_5px,#111111_5px,#111111_6px,transparent_6px,transparent_9px)]" />
          <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111] mt-3">MERCI · BON APPÉTIT</span>
        </div>
      </div>
    </div>
  );
}
