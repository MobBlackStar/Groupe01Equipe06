// 💡 Concept & Analogie : Aiguillage des requêtes d'analytique et de tableaux de bord selon le rôle de l'utilisateur connecté.
// 🔄 Comparaison React / Flutter : Routes consommées par les vues de supervision Web et Mobile.
// 🎯 À retenir pour la soutenance : "Chaque route de tableau de bord est protégée par un contrôle d'accès strict sur le rôle de l'utilisateur."
// Module : Tableaux de Bord & Indicateurs Décisionnels

import { Router } from 'express';
import { dashboardsController } from './dashboards.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { merchantDashboardQuerySchema } from './dashboards.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const dashboardsRouter = Router();

// Tableau de bord Étudiant
dashboardsRouter.get(
  '/student',
  authenticate,
  requireRole(ROLES.STUDENT),
  dashboardsController.getStudentDashboard
);

// Tableau de bord Commerçant (avec paramètre temporel 7d ou 30d)
dashboardsRouter.get(
  '/merchant',
  authenticate,
  requireRole(ROLES.MERCHANT),
  validate({ query: merchantDashboardQuerySchema }),
  dashboardsController.getMerchantDashboard
);

// Tableau de bord Administrateur
dashboardsRouter.get(
  '/admin',
  authenticate,
  requireRole(ROLES.ADMIN),
  dashboardsController.getAdminDashboard
);
