// 💡 Concept & Analogie : Comme un pass d'accès avec un code tournant à 6 chiffres (Google Authenticator / TOTP), ce système génère un QR code dynamique renouvelé toutes les 30 secondes pour empêcher la fraude par capture d'écran.
// 🔄 Comparaison React / Flutter : L'application React utilise l'API Web standard `crypto.subtle` (WebCrypto) et Flutter utilise le package Dart `crypto` ; les deux produisent exactement les mêmes signatures HMAC-SHA256.
// 🎯 À retenir pour la soutenance : "Le ticket dynamique anti-capture génère un code rotatif par fenêtre de 30 secondes signé par HMAC-SHA256 et vérifié en temps constant (`timingSafeEqual`) pour éliminer toute attaque par temporisation."
// Module : Cryptographie & Sécurité

import crypto from 'node:crypto';

const DEFAULT_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Dérive la clé secrète unique du ticket (ticketKey) à partir du secret maître et des données de commande.
 * Règle d'or : cette clé n'est JAMAIS stockée en base de données et est recalculée à la volée.
 */
export function deriveTicketKey({ secret, orderId, studentId, merchantId, nonce }) {
  const masterSecret = secret || process.env.QR_SECRET || DEFAULT_SECRET;
  const secretBuf = Buffer.from(masterSecret, 'hex').length === 32
    ? Buffer.from(masterSecret, 'hex')
    : Buffer.from(masterSecret, 'utf8');

  const message = `${orderId}|${studentId}|${merchantId}|${nonce}`;
  return crypto.createHmac('sha256', secretBuf).update(message).digest();
}

/**
 * Calcule l'indice de fenêtre temporelle actuelle (fenêtre de 30 secondes).
 */
export function getWindowIndex(nowMs = Date.now()) {
  return Math.floor(nowMs / 30000);
}

/**
 * Calcule la signature HMAC, le tag base64url, le code à 6 chiffres et le payload QR.
 */
export function computeWindowCode(ticketKey, orderId, windowIndex) {
  const keyBuf = Buffer.isBuffer(ticketKey)
    ? ticketKey
    : (ticketKey.length === 64 && /^[0-9a-fA-F]+$/.test(ticketKey))
      ? Buffer.from(ticketKey, 'hex')
      : Buffer.from(ticketKey, 'base64url');

  const message = `CS2|${orderId}|${windowIndex}`;
  const mac = crypto.createHmac('sha256', keyBuf).update(message).digest();

  // Tag : 16 premiers octets en base64url (sans padding)
  const tag = mac.subarray(0, 16).toString('base64url');

  // Code à 6 chiffres : 4 premiers octets Big-Endian modulo 1 000 000
  const codeNum = mac.readUInt32BE(0) % 1000000;
  const code6 = String(codeNum).padStart(6, '0');

  const qrPayload = `CS2.${orderId}.${windowIndex}.${tag}`;

  return {
    qrPayload,
    tag,
    tagBase64Url: tag,
    code6,
    windowIndex,
  };
}

/**
 * Alias pour computeWindowCode
 */
export function generateTicketData(ticketKey, orderId, windowIndex) {
  return computeWindowCode(ticketKey, orderId, windowIndex);
}

/**
 * Analyse et vérifie une charge utile QR scannée par le commerçant.
 * Vérification en temps constant avec crypto.timingSafeEqual.
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
  if (isNaN(payloadWindow)) {
    return { valid: false, orderId, reason: 'INVALID_WINDOW' };
  }

  const currentWindow = getWindowIndex(nowMs);

  // Tolérance d'une fenêtre (± 30 secondes)
  if (Math.abs(payloadWindow - currentWindow) > 1) {
    return { valid: false, orderId, reason: 'TICKET_EXPIRED', payloadWindow, currentWindow };
  }

  const { tag } = computeWindowCode(ticketKey, orderId, payloadWindow);

  const tagBufA = Buffer.from(scannedTag);
  const tagBufB = Buffer.from(tag);

  if (tagBufA.length !== tagBufB.length || !crypto.timingSafeEqual(tagBufA, tagBufB)) {
    return { valid: false, orderId, reason: 'INVALID_SIGNATURE' };
  }

  return { valid: true, orderId, windowIndex: payloadWindow };
}

/**
 * Vérifie un code manuel à 6 chiffres saisi par le commerçant en cas de problème de caméra.
 * Teste la fenêtre courante et les deux fenêtres adjacentes (± 1).
 */
export function verifyManualCode(code6, ticketKey, orderId, nowMs = Date.now()) {
  if (!code6 || String(code6).length !== 6) {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }

  const currentWindow = getWindowIndex(nowMs);
  const candidateWindows = [currentWindow, currentWindow - 1, currentWindow + 1];

  for (const w of candidateWindows) {
    const computed = computeWindowCode(ticketKey, orderId, w);
    if (computed.code6 === String(code6)) {
      return { valid: true, windowIndex: w };
    }
  }

  return { valid: false, reason: 'INVALID_SIGNATURE' };
}
