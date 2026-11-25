// 💡 Concept & Analogie : Preuve automatisée que le QR Code Halftone artistique avec la mascotte CampusSave reste 100 % lisible par un vrai décodeur QR (`jsQR`) sur les payloads cryptographiques `CS2.<orderId>.<window>.<tag>`.
// 🎯 À retenir pour la soutenance : "Ce test automatisé décode réellement les pixels rendus par le moteur Halftone avec la mascotte incrustée et vérifie l'identité bit à bit du jeton CS2."

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import {
  createHalftoneQrMatrix,
  isFinderOrSeparator,
  isTimingPattern,
  isAlignmentPatternModule,
  isSolidStructuralModule,
  renderHalftoneQrPixels,
} from '../src/features/ticket/halftoneQrRenderer.js';

function blur3x3(src, width, height) {
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0; let g = 0; let b = 0; let count = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx; const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            r += src[i]; g += src[i + 1]; b += src[i + 2]; count += 1;
          }
        }
      }
      const oi = (y * width + x) * 4;
      out[oi] = r / count; out[oi + 1] = g / count; out[oi + 2] = b / count; out[oi + 3] = 255;
    }
  }
  return out;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const mascotPath = resolve(__dirname, '../public/assets/brand/mascot-sticker.png');
const mascot256Path = resolve(__dirname, '../public/assets/brand/mascot-sticker-256.png');
const mascotPng = PNG.sync.read(fs.readFileSync(mascotPath));
const mascot256Png = PNG.sync.read(fs.readFileSync(mascot256Path));

describe('Halftone Mascot QR Code — Structure & Décodabilité jsQR', () => {
  test('protège uniquement les 3 Finder Patterns et le motif d alignement (pas les bits de format)', () => {
    const payload = 'CS2.ord-seed-001.59852000.abcdef0123456789';
    const qr = createHalftoneQrMatrix(payload);
    const N = qr.modules.size;

    assert.equal(isFinderOrSeparator(0, 0, N), true);
    assert.equal(isFinderOrSeparator(0, N - 1, N), true);
    assert.equal(isFinderOrSeparator(N - 1, 0, N), true);
    assert.equal(isSolidStructuralModule(0, 0, qr.modules), true);

    // L'info de format en ligne 8 / colonne 8 reste en point halftone et n'est pas marquée comme alignement
    assert.equal(isAlignmentPatternModule(8, N - 8, qr.modules), false);
    assert.equal(isAlignmentPatternModule(N - 8, 8, qr.modules), false);
    // Les motifs de synchronisation (row 6 / col 6) et d'alignement (N - 7, N - 7) sont protégés en carré plein
    assert.equal(isTimingPattern(6, 10, N), true);
    assert.equal(isSolidStructuralModule(6, 10, qr.modules), true);
    assert.equal(isAlignmentPatternModule(N - 7, N - 7, qr.modules), true);

    // Au centre de l'image, les données sont bien des modules halftone non structurels
    const mid = Math.floor(N / 2);
    assert.equal(isSolidStructuralModule(mid, mid, qr.modules), false);
  });

  test('décode à 100 % avec jsQR les QR Halftone avec mascotte CampusSave (600px et 280px)', () => {
    const payloads = [
      'CS2.ord-seed-001.59852000.9f86d081884c7d65',
      'CS2.ord-seed-002.59852001.4b227777d4dd1fc6',
      'CS2.ord-demo-essectx.59852002.e3b0c44298fc1c14',
      'CS2.ord-mystery-42.59852003.7d865e959b246691',
      'CS2.ord-urgent-99.59852004.a665a45920422f9d',
    ];

    for (const payload of payloads) {
      for (const pixelSize of [600, 280]) {
        const rendered = renderHalftoneQrPixels({ payload, pixelSize, mascotPng });
        const decoded = jsQR(rendered.data, rendered.width, rendered.height);
        assert.ok(decoded, `jsQR doit décoder ${payload} (${pixelSize}px)`);
        assert.equal(decoded.data, payload);
      }
    }
  });

  test('assure un repli propre sans mascotte (fallback QR haute lisibilité) décodable par jsQR', () => {
    const payload = 'CS2.ord-fallback-01.59852010.0123456789abcdef';
    const rendered = renderHalftoneQrPixels({ payload, pixelSize: 300, mascotPng: null });
    const decoded = jsQR(rendered.data, rendered.width, rendered.height);
    assert.ok(decoded);
    assert.equal(decoded.data, payload);
  });

  test('décode exactement l URL officielle CampusSave.apk rendue par halftoneQrRenderer (net + flou optique caméra)', () => {
    const apkUrl = 'https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk';
    for (const pixelSize of [600, 560, 544, 340, 280]) {
      const rendered = renderHalftoneQrPixels({ payload: apkUrl, pixelSize, mascotPng });
      const sharpDecoded = jsQR(rendered.data, rendered.width, rendered.height);
      assert.ok(sharpDecoded, `jsQR net doit décoder CampusSave.apk (${pixelSize}px)`);
      assert.equal(sharpDecoded.data, apkUrl);

      const blurred = blur3x3(rendered.data, rendered.width, rendered.height);
      const blurDecoded = jsQR(blurred, rendered.width, rendered.height);
      assert.ok(blurDecoded, `jsQR sous flou caméra 3x3 doit décoder CampusSave.apk (${pixelSize}px)`);
      assert.equal(blurDecoded.data, apkUrl);
    }
  });
});
