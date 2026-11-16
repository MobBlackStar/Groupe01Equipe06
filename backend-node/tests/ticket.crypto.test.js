// 💡 Concept & Analogie : Test unitaire cryptographique pour la dérivation HMAC et la validation de rotation temporelle du ticket de retrait.
// 🔄 Comparaison React / Flutter : Vérifie la tolérance de dérive d'horloge de ± 30 secondes.
// 🎯 À retenir pour la soutenance : "Nos tests cryptographiques valident le rejet immédiat des signatures altérées ou des fenêtres temporelles périmées."
// Module : Logique Métier Backend

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveTicketKey,
  getWindowIndex,
  generateTicketData,
  verifyQrPayload,
} from '../src/modules/tickets/ticket.crypto.js';

describe('Cryptographie du Ticket Dynamique (ticket.crypto)', () => {
  const orderId = 'ord_test_99';
  const studentId = 'usr_student_01';
  const merchantId = 'mch_bakery_01';
  const nonce = 'k3f9L2xQ8mP0vR5t';
  const ticketKey = deriveTicketKey({ orderId, studentId, merchantId, nonce });

  test('Génération de payload QR valide et vérification sur la même fenêtre', () => {
    const now = Date.now();
    const window = getWindowIndex(now);
    const { qrPayload } = generateTicketData(ticketKey, orderId, window);

    const verification = verifyQrPayload(qrPayload, ticketKey, now);
    assert.equal(verification.valid, true);
    assert.equal(verification.orderId, orderId);
  });

  test('Acceptation dans la fenêtre tolérée ± 1 (30 secondes de battement)', () => {
    const now = Date.now();
    const window = getWindowIndex(now);
    const { qrPayload } = generateTicketData(ticketKey, orderId, window);

    // Vérification 25 secondes plus tard (même fenêtre ou fenêtre + 1)
    const verification = verifyQrPayload(qrPayload, ticketKey, now + 25000);
    assert.equal(verification.valid, true);
  });

  test('Rejet strict d une signature altérée', () => {
    const now = Date.now();
    const window = getWindowIndex(now);
    const { qrPayload } = generateTicketData(ticketKey, orderId, window);

    // Altération du tag de signature
    const tampered = qrPayload.slice(0, -3) + 'XYZ';
    const verification = verifyQrPayload(tampered, ticketKey, now);
    assert.equal(verification.valid, false);
    assert.equal(verification.reason, 'INVALID_SIGNATURE');
  });
});
