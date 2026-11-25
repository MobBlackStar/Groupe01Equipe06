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
  isAlignmentPatternModule,
  isSolidStructuralModule,
  renderHalftoneQrPixels,
} from '../src/features/ticket/halftoneQrRenderer.js';

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
    // Le motif d'alignement (N - 7, N - 7) est protégé en carré plein
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

  test('décode exactement l URL officielle CampusSave.apk depuis le QR Niveau H avec sticker circulaire mascot-sticker-256.png', () => {
    const apkUrl = 'https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk';
    const qr = createHalftoneQrMatrix(apkUrl);
    const N = qr.modules.size;
    const quiet = 4;
    const totalModules = N + quiet * 2;

    for (const pixelSize of [220, 280, 440]) {
      const data = new Uint8ClampedArray(pixelSize * pixelSize * 4).fill(255);
      const cell = pixelSize / totalModules;
      const badgeRadiusPx = pixelSize * 0.11;
      const center = pixelSize / 2;

      for (let py = 0; py < pixelSize; py += 1) {
        for (let px = 0; px < pixelSize; px += 1) {
          const dx = px - center;
          const dy = py - center;
          const dist = Math.hypot(dx, dy);
          const idx = (py * pixelSize + px) * 4;

          if (dist <= badgeRadiusPx) {
            const u = (dx / (badgeRadiusPx * 2) + 0.5) * (mascot256Png.width - 1);
            const v = (dy / (badgeRadiusPx * 2) + 0.5) * (mascot256Png.height - 1);
            const mx = Math.max(0, Math.min(mascot256Png.width - 1, Math.round(u)));
            const my = Math.max(0, Math.min(mascot256Png.height - 1, Math.round(v)));
            const midx = (my * mascot256Png.width + mx) * 4;
            if (mascot256Png.data[midx + 3] > 30) {
              data[idx] = mascot256Png.data[midx];
              data[idx + 1] = mascot256Png.data[midx + 1];
              data[idx + 2] = mascot256Png.data[midx + 2];
            }
            continue;
          }

          const col = Math.floor(px / cell) - quiet;
          const row = Math.floor(py / cell) - quiet;
          if (row >= 0 && row < N && col >= 0 && col < N && qr.modules.get(row, col)) {
            data[idx] = 17;
            data[idx + 1] = 17;
            data[idx + 2] = 17;
          }
        }
      }

      const decoded = jsQR(data, pixelSize, pixelSize);
      assert.ok(decoded, `jsQR doit décoder CampusSave.apk (${pixelSize}px)`);
      assert.equal(decoded.data, apkUrl);
    }
  });
});
