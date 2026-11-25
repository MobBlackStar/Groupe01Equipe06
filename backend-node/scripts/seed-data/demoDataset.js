// 💡 Concept & Analogie : Le grand livre comptable de la démonstration : toutes les valeurs (commandes, points, recettes, impact) sont calculées à partir des mêmes commandes, donc elles ne se contredisent jamais.
// 🔄 Comparaison React / Flutter : Source unique des données de démo, lue à la fois par `scripts/seed.js` (Firestore) et par `src/config/inMemoryDb.js` (mode mémoire) ; le web et le mobile affichent donc les mêmes chiffres.
// 🎯 À retenir pour la soutenance : "Chaque total (stats étudiant, stats commerçant, séries journalières, classement des filières, impact campus) est la somme exacte des commandes générées ; le CO2 vaut round(grammes × 2,5) comme dans shared/impact.js."
// Module : Scripts & Données de démonstration

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MERCHANT_STATUS,
  ROLES,
  ORDER_STATUS,
  OFFER_CATEGORIES,
  PRICING_MODES,
  RARITY_TIERS,
  REWARD_TYPES,
  REWARD_STATUS,
} from '../../../shared/constants.js';
import { getLoyaltyTier, getNextRewardMilestone } from '../../../shared/loyalty.js';
import { calculateImpact } from '../../../shared/impact.js';
import { DISH_PHOTO_URLS, resolveDishPhoto } from '../../../shared/dishPhotos.js';
import { getTunisDayKey } from '../../src/utils/tunisTime.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;
const WELCOME_BONUS_POINTS = 30; // shared/loyalty.js : bonus de première commande finalisée
const POINTS_PER_PORTION = 20;

