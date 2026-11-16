// 💡 Concept & Analogie : Aiguillage sécurisé permettant à l'étudiant connecté de consulter sa carte de fidélité et ses récompenses.
// 🔄 Comparaison React / Flutter : Protégé par authenticate et requireRole(STUDENT).
// 🎯 À retenir pour la soutenance : "Seul l'étudiant titulaire du compte peut accéder à son relevé d'EcoPoints et à ses coupons débloqués."
// Module : Fidélité & Récompenses Backend

import { Router } from 'express';
import { loyaltyController } from './loyalty.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { ROLES } from '../../../../shared/constants.js';

export const loyaltyRouter = Router();

// Consultation du solde de points et récompenses de l'étudiant connecté
loyaltyRouter.get(
  '/me',
  authenticate,
  requireRole(ROLES.STUDENT),
  loyaltyController.getMyLoyalty
);
