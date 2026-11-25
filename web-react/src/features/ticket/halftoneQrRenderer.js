// 💡 Concept & Analogie : Comme un maître imprimeur qui superpose une trame demi-teinte (halftone) sur une affiche en couleur sans jamais boucher les repères de cadrage, ce moteur trace la mascotte CampusSave au cœur de la grille QR (correction H à 30 %) avec des micro-points contrastés garantissant un scan immédiat.
// 🔄 Comparaison React / Flutter : Côté React, ce module pilote le `<canvas>` haute densité ; côté Flutter, `HalftoneMascotQr` reproduit le même algorithme dans un `CustomPainter`.
// 🎯 À retenir pour la soutenance : "Les 3 Finder Patterns et le motif d'alignement restent 100 % pleins sur fond blanc tandis que la mascotte occupe la zone centrale sous des points circulaires à 42 % avec halo adaptatif."
// Module : Rendu QR Halftone Mascotte (M7, I6)

import QRCode from 'qrcode';

export const DEFAULT_MASCOT_URL = '/assets/brand/mascot-sticker.png';
const QUIET_MODULES = 4;
const MASCOT_DOT_RATIO = 0.56; // Carré centré haute lisibilité (56 % cellule -> ~31 % surface, ~69 % illustration visible)
const OUTER_MODULE_RATIO = 1.0; // Blocs pleins sans couture hors mascotte pour verrouillage caméra sans moiré

/**
 * Construit la matrice QR brute au niveau maximal de correction d'erreur H (30 %).
 */
export function createHalftoneQrMatrix(payload) {
  return QRCode.create(String(payload || ''), { errorCorrectionLevel: 'H' });
}

/**
 * Identifie les 3 Finder Patterns (7x7) + séparateurs (8x8) aux coins.
 */
export function isFinderOrSeparator(row, col, size) {
  return (
    (row < 8 && col < 8) ||
    (row < 8 && col >= size - 8) ||
    (row >= size - 8 && col < 8)
  );
}

/**
 * Identifie les motifs de synchronisation (Timing Patterns, ligne 6 & colonne 6) indispensables au verrouillage caméra.
 */
export function isTimingPattern(row, col, size) {
  return (
    (row === 6 && col >= 8 && col < size - 8) ||
    (col === 6 && row >= 8 && row < size - 8)
  );
}

/**
 * Identifie uniquement les motifs d'alignement internes (excluant l'info de format en row/col <= 8).
 */
export function isAlignmentPatternModule(row, col, modules) {
  return Boolean(row >= 9 && col >= 9 && modules.isReserved(row, col));
}

/**
 * Renvoie true si la case doit rester en carré plein noir/blanc ultra-net (Finders, Timing, Alignement).
 */
export function isSolidStructuralModule(row, col, modules) {
  return (
    isFinderOrSeparator(row, col, modules.size) ||
    isTimingPattern(row, col, modules.size) ||
    isAlignmentPatternModule(row, col, modules)
  );
}

/**
 * Calcule le rectangle centré de la mascotte à l'intérieur de la matrice QR.
 */
export function computeMascotRect(moduleCount, cellSize, quietModules = QUIET_MODULES) {
  const marginModules = Math.max(3, Math.round(moduleCount * 0.14));
  const origin = (quietModules + marginModules) * cellSize;
  const span = Math.max(0, moduleCount - marginModules * 2) * cellSize;
  return { x: origin, y: origin, size: span };
}

/**
 * Algorithme unique de tracé Halftone QR exécuté de manière identique sur Canvas 2D et sur buffer RGBA de test.
 */
