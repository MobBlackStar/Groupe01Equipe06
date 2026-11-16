// 💡 Concept & Analogie : Comme une lampe torche à manivelle prête à fonctionner quand le réseau électrique tombe, ce parseur déterministe prend le relais instantanément si l'API IA est indisponible ou désactivée (`AI_PROVIDER=none`).
// 🔄 Comparaison React / Flutter : Fonctionne 100% côté serveur sans aucune dépendance externe, assurant un comportement infaillible en toute circonstance.
// 🎯 À retenir pour la soutenance : "Nous avons conçu un parseur déterministe à base d'expressions régulières et de lexique gastronomique tunisien pour garantir la résilience du système même sans connexion externe à l'IA."
// Module : Parseur de secours & Robustesse

import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '../../../../shared/constants.js';

export const TUNISIAN_LEXICON = [
  { keywords: ['makloub'], name: 'Makloub', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 6500 },
  { keywords: ['chapati'], name: 'Chapati', weight: 300, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 5000 },
  { keywords: ['baguette farcie', 'baguette farci'], name: 'Baguette Farcie', weight: 400, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7000 },
  { keywords: ['brik', 'briks'], name: 'Brik', weight: 120, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 2500 },
  { keywords: ['fricasse', 'fricassé', 'fricasses'], name: 'Fricassé', weight: 150, category: OFFER_CATEGORIES.SNACK, defaultPrice: 1500 },
  { keywords: ['lablabi', 'leblebi'], name: 'Lablabi', weight: 450, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 5000 },
  { keywords: ['ojja'], name: 'Ojja', weight: 400, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 6000 },
  { keywords: ['kafteji'], name: 'Kafteji', weight: 350, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 4500 },
  { keywords: ['mlewi', 'mlawi'], name: 'Mlewi', weight: 200, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 3500 },
  { keywords: ['croissant'], name: 'Croissant', weight: 70, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1200 },
  { keywords: ['pain au chocolat', 'chocolatine'], name: 'Pain au chocolat', weight: 80, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { keywords: ['bambalouni'], name: 'Bambalouni', weight: 90, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['makroudh', 'makroud'], name: 'Makroudh', weight: 60, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['pizza'], name: 'Pizza', weight: 500, category: OFFER_CATEGORIES.PIZZA, defaultPrice: 8000 },
  { keywords: ['sandwich thon', 'sandwich'], name: 'Sandwich', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 4500 },
  { keywords: ['salade'], name: 'Salade', weight: 250, category: OFFER_CATEGORIES.SALADE, defaultPrice: 4000 },
  { keywords: ['jus', 'soda', 'eau', 'boisson'], name: 'Boisson', weight: 300, category: OFFER_CATEGORIES.BOISSON, defaultPrice: 2000 },
];

/**
 * Analyse une note textuelle brute en extrait les articles, quantités, horaires et prix.
 * @param {string} rawNote - Texte brut (ex: "4 makloub escalope + 3 brik, fermeture 17h")
 * @returns {object} Données pré-remplies conformes au modèle d'offre
 */
export function parseRawNote(rawNote) {
  if (!rawNote || typeof rawNote !== 'string') {
    throw new Error('La note brute doit être une chaîne non vide');
  }

  const normalized = rawNote.toLowerCase();
  const foundItems = [];

  for (const entry of TUNISIAN_LEXICON) {
    for (const kw of entry.keywords) {
      const regex = new RegExp(`(?:(\\d+)\\s*x?\\s*)?${kw}`, 'i');
      const match = normalized.match(regex);
      if (match) {
        const qty = match[1] ? parseInt(match[1], 10) : 1;
        foundItems.push({
          ...entry,
          matchedQty: qty,
        });
        break;
      }
    }
  }

  // Détection de l'heure de fermeture (ex: "fermeture 17h", "ferme à 18h30")
  const closingMatch = normalized.match(/(?:fermeture|ferme|jusqu'?à)\s*(\d{1,2})h(\d{2})?/i);
  let closingHour = 18;
  let closingMinute = 0;
  if (closingMatch) {
    closingHour = parseInt(closingMatch[1], 10);
    closingMinute = closingMatch[2] ? parseInt(closingMatch[2], 10) : 0;
  }

  const isMultiItem = foundItems.length > 1;
  const isSurpriseBasket = isMultiItem;

  const totalQty = foundItems.reduce((acc, it) => acc + it.matchedQty, 0) || 1;
  const totalWeight = foundItems.reduce((acc, it) => acc + it.weight * it.matchedQty, 0) || 300;
  const unitWeight = Math.round(totalWeight / totalQty);

  const estimatedOriginal = foundItems.reduce((acc, it) => acc + it.defaultPrice * it.matchedQty, 0) || 6000;
  const originalPerUnit = Math.round(estimatedOriginal / totalQty);
  const discountedPerUnit = Math.round(originalPerUnit * 0.6); // 40% de réduction par défaut

  let title = 'Panier Sauvetage du Jour';
  let category = OFFER_CATEGORIES.MIXTE;

  if (foundItems.length === 1) {
    const single = foundItems[0];
    title = `${single.name} artisanal`;
    category = single.category;
  } else if (foundItems.length > 1) {
    title = `Panier Surprise (${foundItems.map((f) => f.name).join(' & ')})`;
    category = OFFER_CATEGORIES.MIXTE;
  }

  return {
    title,
    description: `Offre préparée le jour même avec des ingrédients frais. Sauvez ${totalQty} portion(s) avant la fermeture à ${String(closingHour).padStart(2, '0')}h${String(closingMinute).padStart(2, '0')}.`,
    category,
    originalPriceMillimes: originalPerUnit,
    discountedPriceMillimes: discountedPerUnit,
    pricingMode: PRICING_MODES.FIXED,
    quantityTotal: totalQty,
    weightGramsPerUnit: unitWeight,
    isSurpriseBasket,
    surprise: isSurpriseBasket
      ? {
          rarity: SURPRISE_RARITY.COMMON,
          teaser: `Assortiment surprise d'environ ${totalQty} délices à récupérer avant fermeture`,
          itemCountHint: totalQty,
        }
      : undefined,
  };
}
