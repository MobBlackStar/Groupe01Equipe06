// 💡 Concept & Analogie : Comme le laboratoire d'authentification des billets de banque qui teste la résistance aux contrefaçons et la conformité des filigranes, ces tests valident la sécurité cryptographique du Living Ticket.
// 🔄 Comparaison React / Flutter : Valide que la dérivation HMAC-SHA256 sous Node.js correspond au millimètre près aux sorties Dart et WebCrypto sur les 5 vecteurs de référence.
// 🎯 À retenir pour la soutenance : "Nos tests cryptographiques démontrent la parité stricte inter-plateformes, la tolérance d'une fenêtre de ± 30 secondes pour compenser la dérive d'horloge, et le rejet infaillible des altérations ou des codes expirés."
// Module : Tests Cryptographiques Backend

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveTicketKey,
  computeWindowCode,
  verifyQrPayload,
  verifyManualCode,
} from '../src/modules/tickets/ticket.crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Cryptographie du Living Ticket — Vecteurs Officiels & Sécurité', () => {
  const vectorsPath = path.resolve(__dirname, '../../shared/test-vectors/ticket.json');
  const vectorsData = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));

  test('Vérification stricte des 5 vecteurs de test officiels cross-runtime', () => {
    for (const tc of vectorsData.testCases) {
      const generated = computeWindowCode(tc.ticketKeyHex, tc.orderId, tc.windowIndex);

      assert.equal(
        generated.qrPayload,
        tc.expectedQrPayload,
        `Échec qrPayload pour ${tc.id}`
      );
      assert.equal(
        generated.code6,
        tc.expectedCode6,
        `Échec code6 pour ${tc.id}`
      );
      assert.equal(
        generated.tagBase64Url,
        tc.expectedTag,
        `Échec tagBase64Url pour ${tc.id}`
      );
    }
  });

  test('Fenêtre courante et tolérance d horloge ± 1 fenêtre (30 secondes)', () => {
    const tc = vectorsData.testCases[0];
    const ticketKey = tc.ticketKeyHex;
    const window = tc.windowIndex;
    const nowMs = window * 30000 + 15000;

    const { qrPayload } = computeWindowCode(ticketKey, tc.orderId, window);

    // Même fenêtre
    const v1 = verifyQrPayload(qrPayload, ticketKey, nowMs);
    assert.equal(v1.valid, true);

    // Fenêtre suivante (+20 secondes, transition possible)
    const v2 = verifyQrPayload(qrPayload, ticketKey, nowMs + 20000);
    assert.equal(v2.valid, true);

    // Fenêtre précédente (-20 secondes)
    const v3 = verifyQrPayload(qrPayload, ticketKey, nowMs - 20000);
    assert.equal(v3.valid, true);

    // Dérive excessive (+65 secondes = 2 fenêtres plus tard) -> rejet TICKET_EXPIRED
    const v4 = verifyQrPayload(qrPayload, ticketKey, nowMs + 65000);
    assert.equal(v4.valid, false);
    assert.equal(v4.reason, 'TICKET_EXPIRED');
  });

  test('Rejet strict d un QR code altéré ou falsifié', () => {
    const tc = vectorsData.testCases[1];
    const ticketKey = tc.ticketKeyHex;
    const { qrPayload } = computeWindowCode(ticketKey, tc.orderId, tc.windowIndex);

    // Altération du tag de signature
    const tampered = qrPayload.slice(0, -4) + 'AAAA';
    const result = verifyQrPayload(tampered, ticketKey, tc.windowIndex * 30000);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'INVALID_SIGNATURE');
  });

  test('Rejet strict si le ticket appartient à une autre commande', () => {
    const tc1 = vectorsData.testCases[0];
    const tc2 = vectorsData.testCases[1];

    const generated = computeWindowCode(tc1.ticketKeyHex, tc1.orderId, tc1.windowIndex);

    // Vérification avec la clé d'une autre commande
    const check = verifyQrPayload(generated.qrPayload, tc2.ticketKeyHex, tc1.windowIndex * 30000);
    assert.equal(check.valid, false);
  });

  test('Validation du code manuel à 6 chiffres avec tolérance de synchronisation', () => {
    const tc = vectorsData.testCases[2];
    const ticketKey = tc.ticketKeyHex;
    const window = tc.windowIndex;
    const nowMs = window * 30000 + 10000;

    const generated = computeWindowCode(ticketKey, tc.orderId, window);

    // Code correct dans la fenêtre
    const ok = verifyManualCode(generated.code6, ticketKey, tc.orderId, nowMs);
    assert.equal(ok.valid, true);

    // Mauvais code
    const bad = verifyManualCode('999999', ticketKey, tc.orderId, nowMs);
    assert.equal(bad.valid, false);
  });
});