export function driveHalftoneQrRender({
  payload,
  pixelSize,
  quietModules = QUIET_MODULES,
  sampleMascotPixel,
  clearWhite,
  drawMascotLayer,
  fillRect,
}) {
  const qr = createHalftoneQrMatrix(payload);
  const N = qr.modules.size;
  const totalModules = N + quietModules * 2;
  const cell = pixelSize / totalModules;
  const mascotRect = computeMascotRect(N, cell, quietModules);

  clearWhite(pixelSize);

  if (drawMascotLayer) {
    drawMascotLayer({ qr, N, cell, quietModules, mascotRect });
  }

  for (let row = 0; row < N; row += 1) {
    for (let col = 0; col < N; col += 1) {
      const isDark = Boolean(qr.modules.get(row, col));
      const x0 = (quietModules + col) * cell;
      const y0 = (quietModules + row) * cell;
      const cx = x0 + cell / 2;
      const cy = y0 + cell / 2;

      if (isSolidStructuralModule(row, col, qr.modules)) {
        fillRect(
          x0,
          y0,
          cell,
          cell,
          isDark ? 'rgba(17, 17, 17, 1)' : 'rgba(255, 255, 255, 1)',
          isDark ? [17, 17, 17, 255] : [255, 255, 255, 255]
        );
        continue;
      }

      const u = mascotRect.size > 0 ? (cx - mascotRect.x) / mascotRect.size : -1;
      const v = mascotRect.size > 0 ? (cy - mascotRect.y) / mascotRect.size : -1;
      const sample = sampleMascotPixel ? sampleMascotPixel(u, v) : [255, 255, 255, 0];
      const [mr, mg, mb, ma] = sample;
      const overMascot = u >= 0 && u < 1 && v >= 0 && v < 1 && ma > 30;
      const luminance = 0.299 * mr + 0.587 * mg + 0.114 * mb;

      if (overMascot) {
        const dotSize = cell * MASCOT_DOT_RATIO;
        const dx = cx - dotSize / 2;
        const dy = cy - dotSize / 2;
        if (isDark) {
          if (luminance < 150) {
            const halo = dotSize + cell * 0.18;
            fillRect(cx - halo / 2, cy - halo / 2, halo, halo, 'rgba(255, 255, 255, 0.94)', [255, 255, 255, 240]);
          }
          fillRect(dx, dy, dotSize, dotSize, 'rgba(17, 17, 17, 1)', [17, 17, 17, 255]);
        } else {
          if (luminance > 170) {
            const rim = dotSize + cell * 0.1;
            fillRect(cx - rim / 2, cy - rim / 2, rim, rim, 'rgba(17, 17, 17, 0.31)', [17, 17, 17, 80]);
          }
          fillRect(dx, dy, dotSize, dotSize, 'rgba(255, 255, 255, 1)', [255, 255, 255, 255]);
        }
      } else if (isDark) {
        const modSize = cell * OUTER_MODULE_RATIO;
        fillRect(cx - modSize / 2, cy - modSize / 2, modSize, modSize, 'rgba(17, 17, 17, 1)', [17, 17, 17, 255]);
      } else {
        fillRect(x0, y0, cell, cell, 'rgba(255, 255, 255, 1)', [255, 255, 255, 255]);
      }
    }
  }

  return qr;
}

/**
 * Extrait un échantillonneur rapide de pixels RGBA depuis une image navigateur chargée.
 */
export function buildBrowserMascotSampler(image) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;
  const offscreen = document.createElement('canvas');
  offscreen.width = image.naturalWidth;
  offscreen.height = image.naturalHeight;
  const octx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!octx) return null;
  octx.drawImage(image, 0, 0);
  const imgData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
  const { data, width, height } = imgData;

  return {
    image,
    sample(u, v) {
      if (u < 0 || u >= 1 || v < 0 || v >= 1) return [255, 255, 255, 0];
      const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
      const y = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
      const idx = (y * width + x) * 4;
      return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    },
  };
}

/**
 * Dessine le QR code Halftone complet sur un contexte Canvas 2D haute résolution.
 */
