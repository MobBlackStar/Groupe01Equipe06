// 💡 Concept & Analogie : Comme l'index alphabétique à la fin d'un manuel scolaire qui permet de retrouver un sujet sans relire tout le livre, ce générateur de mots-clés découpe les titres et catégories en préfixes pour une recherche instantanée dans Firestore.
// 🔄 Comparaison React / Flutter : Permet aux deux applications clientes d'effectuer des recherches plein texte partielles via la clause `array-contains` de Firestore sans nécessiter de moteur tiers lourd.
// 🎯 À retenir pour la soutenance : "Nous générons des préfixes normalisés (sans accents, minuscules, dès 2 caractères) pour permettre l'auto-complétion directe sur Firestore avec une faible latence."
// Module : Logique Métier Backend

/**
 * Normalise une chaîne (minuscule, suppression des accents et caractères spéciaux).
 * @param {string} str
 * @returns {string}
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

/**
 * Génère une liste dédoublée de préfixes de recherche (longueur >= 2) pour l'indexation Firestore.
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.merchantName
 * @param {string} params.category
 * @param {string[]} [params.tags=[]]
 * @returns {string[]} Tableau de mots-clés (max 60 éléments)
 */
export function generateSearchKeywords({ title = '', merchantName = '', category = '', tags = [] }) {
  const combined = `${title} ${merchantName} ${category} ${tags.join(' ')}`;
  const clean = normalizeText(combined);
  const words = clean.split(/\s+/).filter(Boolean);

  const prefixes = new Set();

  for (const word of words) {
    if (word.length >= 2) {
      for (let i = 2; i <= Math.min(word.length, 12); i++) {
        prefixes.add(word.substring(0, i));
      }
    }
  }

  return Array.from(prefixes).slice(0, 60);
}
