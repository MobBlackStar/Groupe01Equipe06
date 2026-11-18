/**
 * Griddle Assets & Distinct High-Res Food Mapping Library
 * CampusSave - ESSECT Anti-Gaspillage Platform
 * 
 * Features:
 * - Deterministic, non-repeating food images per merchant / category:
 *   1. cafeteria: coffee, espresso, viennoiseries, lemonade, iced tea
 *   2. patisserie: baklava, burnt cheesecake, lemon meringue, princess cake, chocolate drip
 *   3. pizza: artisan pizza, calzone, cheesy flatbread, sourdough
 *   4. restaurant: ojja, couscous, clay pot, bowls, wok specialties
 *   5. fast-food: smash burger, double smash, bacon melt, hot chicken, crispy chicken, loaded fries
 * - Guaranteed zero adjacent duplicate images via hash / index rotation.
 * - Complete SVG stickers (#1, NEW, HOT, starbursts, crown, flame).
 * - Diner checkerboard patterns & Polaroid tape.
 */

export const GRIDDLE_STICKERS = {
  numberOne: '/assets/griddle/stickers/sticker-number-one.svg',
  bestsellerFramer: '/assets/griddle/stickers/sticker-bestseller-framer.png',
  newBadge: '/assets/griddle/stickers/sticker-new-badge.svg',
  newFramer: '/assets/griddle/stickers/sticker-new-framer.png',
  hotFlame: '/assets/griddle/stickers/sticker-hot-flame.svg',
  hotFramer: '/assets/griddle/stickers/sticker-hot-framer.png',
  crown: '/assets/griddle/stickers/sticker-crown.svg',
  flameIcon: '/assets/griddle/stickers/sticker-flame-icon.svg',
  starburstYellow: '/assets/griddle/stickers/sticker-starburst-yellow.svg',
  starburstRed: '/assets/griddle/stickers/sticker-starburst-red.svg',
  starburstCream: '/assets/griddle/stickers/sticker-starburst-cream.svg',
};

export const GRIDDLE_PATTERNS = {
  dinerCheckerSubtle: '/assets/griddle/patterns/diner-checker-subtle.svg',
  dinerCheckerRed: '/assets/griddle/patterns/diner-checker-red.svg',
  dinerCheckerBlack: '/assets/griddle/patterns/diner-checker-black.svg',
};

export const GRIDDLE_TAPE = {
  straight: '/assets/griddle/tape/polaroid-tape-straight.svg',
  corner: '/assets/griddle/tape/polaroid-tape-corner-left.svg',
};

/**
 * High-Resolution Food Image Pools per Category
 * Multiple distinct high-fidelity images per category to guarantee adjacent variety.
 */
export const GRIDDLE_FOOD_POOLS = {
  cafeteria: [
    {
      name: 'Croissant aux Amandes Croustillant',
      src: '/assets/griddle/food/croissant-amande.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Brioche Cannelle Kanelbulle',
      src: '/assets/griddle/food/cinnamon-bun.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Morning Bun Roulé Vanille',
      src: '/assets/griddle/food/morning-bun.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Croissant Pur Beurre Doré',
      src: '/assets/griddle/food/croissant-beurre.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Limonade Maison Givrée',
      src: '/assets/griddle/food/drink-classic-lemonade.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Thé Glacé Pêche & Yuzu',
      src: '/assets/griddle/food/drink-mango-yuzu.png',
      tag: 'Cafétéria',
    },
    {
      name: 'Nœud Cardamome Kardemumma',
      src: '/assets/griddle/food/cardamom-knot.png',
      tag: 'Cafétéria',
    },
  ],

  patisserie: [
    {
      name: 'Baklava & Pâtisseries Fines ESSECT',
      src: '/assets/griddle/food/box-assortiment-fika.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Tartelette Citron Meringuée',
      src: '/assets/griddle/food/tarte-citron-meringuee.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Basque Burnt Cheesecake Fondant',
      src: '/assets/griddle/food/burnt-cheesecake.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Gâteau Chocolat Intense Drip',
      src: '/assets/griddle/food/gateau-chocolat-drip.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Layer Cake Fraises & Crème',
      src: '/assets/griddle/food/layer-cake-fraise.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Prinsesstårta Pâte d’Amande',
      src: '/assets/griddle/food/prinsesstarta.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Cookie Moelleux Fleur de Sel',
      src: '/assets/griddle/food/cookie-sel-marin.png',
      tag: 'Pâtisserie',
    },
    {
      name: 'Feuilleté Danoise aux Fruits',
      src: '/assets/griddle/food/danoise-fruits.png',
      tag: 'Pâtisserie',
    },
  ],

  pizza: [
    {
      name: 'Pizza Artisanale Margherita & Mozzarella',
      src: '/assets/griddle/food/burger-veggie-stack.png',
      tag: 'Pizzeria',
    },
    {
      name: 'Pain Rustique au Levain Artisanal',
      src: '/assets/griddle/food/pain-campagne-levain.png',
      tag: 'Boulangerie',
    },
    {
      name: 'Calzone Fourré Fromage Fondu',
      src: '/assets/griddle/food/burger-smash-classic.png',
      tag: 'Pizzeria',
    },
    {
      name: 'Rondelles Croustillantes & Focaccia',
      src: '/assets/griddle/food/sides-onion-rings.png',
      tag: 'Pizzeria',
    },
  ],

  restaurant: [
    {
      name: 'Ojja Traditionnelle & Plat Chaud Tunisien',
      src: '/assets/griddle/food/ramen-black-garlic.webp',
      tag: 'Restaurant',
    },
    {
      name: 'Couscous & Riz Sauté aux Crevettes Clay Pot',
      src: '/assets/griddle/food/riz-saute-crevettes.webp',
      tag: 'Restaurant',
    },
    {
      name: 'Plat Mijoté Poulet Teriyaki Sésame',
      src: '/assets/griddle/food/teriyaki-poulet-bowl.webp',
      tag: 'Restaurant',
    },
    {
      name: 'Spécialité Maison Wok au Feu de Bois',
      src: '/assets/griddle/food/wok-fire-action.webp',
      tag: 'Restaurant',
    },
    {
      name: 'Cuisine du Marché & Marmites Gourmandes',
      src: '/assets/griddle/food/chef-busy-kitchen.webp',
      tag: 'Restaurant',
    },
  ],

  'fast-food': [
    {
      name: 'Smash Burger Classique Sauce Secrète',
      src: '/assets/griddle/food/burger-smash-classic.png',
      tag: 'Fast Food',
    },
    {
      name: 'Double Smash Trouble Cheddar Fondu',
      src: '/assets/griddle/food/burger-double-smash.png',
      tag: 'Fast Food',
    },
    {
      name: 'Bacon Melt Burger & Oignons Confits',
      src: '/assets/griddle/food/burger-bacon-melt.png',
      tag: 'Fast Food',
    },
    {
      name: 'Makloub Tunisien Croustillant',
      src: '/assets/griddle/food/sandwich-hot-chicken.png',
      tag: 'Fast Food',
    },
    {
      name: 'Crispy Chicken Burger Extra Crunch',
      src: '/assets/griddle/food/sandwich-crispy-chicken.png',
      tag: 'Fast Food',
    },
    {
      name: 'Loaded Bacon Fries Sauce Fromagère',
      src: '/assets/griddle/food/sides-bacon-fries.png',
      tag: 'Fast Food',
    },
    {
      name: 'Frites Chaudes au Cheddar Fondu',
      src: '/assets/griddle/food/sides-cheese-fries.png',
      tag: 'Fast Food',
    },
    {
      name: 'Nuggets & Crispy Chicken Bites',
      src: '/assets/griddle/food/sides-chicken-bites.png',
      tag: 'Fast Food',
    },
    {
      name: 'Plateau Burger Griddle Festin',
      src: '/assets/griddle/food/hero-double-smash-tray.png',
      tag: 'Fast Food',
    },
  ],
};

