// 💡 Concept & Analogie : Contrôleur HTTP pour les paiements Konnect et les retours webhooks.
// 🔄 Comparaison React / Flutter : Point de contact appelé après la transaction Konnect.
// 🎯 À retenir pour la soutenance : "Le webhook public répond toujours 200 OK pour assurer une communication idempotente et sans blocage avec les serveurs de paiement."
// Module : Paiements & Konnect

import { paymentsService } from './payments.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const paymentsController = {
  initPayment: asyncHandler(async (req, res) => {
    const result = await paymentsService.initPayment(req.body.orderId, req.user);
    res.json(result);
  }),

  handleWebhook: asyncHandler(async (req, res) => {
    const paymentRef = req.query.payment_ref || req.body?.payment_ref;
    const result = await paymentsService.handleWebhook(paymentRef);
    res.json(result);
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const { orderId, paymentRef } = req.body;
    const result = await paymentsService.verifyPayment(orderId, paymentRef);
    res.json(result);
  }),
};
