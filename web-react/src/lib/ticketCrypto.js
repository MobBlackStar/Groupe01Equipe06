// 💡 Concept & Analogie : Comme un générateur de jeton OTP matériel, ce module utilise l'API Web standard `crypto.subtle` pour signer localement le QR code rotatif toutes les 30 secondes sans aucun appel réseau.
// 🔄 Comparaison React / Flutter : Côté React, on exploite WebCrypto ; côté Flutter, on utilise `package:crypto`. Les deux produisent la même chaîne `CS2.orderId.window.tag`.
// 🎯 À retenir pour la soutenance : "La génération du QR code tournant s'exécute entièrement côté client grâce à WebCrypto, garantissant une rotation fluide même en cas de mauvaise connectivité."
// Module : Cryptographie

export async function generateClientTicketData(ticketKeyHex, orderId, windowIndex) {
  // Conversion de la clé hexadécimale en ArrayBuffer
  const keyBytes = new Uint8Array(
    ticketKeyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

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

  // 16 premiers octets en base64url
  const first16 = sigBytes.slice(0, 16);
  let binary = '';
  for (let i = 0; i < first16.byteLength; i++) {
    binary += String.fromCharCode(first16[i]);
  }
  const tagBase64Url = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4 premiers octets Big-Endian en nombre à 6 chiffres
  const view = new DataView(sigBytes.buffer);
  const codeNum = view.getUint32(0, false) % 1000000;
  const code6 = String(codeNum).padStart(6, '0');

  const qrPayload = `CS2.${orderId}.${windowIndex}.${tagBase64Url}`;

  return {
    qrPayload,
    code6,
    windowIndex,
  };
}
