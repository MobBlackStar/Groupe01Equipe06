// 💡 Concept & Analogie : Comme le guichet d'enregistrement des commerçants partenaires, ce routeur expose l'API de gestion des boutiques et de leurs offres.
// 🔄 Comparaison React / Flutter : Routes consommées par `MerchantOnboardingPage` en React et `MerchantOnboardingScreen` en Flutter.
// 🎯 À retenir pour la soutenance : "Toutes les mutations commerçantes sont protégées par le rôle MERCHANT, tandis que la consultation des fiches approuvées est publique."
// Module : Commerces & Partenaires

import { Router } from 'express';
import { merchantsController } from './merchants.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createMerchantSchema, updateMerchantSchema } from './merchants.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const merchantsRouter = Router();

// Routes privées pour le commerçant connecté
merchantsRouter.post(
  '/',
  authenticate,
  requireRole(ROLES.MERCHANT),
  validate({ body: createMerchantSchema }),
  merchantsController.createMerchant
);

merchantsRouter.get(
  '/me',
  authenticate,
  requireRole(ROLES.MERCHANT),
  merchantsController.getMe
);

merchantsRouter.patch(
  '/me',
  authenticate,
  requireRole(ROLES.MERCHANT),
  validate({ body: updateMerchantSchema }),
  merchantsController.updateMe
);

merchantsRouter.get(
  '/me/offers',
  authenticate,
  requireRole(ROLES.MERCHANT),
  merchantsController.getMyOffers
);

merchantsRouter.get(
  '/me/orders',
  authenticate,
  requireRole(ROLES.MERCHANT),
  merchantsController.getMyOrders
);

// Route publique de consultation d'un commerce (authentification optionnelle)
merchantsRouter.get(
  '/:id',
  (req, res, next) => {
    // Si un header Bearer est présent, tente l'authentification sans bloquer en cas d'absence
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    next();
  },
  merchantsController.getById
);
