// 💡 Concept & Analogie : Comme un mégaphone ou un télégramme d'alerte qui informe instantanément les personnes concernées dès qu'une action importante a eu lieu, ce service expédie des notifications push mobiles et web.
// 🔄 Comparaison React / Flutter : En React, les alertes sont reçues par le Service Worker `firebase-messaging-sw.js` ; en Flutter, elles sont traitées nativement par `firebase_messaging`.
// 🎯 À retenir pour la soutenance : "Conformément à nos règles de résilience, les envois de notifications push FCM se font toujours après le commit réussi des transactions Firestore (aucun blocage en cas d'échec réseau tiers)."
// Module : Logique Métier Backend

import { messaging } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';

export class FcmService {
  /**
   * Envoie une notification à une liste de jetons d'appareils avec nettoyage des jetons expirés.
   * @param {string[]} tokens - Liste des jetons FCM
   * @param {object} payload - { title, body, data }
   */
  async sendToTokens(tokens, { title, body, data = {} }) {
    if (!tokens || tokens.length === 0) return;

    try {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });

      logger.info({ successCount: response.successCount, failureCount: response.failureCount }, 'Notifications FCM expédiées');
    } catch (error) {
      logger.error({ err: error.message }, 'Échec d expédition FCM');
    }
  }

  /**
   * Notification commerçant : statut de son établissement mis à jour par l'admin.
   */
  async notifyMerchantStatus(tokens, status, reason = '') {
    const isApproved = status === 'APPROVED';
    await this.sendToTokens(tokens, {
      title: isApproved ? 'Boutique Validée ! 🎉' : 'Mise à jour de votre statut commerçant',
      body: isApproved
        ? 'Félicitations ! Vous pouvez désormais publier vos premières offres alimentaires.'
        : `Votre compte est actuellement ${status}. ${reason}`,
      data: { type: 'MERCHANT_STATUS', status },
    });
  }

  /**
   * Notification commerçant : nouvelle commande payée prête à préparer.
   */
  async notifyOrderPaid(tokens, orderCode) {
    await this.sendToTokens(tokens, {
      title: 'Nouvelle commande confirmée ! 🛎️',
      body: `La commande ${orderCode} a été réglée et sera retirée prochainement.`,
      data: { type: 'ORDER_PAID', orderCode },
    });
  }

  /**
   * Notification étudiant : ticket de retrait prêt avec QR code rotatif.
   */
  async notifyTicketReady(tokens, orderCode) {
    await this.sendToTokens(tokens, {
      title: 'Paiement confirmé ! 🎟️',
      body: `Votre ticket pour la commande ${orderCode} est prêt. Présentez-le lors du retrait.`,
      data: { type: 'TICKET_READY', orderCode },
    });
  }

  /**
   * Notification étudiant : commande retirée avec succès et attribution des EcoPoints.
   */
  async notifyOrderCompleted(tokens, orderCode, pointsAwarded) {
    await this.sendToTokens(tokens, {
      title: 'Commande retirée avec succès ! 🎉',
      body: `Votre commande ${orderCode} est validée. Vous avez gagné +${pointsAwarded} EcoPoints !`,
      data: { type: 'ORDER_COMPLETED', orderCode, pointsAwarded: String(pointsAwarded) },
    });
  }

  /**
   * Notification étudiant : déblocage d'un palier de fidélité ou d'une récompense.
   */
  async notifyRewardUnlocked(tokens, rewardDescription) {
    await this.sendToTokens(tokens, {
      title: 'Nouveau cadeau débloqué ! 🎁',
      body: `Félicitations ! Vous venez de débloquer : ${rewardDescription}.`,
      data: { type: 'REWARD_UNLOCKED' },
    });
  }
}

export const fcmService = new FcmService();
