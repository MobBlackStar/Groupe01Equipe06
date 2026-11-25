// 💡 Concept & Analogie : Comme un central d'annonces qui diffuse des messages personnalisés aux bonnes personnes au bon moment, ce service orchestre les notifications push vers les applications Web et Mobile.
// 🔄 Comparaison React / Flutter : Les alertes sont reçues côté Web par le Service Worker `firebase-messaging-sw.js` et côté Mobile par `fcm_service.dart`.
// 🎯 À retenir pour la soutenance : "Toutes les notifications FCM sont expédiées après le commit réussi des transactions (zéro blocage métier) et les jetons invalides sont automatiquement purgés de Firestore."
// Module : Notifications & Messagerie Événementielle

import { messaging, db, isFirebaseConfigured } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';
import pkg from 'firebase-admin';
const { firestore } = pkg;

/** Canal Android « haute importance » (créé côté application) : sans lui, Android 8+ n'affiche pas la bannière flottante. */
export const ANDROID_CHANNEL_ID = 'campussave_high_importance';

/** Page ouverte au toucher de la notification (web) et route lue par l'application mobile. */
const ROUTE_BY_TYPE = {
  ORDER_PAID: '/merchant/orders',
  TICKET_READY: '/app/orders',
  ORDER_COMPLETED: '/app/orders',
  PICKUP_REMINDER: '/app/orders',
  REWARD_UNLOCKED: '/app/loyalty',
  MERCHANT_STATUS: '/merchant/store',
  NEW_OFFER: '/app/explore',
  TEST: '/profile',
};

/**
 * Message FCM complet : notification commune + options Android (priorité haute, canal, son), Web Push et iOS.
 * Les valeurs de `data` sont forcées en chaînes (exigence FCM).
 */
export function buildFcmMessage({ title, body, data = {} }) {
  const type = String(data.type || 'GENERIC');
  const stringData = Object.fromEntries(Object.entries({ ...data, route: data.route || ROUTE_BY_TYPE[type] || '/' }).map(([k, v]) => [k, String(v)]));
  const webLink = `${(process.env.WEB_APP_URL || '').replace(/\/$/, '')}${stringData.route}`;
  return {
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        channelId: ANDROID_CHANNEL_ID,
        icon: 'ic_stat_campussave',
        color: '#DA0711',
        imageUrl: 'https://campussave-rouge.vercel.app/assets/brand/mascot-sticker.png',
        sound: 'default',
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public',
      },
    },
    webpush: {
      headers: { Urgency: 'high', TTL: '86400' },
      notification: { icon: '/favicon.png', badge: '/favicon-32x32.png', image: '/assets/brand/mascot-sticker.png', tag: type, renotify: true },
      ...(webLink.startsWith('http') ? { fcmOptions: { link: webLink } } : {}),
    },
    apns: { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } },
  };
}

// Cache en mémoire pour le bridage anti-spam du topic new-offers (max 1 notification par commerçant par heure)
const topicThrottleCache = new Map();

