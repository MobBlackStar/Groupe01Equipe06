// Catalogue unifié des 14 tags photo culinaires CampusSave (tous vérifiés HTTP 200 image/jpeg)
// Utilisé par l'IA Gemini/Fallback, le Seed ESSECT, OfferFormPage Web et mirroré sous Flutter.

export const DISH_PHOTO_TAGS = [
  'burger',
  'makloub',
  'chapati',
  'baguette',
  'pizza',
  'tacos',
  'frites',
  'brik',
  'salade',
  'plat_chaud',
  'croissant',
  'patisserie',
  'boisson',
  'surprise',
];

export const DISH_PHOTO_URLS = {
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  makloub: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
  chapati: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  baguette: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  tacos: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
  frites: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=800&q=80',
  brik: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  salade: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  plat_chaud: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  patisserie: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  boisson: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
  surprise: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
};

export const EXTRA_DISH_URLS = {
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  margherita: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
  viennoiserie: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=800&q=80',
  omelette: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
  couscous: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
  cafe: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
  tarte: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80',
};

export const CATEGORY_DEFAULT_IMAGES = {
  SANDWICH: DISH_PHOTO_URLS.baguette,
  PLAT_CHAUD: DISH_PHOTO_URLS.plat_chaud,
  PIZZA: DISH_PHOTO_URLS.pizza,
  PATISSERIE: DISH_PHOTO_URLS.patisserie,
  VIENNOISERIE: DISH_PHOTO_URLS.croissant,
  SALADE: DISH_PHOTO_URLS.salade,
  BOISSON: DISH_PHOTO_URLS.boisson,
  SNACK: DISH_PHOTO_URLS.frites,
  MIXTE: DISH_PHOTO_URLS.surprise,
};

function kw(expr) {
  return new RegExp(`(?:^|[^\\p{L}0-9])(?:${expr})(?=$|[^\\p{L}0-9])`, 'iu');
}

const KEYWORD_RULES = [
  { tag: 'burger', pattern: kw('cheeseburgers?|burgers?|smash'), url: DISH_PHOTO_URLS.burger },
  { tag: 'tacos', pattern: kw('tacos?|burritos?'), url: DISH_PHOTO_URLS.tacos },
  { tag: 'chapati', pattern: kw('chapatis?|mahdia|ml[ae]wis?'), url: DISH_PHOTO_URLS.chapati },
  { tag: 'makloub', pattern: kw('makloubs?|chawarmas?|shawarmas?|wraps?|kaskrouts?'), url: DISH_PHOTO_URLS.makloub },
  { tag: 'baguette', pattern: kw('baguettes?(?:\\s+farci(?:es?|s)?)?'), url: DISH_PHOTO_URLS.baguette },
  { tag: 'pizza', pattern: kw('margherita'), url: EXTRA_DISH_URLS.margherita },
  { tag: 'pizza', pattern: kw('pizzas?|calzones?'), url: DISH_PHOTO_URLS.pizza },
  { tag: 'brik', pattern: kw('briks?'), url: DISH_PHOTO_URLS.brik },
  { tag: 'frites', pattern: kw('frites?|fries|nuggets?|fricass[eé]e?s?'), url: DISH_PHOTO_URLS.frites },
  { tag: 'croissant', pattern: kw('croissants?'), url: DISH_PHOTO_URLS.croissant },
  { tag: 'croissant', pattern: kw('pains?\\s+au\\s+chocolat|chocolatines?|viennoiseries?|brioches?'), url: EXTRA_DISH_URLS.viennoiserie },
  { tag: 'patisserie', pattern: kw('tartes?|millefeuilles?|citron\\s+mering'), url: EXTRA_DISH_URLS.tarte },
  { tag: 'patisserie', pattern: kw('g[aâ]teaux?|gateaux?|p[aâ]tisseries?|patisseries?|cheesecakes?|baklavas?|makroudhs?|bambalounis?|[eé]clairs?|cookies?|biscuits?|desserts?|brownies?'), url: DISH_PHOTO_URLS.patisserie },
  { tag: 'salade', pattern: kw('salades?|salads?|bowls?|c[eé]sar'), url: DISH_PHOTO_URLS.salade },
  { tag: 'plat_chaud', pattern: kw('couscous|kosksi|riz'), url: EXTRA_DISH_URLS.couscous },
  { tag: 'plat_chaud', pattern: kw('p[aâ]tes|pasta|spaghettis?|lasagnes?|maqarouna|penne'), url: EXTRA_DISH_URLS.pasta },
  { tag: 'plat_chaud', pattern: kw('ojja|l[ae]bl[ae]bi|kaftejis?|plats?\\s+chauds?|tajines?|mijot[eé]s?|lasagne'), url: DISH_PHOTO_URLS.plat_chaud },
  { tag: 'frites', pattern: kw('omelettes?'), url: EXTRA_DISH_URLS.omelette },
  { tag: 'frites', pattern: kw('eggs?|oeufs?|œufs?|adham'), url: EXTRA_DISH_URLS.eggs },
  { tag: 'boisson', pattern: kw('caf[eé]s?|coffees?|espressos?|cappuccinos?|lattes?'), url: EXTRA_DISH_URLS.cafe },
  { tag: 'boisson', pattern: kw('boissons?|jus|limonades?|sodas?|smoothies?|th[eé]s?|drinks?|citronnade'), url: DISH_PHOTO_URLS.boisson },
  { tag: 'baguette', pattern: kw('sandwichs?|sandwiches|paninis?'), url: EXTRA_DISH_URLS.sandwich },
  { tag: 'surprise', pattern: kw('panier\\s*surprise|mystery\\s*box|coffrets?|assortiments?|l[eé]gendaire|mythique'), url: DISH_PHOTO_URLS.surprise },
];

