// 💡 Concept & Analogie : Comme un dictionnaire officiel dans une ambassade, ce fichier centralise le vocabulaire strict et immuable du projet pour éviter que chaque partie du système n'invente ses propres termes.
// 🔄 Comparaison React / Flutter : En React (JavaScript), ces constantes sont importées directement sous forme d'objets immuables gelés (Object.freeze) ; en Flutter (Dart), elles sont traduites en `enum` fortement typés.
// 🎯 À retenir pour la soutenance : "Nous avons centralisé tous les énumérés et constantes métier dans un module partagé pour garantir une cohérence absolue entre l'API Node.js et nos deux applications clientes."

export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  MERCHANT: 'MERCHANT',
  ADMIN: 'ADMIN',
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
});

export const MERCHANT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
});

export const MERCHANT_TYPES = Object.freeze({
  RESTAURANT: 'RESTAURANT',
  CAFETERIA: 'CAFETERIA',
  BOULANGERIE: 'BOULANGERIE',
  FAST_FOOD: 'FAST_FOOD',
  PATISSERIE: 'PATISSERIE',
});

export const FILIERES = Object.freeze({
  EBUSINESS_3A: 'EBUSINESS_3A',
  FINANCE: 'FINANCE',
  MARKETING: 'MARKETING',
  GESTION: 'GESTION',
  COMPTABILITE: 'COMPTABILITE',
});

export const OFFER_CATEGORIES = Object.freeze({
  SANDWICH: 'SANDWICH',
  PLAT_CHAUD: 'PLAT_CHAUD',
  PIZZA: 'PIZZA',
  PATISSERIE: 'PATISSERIE',
  VIENNOISERIE: 'VIENNOISERIE',
  SALADE: 'SALADE',
  BOISSON: 'BOISSON',
  SNACK: 'SNACK',
  MIXTE: 'MIXTE',
});

export const PRICING_MODES = Object.freeze({
  FIXED: 'FIXED',
  DUTCH_AUCTION: 'DUTCH_AUCTION',
});

export const OFFER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SOLD_OUT: 'SOLD_OUT',
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED',
});

export const SURPRISE_RARITY = Object.freeze({
  COMMON: 'COMMON',
  RARE: 'RARE',
  LEGENDARY: 'LEGENDARY',
});

// Alias pour compatibilité transversale
export const RARITY_TIERS = SURPRISE_RARITY;

export const ORDER_STATUS = Object.freeze({
  RESERVED: 'RESERVED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  NO_SHOW: 'NO_SHOW',
});

export const PAYMENT_PROVIDERS = Object.freeze({
  KONNECT: 'KONNECT',
  REWARD: 'REWARD',
});

export const PAYMENT_STATUS = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  INITIATED: 'INITIATED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
});

export const LOYALTY_TIERS = Object.freeze({
  GRAINE: 'GRAINE',
  POUSSE: 'POUSSE',
  ARBRE: 'ARBRE',
  FORET: 'FORET',
});

export const LOYALTY_THRESHOLDS = Object.freeze({
  GRAINE: 0,
  POUSSE: 100,
  ARBRE: 300,
  FORET: 600,
});

export const REWARD_TYPES = Object.freeze({
  PERCENT_OFF: 'PERCENT_OFF',
  FREE_SURPRISE: 'FREE_SURPRISE',
});

export const REWARD_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
});

export const PICKUP_METHODS = Object.freeze({
  QR: 'QR',
  MANUAL_CODE: 'MANUAL_CODE',
});

export const ESSECT_COORDINATES = Object.freeze({
  lat: 36.7871,
  lng: 10.1748,
});

export const BUSINESS_RULES = Object.freeze({
  MAX_MERCHANT_DISTANCE_METERS: 3000,
  RESERVATION_HOLD_MINUTES: 10,
  QR_WINDOW_SECONDS: 30,
  CO2_FACTOR_PER_GRAM_FOOD: 2.5,
  CAR_CO2_GRAMS_PER_KM: 244,
  SMARTPHONE_CO2_GRAMS_PER_CHARGE: 10,
  MAX_FAILED_TICKET_ATTEMPTS: 5,
});
