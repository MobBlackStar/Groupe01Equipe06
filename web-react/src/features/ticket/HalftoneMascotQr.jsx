// 💡 Concept & Analogie : Composant React affichant un QR Code artistique Halftone à haute résolution (<canvas> DPR) incrustant la mascotte CampusSave au centre sans sacrifier la scannabilité.
// 🔄 Comparaison React / Flutter : En React, utilise HTML5 Canvas 2D et `qrcode` niveau H ; en Flutter, `HalftoneMascotQr` exploite un `CustomPainter` avec la matrice `QrImage`.
// 🎯 À retenir pour la soutenance : "Repli automatique sur QR standard haute lisibilité pendant le chargement de la mascotte ou en cas d'erreur d'image."

import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MASCOT_URL,
  buildBrowserMascotSampler,
  drawHalftoneQrToCanvas,
} from './halftoneQrRenderer.js';

export default function HalftoneMascotQr({
  value,
  size = 300,
  mascotSrc = DEFAULT_MASCOT_URL,
  className = '',
}) {
  const canvasRef = useRef(null);
  const [mascotSampler, setMascotSampler] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        setMascotSampler(buildBrowserMascotSampler(img));
      } catch {
        setMascotSampler(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setMascotSampler(null);
    };
    img.src = mascotSrc;

    return () => {
      cancelled = true;
    };
  }, [mascotSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const dpr = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 1) : 2;
    const pixelSize = Math.round(size * dpr);
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawHalftoneQrToCanvas(ctx, {
      payload: value,
      pixelSize,
      mascotSampler,
    });
  }, [value, size, mascotSampler]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      role="img"
      aria-label="QR code sécurisé CampusSave"
      data-qr-payload={value}
      data-halftone-mascot={mascotSampler ? 'loaded' : 'fallback'}
      className={`block bg-white ${className || 'w-[260px] h-[260px] sm:w-[300px] sm:h-[300px]'}`}
    />
  );
}