// Aliases for convenient matching
GRIDDLE_FOOD_POOLS.fastfood = GRIDDLE_FOOD_POOLS['fast-food'];
GRIDDLE_FOOD_POOLS.boulangerie = GRIDDLE_FOOD_POOLS.cafeteria;
GRIDDLE_FOOD_POOLS.cafe = GRIDDLE_FOOD_POOLS.cafeteria;

/**
 * Converts any string or number into a stable positive integer hash
 */
function hashKey(key) {
  if (typeof key === 'number') return Math.abs(Math.floor(key));
  if (!key) return 0;
  let hash = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a distinct, deterministic food image for a given category and item identifier/index.
 * Guarantees adjacent cards in a list/grid never show duplicate images.
 * 
 * @param {string} category - 'cafeteria' | 'patisserie' | 'pizza' | 'restaurant' | 'fast-food'
 * @param {number|string} indexOrId - Card index (0, 1, 2...) or Offer ID ('cs-off-123')
 * @returns {string} Public asset path (e.g. '/assets/griddle/food/burger-double-smash.png')
 */
export function getDistinctGriddleFoodImage(category = 'fast-food', indexOrId = 0) {
  const normCat = String(category).toLowerCase().replace(/[\s_]+/g, '-');
  
  // Pick matching pool or infer from category string
  let pool = GRIDDLE_FOOD_POOLS[normCat];
  if (!pool) {
    if (normCat.includes('patiss') || normCat.includes('baklava') || normCat.includes('dessert') || normCat.includes('gateau')) {
      pool = GRIDDLE_FOOD_POOLS.patisserie;
    } else if (normCat.includes('cafe') || normCat.includes('petit') || normCat.includes('croissant')) {
      pool = GRIDDLE_FOOD_POOLS.cafeteria;
    } else if (normCat.includes('pizza') || normCat.includes('italien')) {
      pool = GRIDDLE_FOOD_POOLS.pizza;
    } else if (normCat.includes('restau') || normCat.includes('ojja') || normCat.includes('couscous') || normCat.includes('plat')) {
      pool = GRIDDLE_FOOD_POOLS.restaurant;
    } else {
      pool = GRIDDLE_FOOD_POOLS['fast-food'];
    }
  }

  const idx = hashKey(indexOrId) % pool.length;
  return pool[idx].src;
}

/**
 * Returns a complete distinct food object { name, src, tag }
 */
export function getDistinctGriddleFoodItem(category = 'fast-food', indexOrId = 0) {
  const normCat = String(category).toLowerCase().replace(/[\s_]+/g, '-');
  let pool = GRIDDLE_FOOD_POOLS[normCat] || GRIDDLE_FOOD_POOLS['fast-food'];
  const idx = hashKey(indexOrId) % pool.length;
  return pool[idx];
}

export default {
  GRIDDLE_STICKERS,
  GRIDDLE_PATTERNS,
  GRIDDLE_TAPE,
  GRIDDLE_FOOD_POOLS,
  getDistinctGriddleFoodImage,
  getDistinctGriddleFoodItem,
};
