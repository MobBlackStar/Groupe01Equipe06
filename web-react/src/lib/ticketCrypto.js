// 💡 Concept & Analogie : Comme un générateur de jeton OTP matériel, ce module utilise l'API Web standard `crypto.subtle` (WebCrypto) pour signer localement le QR code rotatif toutes les 30 secondes sans aucun appel réseau.
// 🔄 Comparaison React / Flutter : Côté React, on exploite WebCrypto ; côté Flutter, on utilise `package:crypto`. Les deux produisent la même chaîne `CS2.orderId.window.tag`.
// 🎯 À retenir pour la soutenance : "La génération du QR code tournant s'exécute entièrement côté client grâce à WebCrypto, garantissant une rotation fluide même en cas de mauvaise connectivité."
// Module : Cryptographie

/**
 * Calcule l'indice de fenêtre temporelle actuelle (fenêtre de 30 secondes).
 * @param {number} [nowMs=Date.now()]
 * @returns {number}
 */
export function getWindowIndex(nowMs = Date.now()) {
  return Math.floor(nowMs / 30000);
}

/**
 * Génère le payload QR et le code à 6 chiffres via WebCrypto.
 * @param {string} ticketKeyHex - Clé secrète sous forme hexadécimale (64 caractères)
 * @param {string} orderId - Identifiant de commande
 * @param {number} windowIndex - Numéro de fenêtre temporelle (30 s)
 * @returns {Promise<{ qrPayload: string, code6: string, tag: string, windowIndex: number }>}
 */
export async function generateClientTicketData(ticketKeyHex, orderId, windowIndex) {
  // Conversion de la clé hexadécimale en Uint8Array
  let keyBytes;
  if (/^[0-9a-fA-F]+$/.test(ticketKeyHex)) {
    keyBytes = new Uint8Array(
      ticketKeyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
  } else {
    // Si la clé est fournie en base64url
    const base64 = ticketKeyHex.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64);
    keyBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      keyBytes[i] = bin.charCodeAt(i);
    }
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const message = new TextEncoder().encode(`CS2|${orderId}|${windowIndex}`);
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, message);
  const sigBytes = new Uint8Array(signature);

  // 16 premiers octets en base64url (sans padding)
  const first16 = sigBytes.slice(0, 16);
  let binary = '';
  for (let i = 0; i < first16.byteLength; i++) {
    binary += String.fromCharCode(first16[i]);
  }
  const tagBase64Url = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4 premiers octets Big-Endian en entier modulo 1 000 000
  const view = new DataView(sigBytes.buffer);
  const codeNum = view.getUint32(0, false) % 1000000;
  const code6 = String(codeNum).padStart(6, '0');

  const qrPayload = `CS2.${orderId}.${windowIndex}.${tagBase64Url}`;

  return {
    qrPayload,
    code6,
    tag: tagBase64Url,
    windowIndex,
  };
}
