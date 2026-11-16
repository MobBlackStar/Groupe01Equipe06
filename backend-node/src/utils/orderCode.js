// 💡 Concept & Analogie : Comme un numéro de suivi de colis ou un code de retrait court et lisible sans risque de confondre le chiffre '0' avec la lettre 'O' ou '1' avec 'I', nous utilisons l'alphabet Crockford Base32.
// 🔄 Comparaison React / Flutter : Le code commande alphanumérique court est affiché en gros caractères sur le billet Web et Mobile pour permettre la saisie manuelle en cas de caméra défaillante.
// 🎯 À retenir pour la soutenance : "Nous générons des codes de commande au format `CS-XXXXX` basés sur un alphabet Crockford évitant toute ambiguïté visuelle lors de la saisie manuelle par le commerçant."
// Module : Architecture & Infrastructure

import crypto from 'node:crypto';

const CROCKFORD_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Génère un code de commande unique et mémorisable au format CS-XXXXX.
 * @returns {string} Exemple : "CS-7H9KZ"
 */
export function generateOrderCode() {
  const bytes = crypto.randomBytes(5);
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CROCKFORD_CHARS[bytes[i] % CROCKFORD_CHARS.length];
  }
  return `CS-${code}`;
}
