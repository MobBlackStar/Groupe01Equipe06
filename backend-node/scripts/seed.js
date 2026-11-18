// 💡 Concept & Analogie : Comme la répétition générale avant la première d'une pièce de théâtre, ce script installe un décor universitaire complet et immersif : commerces réels de Montfleury, offres actives à prix dégressif, paniers surprises scellés, étudiants de toutes les filières et historique de 14 jours.
// 🔄 Comparaison React / Flutter : Alimente simultanément le radar 3D WebGL, les graphiques Recharts/FlChart, et les catalogues Web & Mobile.
// 🎯 À retenir pour la soutenance : "Ce jeu de données officiel prépare la soutenance : 6 commerces (dont 1 en attente pour validation live), 20 offres, 3 raretés de paniers surprises et un étudiant à 90 EcoPoints pour débloquer un palier en direct."
// Module : Scripts & Déploiement

import { db, auth } from '../src/config/firebase.js';
import { ROLES, OFFER_CATEGORIES, PRICING_MODES, RARITY_TIERS, MERCHANT_STATUS, FILIERES } from '../../shared/constants.js';
import { readFileSync } from 'node:fs';

const merchantsData = JSON.parse(
  readFileSync(new URL('./seed-data/merchants.json', import.meta.url), 'utf8')
);

