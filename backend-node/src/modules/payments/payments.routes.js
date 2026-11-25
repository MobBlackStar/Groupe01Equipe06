// 💡 Concept & Analogie : Aiguillage des routes monétiques (initialisation, webhook et vérification de retour).
// 🔄 Comparaison React / Flutter : Le webhook est public (appelé par Konnect), l'init et la vérification sont sécurisées.
// 🎯 À retenir pour la soutenance : "Le webhook GET /konnect/webhook permet à Konnect de notifier le backend en tâche de fond même si l'étudiant a fermé son navigateur."
// Module : Paiements & Konnect

import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { initPaymentSchema, verifyPaymentSchema, emailTestSchema } from './payments.schemas.js';

export const paymentsRouter = Router();

// Initialisation d'une session de paiement Konnect
paymentsRouter.post(
  '/konnect/init',
  authenticate,
  validate({ body: initPaymentSchema }),
  paymentsController.initPayment
);

// Webhook officiel appelé par les serveurs Konnect (accès public sans Bearer token)
paymentsRouter.get(
  '/konnect/webhook',
  paymentsController.handleWebhook
);

// Vérification manuelle déclenchée lors de la redirection retour client
paymentsRouter.post(
  '/konnect/verify',
  authenticate,
  validate({ body: verifyPaymentSchema }),
  paymentsController.verifyPayment
);

// Diagnostic d'envoi de reçu e-mail en conditions réelles
paymentsRouter.post(
  '/email-test',
  authenticate,
  validate({ body: emailTestSchema }),
  paymentsController.sendTestEmail
);