const RAW_OFFER_TEMPLATES = [
  // Munchies & Baguette Ali Trad (4 offres : 2 Dutch, 1 Fixed, 1 Mystery Box RARE)
  {
    id: 'off-01',
    merchantId: 'merchant-baguette-baguette',
    title: 'Baguette Farcie Escalope Panée & Frites',
    category: OFFER_CATEGORIES.SANDWICH,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 7500,
    startPriceMillimes: 5000,
    floorPriceMillimes: 2500,
    quantityAvailable: 4,
    weightGrams: 400,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'baguette',
  },
  {
    id: 'off-02',
    merchantId: 'merchant-baguette-baguette',
    title: 'Makloub Chawarma Poulet Épicé',
    category: OFFER_CATEGORIES.SANDWICH,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 6800,
    discountedPriceMillimes: 3500,
    quantityAvailable: 3,
    weightGrams: 350,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'makloub',
  },
  {
    id: 'off-03',
    merchantId: 'merchant-baguette-baguette',
    title: 'Salade César Tunisienne & Poulet Grillé',
    category: OFFER_CATEGORIES.SALADE,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 5500,
    startPriceMillimes: 4000,
    floorPriceMillimes: 2200,
    quantityAvailable: 5,
    weightGrams: 300,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'salade',
  },
  {
    id: 'off-04-mystery-rare',
    merchantId: 'merchant-baguette-baguette',
    title: 'Mystery Box Salée — Spécialités Chaudes',
    category: OFFER_CATEGORIES.MIXTE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 12000,
    discountedPriceMillimes: 4500,
    quantityAvailable: 2,
    weightGrams: 600,
    isSurprise: true,
    isSurpriseBasket: true,
    rarity: RARITY_TIERS.RARE,
    photoTag: 'surprise',
    privateContents: [
      { name: 'Baguette Farcie Thon & Fromage', quantity: 1, originalPriceMillimes: 6500 },
      { name: 'Makloub Jambon Fumé', quantity: 1, originalPriceMillimes: 5500 },
    ],
  },

  // Cafétéria L'Étoile du Savoir (3 offres : 1 Surprise COMMON, 1 Fixed, 1 Dutch)
  {
    id: 'off-05-mystery-common',
    merchantId: 'merchant-etoile-savoir',
    title: 'Boîte Surprise Viennoiseries Pur Beurre',
    category: OFFER_CATEGORIES.VIENNOISERIE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 6000,
    discountedPriceMillimes: 2500,
    quantityAvailable: 4,
    weightGrams: 350,
    isSurprise: true,
    isSurpriseBasket: true,
    rarity: RARITY_TIERS.COMMON,
    photoTag: 'croissant',
    privateContents: [
      { name: 'Croissants Pur Beurre', quantity: 2, originalPriceMillimes: 3000 },
      { name: 'Pains au Chocolat Croustillants', quantity: 2, originalPriceMillimes: 3000 },
    ],
  },
  {
    id: 'off-06',
    merchantId: 'merchant-etoile-savoir',
    title: 'Chapati Tunisien Traditionnel Thon & Œuf',
    category: OFFER_CATEGORIES.SANDWICH,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 4500,
    discountedPriceMillimes: 2200,
    quantityAvailable: 6,
    weightGrams: 300,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'chapati',
  },
  {
    id: 'off-07',
    merchantId: 'merchant-etoile-savoir',
    title: 'Tacos Grillé Escalope Sauce Fromagère',
    category: OFFER_CATEGORIES.SANDWICH,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 6500,
    startPriceMillimes: 4500,
    floorPriceMillimes: 2800,
    quantityAvailable: 3,
    weightGrams: 360,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'tacos',
  },

  // Pâtisserie Mme Essid (1 offre)
  {
    id: 'off-08',
    merchantId: 'merchant-patisserie-mme-essid',
    title: 'Assortiment Gâteaux & Millefeuille Prestige (6 pcs)',
    category: OFFER_CATEGORIES.PATISSERIE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 9000,
    discountedPriceMillimes: 4200,
    quantityAvailable: 3,
    weightGrams: 400,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'patisserie',
  },

  // Restaurant Le Dôme Montfleury (3 offres : 1 Mystery Box LEGENDARY, 1 Dutch, 1 Fixed)
  {
    id: 'off-12-mystery-legendary',
    merchantId: 'merchant-le-dome',
    title: 'Grand Coffret Gastronomique de Chef (Or)',
    category: OFFER_CATEGORIES.MIXTE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 18500,
    discountedPriceMillimes: 6500,
    quantityAvailable: 1,
    weightGrams: 900,
    isSurprise: true,
    isSurpriseBasket: true,
    rarity: RARITY_TIERS.LEGENDARY,
    photoTag: 'surprise',
    privateContents: [
      { name: 'Couscous Royal Agneau & Merguez', quantity: 1, originalPriceMillimes: 10500 },
      { name: 'Ojja Royale Crevettes & Merguez', quantity: 1, originalPriceMillimes: 8000 },
    ],
  },
  {
    id: 'off-13',
    merchantId: 'merchant-le-dome',
    title: 'Couscous Tunisien à la Viande & Légumes',
    category: OFFER_CATEGORIES.PLAT_CHAUD,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 11000,
    startPriceMillimes: 6500,
    floorPriceMillimes: 4200,
    quantityAvailable: 3,
    weightGrams: 550,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'plat_chaud',
  },
  {
    id: 'off-14',
    merchantId: 'merchant-le-dome',
    title: 'Plat Ojja aux Merguez Artisanales & Œufs',
    category: OFFER_CATEGORIES.PLAT_CHAUD,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 9000,
    discountedPriceMillimes: 4500,
    quantityAvailable: 4,
    weightGrams: 450,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'plat_chaud',
  },

  // Pizzeria Bella Napoli Montfleury (2 offres)
  {
    id: 'off-16',
    merchantId: 'merchant-bella-napoli',
    title: 'Pizza Reine Champignons & Jambon 32cm',
    category: OFFER_CATEGORIES.PIZZA,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 10500,
    startPriceMillimes: 6500,
    floorPriceMillimes: 3800,
    quantityAvailable: 3,
    weightGrams: 550,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'pizza',
  },
  {
    id: 'off-17',
    merchantId: 'merchant-bella-napoli',
    title: 'Pizza Margherita Authentique Mozzarella Di Bufala',
    category: OFFER_CATEGORIES.PIZZA,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 8500,
    discountedPriceMillimes: 4200,
    quantityAvailable: 4,
    weightGrams: 500,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'pizza',
  },

  // Abdou Food Bab Jedid (2 offres : Burger Smash + Brik)
  {
    id: 'off-20',
    merchantId: 'merchant-abdou-food-bab-jedid',
    title: 'Double Cheeseburger Artisanal & Frites Fraîches',
    category: OFFER_CATEGORIES.SANDWICH,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 9500,
    discountedPriceMillimes: 4800,
    quantityAvailable: 5,
    weightGrams: 450,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'burger',
  },
  {
    id: 'off-18',
    merchantId: 'merchant-abdou-food-bab-jedid',
    title: 'Duo Brik à l’Œuf & Grande Barquette Frites',
    category: OFFER_CATEGORIES.SNACK,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 5500,
    discountedPriceMillimes: 2800,
    quantityAvailable: 4,
    weightGrams: 320,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'brik',
  },

  // Café Chez Nous Ali Trad (1 offre)
  {
    id: 'off-21',
    merchantId: 'merchant-chez-nous-ali-trad',
    title: 'Citronnade Fraîche Maison & Jus d’Orange Pressé',
    category: OFFER_CATEGORIES.BOISSON,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 4800,
    discountedPriceMillimes: 2200,
    quantityAvailable: 4,
    weightGrams: 350,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'boisson',
  },

  // Café 7Days Montfleury (1 offre)
  {
    id: 'off-22',
    merchantId: 'merchant-7days-montfleury',
    title: 'Barquette Frites Cheddar & Mini Baguette Thon',
    category: OFFER_CATEGORIES.SNACK,
    mode: PRICING_MODES.DUTCH_AUCTION,
    originalPriceMillimes: 5800,
    startPriceMillimes: 4200,
    floorPriceMillimes: 2200,
    quantityAvailable: 5,
    weightGrams: 320,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'frites',
  },

  // La Maison de l'Amandier (1 offre)
  {
    id: 'off-23',
    merchantId: 'merchant-maison-amandier',
    title: 'Assiette d’Amandes & Pâtisseries Fines',
    category: OFFER_CATEGORIES.PATISSERIE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 7000,
    discountedPriceMillimes: 3500,
    quantityAvailable: 3,
    weightGrams: 320,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'patisserie',
  },

  // Boulangerie Beb El Falla (1 offre)
  {
    id: 'off-24',
    merchantId: 'merchant-boulangerie-beb-falla',
    title: 'Lot 4 Croissants Pur Beurre & Pain Tradition',
    category: OFFER_CATEGORIES.VIENNOISERIE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 5000,
    discountedPriceMillimes: 2200,
    quantityAvailable: 6,
    weightGrams: 500,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'croissant',
  },

  // Pâtisserie Mme Abid (1 offre)
  {
    id: 'off-25',
    merchantId: 'merchant-patisserie-mme-abid',
    title: 'Plateau de Makroudh & Kaak Warka Artisanal',
    category: OFFER_CATEGORIES.PATISSERIE,
    mode: PRICING_MODES.FIXED,
    originalPriceMillimes: 6500,
    discountedPriceMillimes: 3200,
    quantityAvailable: 4,
    weightGrams: 350,
    isSurprise: false,
    isSurpriseBasket: false,
    photoTag: 'patisserie',
  },
];

