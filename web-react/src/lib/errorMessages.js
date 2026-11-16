// 💡 Concept & Analogie : Comme un interprète bienveillant traduisant le jargon technique d'un rapport de vol en conseils clairs et rassurants pour les passagers.
// 🔄 Comparaison React / Flutter : En React, ce dictionnaire centralise les chaînes de caractères pour les toasts et alertes ; en Flutter, il est utilisable via une fonction helper similaire.
// 🎯 À retenir pour la soutenance : "Toutes les erreurs HTTP et codes métier (§6) sont traduits en français pédagogique afin de ne jamais laisser l'étudiant ou le commerçant face à un code cryptique."

export const ERROR_MESSAGES = {
  // Concurrence & Offres
  OFFER_SOLD_OUT: 'Désolé, cette offre vient d’être entièrement réservée par d’autres étudiants.',
  OFFER_EXPIRED: 'Cette offre est arrivée à expiration et n’est plus disponible.',
  OFFER_LOCKED: 'Un autre étudiant est en train de finaliser la réservation de ce panier. Réessayez dans quelques instants.',
  TOO_FAR: 'Ce commerce est situé à plus de 3 km de l’ESSECT Montfleury, en dehors du rayon campus autorisé.',

  // Fidélité & Récompenses
  REWARD_UNAVAILABLE: 'Ce bon de réduction n’est plus disponible ou a déjà été utilisé.',
  INSUFFICIENT_POINTS: 'Votre solde d’EcoPoints est insuffisant pour débloquer cette récompense.',

  // Sécurité & Living Ticket HMAC
  INVALID_SIGNATURE: 'Signature du QR code invalide ou corrompue. Veuillez actualiser le billet.',
  WRONG_MERCHANT: 'Ce ticket appartient à un autre commerce partenaire. Vérifiez l’adresse de retrait.',
  ALREADY_USED: 'Ce billet de retrait a déjà été validé et composté.',
  NOT_PAID: 'Cette commande n’est pas encore confirmée ou le paiement a échoué.',
  TICKET_EXPIRED: 'La fenêtre de retrait de ce Living Ticket est définitivement expirée.',
  PICKUP_WINDOW_CLOSED: 'Le créneau de retrait est désormais clos pour ce commerce.',
  TICKET_LOCKED: 'Compte temporairement verrouillé suite à 5 tentatives de scan infructueuses.',

  // Statuts & Administration
  MERCHANT_NOT_APPROVED: 'Votre boutique est actuellement en cours de revue par l’administration de l’ESSECT.',
  MERCHANT_SUSPENDED: 'Ce compte commerçant est temporairement suspendu par l’administrateur.',
  PROFILE_EXISTS: 'Un profil utilisateur existe déjà pour cette adresse universitaire.',
  ALREADY_RATED: 'Vous avez déjà évalué cette commande.',

  // Erreurs Communes HTTP
  UNAUTHORIZED: 'Session expirée ou non authentifiée. Veuillez vous reconnecter.',
  FORBIDDEN: 'Accès refusé. Vous ne disposez pas des autorisations nécessaires pour cette page.',
  NOT_FOUND: 'La ressource demandée est introuvable.',
  INVALID_PAYLOAD: 'Les données transmises sont incomplètes ou invalides.',
  RATE_LIMITED: 'Trop de requêtes successives. Veuillez patienter quelques instants.',
  INTERNAL_ERROR: 'Une erreur serveur inattendue est survenue. Nos équipes techniques sont notifiées.',
  NETWORK_ERROR: 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.',
};

/**
 * Traduit un code d'erreur API en message français compréhensible
 * @param {string} code - Code d'erreur API (ex: 'OFFER_SOLD_OUT')
 * @param {string} [fallback] - Message de secours par défaut
 * @returns {string}
 */
export function getErrorMessage(code, fallback = 'Une erreur est survenue. Veuillez réessayer.') {
  if (!code) return fallback;
  return ERROR_MESSAGES[code] || fallback;
}
