// 💡 Concept & Analogie : Catalogue d'adresses centralisé répertoriant tous les endpoints de l'API REST pour éviter les chaînes en dur dispersées.
// 🔄 Comparaison React / Flutter : Équivalent direct de `endpoints.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce dictionnaire rassemble les routes de l'API REST conformément au contrat de spécification."
// Module : Infrastructure

export const ENDPOINTS = {
  // Auth & Utilisateurs
  CHECK_AVAILABILITY: '/auth/check-availability',
  REGISTER_PROFILE: '/auth/register-profile',
  ME: '/users/me',
  USERS_ME: '/users/me',
  FCM_TOKEN: '/users/me/fcm-token',

  // Commerces
  MERCHANTS: '/merchants',
  MERCHANTS_ME: '/merchants/me',
  MERCHANT_BY_ID: (id) => `/merchants/${id}`,
  MERCHANT_OFFERS: '/merchants/me/offers',
  MERCHANT_ORDERS: '/merchants/me/orders',

  // Offres & IA
  OFFERS: Object.assign(new String('/offers'), { LIST: '/offers', toString() { return '/offers'; }, valueOf() { return '/offers'; } }),
  OFFER_BY_ID: (id) => `/offers/${id}`,
  AI_OFFER_AUTOFILL: '/ai/offer-autofill',
  UPLOAD_IMAGE: '/uploads/image',
  RADAR: '/radar',

  // Commandes & Paiements
  ORDERS: Object.assign(new String('/orders'), { CREATE: '/orders', LIST: '/orders', toString() { return '/orders'; }, valueOf() { return '/orders'; } }),
  ORDER_BY_ID: (id) => `/orders/${id}`,
  CANCEL_ORDER: (id) => `/orders/${id}/cancel`,
  GET_TICKET: (id) => `/orders/${id}/ticket`,
  RATE_ORDER: (id) => `/orders/${id}/rating`,
  INIT_PAYMENT: '/payments/konnect/init',
  VERIFY_PAYMENT: '/payments/konnect/verify',

  // Retrait & Scan
  SCAN_TICKET: '/tickets/scan',
  REDEEM_CODE: '/tickets/redeem-code',

  // Fidélité & Impact
  LOYALTY_ME: '/loyalty/me',
  IMPACT_GLOBAL: '/impact/global',
  IMPACT_FILIERES: '/impact/filieres',

  // Tableaux de bord & Admin
  DASHBOARD_STUDENT: '/dashboards/student',
  DASHBOARD_MERCHANT: '/dashboards/merchant',
  DASHBOARD_ADMIN: '/dashboards/admin',
  ADMIN_MERCHANTS: '/admin/merchants',
  ADMIN_MERCHANT_STATUS: (id) => `/admin/merchants/${id}/status`,
  ADMIN_MERCHANT_LOCATION: (id) => `/admin/merchants/${id}/location`,
  ADMIN_MERCHANT: (id) => `/admin/merchants/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_STATUS: (uid) => `/admin/users/${uid}/status`,
  ADMIN_USER: (uid) => `/admin/users/${uid}`,
  ADMIN_RESET_DEMO: '/admin/reset-demo',
  HEALTH: '/health',
};