/** Les 20 offres du catalogue ESSECT Montfleury avec photos 100 % exactes par plat. */
export const OFFER_TEMPLATES = RAW_OFFER_TEMPLATES.map((tpl) => ({
  ...tpl,
  imageUrl: resolveDishPhoto({
    photoTag: tpl.photoTag,
    category: tpl.category,
    title: tpl.title,
    isSurpriseBasket: tpl.isSurpriseBasket,
  }) || DISH_PHOTO_URLS[tpl.photoTag] || DISH_PHOTO_URLS.surprise,
}));

/**
 * Fin du créneau de retrait de chaque offre, en minutes après « maintenant » : certaines se terminent dans 2 h à 5 h
 * (le prix dégressif se voit baisser), les autres couvrent jusqu'à 24 h.
 */
const OFFER_END_MINUTES = [120, 180, 300, 1440, 240, 1440, 150, 1200, 300, 1440, 210, 1440, 270, 1440, 180, 960, 1440, 135, 300, 1440, 200, 270, 1440, 360, 1440];

/** Les 8 étudiants et le nombre de commandes finalisées de chacun (Yassine : 3 commandes = 90 EcoPoints, à 10 points du palier 100). */
const STUDENT_PLAN = [
  { uid: 'student-yassine', email: 'etudiant@essect.u-tunis.tn', displayName: 'Yassine Trabelsi', phone: '+21698123456', filiereId: 'EBUSINESS_3A', orders: 3, welcomeCoupon: true },
  { uid: 'student-sarah', email: 'sarah.mansour@essect.tn', displayName: 'Sarah Mansour', phone: '+21698123457', filiereId: 'EBUSINESS_3A', orders: 11 },
  { uid: 'student-ahmed', email: 'ahmed.bensalah@essect.tn', displayName: 'Ahmed Ben Salah', phone: '+21698123458', filiereId: 'FINANCE', orders: 8 },
  { uid: 'student-mariem', email: 'mariem.jaziri@essect.tn', displayName: 'Mariem Jaziri', phone: '+21698123459', filiereId: 'FINANCE', orders: 15 },
  { uid: 'student-khalil', email: 'khalil.dridi@essect.tn', displayName: 'Khalil Dridi', phone: '+21698123460', filiereId: 'MARKETING', orders: 6 },
  { uid: 'student-nour', email: 'nour.bouazizi@essect.tn', displayName: 'Nour Bouazizi', phone: '+21698123461', filiereId: 'GESTION', orders: 10 },
  { uid: 'student-aziz', email: 'aziz.gharbi@essect.tn', displayName: 'Aziz Gharbi', phone: '+21698123462', filiereId: 'GESTION', orders: 3 },
  { uid: 'student-ines', email: 'ines.khemir@essect.tn', displayName: 'Ines Khemir', phone: '+21698123463', filiereId: 'COMPTABILITE', orders: 7 },
];

