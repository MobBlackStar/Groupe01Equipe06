// 💡 Concept & Analogie : Comme une lampe torche à manivelle prête à fonctionner quand le réseau électrique tombe, ce parseur déterministe prend le relais instantanément si l'API IA est indisponible ou désactivée (`AI_PROVIDER=none`).
// 🔄 Comparaison React / Flutter : Fonctionne 100% côté serveur sans aucune dépendance externe, assurant un comportement infaillible en toute circonstance.
// 🎯 À retenir pour la soutenance : "Nous avons conçu un parseur déterministe à base d'expressions régulières et de lexique gastronomique tunisien pour garantir la résilience du système même sans connexion externe à l'IA."
// Module : Parseur de secours & Robustesse

import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '../../../../shared/constants.js';
import { resolveDishPhoto, resolveDishPhotoTag } from '../../../../shared/dishPhotos.js';

export const TUNISIAN_LEXICON = [
  { keywords: ['makloub'], pattern: 'makloubs?', name: 'Makloub', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 6500 },
  { keywords: ['chapati'], pattern: 'chapatis?', name: 'Chapati', weight: 300, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 5000 },
  { keywords: ['baguette farcie', 'baguette farci'], pattern: 'baguettes?\\s+farci(?:es?|s)?', name: 'Baguette Farcie', weight: 400, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7000 },
  { keywords: ['brik', 'briks'], pattern: 'briks?', name: 'Brik', weight: 120, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 2500 },
  { keywords: ['fricasse', 'fricassé', 'fricasses'], pattern: 'fricass(?:[eé]e?s?)', name: 'Fricassé', weight: 150, category: OFFER_CATEGORIES.SNACK, defaultPrice: 1500 },
  { keywords: ['lablabi', 'leblebi'], pattern: 'l[ae]bl[ae]bis?', name: 'Lablabi', weight: 450, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 5000 },
  { keywords: ['ojja'], pattern: 'ojjas?', name: 'Ojja', weight: 400, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 6000 },
  { keywords: ['kafteji'], pattern: 'kaftejis?', name: 'Kafteji', weight: 350, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 4500 },
  { keywords: ['mlewi', 'mlawi'], pattern: 'ml[ae]wis?', name: 'Mlewi', weight: 200, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 3500 },
  { keywords: ['croissant'], pattern: 'croissants?', name: 'Croissant', weight: 70, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1200 },
  { keywords: ['pain au chocolat', 'chocolatine'], pattern: '(?:pains?\\s+au\\s+chocolat|chocolatines?)', name: 'Pain au chocolat', weight: 80, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { keywords: ['bambalouni'], pattern: 'bambalounis?', name: 'Bambalouni', weight: 90, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['makroudh', 'makroud'], pattern: 'makroudh?s?', name: 'Makroudh', weight: 60, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 1000 },
  { keywords: ['pâtisserie', 'patisserie', 'gâteau', 'gateau'], pattern: '(?:p[aâ]tisseries?|g[aâ]teaux?|millefeuilles?|[eé]clairs?)', name: 'Pâtisserie', weight: 220, category: OFFER_CATEGORIES.PATISSERIE, defaultPrice: 4500 },
  { keywords: ['viennoiserie', 'viennoiseries'], pattern: 'viennoiseries?', name: 'Viennoiserie', weight: 85, category: OFFER_CATEGORIES.VIENNOISERIE, defaultPrice: 1500 },
  { keywords: ['pizza'], pattern: 'pizzas?', name: 'Pizza', weight: 500, category: OFFER_CATEGORIES.PIZZA, defaultPrice: 8000 },
  { keywords: ['burger', 'cheeseburger'], pattern: '(?:cheeseburgers?|burgers?)', name: 'Burger Smash', weight: 360, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7500 },
  { keywords: ['tacos'], pattern: 'tacos?', name: 'Tacos', weight: 380, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7000 },
  { keywords: ['chawarma', 'shawarma', 'panini'], pattern: '(?:chawarmas?|shawarmas?|paninis?)', name: 'Spécialité Grill', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 7000 },
  { keywords: ['sandwich thon', 'sandwich'], pattern: '(?:sandwichs?\\s+au\\s+thon|sandwichs?\\s+thon|sandwiches|sandwichs?)', name: 'Sandwich', weight: 350, category: OFFER_CATEGORIES.SANDWICH, defaultPrice: 4500 },
  { keywords: ['salade', 'salad'], pattern: 'salade?s?', name: 'Salade', weight: 250, category: OFFER_CATEGORIES.SALADE, defaultPrice: 4000 },
  { keywords: ['eggs', 'oeufs', 'œufs'], pattern: '(?<!avec\\s)(?<!au\\s)(?:eggs?|oeufs?|œufs|adham)', name: 'Œufs frais fermiers', weight: 360, category: OFFER_CATEGORIES.SNACK, defaultPrice: 3500 },
  { keywords: ['pasta', 'pâtes', 'pates', 'spaghetti'], pattern: '(?:pasta|p[aâ]tes|spaghettis?|lasagnes?|maqarouna)', name: 'Pâtes maison', weight: 400, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 7000 },
  { keywords: ['couscous', 'kosksi'], pattern: '(?:couscous|kosksi)', name: 'Couscous tunisien', weight: 450, category: OFFER_CATEGORIES.PLAT_CHAUD, defaultPrice: 7500 },
  { keywords: ['jus', 'soda', 'eau', 'boisson', 'coffee', 'café'], pattern: '(?:jus|sodas?|eaux?|boissons?|coffees?|caf[eé]s?)', name: 'Boisson', weight: 300, category: OFFER_CATEGORIES.BOISSON, defaultPrice: 2000 },
];

/** Convertit une valeur textuelle monétaire (ex: "8", "3.5", "7500") + unité en millimes entiers. */
function parseMoneyToken(rawValue, unit = '') {
  const num = Number(String(rawValue).replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return null;
  const normalizedUnit = (unit || '').toLowerCase();
  if (normalizedUnit.startsWith('d') || normalizedUnit.startsWith('t') || num < 100) {
    return Math.round(num * 1000);
  }
  return Math.round(num);
}

/** Extrait une heure de fermeture { closingHour, closingMinute } depuis un texte ou un paramètre HH:mm. */
function extractClosingTime(normalized, explicitClosingTime) {
  if (explicitClosingTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(explicitClosingTime)) {
    const [h, m] = explicitClosingTime.split(':').map(Number);
    return { closingHour: h, closingMinute: m };
  }

  const closingMatch =
    normalized.match(/(?:fermeture|ferme(?:\s*[àa])?|jusqu'[àa]|avant)\s*(\d{1,2})\s*h\s*(\d{2})?/i) ||
    normalized.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);

  if (closingMatch) {
    const h = Math.min(23, Math.max(0, parseInt(closingMatch[1], 10)));
    const m = closingMatch[2] ? Math.min(59, Math.max(0, parseInt(closingMatch[2], 10))) : 0;
    return { closingHour: h, closingMinute: m };
  }

  return { closingHour: 18, closingMinute: 0 };
}

/** Calcule des horaires HH:mm cohérents (créneau de 2h se terminant à l'heure de fermeture). */
function computeSuggestedWindow(closingHour, closingMinute) {
  const endMinutesTotal = Math.max(60, closingHour * 60 + closingMinute);
  const startMinutesTotal = Math.max(0, endMinutesTotal - 120);
  const fmt = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return {
    suggestedPickupStartAt: fmt(startMinutesTotal),
    suggestedPickupEndAt: fmt(endMinutesTotal),
  };
}

/** Extrait d'éventuels prix explicites dans la note du commerçant. */
function extractExplicitPrices(normalized) {
  const origMatch = normalized.match(
    /(?:prix\s*(?:initial|normal|d'origine|origine)?|au\s*lieu\s*de|valeur)\s*(?::|=)?\s*(\d+(?:[.,]\d+)?)\s*(dt|dinars?|tnd|millimes?)?/i
  );
  const discMatch = normalized.match(
    /(?:prix\s*(?:r[eé]duit|final|promo|vente)|vendu\s*[àa]?|pour|à)\s*(\d+(?:[.,]\d+)?)\s*(dt|dinars?|tnd|millimes?)/i
  );
  return {
    explicitOriginal: origMatch ? parseMoneyToken(origMatch[1], origMatch[2]) : null,
    explicitDiscounted: discMatch ? parseMoneyToken(discMatch[1], discMatch[2]) : null,
  };
}

/**
 * Analyse une note textuelle brute en extrait les articles, quantités, horaires et prix.
 * @param {string} rawNote - Texte brut (ex: "4 makloub escalope + 3 brik, fermeture 17h")
 * @param {{ closingTime?: string }} [options] - Paramètres optionnels
 * @returns {object} Données pré-remplies conformes au modèle d'offre
 */
export function parseRawNote(rawNote, options = {}) {
  if (!rawNote || typeof rawNote !== 'string' || !rawNote.trim()) {
    throw new Error('La note brute doit être une chaîne non vide');
  }

  const normalized = rawNote.toLowerCase();
  const foundItems = [];

  for (const entry of TUNISIAN_LEXICON) {
    const patternBody = entry.pattern || entry.keywords.join('|');
    const regex = new RegExp(`(?:(\\d+)\\s*x?\\s*)?\\b${patternBody}\\b`, 'i');
    const match = normalized.match(regex);
    if (match) {
      const qty = match[1] ? parseInt(match[1], 10) : 1;
      foundItems.push({
        ...entry,
        matchedQty: Math.min(50, Math.max(1, qty)),
        hasExplicitQty: Boolean(match[1]),
      });
    }
  }

  // Si aucune quantité préfixe directe n'a été détectée (ex: "panier surprise pâtisserie 5 pièces" ou "2 fresh salad")
  const trailingQtyMatch = normalized.match(/(\d+)\s*(?:pi[eè]ces?|portions?|parts?|articles?|unit[eé]s?)/i);
  const leadingQtyMatch = normalized.match(/^\s*(\d+)\s+(?!dt\b|tnd\b|millimes?\b|h\b)/i);
  if (foundItems.length === 1 && !foundItems[0].hasExplicitQty) {
    if (trailingQtyMatch) {
      foundItems[0].matchedQty = Math.min(50, Math.max(1, parseInt(trailingQtyMatch[1], 10)));
    } else if (leadingQtyMatch) {
      foundItems[0].matchedQty = Math.min(50, Math.max(1, parseInt(leadingQtyMatch[1], 10)));
    }
  }

  const { closingHour, closingMinute } = extractClosingTime(normalized, options.closingTime);
  const { suggestedPickupStartAt, suggestedPickupEndAt } = computeSuggestedWindow(closingHour, closingMinute);

  const explicitSurprise = /(?:panier\s*surprise|box\s*surprise|bo[iî]te\s*myst[eè]re|assortiment)/i.test(normalized);
  const isMultiItem = foundItems.length > 1;
  const isSurpriseBasket = isMultiItem || explicitSurprise;

  const fallbackQty = trailingQtyMatch ? Math.min(50, Math.max(1, parseInt(trailingQtyMatch[1], 10))) : 1;
  const totalQty = foundItems.reduce((acc, it) => acc + it.matchedQty, 0) || fallbackQty;
  const totalWeight = foundItems.reduce((acc, it) => acc + it.weight * it.matchedQty, 0) || 300 * totalQty;
  const unitWeight = Math.min(5000, Math.max(50, Math.round(totalWeight / totalQty)));

  const { explicitOriginal, explicitDiscounted } = extractExplicitPrices(normalized);
  const estimatedOriginal = foundItems.reduce((acc, it) => acc + it.defaultPrice * it.matchedQty, 0) || 6000 * totalQty;
  const originalPerUnit = Math.min(100000, Math.max(500, explicitOriginal || Math.round(estimatedOriginal / totalQty)));
  const rawDiscounted = explicitDiscounted || Math.round(originalPerUnit * 0.6); // 40% de réduction par défaut
  const discountedPerUnit = Math.max(100, Math.min(originalPerUnit - 100, rawDiscounted));

  // Bornes cohérentes pour le mode Smart Decay si le commerçant l'active ensuite
  const floorPriceMillimes = discountedPerUnit;
  const startPriceMillimes = Math.max(
    floorPriceMillimes + 100,
    Math.min(originalPerUnit, Math.round((originalPerUnit * 0.8) / 100) * 100)
  );

  let title = explicitSurprise ? 'Panier Surprise du Jour' : 'Panier Sauvetage du Jour';
  let category = OFFER_CATEGORIES.MIXTE;

  if (foundItems.length === 1 && !explicitSurprise) {
    const single = foundItems[0];
    title = `${single.name} artisanal`;
    category = single.category;
  } else if (foundItems.length === 1 && explicitSurprise) {
    const single = foundItems[0];
    title = `Panier Surprise (${single.name})`;
    category = OFFER_CATEGORIES.MIXTE;
  } else if (foundItems.length > 1) {
    title = `Panier Surprise (${foundItems.map((f) => f.name).join(' & ')})`;
    category = OFFER_CATEGORIES.MIXTE;
  }

  const surpriseItems = foundItems.map((it) => ({ name: it.name, quantity: it.matchedQty }));
  const surpriseContents =
    surpriseItems.length > 0
      ? surpriseItems.map((it) => `${it.quantity}x ${it.name}`).join(' + ')
      : `${totalQty}x Assortiment surprise du chef`;

  const photoTag = resolveDishPhotoTag({
    category,
    title: title.slice(0, 80),
    rawNote,
    surpriseContents,
    isSurpriseBasket,
  });
  const suggestedPhotoUrl = resolveDishPhoto({
    photoTag,
    category,
    title: title.slice(0, 80),
    rawNote,
    surpriseContents,
    isSurpriseBasket,
  });

  return {
    title: title.slice(0, 80),
    description: `Offre préparée le jour même avec des ingrédients frais. Sauvez ${totalQty} portion(s) avant la fermeture à ${String(closingHour).padStart(2, '0')}h${String(closingMinute).padStart(2, '0')}.`,
    category,
    photoTag,
    suggestedPhotoUrl,
    originalPriceMillimes: originalPerUnit,
    discountedPriceMillimes: discountedPerUnit,
    startPriceMillimes,
    floorPriceMillimes,
    pricingMode: PRICING_MODES.FIXED,
    quantityTotal: totalQty,
    weightGramsPerUnit: unitWeight,
    isSurpriseBasket,
    closingHour,
    closingMinute,
    suggestedPickupStartAt,
    suggestedPickupEndAt,
    ...(isSurpriseBasket
      ? {
          surpriseContents,
          surpriseItems,
          surprise: {
            rarity: SURPRISE_RARITY.COMMON,
            teaser: `Assortiment surprise d'environ ${totalQty} délices à récupérer avant fermeture`,
            itemCountHint: Math.min(10, totalQty),
          },
        }
      : {}),
  };
}
