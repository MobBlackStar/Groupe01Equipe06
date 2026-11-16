// 💡 Concept & Analogie : Aiguillage des requêtes liées aux commandes vers le contrôleur sécurisé.
// 🔄 Comparaison React / Flutter : Protégé par le middleware authenticate et requireRole(STUDENT).
// 🎯 À retenir pour la soutenance : "Seuls les utilisateurs authentifiés avec le rôle STUDENT peuvent réserver une offre."
// Module : Commandes & Réservations

import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createOrderSchema, rateOrderSchema } from './orders.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const ordersRouter = Router();

// Création d'une réservation (Rôle Étudiant uniquement)
ordersRouter.post(
  '/',
  authenticate,
  requireRole(ROLES.STUDENT),
  validate({ body: createOrderSchema }),
  ordersController.createOrder
);

// Annulation d'une réservation temporaire (Rôle Étudiant)
ordersRouter.post(
  '/:id/cancel',
  authenticate,
  requireRole(ROLES.STUDENT),
  ordersController.cancelOrder
);

// Liste des commandes de l'étudiant connecté
ordersRouter.get(
  '/me',
  authenticate,
  requireRole(ROLES.STUDENT),
  ordersController.getMyOrders
);

// Consultation d'une commande par identifiant (Étudiant propriétaire, Commerçant concerné ou Admin)
ordersRouter.get(
  '/:id',
  authenticate,
  ordersController.getOrderById
);

// Obtention des paramètres cryptographiques du Living Ticket (Étudiant propriétaire, rôle STUDENT)
ordersRouter.get(
  '/:id/ticket',
  authenticate,
  requireRole(ROLES.STUDENT),
  ordersController.getOrderTicket
);

// Évaluation d'une commande terminée (Rôle Étudiant uniquement)
ordersRouter.post(
  '/:id/rating',
  authenticate,
  requireRole(ROLES.STUDENT),
  validate({ body: rateOrderSchema }),
  ordersController.rateOrder
);