export class FcmService {
  /**
   * Envoie une notification à une liste de jetons avec élagage automatique des jetons périmés.
   * @param {string[]} tokens - Liste des jetons FCM
   * @param {object} payload - { title, body, data }
   * @param {string|null} userId - Identifiant de l'utilisateur pour purger les jetons morts
   * @returns {Promise<{ tokensCount: number, sentCount: number, failedCount: number, errors: Array<{token: string, code: string}> }>}
   */
  async sendToTokens(tokens, { title, body, data = {} }, userId = null) {
    const result = { tokensCount: 0, sentCount: 0, failedCount: 0, errors: [] };
    if (!tokens || tokens.length === 0) return result;

    try {
      // Filtrer les doublons éventuels
      const uniqueTokens = [...new Set(tokens.filter(Boolean))];
      result.tokensCount = uniqueTokens.length;
      if (uniqueTokens.length === 0) return result;

      const response = await messaging.sendEachForMulticast({
        tokens: uniqueTokens,
        ...buildFcmMessage({ title, body, data }),
      });
      result.sentCount = response.successCount;
      result.failedCount = response.failureCount;
      response.responses.forEach((resp, idx) => {
        if (!resp.success) result.errors.push({ token: `${uniqueTokens[idx].slice(0, 12)}…`, code: resp.error?.code || 'unknown' });
      });

      logger.info(
        { successCount: response.successCount, failureCount: response.failureCount },
        'Notifications FCM expédiées'
      );

      // Élagage des jetons invalides ou désenregistrés (Dead Token Pruning)
      if (response.failureCount > 0 && userId) {
        const deadTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              deadTokens.push(uniqueTokens[idx]);
            }
          }
        });

        if (deadTokens.length > 0) {
          logger.info({ userId, count: deadTokens.length }, 'Purge des jetons FCM obsolètes');
          await db
            .collection('users')
            .doc(userId)
            .update({
              fcmTokens: firestore.FieldValue.arrayRemove(...deadTokens),
              updatedAt: new Date(),
            })
            .catch((err) => logger.warn({ err: err.message }, 'Erreur lors de la purge des jetons'));
        }
      }
    } catch (error) {
      logger.warn({ err: error.message }, 'Échec d expédition FCM (résilience active)');
      result.failedCount = result.tokensCount;
      result.errors.push({ token: '*', code: error.code || error.message });
    }
    return result;
  }

  /** Mode d'envoi réel : `firebase` (vraie messagerie) ou `memory` (simulation locale, aucun téléphone ne reçoit rien). */
  get mode() {
    return isFirebaseConfigured ? 'firebase' : 'memory';
  }

  /** Notification de test : même charge utile que les vraies notifications, pour vérifier la réception en quelques secondes. */
  async notifyTest(tokens, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'CampusSave : test de notification 🔔',
        body: 'Si vous lisez ceci, les notifications push fonctionnent sur cet appareil.',
        data: { type: 'TEST' },
      },
      userId
    );
  }

  /**
   * 1. Notification Commerçant : Mise à jour du statut d'homologation de la boutique par l'administration.
   */
  async notifyMerchantStatus(tokens, status, reason = '', userId = null) {
    const isApproved = status === 'APPROVED';
    return this.sendToTokens(
      tokens,
      {
        title: isApproved ? 'Boutique Validée ! 🎉' : 'Mise à jour de votre statut commerçant',
        body: isApproved
          ? 'Félicitations ! Votre commerce est homologué. Vous pouvez publier vos premières offres anti-gaspillage.'
          : `Votre établissement est actuellement ${status}. ${reason}`.trim(),
        data: { type: 'MERCHANT_STATUS', status },
      },
      userId
    );
  }

  /**
   * 2. Notification Commerçant : Nouvelle commande payée prête pour le retrait étudiant.
   */
  async notifyOrderPaid(tokens, orderCode, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'Nouvelle commande confirmée ! 🛎️',
        body: `La commande ${orderCode} a été réglée en ligne. Préparez le panier pour le retrait.`,
        data: { type: 'ORDER_PAID', orderCode },
      },
      userId
    );
  }

  /**
   * 3. Notification Étudiant : Commande confirmée et Living Ticket prêt avec QR code rotatif.
   */
  async notifyTicketReady(tokens, orderCode, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'Paiement confirmé ! 🎟️',
        body: `Votre ticket pour la commande ${orderCode} est prêt. Présentez son QR code dynamique au commerçant.`,
        data: { type: 'TICKET_READY', orderCode },
      },
      userId
    );
  }

  /**
   * 4. Notification Étudiant : Rappel de retrait imminent avant expiration du créneau.
   */
  async notifyPickupReminder(tokens, orderCode, minutesLeft = 30, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'Rappel de retrait CampusSave ⏳',
        body: `Votre commande ${orderCode} expire dans environ ${minutesLeft} minutes. N'oubliez pas de la récupérer !`,
        data: { type: 'PICKUP_REMINDER', orderCode, minutesLeft: String(minutesLeft) },
      },
      userId
    );
  }

  /**
   * 5. Notification Étudiant : Commande retirée avec succès, EcoPoints crédités et Mystery Box révélée.
   */
  async notifyOrderCompleted(tokens, orderCode, pointsAwarded, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'Sauvetage réussi ! 🌱',
        body: `Commande ${orderCode} retirée. Vous gagnez +${pointsAwarded} EcoPoints sur votre carte de fidélité !`,
        data: { type: 'ORDER_COMPLETED', orderCode, pointsAwarded: String(pointsAwarded) },
      },
      userId
    );
  }

  /**
   * 6. Notification Étudiant : Déblocage d'un palier ou d'un coupon de fidélité éco-citoyen.
   */
  async notifyRewardUnlocked(tokens, rewardDescription, userId = null) {
    return this.sendToTokens(
      tokens,
      {
        title: 'Nouveau coupon débloqué ! 🎁',
        body: `Bravo ! Votre assiduité anti-gaspillage vous donne droit à : ${rewardDescription}.`,
        data: { type: 'REWARD_UNLOCKED' },
      },
      userId
    );
  }

  /**
   * 7. Notification Diffusion Générale (Topic 'new-offers') : Nouvelle offre panier surprise.
   * Règle de modération : Bridage strict à un envoi par commerçant par heure pour prévenir le spam.
   */
  async notifyNewOfferTopic(offer) {
    if (!offer?.isSurpriseBasket) return;

    const merchantId = offer.merchantId;
    const now = Date.now();
    const lastSent = topicThrottleCache.get(merchantId) || 0;
    const oneHourMs = 60 * 60 * 1000;

    if (now - lastSent < oneHourMs) {
      logger.info({ merchantId }, 'Diffusion topic new-offers ignorée (seuil 1h actif)');
      return;
    }

    topicThrottleCache.set(merchantId, now);

    try {
      const title = 'Nouveau Panier Mystère disponible ! 🎁';
      const body = `${offer.merchantSnapshot?.name || 'Un commerce partenaire'} vient de publier un panier surprise !`;

      await messaging.send({
        topic: 'new-offers',
        ...buildFcmMessage({ title, body, data: { type: 'NEW_OFFER', offerId: offer.id || '', merchantId: merchantId || '' } }),
      });

      logger.info({ offerId: offer.id, merchantId }, 'Notification topic new-offers expédiée');
    } catch (error) {
      logger.warn({ err: error.message }, 'Échec diffusion topic new-offers');
    }
  }
}

export const fcmService = new FcmService();
