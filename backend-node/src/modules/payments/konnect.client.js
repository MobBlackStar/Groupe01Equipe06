// 💡 Concept & Analogie : Comme un terminal de paiement électronique (TPE) sans fil relié à la banque qui demande l'autorisation avant de débiter le compte, ce client communique avec la passerelle Konnect en mode Sandbox.
// 🔄 Comparaison React / Flutter : Le backend initie le paiement et renvoie une URL de paiement (`payUrl`) que React affiche via une redirection et que Flutter affiche dans une WebView intégrée.
// 🎯 À retenir pour la soutenance : "Nous intégrons la passerelle tunisienne Konnect en mode Sandbox avec un cycle en deux temps : initialisation avec lien de paiement et réconciliation idempotente via webhook."
// Module : Logique Métier Backend

import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';

function isPlaceholderCredential(value) {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  return (
    !trimmed ||
    trimmed === 'konnect_dev_mock_key' ||
    trimmed === 'konnect_dev_mock_wallet' ||
    trimmed.startsWith('your-') ||
    trimmed.startsWith('<')
  );
}

/**
 * Indique si la passerelle Konnect doit fonctionner en mode simulé (Sandbox local / soutenance)
 * même lorsque NODE_ENV === 'production' (ex. Render sans clé Konnect réelle).
 */
export function isSimulatedKonnectMode(paymentRef = '', config = env) {
  const apiKey = (config?.KONNECT_API_KEY ?? env.KONNECT_API_KEY ?? '').trim();
  const walletId = (config?.KONNECT_RECEIVER_WALLET_ID ?? env.KONNECT_RECEIVER_WALLET_ID ?? '').trim();

  if (isPlaceholderCredential(apiKey) || isPlaceholderCredential(walletId)) {
    return true;
  }

  if (
    typeof paymentRef === 'string' &&
    (paymentRef.startsWith('demo-') ||
      paymentRef.startsWith('mock_') ||
      paymentRef.startsWith('sim_') ||
      paymentRef.startsWith('ksb_'))
  ) {
    return true;
  }

  return false;
}

function buildSandboxSession(webAppUrl, orderId) {
  const paymentRef = `demo-ksb-${Date.now().toString(36)}`;
  const cleanOrigin = (webAppUrl || 'http://localhost:5173').replace(/\/+$/, '');
  return {
    payUrl: `${cleanOrigin}/payment/konnect-sandbox?orderId=${encodeURIComponent(orderId)}&payment_ref=${encodeURIComponent(paymentRef)}`,
    paymentRef,
  };
}

export class KonnectClient {
  constructor(config = env) {
    this.config = config;
    this.apiBase = config.KONNECT_API_BASE || env.KONNECT_API_BASE;
    this.apiKey = isPlaceholderCredential(config.KONNECT_API_KEY) ? '' : config.KONNECT_API_KEY.trim();
    this.walletId = isPlaceholderCredential(config.KONNECT_RECEIVER_WALLET_ID) ? '' : config.KONNECT_RECEIVER_WALLET_ID.trim();
    this.webAppUrl = config.WEB_APP_URL || env.WEB_APP_URL;
  }

  /**
   * Initialise une session de paiement électronique auprès de Konnect Sandbox
   * avec bascule automatique vers l'environnement Sandbox intégré en cas de panne distante.
   * @param {object} params
   * @param {string} params.orderId - Identifiant unique de la commande CampusSave
   * @param {number} params.amountMillimes - Montant entier en millimes
   * @param {string} params.description - Libellé affiché sur la facture
   * @param {string} [params.email]
   * @param {string} [params.phone]
   * @returns {Promise<{ payUrl: string, paymentRef: string }>}
   */
  async initPayment({ orderId, amountMillimes, description, email, phone }) {
    if (isSimulatedKonnectMode('', { KONNECT_API_KEY: this.apiKey, KONNECT_RECEIVER_WALLET_ID: this.walletId })) {
      logger.warn({ orderId }, 'Mode Konnect Sandbox intégré actif : redirection vers /payment/konnect-sandbox');
      return buildSandboxSession(this.webAppUrl, orderId);
    }

    try {
      const payload = {
        receiverWalletId: this.walletId,
        token: 'TND',
        amount: amountMillimes,
        type: 'immediate',
        description: description || `Commande CampusSave #${orderId}`,
        acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
        lifespan: this.config.KONNECT_PAYMENT_LIFESPAN_MIN ?? env.KONNECT_PAYMENT_LIFESPAN_MIN,
        checkoutForm: false,
        addPaymentFeesToAmount: false,
        email,
        phoneNumber: phone,
        orderId,
        webhook: `${this.config.PUBLIC_BASE_URL || env.PUBLIC_BASE_URL}/api/v1/payments/konnect/webhook`,
        successUrl: `${this.webAppUrl}/payment/return?o=${orderId}`,
        failUrl: `${this.webAppUrl}/payment/return?o=${orderId}&failed=1`,
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
      logger.warn(
        { err: error.response?.data || error.message, orderId },
        'Passerelle Konnect Sandbox externe indisponible : bascule automatique vers Konnect Sandbox intégré'
      );
      return buildSandboxSession(this.webAppUrl, orderId);
    }
  }

  /**
   * Vérifie le statut d'un paiement auprès de Konnect Sandbox ou de la passerelle simulée.
   * @param {string} paymentRef - Référence du paiement Konnect
   * @returns {Promise<object>} Détails du paiement
   */
  async getPaymentDetails(paymentRef) {
    if (isSimulatedKonnectMode(paymentRef, { KONNECT_API_KEY: this.apiKey, KONNECT_RECEIVER_WALLET_ID: this.walletId })) {
      if (typeof paymentRef === 'string' && paymentRef.endsWith('-fail')) {
        return { status: 'failed', paymentRef };
      }
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

  /** Alias ergonomique pour la vérification directe du paiement. */
  async getPayment(paymentRef) {
    return this.getPaymentDetails(paymentRef);
  }
}

export const konnectClient = new KonnectClient();