const FILIERES_META = [
  { filiereId: 'EBUSINESS_3A', label: '3ème E-Business (Promotion Pilote)', studentsCount: 38 },
  { filiereId: 'FINANCE', label: 'Licence & Master Finance', studentsCount: 65 },
  { filiereId: 'MARKETING', label: 'Licence & Master Marketing', studentsCount: 52 },
  { filiereId: 'GESTION', label: 'Sciences de Gestion', studentsCount: 70 },
  { filiereId: 'COMPTABILITE', label: 'Comptabilité & CCA', studentsCount: 45 },
];

function loadMerchantsJson() {
  const raw = JSON.parse(readFileSync(join(__dirname, 'merchants.json'), 'utf8'));
  return raw.merchants || [];
}

const sum = (list, pick) => list.reduce((acc, item) => acc + pick(item), 0);

/** Prix unitaire de référence d'une offre (prix fixe, ou milieu de la courbe pour une enchère dégressive). */
function referenceUnitPrice(tpl) {
  if (tpl.mode === PRICING_MODES.DUTCH_AUCTION) {
    return Math.round((tpl.startPriceMillimes + tpl.floorPriceMillimes) / 2 / 100) * 100;
  }
  return tpl.discountedPriceMillimes;
}

/**
 * Construit tout le jeu de données de démonstration pour l'instant `nowMs`.
 * @returns {{ entries: Array<{path: string, data: object}>, summary: object }}
 */
