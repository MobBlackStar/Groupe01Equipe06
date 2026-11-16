// 💡 Concept & Analogie : Comme une ligne téléphonique dédiée aux requêtes d'assistance avec limitation de trafic, ce routeur protège le service d'IA contre les abus.
// 🔄 Comparaison React / Flutter : Protégé par une limitation de débit de 10 requêtes par minute identique pour les deux clients.
// 🎯 À retenir pour la soutenance : "Nous appliquons un rate limiting strict de 10 req/min sur l'endpoint IA pour maîtriser les coûts de consommation de tokens."
// Module : Intelligence Artificielle & Automatisation

import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { offerAutofillSchema } from './ai.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const aiRouter = Router();

// Pré-remplissage d'offre alimentaire avec limitation de débit
aiRouter.post(
  '/offer-autofill',
  aiLimiter,
  authenticate,
  requireRole(ROLES.MERCHANT),
  validate({ body: offerAutofillSchema }),
  aiController.autofillOffer
);
