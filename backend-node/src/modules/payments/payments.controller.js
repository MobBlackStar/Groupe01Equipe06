// 💡 Concept & Analogie : Contrôleur HTTP pour les paiements Konnect et les retours webhooks.
// 🔄 Comparaison React / Flutter : Point de contact appelé après la transaction Konnect.
// 🎯 À retenir pour la soutenance : "Le webhook public répond toujours 200 OK pour assurer une communication idempotente et sans blocage avec les serveurs de paiement."
// Module : Paiements & Konnect

import { paymentsService } from './payments.service.js';
import { sendOrderReceiptEmail, getEmailProviderStatus } from '../notifications/email.service.js';
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
    const { orderId, paymentRef, receiptEmail } = req.body;
    const result = await paymentsService.verifyPayment(orderId, paymentRef, {
      receiptEmail: typeof receiptEmail === 'string' && receiptEmail.trim() ? receiptEmail.trim() : undefined,
    });
    res.json(result);
  }),

  sendTestEmail: asyncHandler(async (req, res) => {
    const targetEmail = (typeof req.body?.email === 'string' && req.body.email.trim()) || req.user?.email || '';
    const sampleOrder = {
      orderId: 'ord-email-test',
      orderCode: 'CS-TEST1',
      studentId: req.user?.uid || 'student-test',
      merchantId: 'merch-test',
      receiptEmail: targetEmail,
      studentSnapshot: { displayName: req.user?.displayName || 'Étudiant ESSECT', email: targetEmail },
      merchantSnapshot: { name: 'Munchies & Baguette Ali Trad' },
      items: [
        { offerId: 'off-test-1', title: 'Panier Test CampusSave ESSECT', quantity: 1, unitPriceMillimes: 2200, lineSubtotalMillimes: 2200 },
      ],
      pricing: {
        subtotalMillimes: 2200,
        discountMillimes: 0,
        totalMillimes: 2200,
        savedMillimes: 2300,
      },
      impact: { foodSavedGrams: 350, co2SavedGrams: 875 },
      payment: { paymentRef: 'demo-ksb-test', confirmedAt: new Date() },
    };

    const result = await sendOrderReceiptEmail({
      order: sampleOrder,
      student: { displayName: req.user?.displayName || 'Étudiant ESSECT', email: targetEmail },
      merchant: { name: 'Munchies & Baguette Ali Trad' },
      overrideEmail: targetEmail,
    });

    res.json({
      ok: Boolean(result?.sent),
      provider: result?.provider || 'none',
      toEmail: result?.toEmail || targetEmail,
      error: result?.error || null,
      ...(result?.errorDetail ? { errorDetail: result.errorDetail } : {}),
      config: getEmailProviderStatus(),
    });
  }),
};
