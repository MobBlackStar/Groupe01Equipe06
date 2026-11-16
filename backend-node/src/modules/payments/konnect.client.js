// 💡 Concept & Analogie : Comme un terminal de paiement électronique (TPE) sans fil relié à la banque qui demande l'autorisation avant de débiter le compte, ce client communique avec la passerelle Konnect en mode Sandbox.
// 🔄 Comparaison React / Flutter : Le backend initie le paiement et renvoie une URL de paiement (`payUrl`) que React affiche via une redirection et que Flutter affiche dans une WebView intégrée.
// 🎯 À retenir pour la soutenance : "Nous intégrons la passerelle tunisienne Konnect en mode Sandbox avec un cycle en deux temps : initialisation avec lien de paiement et réconciliation idempotente via webhook."
// Module : Logique Métier Backend

import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';

export class KonnectClient {
  constructor() {
    this.apiBase = env.KONNECT_API_BASE;
    this.apiKey = env.KONNECT_API_KEY;
    this.walletId = env.KONNECT_RECEIVER_WALLET_ID;
  }

  /**
   * Initialise une session de paiement électronique auprès de Konnect Sandbox.
   * @param {object} params
   * @param {string} params.orderId - Identifiant unique de la commande CampusSave
   * @param {number} params.amountMillimes - Montant entier en millimes
   * @param {string} params.description - Libellé affiché sur la facture
   * @param {string} [params.email]
   * @param {string} [params.phone]
   * @returns {Promise<{ payUrl: string, paymentRef: string }>}
   */
  async initPayment({ orderId, amountMillimes, description, email, phone }) {
    if (!this.apiKey || !this.walletId) {
      logger.warn('Clés Konnect manquantes : retour d un lien de simulation factice');
      return {
        payUrl: `${env.WEB_APP_URL}/payment/return?o=${orderId}&simulated=true`,
        paymentRef: `sim_${orderId}_${Date.now()}`,
      };
    }

    try {
      const payload = {
        receiverWalletId: this.walletId,
        token: 'TND',
        amount: amountMillimes,
        type: 'immediate',
        description: description || `Commande CampusSave #${orderId}`,
        acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
        lifespan: env.KONNECT_PAYMENT_LIFESPAN_MIN,
        checkoutForm: false,
        addPaymentFeesToAmount: false,
        email,
        phoneNumber: phone,
        orderId,
        webhook: `${env.PUBLIC_BASE_URL}/api/v1/payments/konnect/webhook`,
        successUrl: `${env.WEB_APP_URL}/payment/return?o=${orderId}`,
        failUrl: `${env.WEB_APP_URL}/payment/return?o=${orderId}&failed=1`,
      };

      const response = await axios.post(`${this.apiBase}/payments/init-payment`, payload, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return {
        payUrl: response.data.payUrl,
        paymentRef: response.data.paymentRef,
      };
    } catch (error) {
      logger.error({ err: error.response?.data || error.message }, 'Erreur lors de l appel Konnect init-payment');
      throw new AppError('Échec de la communication avec la passerelle de paiement', 502, 'KONNECT_GATEWAY_ERROR');
    }
  }

  /**
   * Vérifie le statut réel d'un paiement directement auprès de l'API Konnect.
   * @param {string} paymentRef - Référence du paiement Konnect
   * @returns {Promise<object>} Détails du paiement
   */
  async getPaymentDetails(paymentRef) {
    if (!this.apiKey) {
      return { status: 'completed', paymentRef };
    }

    try {
      const response = await axios.get(`${this.apiBase}/payments/${paymentRef}`, {
        headers: { 'x-api-key': this.apiKey },
        timeout: 10000,
      });
      return response.data.payment;
    } catch (error) {
      logger.error({ err: error.response?.data || error.message }, 'Erreur lors de la vérification Konnect');
      throw new AppError('Impossible de vérifier le paiement auprès de la passerelle', 502, 'KONNECT_CHECK_ERROR');
    }
  }
}

export const konnectClient = new KonnectClient();
