// 💡 Concept & Analogie : Comme la salle de contrôle de l'université accessible uniquement aux directeurs et administrateurs munis d'une accréditation maximale.
// 🔄 Comparaison React / Flutter : Protège l'accès à la console de gestion `/admin` sur React ; inexistant sur Flutter.
// 🎯 À retenir pour la soutenance : "Ce routeur applique le middleware requireRole(ADMIN) sur l'ensemble de ses sous-routes."
// Module : Administration & Modération

import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { updateMerchantStatusSchema, updateUserStatusSchema } from './admin.schemas.js';
import { ROLES } from '../../../../shared/constants.js';

export const adminRouter = Router();

// Toutes les routes administratives exigent une authentification avec rôle ADMIN
adminRouter.use(authenticate, requireRole(ROLES.ADMIN));

// Gestion et modération des commerces
adminRouter.get('/merchants', adminController.listMerchants);
adminRouter.patch(
  '/merchants/:id/status',
  validate({ body: updateMerchantStatusSchema }),
  adminController.updateMerchantStatus
);

// Gestion et suspension des utilisateurs
adminRouter.get('/users', adminController.listUsers);
adminRouter.patch(
  '/users/:uid/status',
  validate({ body: updateUserStatusSchema }),
  adminController.updateUserStatus
);
