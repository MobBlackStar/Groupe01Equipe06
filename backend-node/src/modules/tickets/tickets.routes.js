// 💡 Concept & Analogie : Portillon de sécurité vérifiant que seul un commerçant validé et à un débit raisonnable peut valider des billets.
// 🔄 Comparaison React / Flutter : Protégé par authenticate, requireRole(MERCHANT), requireApprovedMerchant et scanLimiter (20 req/min).
// 🎯 À retenir pour la soutenance : "Nous limitons le taux de scan à 20 requêtes par minute pour prévenir toute tentative d'attaque par force brute sur les codes manuels."
// Module : Cryptographie & Retrait de Commandes

import { Router } from 'express';
import { ticketsController } from './tickets.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { requireApprovedMerchant } from '../../middleware/requireApprovedMerchant.js';
import { validate } from '../../middleware/validate.js';
import { scanLimiter } from '../../middleware/rateLimit.js';
import { scanTicketSchema, redeemCodeSchema } from './tickets.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const ticketsRouter = Router();

// Validation par scan de QR code dynamique rotatif 30s
ticketsRouter.post(
  '/scan',
  authenticate,
  requireRole(ROLES.MERCHANT),
  requireApprovedMerchant,
  scanLimiter,
  validate({ body: scanTicketSchema }),
  ticketsController.scanTicket
);

// Validation par saisie manuelle du code commande et du code 6 chiffres
ticketsRouter.post(
  '/redeem-code',
  authenticate,
  requireRole(ROLES.MERCHANT),
  requireApprovedMerchant,
  scanLimiter,
  validate({ body: redeemCodeSchema }),
  ticketsController.redeemCode
);
