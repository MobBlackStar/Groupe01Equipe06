// 💡 Concept & Analogie : Comme un pass d'accès avec un code tournant à 6 chiffres (Google Authenticator / TOTP), ce système génère un QR code dynamique renouvelé toutes les 30 secondes pour empêcher la fraude par capture d'écran.
// 🔄 Comparaison React / Flutter : L'application React utilise l'API native `crypto.subtle` (WebCrypto) et Flutter utilise le package Dart `crypto` ; les deux produisent exactement les mêmes signatures HMAC-SHA256.
// 🎯 À retenir pour la soutenance : "Le ticket dynamique anti-capture génère un code rotatif par fenêtre de 30 secondes signé par HMAC-SHA256 et vérifié en temps constant (`timingSafeEqual`) pour éliminer toute attaque par temporisation."
// Module : Cryptographie & Sécurité

import crypto from 'node:crypto';

const QR_SECRET = process.env.QR_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Dérive une clé secrète unique propre à la commande (ticketKey).
 * Ne doit JAMAIS être stockée en base de données Firestore.
 * @param {object} params
 * @param {string} params.orderId
 * @param {string} params.studentId
 * @param {string} params.merchantId
 * @param {string} params.nonce - Chaîne aléatoire de 16 octets en base64url
 * @returns {Buffer} Clé dérivée de 32 octets
 */
export function deriveTicketKey({ orderId, studentId, merchantId, nonce }) {
  const message = `${orderId}|${studentId}|${merchantId}|${nonce}`;
  return crypto.createHmac('sha256', Buffer.from(QR_SECRET, 'hex')).update(message).digest();
}

/**
 * Calcule l'indice de fenêtre temporelle actuelle (fenêtre de 30 secondes).
 * @param {number} [nowMs=Date.now()]
 * @returns {number}
 */
export function getWindowIndex(nowMs = Date.now()) {
  return Math.floor(nowMs / 30000);
}

/**
 * Calcule le tag HMAC et le code de secours à 6 chiffres pour une fenêtre temporelle donnée.
 * @param {Buffer|string} ticketKey
 * @param {string} orderId
 * @param {number} windowIndex
 * @returns {{ tagBase64Url: string, code6: string, qrPayload: string }}
 */
export function generateTicketData(ticketKey, orderId, windowIndex) {
  const keyBuf = Buffer.isBuffer(ticketKey) ? ticketKey : Buffer.from(ticketKey, 'hex');
  const message = `CS2|${orderId}|${windowIndex}`;

  const mac = crypto.createHmac('sha256', keyBuf).update(message).digest();

  // Les 16 premiers octets pour le tag QR en base64url
  const tagBase64Url = mac.subarray(0, 16).toString('base64url');

  // Code de secours à 6 chiffres calculé depuis les 4 premiers octets (Big-Endian uint32 modulo 1 000 000)
  const codeNum = mac.readUInt32BE(0) % 1000000;
  const code6 = String(codeNum).padStart(6, '0');

  const qrPayload = `CS2.${orderId}.${windowIndex}.${tagBase64Url}`;

  return {
    tagBase64Url,
    code6,
    qrPayload,
  };
}

/**
 * Analyse et valide une charge utile QR lors du scan commerçant.
 * Tolérance temporelle : fenêtre actuelle ± 1 fenêtre (dérive maximale de 30 s).
 * @param {string} qrPayload - Format "CS2.<orderId>.<window>.<tag>"
 * @param {Buffer} ticketKey - Clé dérivée de la commande
 * @param {number} [nowMs=Date.now()]
 * @returns {{ valid: boolean, orderId: string, reason?: string }}
 */
export function verifyQrPayload(qrPayload, ticketKey, nowMs = Date.now()) {
  if (!qrPayload || typeof qrPayload !== 'string') {
    return { valid: false, orderId: '', reason: 'PAYLOAD_FORMAT_INVALID' };
  }

  const parts = qrPayload.split('.');
  if (parts.length !== 4 || parts[0] !== 'CS2') {
    return { valid: false, orderId: '', reason: 'UNSUPPORTED_VERSION' };
  }

  const [, orderId, windowStr, scannedTag] = parts;
  const payloadWindow = parseInt(windowStr, 10);
  const currentWindow = getWindowIndex(nowMs);

  // Tolérance d'une fenêtre avant/après pour absorber la latence réseau
  if (Math.abs(payloadWindow - currentWindow) > 1) {
    return { valid: false, orderId, reason: 'TICKET_EXPIRED' };
  }

  const { tagBase64Url } = generateTicketData(ticketKey, orderId, payloadWindow);

  // Vérification en temps constant contre les attaques par canal auxiliaire
  const tagBufA = Buffer.from(scannedTag);
  const tagBufB = Buffer.from(tagBase64Url);

  if (tagBufA.length !== tagBufB.length || !crypto.timingSafeEqual(tagBufA, tagBufB)) {
    return { valid: false, orderId, reason: 'INVALID_SIGNATURE' };
  }

  return { valid: true, orderId };
}
