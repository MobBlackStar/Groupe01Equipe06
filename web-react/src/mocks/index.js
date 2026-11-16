// 💡 Concept & Analogie : Registre de données d'émulation et comptes de démonstration pour les tests en direct.
// 🔄 Comparaison React / Flutter : Permet de basculer en 1 clic vers les profils Étudiant, Commerçant et Administrateur.
// 🎯 À retenir pour la soutenance : "Ce module fournit les identifiants de démonstration pour illustrer instantanément les 3 rôles devant le jury."

import { mockMerchants } from './merchants.mock.js';
import { ROLES, FILIERES } from '@shared/constants.js';

export { mockMerchants };

export const demoAccounts = {
  student: {
    email: 'etudiant@essect.u-tunis.tn',
    password: 'CampusSave2026!',
    displayName: 'Yassine Trabelsi',
    role: ROLES.STUDENT,
    filiereId: FILIERES.EBUS,
    phone: '+21698123456',
    ecoPoints: 420,
    totalMoneySavedMillimes: 38500,
    totalCo2SavedGrams: 14200,
    totalMealsRescued: 9,
  },
  merchant: {
    email: 'commercant@baguette.tn',
    password: 'CampusSave2026!',
    displayName: 'Baguette & Baguette Montfleury',
    role: ROLES.MERCHANT,
    merchantId: 'merchant-baguette-baguette',
    phone: '+21671390111',
  },
  admin: {
    email: 'admin@campussave.essect.tn',
    password: 'CampusSave2026!',
    displayName: 'Admin ESSECT',
    role: ROLES.ADMIN,
    phone: '+21671390999',
  },
};

export const mockOffers = [
  {
    id: 'off-01',
    merchantId: 'merchant-baguette-baguette',
    merchantName: 'Baguette & Baguette Montfleury',
    title: 'Baguette Farcie Escalope Panée',
    description: 'Baguette artisanale chaude garnie d escalope panée, frites maison et fromage.',
    category: 'SANDWICH',
    pricingType: 'DUTCH',
    originalPriceMillimes: 7500,
    targetPriceMillimes: 3500,
    quantity: 4,
    remainingQuantity: 4,
    pickupStartAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    status: 'ACTIVE',
  },
  {
    id: 'off-02',
    merchantId: 'merchant-etoile-savoir',
    merchantName: "Cafétéria L'Étoile du Savoir",
    title: 'Panier Surprise Viennoiseries du Matin',
    description: 'Assortiment de 4 croissants et pains au chocolat pur beurre préparés ce matin.',
    category: 'VIENNOISERIE',
    pricingType: 'FIXED',
    originalPriceMillimes: 6000,
    targetPriceMillimes: 2500,
    quantity: 3,
    remainingQuantity: 3,
    pickupStartAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    isSurpriseBasket: true,
    status: 'ACTIVE',
  },
  {
    id: 'off-03',
    merchantId: 'merchant-le-dome',
    merchantName: 'Restaurant Le Dôme Montfleury',
    title: 'Couscous Tunisien à la Viande & Légumes',
    description: 'Plat chaud traditionnel tunisien très copieux à emporter.',
    category: 'PLAT_CHAUD',
    pricingType: 'DUTCH',
    originalPriceMillimes: 12000,
    targetPriceMillimes: 6000,
    quantity: 2,
    remainingQuantity: 2,
    pickupStartAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    status: 'ACTIVE',
  },
];

export const mockOrders = [
  {
    orderId: 'ord-mock-01',
    orderCode: 'CS-7H9KZ',
    studentId: 'student-mock-uid',
    merchantId: 'merchant-baguette-baguette',
    merchantSnapshot: {
      name: 'Baguette & Baguette Montfleury',
      location: { lat: 36.7865, lng: 10.1752 },
    },
    offerId: 'off-01',
    offerSnapshot: {
      title: 'Baguette Farcie Escalope Panée',
      category: 'SANDWICH',
      isSurpriseBasket: false,
      pickupStartAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      pickupEndAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      weightGramsPerUnit: 400,
      co2GramsPerUnit: 1000,
    },
    quantity: 1,
    pricing: {
      lockedUnitPriceMillimes: 3500,
      subtotalMillimes: 3500,
      totalMillimes: 3500,
      savedMillimes: 4000,
    },
    status: 'PAID',
    ticket: {
      version: 2,
      nonce: 'mockNonce12345678',
      windowSeconds: 30,
    },
    pickup: { failedAttempts: 0 },
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];