export function drawHalftoneQrToCanvas(ctx, { payload, pixelSize, mascotSampler }) {
  driveHalftoneQrRender({
    payload,
    pixelSize,
    sampleMascotPixel: mascotSampler ? (u, v) => mascotSampler.sample(u, v) : null,
    clearWhite: (size) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
    },
    drawMascotLayer: mascotSampler
      ? ({ mascotRect }) => {
          ctx.save();
          ctx.globalAlpha = 0.82;
          ctx.drawImage(mascotSampler.image, mascotRect.x, mascotRect.y, mascotRect.size, mascotRect.size);
          ctx.restore();
        }
      : null,
    fillRect: (x, y, w, h, cssColor) => {
      ctx.fillStyle = cssColor;
      ctx.fillRect(x, y, w + 0.35, h + 0.35);
    },
  });
}

/**
 * Rend le QR code Halftone dans un buffer RGBA brut (Uint8ClampedArray) pour vérification jsQR côté Node.
 */
export function renderHalftoneQrPixels({ payload, pixelSize = 560, mascotPng }) {
  const buf = new Uint8ClampedArray(pixelSize * pixelSize * 4);
  buf.fill(255);

  const sampleMascot = (u, v) => {
    if (!mascotPng || u < 0 || u >= 1 || v < 0 || v >= 1) return [255, 255, 255, 0];
    const x = Math.min(mascotPng.width - 1, Math.max(0, Math.floor(u * mascotPng.width)));
    const y = Math.min(mascotPng.height - 1, Math.max(0, Math.floor(v * mascotPng.height)));
    const idx = (y * mascotPng.width + x) * 4;
    return [mascotPng.data[idx], mascotPng.data[idx + 1], mascotPng.data[idx + 2], mascotPng.data[idx + 3]];
  };

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= pixelSize || py < 0 || py >= pixelSize) return;
    const i = (py * pixelSize + px) * 4;
    if (a >= 255) {
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    } else {
      const k = a / 255;
      buf[i] = Math.round(r * k + buf[i] * (1 - k));
      buf[i + 1] = Math.round(g * k + buf[i + 1] * (1 - k));
      buf[i + 2] = Math.round(b * k + buf[i + 2] * (1 - k));
      buf[i + 3] = 255;
    }
  };

  driveHalftoneQrRender({
    payload,
    pixelSize,
    sampleMascotPixel: mascotPng ? sampleMascot : null,
    clearWhite: () => buf.fill(255),
    drawMascotLayer: mascotPng
      ? ({ qr, N, cell, quietModules, mascotRect }) => {
          for (let py = 0; py < pixelSize; py += 1) {
            const gr = Math.floor(py / cell) - quietModules;
            if (gr < 0 || gr >= N) continue;
            for (let px = 0; px < pixelSize; px += 1) {
              const gc = Math.floor(px / cell) - quietModules;
              if (gc < 0 || gc >= N) continue;
              if (isSolidStructuralModule(gr, gc, qr.modules)) continue;
              const u = (px - mascotRect.x) / mascotRect.size;
              const v = (py - mascotRect.y) / mascotRect.size;
              if (u >= 0 && u < 1 && v >= 0 && v < 1) {
                const [mr, mg, mb, ma] = sampleMascot(u, v);
                if (ma > 10) {
                  setPixel(
                    px,
                    py,
                    Math.round(mr * 0.82 + 255 * 0.18),
                    Math.round(mg * 0.82 + 255 * 0.18),
                    Math.round(mb * 0.82 + 255 * 0.18),
                    ma
                  );
                }
              }
            }
          }
        }
      : null,
    fillRect: (x, y, w, h, _css, rgba) => {
      const [r, g, b, a] = rgba;
      const xStart = Math.max(0, Math.floor(x));
      const xEnd = Math.min(pixelSize, Math.ceil(x + w));
      const yStart = Math.max(0, Math.floor(y));
      const yEnd = Math.min(pixelSize, Math.ceil(y + h));
      for (let py = yStart; py < yEnd; py += 1) {
        const cy = py + 0.5;
        if (cy < y || cy > y + h) continue;
        for (let px = xStart; px < xEnd; px += 1) {
          const cx = px + 0.5;
          if (cx >= x && cx <= x + w) {
            setPixel(px, py, r, g, b, a);
          }
        }
      }
    },
  });

  return { data: buf, width: pixelSize, height: pixelSize };
}
