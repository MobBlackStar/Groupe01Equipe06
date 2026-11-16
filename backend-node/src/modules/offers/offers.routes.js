// 💡 Concept & Analogie : Comme les allées d'un supermarché organisant les rayons alimentaires et les caisses, ce routeur organise les points d'accès aux offres.
// 🔄 Comparaison React / Flutter : Consommé par `OfferFormPage` (React) et `OfferDetailPage` (React/Flutter).
// 🎯 À retenir pour la soutenance : "La publication d'offre requiert obligatoirement le statut de commerçant validé grâce au middleware requireApprovedMerchant."
// Module : Offres & Catalogue

import { Router } from 'express';
import { offersController } from './offers.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { requireApprovedMerchant } from '../../middleware/requireApprovedMerchant.js';
import { validate } from '../../middleware/validate.js';
import { createOfferSchema, updateOfferSchema } from './offers.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const offersRouter = Router();

// Consultation du catalogue public avec recherche et filtres multi-critères
offersRouter.get('/', offersController.listOffers);

// Création d'offre réservée aux commerçants agréés
offersRouter.post(
  '/',
  authenticate,
  requireRole(ROLES.MERCHANT),
  requireApprovedMerchant,
  validate({ body: createOfferSchema }),
  offersController.createOffer
);

// Mise à jour et suppression d'offre
offersRouter.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.MERCHANT),
  validate({ body: updateOfferSchema }),
  offersController.updateOffer
);

offersRouter.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.MERCHANT),
  offersController.deleteOffer
);

// Consultation d'une offre (publique avec identification facultative pour débloquer le contenu surprise)
offersRouter.get(
  '/:id',
  (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return authenticate(req, res, next);
    }
    next();
  },
  offersController.getOfferById
);
