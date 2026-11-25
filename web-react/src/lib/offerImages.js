// 💡 Concept & Analogie : Comme le catalogue visuel d'un menu photo bien rangé, ce module associe d'abord les mots-clés précis du plat (œufs, makloub, pizza, croissant...) puis se replie proprement sur l'une des 9 catégories CampusSave.
// 🔄 Comparaison React / Flutter : React l'utilise dans `OfferFormPage`, `PhotoDropzone`, `OfferCard`, `MysteryBoxCard` et `OfferDetailPage` ; Flutter applique la même table dans `offer_form_screen.dart`.
// 🎯 À retenir pour la soutenance : "Une table unique de correspondance sémantique garantit que l'aperçu en direct affiche toujours un plat cohérent sans dépendre uniquement de la catégorie générique."

export const SAFE_FOOD_FALLBACK_IMG = '/assets/griddle/food/takeaway-counter.webp';

export const CATEGORY_DEFAULT_IMAGES = {
  SANDWICH: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
  PLAT_CHAUD: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
  PIZZA: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  PATISSERIE: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  VIENNOISERIE: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  SALADE: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  BOISSON: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  SNACK: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
  MIXTE: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
};

// Frontières compatibles Unicode (apostrophes, accents, ligatures « œ » en français).
function kw(expr) {
  return new RegExp(`(?:^|[^\\p{L}0-9])(?:${expr})(?=$|[^\\p{L}0-9])`, 'iu');
}

// Règles ordonnées du plus spécifique au plus générique afin qu'un plat composé garde son visuel principal.
const KEYWORD_IMAGE_RULES = [
  { pattern: kw('makloubs?|chawarmas?|shawarmas?|chapatis?|ml[ae]wis?|wraps?|tacos|kaskrouts?'), url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('baguettes?'), url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('cheeseburgers?|burgers?|smash'), url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('sandwichs?|sandwiches|paninis?'), url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('margherita'), url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('pizzas?|calzones?'), url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('croissants?'), url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('pains?\\s+au\\s+chocolat|chocolatines?|viennoiseries?|brioches?'), url: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('briks?'), url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('omelettes?'), url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('eggs?|oeufs?|œufs?|adham'), url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('salades?|salads?|bowls?|c[eé]sar'), url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('couscous|kosksi|riz'), url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('p[aâ]tes|pasta|spaghettis?|lasagnes?|maqarouna'), url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('ojja|l[ae]bl[ae]bi|kaftejis?|plats?\\s+chauds?|tajines?|mijot[eé]s?'), url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('caf[eé]s?|coffees?|espressos?|cappuccinos?|lattes?'), url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('boissons?|jus|limonades?|sodas?|smoothies?|th[eé]s?|drinks?'), url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('tartes?|millefeuilles?'), url: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('g[aâ]teaux?|gateaux?|p[aâ]tisseries?|patisseries?|cheesecakes?|baklavas?|makroudhs?|bambalounis?|[eé]clairs?|cookies?|biscuits?|desserts?'), url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('frites?|fries|nuggets?|fricass[eé]e?s?|snacks?'), url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80' },
  { pattern: kw('panier\\s*surprise|mystery\\s*box|coffrets?'), url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
];

export const OFFER_IMAGE_PRESETS = [
  { label: 'Baguette Farcie', emoji: '🥖', category: 'SANDWICH', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80' },
  { label: 'Makloub / Wrap', emoji: '🌯', category: 'SANDWICH', url: CATEGORY_DEFAULT_IMAGES.SANDWICH },
  { label: 'Pizza Artisanale', emoji: '🍕', category: 'PIZZA', url: CATEGORY_DEFAULT_IMAGES.PIZZA },
  { label: 'Plat Chaud / Ojja', emoji: '🍲', category: 'PLAT_CHAUD', url: CATEGORY_DEFAULT_IMAGES.PLAT_CHAUD },
  { label: 'Salade Fraîche', emoji: '🥗', category: 'SALADE', url: CATEGORY_DEFAULT_IMAGES.SALADE },
  { label: 'Croissant / Viennoiserie', emoji: '🥐', category: 'VIENNOISERIE', url: CATEGORY_DEFAULT_IMAGES.VIENNOISERIE },
  { label: 'Pâtisserie / Gâteau', emoji: '🧁', category: 'PATISSERIE', url: CATEGORY_DEFAULT_IMAGES.PATISSERIE },
  { label: 'Œufs Fermiers', emoji: '🥚', category: 'SNACK', url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Boisson / Café', emoji: '🥤', category: 'BOISSON', url: CATEGORY_DEFAULT_IMAGES.BOISSON },
  { label: 'Frites & Snack', emoji: '🍟', category: 'SNACK', url: CATEGORY_DEFAULT_IMAGES.SNACK },
  { label: 'Panier Surprise', emoji: '🎁', category: 'MIXTE', url: CATEGORY_DEFAULT_IMAGES.MIXTE },
];

/**
 * Résout l'image la plus cohérente pour une offre à partir de la note brute,
 * du titre, du contenu surprise, puis de la catégorie officielle.
 */
export function resolveOfferImage({
  category,
  title = '',
  rawNote = '',
  surpriseContents = '',
  description = '',
  isSurpriseBasket = false,
} = {}) {
  const candidates = [rawNote, title, surpriseContents, description]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  for (const text of candidates) {
    for (const rule of KEYWORD_IMAGE_RULES) {
      if (rule.pattern.test(text)) {
        return rule.url;
      }
    }
  }

  const normalizedCat = String(category || '').toUpperCase().trim();
  if (CATEGORY_DEFAULT_IMAGES[normalizedCat]) {
    return CATEGORY_DEFAULT_IMAGES[normalizedCat];
  }
  if (isSurpriseBasket) {
    return CATEGORY_DEFAULT_IMAGES.MIXTE;
  }
  return SAFE_FOOD_FALLBACK_IMG;
}
