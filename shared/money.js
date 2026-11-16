// 💡 Concept & Analogie : Comme un compte bancaire qui compte chaque centime individuellement pour éviter les erreurs d'arrondi de virgule flottante (0.1 + 0.2 = 0.30000000000000004), nous stockons tous les montants sous forme d'entiers stricts en millimes tunisiens (1 TND = 1000 millimes).
// 🔄 Comparaison React / Flutter : En React, `formatTND` est utilisé directement dans les composants JSX via un formateur d'affichage ; en Flutter, nous appelons une classe utilitaire `MoneyFormatter` en Dart avec le même comportement déterministe.
// 🎯 À retenir pour la soutenance : "Pour respecter l'intégrité financière et éliminer tout bogue d'arrondi binaire, nous avons adopté la règle inviolable de manipuler exclusivement des entiers en millimes dans toute la chaîne de traitement."

/**
 * Convertit un montant en millimes vers un montant décimal en Dinars Tunisiens (TND).
 * @param {number} millimes - Montant entier en millimes
 * @returns {number} Montant en TND
 */
export function millimesToTND(millimes) {
  if (!Number.isInteger(millimes)) {
    throw new TypeError(`Le montant en millimes doit être un entier strict, reçu : ${millimes}`);
  }
  return millimes / 1000;
}

/**
 * Convertit un montant en Dinars Tunisiens (TND) vers un montant entier en millimes.
 * @param {number|string} tnd - Montant en TND
 * @returns {number} Montant entier en millimes
 */
export function tndToMillimes(tnd) {
  const parsed = typeof tnd === 'number' ? tnd : parseFloat(String(tnd).replace(',', '.'));
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Valeur TND invalide : ${tnd}`);
  }
  return Math.round(parsed * 1000);
}

/**
 * Formate un montant en millimes sous forme de chaîne monétaire tunisienne élégante (ex: "4,500 DT").
 * @param {number} millimes - Montant entier en millimes
 * @param {object} [options] - Options de formatage
 * @param {boolean} [options.withCurrency=true] - Inclure le suffixe "DT"
 * @param {string} [options.decimalSeparator=','] - Séparateur décimal (',' ou '.')
 * @returns {string} Chaîne formatée
 */
export function formatTND(millimes, options = {}) {
  const { withCurrency = true, decimalSeparator = ',' } = options;
  if (!Number.isInteger(millimes)) {
    throw new TypeError(`formatTND attend un entier en millimes, reçu : ${millimes}`);
  }

  const sign = millimes < 0 ? '-' : '';
  const abs = Math.abs(millimes);
  const dinars = Math.floor(abs / 1000);
  const remainder = abs % 1000;
  const paddedRemainder = String(remainder).padStart(3, '0');

  const formatted = `${sign}${dinars}${decimalSeparator}${paddedRemainder}`;
  return withCurrency ? `${formatted} DT` : formatted;
}

/**
 * Analyse une saisie utilisateur en chaîne TND pour la convertir en millimes entiers.
 * Accepte les formats "4.5", "4,500", "4,500 DT", "12 DT".
 * @param {string} input - Chaîne saisie
 * @returns {number} Entier en millimes
 */
export function parseTND(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`parseTND attend une chaîne, reçu : ${typeof input}`);
  }
  const clean = input.replace(/DT|dt|tnd|TND|\s/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  if (Number.isNaN(parsed)) {
    throw new Error(`Format de montant invalide : "${input}"`);
  }
  return Math.round(parsed * 1000);
}
