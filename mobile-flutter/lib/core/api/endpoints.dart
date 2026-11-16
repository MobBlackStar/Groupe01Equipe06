// 💡 Concept & Analogie : Catalogue d'endpoints REST pour Flutter, garantissant la concordance avec le backend Node.js.
// 🔄 Comparaison React / Flutter : Miroir exact de `web-react/src/lib/endpoints.js`.
// 🎯 À retenir pour la soutenance : "Ce fichier centralise les routes de l'API REST consommées par l'application mobile."
// Module : Infrastructure Mobile

class Endpoints {
  static const String registerProfile = '/auth/register-profile';
  static const String me = '/users/me';
  static const String fcmToken = '/users/me/fcm-token';

  static const String merchants = '/merchants';
  static const String merchantsMe = '/merchants/me';
  static String merchantById(String id) => '/merchants/$id';

  static const String offers = '/offers';
  static String offerById(String id) => '/offers/$id';
  static const String radar = '/radar';

  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String cancelOrder(String id) => '/orders/$id/cancel';
  static String getTicket(String id) => '/orders/$id/ticket';
  static String rateOrder(String id) => '/orders/$id/rating';

  static const String initPayment = '/payments/konnect/init';
  static const String verifyPayment = '/payments/konnect/verify';

  static const String scanTicket = '/tickets/scan';
  static const String redeemCode = '/tickets/redeem-code';

  static const String loyaltyMe = '/loyalty/me';
  static const String impactGlobal = '/impact/global';
  static const String dashboardsStudent = '/dashboards/student';
  static const String dashboardsMerchant = '/dashboards/merchant';
}