export const OFFER_IMAGE_PRESETS = [
  { tag: 'burger', label: 'Burger Smash', emoji: '🍔', category: 'SANDWICH', url: DISH_PHOTO_URLS.burger },
  { tag: 'baguette', label: 'Baguette Farcie', emoji: '🥖', category: 'SANDWICH', url: DISH_PHOTO_URLS.baguette },
  { tag: 'makloub', label: 'Makloub / Wrap', emoji: '🌯', category: 'SANDWICH', url: DISH_PHOTO_URLS.makloub },
  { tag: 'chapati', label: 'Chapati Tunisien', emoji: '🫓', category: 'SANDWICH', url: DISH_PHOTO_URLS.chapati },
  { tag: 'tacos', label: 'Tacos Grillé', emoji: '🌮', category: 'SANDWICH', url: DISH_PHOTO_URLS.tacos },
  { tag: 'pizza', label: 'Pizza Artisanale', emoji: '🍕', category: 'PIZZA', url: DISH_PHOTO_URLS.pizza },
  { tag: 'brik', label: 'Brik Croustillante', emoji: '🥟', category: 'PLAT_CHAUD', url: DISH_PHOTO_URLS.brik },
  { tag: 'plat_chaud', label: 'Plat Chaud / Ojja', emoji: '🍲', category: 'PLAT_CHAUD', url: DISH_PHOTO_URLS.plat_chaud },
  { tag: 'salade', label: 'Salade Fraîche', emoji: '🥗', category: 'SALADE', url: DISH_PHOTO_URLS.salade },
  { tag: 'croissant', label: 'Croissant / Viennoiserie', emoji: '🥐', category: 'VIENNOISERIE', url: DISH_PHOTO_URLS.croissant },
  { tag: 'patisserie', label: 'Pâtisserie Fine', emoji: '🧁', category: 'PATISSERIE', url: DISH_PHOTO_URLS.patisserie },
  { tag: 'boisson', label: 'Boisson / Café', emoji: '🥤', category: 'BOISSON', url: DISH_PHOTO_URLS.boisson },
  { tag: 'frites', label: 'Frites & Snack', emoji: '🍟', category: 'SNACK', url: DISH_PHOTO_URLS.frites },
  { tag: 'surprise', label: 'Panier Surprise', emoji: '🎁', category: 'MIXTE', url: DISH_PHOTO_URLS.surprise },
];

const CATEGORY_TO_TAG = {
  SANDWICH: 'baguette',
  PLAT_CHAUD: 'plat_chaud',
  PIZZA: 'pizza',
  PATISSERIE: 'patisserie',
  VIENNOISERIE: 'croissant',
  SALADE: 'salade',
  BOISSON: 'boisson',
  SNACK: 'frites',
  MIXTE: 'surprise',
};

export function resolveDishPhotoTag({
  photoTag,
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
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(text)) {
        return rule.tag;
      }
    }
  }

  if (photoTag && DISH_PHOTO_URLS[photoTag]) {
    return photoTag;
  }

  const normalizedCat = String(category || '').toUpperCase().trim();
  if (CATEGORY_TO_TAG[normalizedCat]) {
    return CATEGORY_TO_TAG[normalizedCat];
  }

  return isSurpriseBasket ? 'surprise' : 'plat_chaud';
}

export function resolveDishPhoto({
  photoTag,
  category,
  title = '',
  rawNote = '',
  surpriseContents = '',
  description = '',
  isSurpriseBasket = false,
} = {}) {
  const candidates = [rawNote, title]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  for (const text of candidates) {
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(text)) {
        return rule.url;
      }
    }
  }

  if (photoTag && DISH_PHOTO_URLS[photoTag]) {
    return DISH_PHOTO_URLS[photoTag];
  }

  for (const text of [surpriseContents, description].map((v) => String(v || '').trim()).filter(Boolean)) {
    for (const rule of KEYWORD_RULES) {
      if (rule.pattern.test(text)) {
        return rule.url;
      }
    }
  }

  const normalizedCat = String(category || '').toUpperCase().trim();
  if (CATEGORY_DEFAULT_IMAGES[normalizedCat]) {
    return CATEGORY_DEFAULT_IMAGES[normalizedCat];
  }

  return isSurpriseBasket ? DISH_PHOTO_URLS.surprise : DISH_PHOTO_URLS.plat_chaud;
}