export async function runSeed() {
  console.log('🌱 [SEED] Démarrage du peuplement officiel CampusSave pour la soutenance...');

  const batch = db.batch();
  const now = new Date();
  const nowMs = now.getTime();

  // =========================================================================
  // 1. LES 6 COMMERCES DE MONTFLEURY (5 APPROUVÉS, 1 EN ATTENTE POUR LA DÉMO)
  // =========================================================================
  const rawMerchants = merchantsData.merchants || [];
  const seededMerchants = [];

  for (let i = 0; i < rawMerchants.length; i++) {
    const m = rawMerchants[i];
    // Le 6ème commerce (Fast-Food Le Phare) est laissé en PENDING pour la validation live par l'Admin !
    const status = i === 5 ? MERCHANT_STATUS.PENDING : MERCHANT_STATUS.APPROVED;

    const merchantDoc = {
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
      ratingAvg: status === MERCHANT_STATUS.APPROVED ? Number((4.3 + (i % 3) * 0.2).toFixed(1)) : 0,
      ratingCount: status === MERCHANT_STATUS.APPROVED ? 12 + i * 4 : 0,
      ratingSum: status === MERCHANT_STATUS.APPROVED ? Math.round((4.3 + (i % 3) * 0.2) * (12 + i * 4)) : 0,
      stats: {
        offersPublished: status === MERCHANT_STATUS.APPROVED ? 14 + i * 2 : 0,
        ordersPaid: status === MERCHANT_STATUS.APPROVED ? 28 + i * 5 : 0,
        ordersCompleted: status === MERCHANT_STATUS.APPROVED ? 26 + i * 5 : 0,
        noShows: status === MERCHANT_STATUS.APPROVED ? (i % 2 === 0 ? 1 : 0) : 0,
        revenueMillimes: status === MERCHANT_STATUS.APPROVED ? (26 + i * 5) * 3500 : 0,
        foodSavedGrams: status === MERCHANT_STATUS.APPROVED ? (26 + i * 5) * 400 : 0,
        co2SavedGrams: status === MERCHANT_STATUS.APPROVED ? Math.round((26 + i * 5) * 400 * 2.5) : 0,
        mealsRescued: status === MERCHANT_STATUS.APPROVED ? 26 + i * 5 : 0,
      },
      createdAt: new Date(nowMs - 20 * 24 * 3600 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    batch.set(db.collection('merchants').doc(m.id), merchantDoc);
    seededMerchants.push(merchantDoc);
  }
  console.log(`✅ 6 Commerces configurés (5 APPROVED, 1 PENDING pour la démo admin).`);

  // =========================================================================
  // 2. LES 20 OFFRES ALIMENTAIRES RÉALISTES & PANIERS MYSTÈRE
  // =========================================================================
  const offersList = [
    // Baguette & Baguette (4 offres : 2 Dutch, 1 Fixed, 1 Mystery Box RARE)
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
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-03',
      merchantId: 'merchant-baguette-baguette',
      title: 'Salade César Tunisienne & Poulet Grillé',
      category: OFFER_CATEGORIES.SALADE,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 5500,
      startPriceMillimes: 4000,
      floorPriceMillimes: 2000,
      quantityAvailable: 5,
      weightGrams: 300,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      privateContents: [
        { name: 'Baguette Farcie Thon & Fromage', quantity: 1, originalPriceMillimes: 6500 },
        { name: 'Makloub Jambon Fumé', quantity: 1, originalPriceMillimes: 5500 },
      ],
    },

    // L'Étoile du Savoir (3 offres : 1 Surprise COMMON, 1 Fixed, 1 Dutch)
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
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1604467715878-83e57e8bc129?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-07',
      merchantId: 'merchant-etoile-savoir',
      title: 'Mlewi Roulé Escalope Fromage Fondant',
      category: OFFER_CATEGORIES.SANDWICH,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 5000,
      startPriceMillimes: 3800,
      floorPriceMillimes: 1800,
      quantityAvailable: 3,
      weightGrams: 280,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    },

    // Pâtisserie Masmoudi (4 offres : 1 Fixed, 2 Dutch, 1 Snack)
    {
      id: 'off-08',
      merchantId: 'merchant-patisserie-masmoudi',
      title: 'Assortiment Gâteaux Soirée Prestige (6 pièces)',
      category: OFFER_CATEGORIES.PATISSERIE,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 9000,
      discountedPriceMillimes: 4500,
      quantityAvailable: 3,
      weightGrams: 400,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-09',
      merchantId: 'merchant-patisserie-masmoudi',
      title: 'Pâtisseries Fines Amandes & Pistaches',
      category: OFFER_CATEGORIES.PATISSERIE,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 14000,
      startPriceMillimes: 9500,
      floorPriceMillimes: 5000,
      quantityAvailable: 2,
      weightGrams: 350,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-10',
      merchantId: 'merchant-patisserie-masmoudi',
      title: 'Millefeuille Croustillant Crème Vanille',
      category: OFFER_CATEGORIES.PATISSERIE,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 3500,
      discountedPriceMillimes: 1800,
      quantityAvailable: 5,
      weightGrams: 180,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-11',
      merchantId: 'merchant-patisserie-masmoudi',
      title: 'Plateau Sablés & Makroudh Artisanal',
      category: OFFER_CATEGORIES.SNACK,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 8000,
      startPriceMillimes: 5500,
      floorPriceMillimes: 2800,
      quantityAvailable: 4,
      weightGrams: 300,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    },

    // Le Dôme Gourmand (4 offres : 1 Mystery Box LEGENDARY, 2 Plats Chauds, 1 Dutch)
    {
      id: 'off-12-mystery-legendary',
      merchantId: 'merchant-le-dome',
      title: 'Grand Coffret Gastronomique de Chef (Or)',
      category: OFFER_CATEGORIES.MIXTE,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 25000,
      discountedPriceMillimes: 8000,
      quantityAvailable: 1,
      weightGrams: 900,
      isSurprise: true,
      isSurpriseBasket: true,
      rarity: RARITY_TIERS.LEGENDARY,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      privateContents: [
        { name: 'Couscous Royal Agneau & Merguez', quantity: 1, originalPriceMillimes: 14000 },
        { name: 'Ojja Royale Crevettes & Merguez', quantity: 1, originalPriceMillimes: 8000 },
        { name: 'Dessert Assida Zgougou Festive', quantity: 1, originalPriceMillimes: 3000 },
      ],
    },
    {
      id: 'off-13',
      merchantId: 'merchant-le-dome',
      title: 'Couscous Tunisien à la Viande & Légumes',
      category: OFFER_CATEGORIES.PLAT_CHAUD,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 12000,
      startPriceMillimes: 8000,
      floorPriceMillimes: 4500,
      quantityAvailable: 3,
      weightGrams: 550,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-14',
      merchantId: 'merchant-le-dome',
      title: 'Plat Ojja aux Merguez Artisanales & Œufs',
      category: OFFER_CATEGORIES.PLAT_CHAUD,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 9500,
      discountedPriceMillimes: 4800,
      quantityAvailable: 4,
      weightGrams: 450,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-15',
      merchantId: 'merchant-le-dome',
      title: 'Riz Djerbien Cuit à la Vapeur aux Légumes',
      category: OFFER_CATEGORIES.PLAT_CHAUD,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 8500,
      startPriceMillimes: 6000,
      floorPriceMillimes: 3200,
      quantityAvailable: 4,
      weightGrams: 450,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    },

    // Pizzeria Bella Napoli (4 offres : 3 Pizzas, 1 Boisson/Snack)
    {
      id: 'off-16',
      merchantId: 'merchant-bella-napoli',
      title: 'Pizza Reine Champignons & Jambon 32cm',
      category: OFFER_CATEGORIES.PIZZA,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 11000,
      startPriceMillimes: 7500,
      floorPriceMillimes: 4000,
      quantityAvailable: 3,
      weightGrams: 550,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-18',
      merchantId: 'merchant-bella-napoli',
      title: 'Pizza 4 Fromages Crémeuse Italienne',
      category: OFFER_CATEGORIES.PIZZA,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 12500,
      discountedPriceMillimes: 6000,
      quantityAvailable: 2,
      weightGrams: 550,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'off-19',
      merchantId: 'merchant-bella-napoli',
      title: 'Calzone Soufflé Mozzarella, Ricotta & Thon',
      category: OFFER_CATEGORIES.PIZZA,
      mode: PRICING_MODES.DUTCH_AUCTION,
      originalPriceMillimes: 9500,
      startPriceMillimes: 6800,
      floorPriceMillimes: 3500,
      quantityAvailable: 3,
      weightGrams: 480,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    },

    // Fast-Food Le Phare (1 offre prête pour son activation post-approbation)
    {
      id: 'off-20',
      merchantId: 'merchant-fastfood-le-phare',
      title: 'Double Cheeseburger Artisanal & Frites Fraîches',
      category: OFFER_CATEGORIES.SANDWICH,
      mode: PRICING_MODES.FIXED,
      originalPriceMillimes: 9500,
      discountedPriceMillimes: 4800,
      quantityAvailable: 5,
      weightGrams: 450,
      isSurprise: false,
      isSurpriseBasket: false,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Enregistrement des 20 offres dans le batch Firestore
  for (const off of offersList) {
    const merchant = seededMerchants.find((m) => m.id === off.merchantId) || seededMerchants[0];

    // Horodatages calés dynamiquement : début il y a 45 min, fin dans 24h (garantit des offres actives en continu pendant les tests)
    const pickupStartAt = new Date(nowMs - 45 * 60 * 1000).toISOString();
    const pickupEndAt = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
    const decayStartAt = new Date(nowMs - 15 * 60 * 1000).toISOString();

    const offerDoc = {
      id: off.id,
      merchantId: off.merchantId,
      merchantSnapshot: {
        id: merchant.id,
        name: merchant.tradeName,
        phone: merchant.phone,
        address: merchant.address,
        location: merchant.location,
        distanceFromEssectM: merchant.distanceFromEssectM,
        walkingMinutes: merchant.walkingMinutes,
      },
      title: off.title,
      description: `Offre anti-gaspillage fraîche préparée par ${merchant.tradeName}.`,
      category: off.category,
      mode: off.mode,
      originalPriceMillimes: off.originalPriceMillimes,
      discountedPriceMillimes: off.discountedPriceMillimes || off.startPriceMillimes,
      pricing: {
        mode: off.mode,
        originalPriceMillimes: off.originalPriceMillimes,
        discountedPriceMillimes: off.discountedPriceMillimes || off.startPriceMillimes,
        startPriceMillimes: off.startPriceMillimes || off.originalPriceMillimes,
        floorPriceMillimes: off.floorPriceMillimes || off.discountedPriceMillimes || 2000,
        decayStartAt,
        roundingStepMillimes: 100,
      },
      quantity: off.quantityAvailable + 2,
      quantityAvailable: off.quantityAvailable,
      quantitySold: 2,
      weightGrams: off.weightGrams,
      co2Grams: Math.round(off.weightGrams * 2.5),
      pickupStartAt,
      pickupEndAt,
      isSurprise: off.isSurprise || false,
      isSurpriseBasket: off.isSurpriseBasket || false,
      rarity: off.rarity || RARITY_TIERS.COMMON,
      imageUrl: off.imageUrl || null,
      status: 'ACTIVE',
      searchKeywords: off.title.toLowerCase().split(/\s+/).filter(Boolean),
      createdAt: new Date(nowMs - 2 * 3600 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    batch.set(db.collection('offers').doc(off.id), offerDoc);

    // Si c'est un panier surprise, enregistrement du document confidentiel offers/{id}/private/contents
    if (off.isSurpriseBasket && off.privateContents) {
      batch.set(
        db.collection('offers').doc(off.id).collection('private').doc('contents'),
        {
          items: off.privateContents,
          note: 'Composition surprise garantie de qualité préparée ce midi.',
          updatedAt: now.toISOString(),
        }
      );
    }
  }
  console.log(`✅ 20 Offres réalistes enregistrées (avec 3 paniers surprises scellés COMMON, RARE, LEGENDARY).`);

  // =========================================================================
  // 3. LES 8 COMPTES ÉTUDIANTS RÉPARTIS SUR LES 5 FILIÈRES ESSECT
  // =========================================================================
  const studentsList = [
    // Étudiant de démo officiel : 90 EcoPoints (1 commande de 20 pts suffit pour débloquer le palier 100 pts !)
    {
      uid: 'student-demo-uid',
      email: 'etudiant@essect.u-tunis.tn',
      displayName: 'Yassine Trabelsi',
      phone: '+21698123456',
      filiereId: 'EBUSINESS_3A',
      ecoPoints: 90,
      loyaltyTier: 'GRAINE',
      nextRewardAt: 100,
      totalMealsRescued: 4,
      unlockedRewards: [
        {
          id: 'rew-welcome-20',
          type: 'PERCENT_OFF',
          discountPercent: 20,
          maxDiscountMillimes: 2000,
          description: 'Coupon Bienvenue Étudiant -20%',
          status: 'AVAILABLE',
          unlockedAt: new Date(nowMs - 5 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      stats: {
        ordersCompleted: 4,
        totalSpentMillimes: 14500,
        totalSavedMillimes: 18000,
        foodSavedGrams: 1600,
        co2SavedGrams: 4000,
        noShows: 0,
      },
    },
    {
      uid: 'student-sarah',
      email: 'sarah.mansour@essect.tn',
      displayName: 'Sarah Mansour',
      phone: '+21698123457',
      filiereId: 'EBUSINESS_3A',
      ecoPoints: 240,
      loyaltyTier: 'POUSSE',
      nextRewardAt: 300,
      totalMealsRescued: 11,
      stats: { ordersCompleted: 11, totalSpentMillimes: 38000, totalSavedMillimes: 45000, foodSavedGrams: 4400, co2SavedGrams: 11000, noShows: 0 },
    },
    {
      uid: 'student-ahmed',
      email: 'ahmed.bensalah@essect.tn',
      displayName: 'Ahmed Ben Salah',
      phone: '+21698123458',
      filiereId: 'FINANCE',
      ecoPoints: 180,
      loyaltyTier: 'POUSSE',
      nextRewardAt: 200,
      totalMealsRescued: 8,
      stats: { ordersCompleted: 8, totalSpentMillimes: 28000, totalSavedMillimes: 32000, foodSavedGrams: 3200, co2SavedGrams: 8000, noShows: 0 },
    },
    {
      uid: 'student-mariem',
      email: 'mariem.jaziri@essect.tn',
      displayName: 'Mariem Jaziri',
      phone: '+21698123459',
      filiereId: 'FINANCE',
      ecoPoints: 340,
      loyaltyTier: 'ARBRE',
      nextRewardAt: 400,
      totalMealsRescued: 15,
      stats: { ordersCompleted: 15, totalSpentMillimes: 52000, totalSavedMillimes: 64000, foodSavedGrams: 6000, co2SavedGrams: 15000, noShows: 0 },
    },
    {
      uid: 'student-khalil',
      email: 'khalil.dridi@essect.tn',
      displayName: 'Khalil Dridi',
      phone: '+21698123460',
      filiereId: 'MARKETING',
      ecoPoints: 120,
      loyaltyTier: 'POUSSE',
      nextRewardAt: 200,
      totalMealsRescued: 6,
      stats: { ordersCompleted: 6, totalSpentMillimes: 21000, totalSavedMillimes: 26000, foodSavedGrams: 2400, co2SavedGrams: 6000, noShows: 0 },
    },
    {
      uid: 'student-nour',
      email: 'nour.bouazizi@essect.tn',
      displayName: 'Nour Bouazizi',
      phone: '+21698123461',
      filiereId: 'GESTION',
      ecoPoints: 210,
      loyaltyTier: 'POUSSE',
      nextRewardAt: 300,
      totalMealsRescued: 10,
      stats: { ordersCompleted: 10, totalSpentMillimes: 35000, totalSavedMillimes: 42000, foodSavedGrams: 4000, co2SavedGrams: 10000, noShows: 0 },
    },
    {
      uid: 'student-aziz',
      email: 'aziz.gharbi@essect.tn',
      displayName: 'Aziz Gharbi',
      phone: '+21698123462',
      filiereId: 'GESTION',
      ecoPoints: 70,
      loyaltyTier: 'GRAINE',
      nextRewardAt: 100,
      totalMealsRescued: 3,
      stats: { ordersCompleted: 3, totalSpentMillimes: 11000, totalSavedMillimes: 13500, foodSavedGrams: 1200, co2SavedGrams: 3000, noShows: 0 },
    },
    {
      uid: 'student-ines',
      email: 'ines.khemir@essect.tn',
      displayName: 'Ines Khemir',
      phone: '+21698123463',
      filiereId: 'COMPTABILITE',
      ecoPoints: 160,
      loyaltyTier: 'POUSSE',
      nextRewardAt: 200,
      totalMealsRescued: 7,
      stats: { ordersCompleted: 7, totalSpentMillimes: 24000, totalSavedMillimes: 30000, foodSavedGrams: 2800, co2SavedGrams: 7000, noShows: 0 },
    },
  ];

  for (const s of studentsList) {
    const studentDoc = {
      uid: s.uid,
      email: s.email,
      displayName: s.displayName,
      phone: s.phone,
      role: ROLES.STUDENT,
      filiereId: s.filiereId,
      ecoPoints: s.ecoPoints,
      loyaltyTier: s.loyaltyTier,
      nextRewardAt: s.nextRewardAt,
      totalMealsRescued: s.totalMealsRescued,
      unlockedRewards: s.unlockedRewards || [],
      stats: s.stats,
      fcmTokens: [],
      createdAt: new Date(nowMs - 15 * 24 * 3600 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };
    batch.set(db.collection('users').doc(s.uid), studentDoc);
  }
  console.log(`✅ 8 Comptes étudiants créés sur les 5 filières (Yassine calé à 90 EcoPoints).`);

  // =========================================================================
  // 4. COMPTE ADMINISTRATEUR UNIQUE
  // =========================================================================
  const adminDoc = {
    uid: 'admin-uid',
    email: 'admin@campussave.tn',
    displayName: 'Administration Centrale ESSECT',
    phone: '+21671390999',
    role: ROLES.ADMIN,
    createdAt: new Date(nowMs - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  };
  batch.set(db.collection('users').doc('admin-uid'), adminDoc);
  console.log(`✅ 1 Compte administrateur validé (admin@campussave.tn).`);

  // =========================================================================
  // 5. LES 5 FILIÈRES ESSECT & STATISTIQUES GLOBALES D'IMPACT
  // =========================================================================
  const filieresData = [
    { filiereId: 'EBUSINESS_3A', label: '3ème E-Business (Promotion Pilote)', studentsCount: 38, ordersCompleted: 45, mealsRescued: 52, foodSavedGrams: 20800, co2SavedGrams: 52000, ecoPointsTotal: 1240 },
    { filiereId: 'FINANCE', label: 'Licence & Master Finance', studentsCount: 65, ordersCompleted: 34, mealsRescued: 39, foodSavedGrams: 15600, co2SavedGrams: 39000, ecoPointsTotal: 920 },
    { filiereId: 'MARKETING', label: 'Licence & Master Marketing', studentsCount: 52, ordersCompleted: 28, mealsRescued: 31, foodSavedGrams: 12400, co2SavedGrams: 31000, ecoPointsTotal: 760 },
    { filiereId: 'GESTION', label: 'Sciences de Gestion', studentsCount: 70, ordersCompleted: 22, mealsRescued: 25, foodSavedGrams: 10000, co2SavedGrams: 25000, ecoPointsTotal: 580 },
    { filiereId: 'COMPTABILITE', label: 'Comptabilité & CCA', studentsCount: 45, ordersCompleted: 18, mealsRescued: 20, foodSavedGrams: 8000, co2SavedGrams: 20000, ecoPointsTotal: 490 },
  ];

  for (const f of filieresData) {
    batch.set(db.collection('filieres').doc(f.filiereId), { ...f, updatedAt: now.toISOString() });
  }

  // 14 jours de séries historiques (merchants daily et campus_impact/global/daily)
  for (let d = 13; d >= 0; d--) {
    const dayDate = new Date(nowMs - d * 24 * 3600 * 1000);
    const isoDate = dayDate.toISOString().split('T')[0];
    const dayOrders = 10 + (d % 5) * 2;
    const dayMeals = dayOrders + 2;
    const dayFoodGrams = dayMeals * 400;
    const dayCo2 = Math.round(dayFoodGrams * 2.5);
    const dayMoney = dayOrders * 3500;

    // Daily global impact
    batch.set(
      db.collection('campus_impact').doc('global').collection('daily').doc(isoDate),
      {
        date: isoDate,
        ordersCompleted: dayOrders,
        mealsRescued: dayMeals,
        foodSavedGrams: dayFoodGrams,
        co2SavedGrams: dayCo2,
        moneySavedMillimes: dayMoney,
      }
    );

    // Daily buckets for each approved merchant
    for (const m of seededMerchants.slice(0, 5)) {
      batch.set(
        db.collection('merchants').doc(m.id).collection('daily').doc(isoDate),
        {
          date: isoDate,
          revenueMillimes: Math.round(dayMoney / 5),
          ordersCompleted: Math.round(dayOrders / 5),
          mealsRescued: Math.round(dayMeals / 5),
          foodSavedGrams: Math.round(dayFoodGrams / 5),
        }
      );
    }
  }

  // Global impact document
  batch.set(db.collection('campus_impact').doc('global'), {
    ordersCompleted: 248,
    mealsRescued: 285,
    foodSavedGrams: 114000,
    co2SavedGrams: 285000,
    moneySavedMillimes: 890000,
    studentsParticipating: 8,
    merchantsParticipating: 5,
    updatedAt: now.toISOString(),
  });

  console.log(`✅ 14 Jours de séries historiques et agrégations campus/filières configurés.`);

  // Validation atomique du batch dans Firestore
  await batch.commit();
  console.log('🌟 [SEED TERMINÉ] Base Firestore initialisée avec succès !');
}

// Exécution directe si invoqué en CLI
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Échec du seed :', err);
      process.exit(1);
    });
}