export function buildDemoDataset(nowMs = Date.now()) {
  const now = new Date(nowMs);
  const entries = [];
  const put = (path, data) => entries.push({ path, data });

  // ---------------------------------------------------------------- commerces (base)
  const rawMerchants = loadMerchantsJson();
  const merchantStatus = (m) => (m.id === 'merchant-nice-view-bellevue' ? MERCHANT_STATUS.PENDING : m.status || MERCHANT_STATUS.APPROVED);
  const merchantById = new Map(rawMerchants.map((m) => [m.id, m]));

  // ---------------------------------------------------------------- offres
  const offers = OFFER_TEMPLATES.map((tpl, i) => {
    const merchant = merchantById.get(tpl.merchantId);
    if (!merchant) throw new Error(`Offre ${tpl.id} : commerce inconnu ${tpl.merchantId}`);
    const start = new Date(nowMs - 45 * MIN_MS);
    const end = new Date(nowMs + OFFER_END_MINUTES[i % OFFER_END_MINUTES.length] * MIN_MS);
    return { tpl, merchant, start, end, doc: null };
  });

  // ---------------------------------------------------------------- commandes finalisées (historique sur 14 jours)
  const approvedTemplates = OFFER_TEMPLATES.filter((t) => !t.isSurpriseBasket && merchantStatus(merchantById.get(t.merchantId)) === MERCHANT_STATUS.APPROVED);
  const demoStoreTemplates = approvedTemplates.filter((t) => t.merchantId === 'merchant-baguette-baguette');

  const orders = [];
  let counter = 0;
  STUDENT_PLAN.forEach((student, studentIndex) => {
    for (let j = 0; j < student.orders; j++) {
      const k = counter++;
      const tpl = k % 3 === 0 ? demoStoreTemplates[Math.floor(k / 3) % demoStoreTemplates.length] : approvedTemplates[(k * 7 + Math.floor(k / 4)) % approvedTemplates.length];
      const merchant = merchantById.get(tpl.merchantId);
      const quantity = j % 6 === 5 ? 2 : 1;
      const daysAgo = (k * 5 + 1) % 14;
      const createdAtMs = daysAgo === 0 ? nowMs - (50 + (k % 4) * 25) * MIN_MS : nowMs - daysAgo * DAY_MS - ((k % 7) + 1) * 40 * MIN_MS;
      const unit = referenceUnitPrice(tpl);
      const original = tpl.originalPriceMillimes;
      const food = calculateImpact(tpl.weightGrams * quantity);
      orders.push({
        k,
        student,
        studentIndex,
        tpl,
        merchant,
        quantity,
        createdAtMs,
        day: getTunisDayKey(createdAtMs),
        unit,
        original,
        subtotal: unit * quantity,
        discount: 0,
        rewardId: null,
        food,
        points: POINTS_PER_PORTION * quantity,
      });
    }
  });

  // chronologie par étudiant : la 1re commande reçoit le bonus de bienvenue, les récompenses se débloquent au fil des 100 points
  const rewardsByStudent = new Map();
  for (const student of STUDENT_PLAN) {
    const own = orders.filter((o) => o.student.uid === student.uid).sort((a, b) => a.createdAtMs - b.createdAtMs);
    own[0].points += WELCOME_BONUS_POINTS;
    const totalPoints = sum(own, (o) => o.points);
    const milestones = Math.floor(totalPoints / 100);
    const rewards = [];
    if (student.welcomeCoupon) {
      rewards.push({
        rewardId: 'rew-welcome-20',
        milestone: 0,
        type: REWARD_TYPES.PERCENT_OFF,
        status: REWARD_STATUS.AVAILABLE,
        percentOff: 20,
        maxDiscountMillimes: 2000,
        description: 'Coupon bienvenue étudiant -20 %',
        unlockedAt: new Date(nowMs - 5 * DAY_MS),
      });
    }
    for (let step = 1; step <= milestones; step++) {
      const isFree = (step * 100) % 300 === 0;
      const isLast = step === milestones;
      const reward = {
        rewardId: `rw_${step * 100}_${student.uid.replace('student-', '')}`,
        milestone: step * 100,
        type: isFree ? REWARD_TYPES.FREE_SURPRISE : REWARD_TYPES.PERCENT_OFF,
        status: isLast ? REWARD_STATUS.AVAILABLE : REWARD_STATUS.USED,
        ...(isFree ? {} : { percentOff: 20 }),
        maxDiscountMillimes: isFree ? 4000 : 2000,
        unlockedAt: new Date(nowMs - (milestones - step + 1) * 2 * DAY_MS),
      };
      rewards.push(reward);
    }
    // les coupons déjà utilisés correspondent à de vraies commandes remises (jamais la première)
    const used = rewards.filter((r) => r.status === REWARD_STATUS.USED && r.type === REWARD_TYPES.PERCENT_OFF);
    used.forEach((reward, idx) => {
      const target = own[own.length - 1 - idx];
      if (!target || target === own[0]) return;
      target.rewardId = reward.rewardId;
      target.discount = Math.min(Math.round(target.subtotal * 0.2), 2000);
      reward.usedOrderId = null; // renseigné plus bas, une fois les identifiants de commandes connus
      reward._orderRef = target;
    });
    rewardsByStudent.set(student.uid, { rewards, totalPoints });
  }

  // identifiants, tampons de dates, notes et documents des commandes
  orders.forEach((o, idx) => {
    o.orderId = `ord-seed-${String(idx + 1).padStart(3, '0')}`;
    o.orderCode = `CS-${(7000 + idx * 37).toString(36).toUpperCase().padStart(5, '0').slice(-5)}`;
    o.saved = (o.original - o.unit) * o.quantity + o.discount;
    o.total = o.subtotal - o.discount;
    o.stars = o.k % 2 === 0 ? [5, 4, 5, 4, 3][o.k % 5] : null;
  });
  for (const { rewards } of rewardsByStudent.values()) {
    for (const reward of rewards) {
      if (reward._orderRef) {
        reward.usedOrderId = reward._orderRef.orderId;
        delete reward._orderRef;
      }
    }
  }

  // ---------------------------------------------------------------- documents commandes
  for (const o of orders) {
    const createdAt = new Date(o.createdAtMs);
    const pickupStart = new Date(o.createdAtMs + 5 * MIN_MS);
    const pickupEnd = new Date(o.createdAtMs + 95 * MIN_MS);
    const scannedAt = new Date(o.createdAtMs + 25 * MIN_MS);
    const reward = o.rewardId ? { rewardId: o.rewardId, type: REWARD_TYPES.PERCENT_OFF, percentOff: 20, discountMillimes: o.discount } : null;
    put(`orders/${o.orderId}`, {
      orderId: o.orderId,
      orderCode: o.orderCode,
      studentId: o.student.uid,
      studentSnapshot: { uid: o.student.uid, displayName: o.student.displayName, filiereId: o.student.filiereId },
      merchantId: o.merchant.id,
      merchantSnapshot: { id: o.merchant.id, name: o.merchant.name, location: o.merchant.location || null },
      offerId: `hist-${o.tpl.id}`,
      offerSnapshot: {
        title: o.tpl.title,
        photoUrl: o.tpl.imageUrl || null,
        category: o.tpl.category,
        isSurpriseBasket: false,
        rarity: null,
        pickupStartAt: pickupStart,
        pickupEndAt: pickupEnd,
        weightGramsPerUnit: o.tpl.weightGrams,
        co2GramsPerUnit: Math.round(o.tpl.weightGrams * 2.5),
      },
      quantity: o.quantity,
      pricing: {
        mode: o.tpl.mode,
        originalUnitPriceMillimes: o.original,
        lockedUnitPriceMillimes: o.unit,
        priceLockedAt: createdAt,
        subtotalMillimes: o.subtotal,
        reward,
        totalMillimes: o.total,
        savedMillimes: o.saved,
      },
      status: ORDER_STATUS.COMPLETED,
      pickupDate: o.day,
      reservationExpiresAt: new Date(o.createdAtMs + 10 * MIN_MS),
      payment: { provider: 'KONNECT', status: 'COMPLETED', attempts: 1, paymentRef: `seed-${o.orderId}`, paidAt: new Date(o.createdAtMs + 2 * MIN_MS) },
      impact: { foodSavedGrams: o.food.foodSavedGrams, co2SavedGrams: o.food.co2SavedGrams },
      pickup: { scannedAt, scannedByUid: o.merchant.id, method: 'QR', failedAttempts: 0 },
      rewards: { pointsAwarded: o.points },
      ...(o.stars ? { rating: { stars: o.stars, comment: '', ratedAt: new Date(o.createdAtMs + 3 * 60 * MIN_MS) } } : {}),
      statusHistory: [
        { status: ORDER_STATUS.RESERVED, timestamp: createdAt, note: 'Réservation créée' },
        { status: ORDER_STATUS.PAID, timestamp: new Date(o.createdAtMs + 2 * MIN_MS), note: 'Paiement confirmé' },
        { status: ORDER_STATUS.COMPLETED, timestamp: scannedAt, note: 'Retrait validé (Scan QR rotatif)' },
      ],
      createdAt,
      updatedAt: scannedAt,
    });
  }

  // ---------------------------------------------------------------- commerces (agrégats = somme de leurs commandes)
  const merchantStats = new Map();
  for (const m of rawMerchants) {
    const own = orders.filter((o) => o.merchant.id === m.id);
    const rated = own.filter((o) => o.stars);
    const ratingSum = sum(rated, (o) => o.stars);
    const liveCount = offers.filter((x) => x.merchant.id === m.id).length;
    const histOffers = new Set(own.map((o) => o.tpl.id)).size;
    merchantStats.set(m.id, {
      stats: {
        offersPublished: liveCount + histOffers,
        ordersPaid: own.length,
        ordersCompleted: own.length,
        noShows: 0,
        revenueMillimes: sum(own, (o) => o.total),
        foodSavedGrams: sum(own, (o) => o.food.foodSavedGrams),
        co2SavedGrams: sum(own, (o) => o.food.co2SavedGrams),
        mealsRescued: sum(own, (o) => o.quantity),
      },
      ratingCount: rated.length,
      ratingSum,
      ratingAvg: rated.length ? Number((ratingSum / rated.length).toFixed(1)) : 0,
      liveCount,
    });
  }

  for (const m of rawMerchants) {
    const status = merchantStatus(m);
    const agg = merchantStats.get(m.id);
    put(`merchants/${m.id}`, {
      id: m.id,
      name: m.name,
      tradeName: m.name,
      type: m.type || 'FAST_FOOD',
      description: m.description,
      phone: m.phone || '+21671390111',
      address: m.address,
      location: m.location,
      distanceFromEssectM: m.distanceFromEssectM || 250,
      walkingMinutes: m.walkingMinutes || 3,
      status,
      statusReason: null,
      ratingAvg: agg.ratingAvg,
      ratingCount: agg.ratingCount,
      ratingSum: agg.ratingSum,
      activeOfferCount: agg.liveCount,
      totalOffersPublished: agg.stats.offersPublished,
      totalMealsSaved: agg.stats.mealsRescued,
      stats: agg.stats,
      createdAt: new Date(nowMs - 20 * DAY_MS),
      updatedAt: now,
    });
  }

  // séries journalières par commerce : exactement la somme des commandes de la journée (clé = jour de Tunis)
  const dailyByMerchant = new Map();
  for (const o of orders) {
    const key = `${o.merchant.id}|${o.day}`;
    const row = dailyByMerchant.get(key) || { merchantId: o.merchant.id, date: o.day, ordersPaid: 0, ordersCompleted: 0, revenueMillimes: 0, foodSavedGrams: 0, mealsRescued: 0 };
    row.ordersPaid += 1;
    row.ordersCompleted += 1;
    row.revenueMillimes += o.total;
    row.foodSavedGrams += o.food.foodSavedGrams;
    row.mealsRescued += o.quantity;
    dailyByMerchant.set(key, row);
  }
  for (const { merchantId, ...row } of dailyByMerchant.values()) {
    put(`merchants/${merchantId}/daily/${row.date}`, row);
  }

  // ---------------------------------------------------------------- offres (documents)
  offers.forEach(({ tpl, merchant, start, end }, i) => {
    const available = tpl.quantityAvailable;
    const unitStart = tpl.startPriceMillimes || tpl.originalPriceMillimes;
    put(`offers/${tpl.id}`, {
      id: tpl.id,
      merchantId: tpl.merchantId,
      merchantSnapshot: {
        id: merchant.id,
        name: merchant.name,
        type: merchant.type,
        phone: merchant.phone || '+21671390111',
        address: merchant.address,
        location: merchant.location,
        distanceFromEssectM: merchant.distanceFromEssectM,
        walkingMinutes: merchant.walkingMinutes,
        coverImageUrl: null,
      },
      title: tpl.title,
      description: `Offre anti-gaspillage fraîche préparée par ${merchant.name}.`,
      category: tpl.category,
      pricing: {
        mode: tpl.mode,
        originalPriceMillimes: tpl.originalPriceMillimes,
        discountedPriceMillimes: tpl.discountedPriceMillimes || tpl.startPriceMillimes,
        startPriceMillimes: unitStart,
        floorPriceMillimes: tpl.floorPriceMillimes || tpl.discountedPriceMillimes || 2000,
        decayStartAt: start,
        roundingStepMillimes: 100,
      },
      // champs à plat lus par le catalogue mobile et le radar
      pricingType: tpl.mode,
      originalPriceMillimes: tpl.originalPriceMillimes,
      targetPriceMillimes: tpl.mode === PRICING_MODES.DUTCH_AUCTION ? tpl.floorPriceMillimes : tpl.discountedPriceMillimes,
      quantity: available,
      quantityTotal: available,
      quantityAvailable: available,
      remainingQuantity: available,
      quantitySold: 0,
      hasOrders: false,
      weightGrams: tpl.weightGrams,
      co2Grams: Math.round(tpl.weightGrams * 2.5),
      pickupStartAt: start,
      pickupEndAt: end,
      pickupDate: getTunisDayKey(start),
      isSurpriseBasket: !!tpl.isSurpriseBasket,
      rarity: tpl.isSurpriseBasket ? tpl.rarity || RARITY_TIERS.COMMON : null,
      photoUrl: tpl.imageUrl || null,
      imageUrl: tpl.imageUrl || null,
      status: 'ACTIVE',
      searchKeywords: [...new Set(`${tpl.title} ${merchant.name} ${tpl.category}`.toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 1))],
      createdAt: new Date(nowMs - (i + 1) * 20 * MIN_MS),
      updatedAt: now,
    });
    if (tpl.isSurpriseBasket && tpl.privateContents) {
      put(`offers/${tpl.id}/private/contents`, {
        items: tpl.privateContents,
        note: 'Composition surprise garantie de qualité préparée ce midi.',
        createdAt: now,
      });
    }
  });

  // ---------------------------------------------------------------- étudiants (agrégats = somme de leurs commandes)
  const studentDocs = [];
  for (const student of STUDENT_PLAN) {
    const own = orders.filter((o) => o.student.uid === student.uid);
    const { rewards, totalPoints } = rewardsByStudent.get(student.uid);
    const doc = {
      uid: student.uid,
      email: student.email,
      displayName: student.displayName,
      phone: student.phone,
      role: ROLES.STUDENT,
      filiereId: student.filiereId,
      status: 'ACTIVE',
      ecoPoints: totalPoints,
      loyaltyTier: getLoyaltyTier(totalPoints),
      nextRewardAt: getNextRewardMilestone(totalPoints),
      totalMealsRescued: sum(own, (o) => o.quantity),
      unlockedRewards: rewards,
      stats: {
        ordersCompleted: own.length,
        totalSpentMillimes: sum(own, (o) => o.total),
        totalSavedMillimes: sum(own, (o) => o.saved),
        foodSavedGrams: sum(own, (o) => o.food.foodSavedGrams),
        co2SavedGrams: sum(own, (o) => o.food.co2SavedGrams),
        noShows: 0,
      },
      notificationPrefs: { email: true, push: true },
      fcmTokens: [],
      createdAt: new Date(nowMs - 15 * DAY_MS),
      updatedAt: now,
    };
    studentDocs.push(doc);
    put(`users/${student.uid}`, doc);
  }

  put('users/admin-uid', {
    uid: 'admin-uid',
    email: 'admin@campussave.tn',
    displayName: 'Administration Centrale ESSECT',
    phone: '+21671390999',
    role: ROLES.ADMIN,
    status: 'ACTIVE',
    createdAt: new Date(nowMs - 30 * DAY_MS),
    updatedAt: now,
  });

  // ---------------------------------------------------------------- 12 comptes commerçants Montfleury (symétrie 1:1)
  rawMerchants.forEach((m) => {
    const slug = m.id.replace('merchant-', '');
    const uid = m.id === 'merchant-baguette-baguette' ? 'm-baguette' : `user-merch-${slug}`;
    const email = m.id === 'merchant-baguette-baguette' ? 'commercant@baguette.tn' : `contact@${slug.replace(/-/g, '')}.tn`;
    put(`users/${uid}`, {
      uid,
      email,
      displayName: m.name,
      phone: m.phone || '+21671390111',
      role: ROLES.MERCHANT,
      merchantId: m.id,
      storeName: m.name,
      status: 'ACTIVE',
      createdAt: new Date(nowMs - 20 * DAY_MS),
      updatedAt: now,
    });
  });

  // ---------------------------------------------------------------- filières, impact global et série du campus
  const filieres = FILIERES_META.map((meta) => {
    const own = studentDocs.filter((s) => s.filiereId === meta.filiereId);
    const ownOrders = orders.filter((o) => o.student.filiereId === meta.filiereId);
    return {
      ...meta,
      ordersCompleted: ownOrders.length,
      mealsRescued: sum(ownOrders, (o) => o.quantity),
      foodSavedGrams: sum(ownOrders, (o) => o.food.foodSavedGrams),
      co2SavedGrams: sum(ownOrders, (o) => o.food.co2SavedGrams),
      ecoPointsTotal: sum(own, (s) => s.ecoPoints),
      updatedAt: now,
    };
  });
  filieres.forEach((f) => put(`filieres/${f.filiereId}`, f));

  const globalDaily = new Map();
  for (const o of orders) {
    const row = globalDaily.get(o.day) || { date: o.day, ordersCompleted: 0, mealsRescued: 0, foodSavedGrams: 0, co2SavedGrams: 0, moneySavedMillimes: 0 };
    row.ordersCompleted += 1;
    row.mealsRescued += o.quantity;
    row.foodSavedGrams += o.food.foodSavedGrams;
    row.co2SavedGrams += o.food.co2SavedGrams;
    row.moneySavedMillimes += o.saved;
    globalDaily.set(o.day, row);
  }
  for (const row of globalDaily.values()) put(`campus_impact/global/daily/${row.date}`, row);

  const merchantsParticipating = new Set(orders.map((o) => o.merchant.id)).size;
  put('campus_impact/global', {
    ordersCompleted: orders.length,
    mealsRescued: sum(orders, (o) => o.quantity),
    foodSavedGrams: sum(orders, (o) => o.food.foodSavedGrams),
    co2SavedGrams: sum(orders, (o) => o.food.co2SavedGrams),
    moneySavedMillimes: sum(orders, (o) => o.saved),
    studentsParticipating: STUDENT_PLAN.length,
    merchantsParticipating,
    updatedAt: now,
  });

  return {
    entries,
    summary: {
      merchants: rawMerchants.length,
      approvedMerchants: rawMerchants.filter((m) => merchantStatus(m) === MERCHANT_STATUS.APPROVED).length,
      offers: offers.length,
      surpriseBaskets: offers.filter((x) => x.tpl.isSurpriseBasket).length,
      students: STUDENT_PLAN.length,
      orders: orders.length,
      days: globalDaily.size,
    },
  };
}
