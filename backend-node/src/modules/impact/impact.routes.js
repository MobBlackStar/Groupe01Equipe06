// 💡 Concept & Analogie : Aiguillage des routes publiques d'impact environnemental.
// 🔄 Comparaison React / Flutter : Accessible sans jeton d'authentification pour un partage viral et pédagogique.
// 🎯 À retenir pour la soutenance : "Routes publiques optimisées avec validation de la fenêtre temporelle."
// Module : Impact Écologique & Responsabilité Sociétale

import { Router } from 'express';
import { impactController } from './impact.controller.js';
import { validate } from '../../middleware/validate.js';
import { globalImpactQuerySchema } from './impact.schemas.js';

export const impactRouter = Router();

// Synthèse d'impact écologique global (public)
impactRouter.get(
  '/global',
  validate({ query: globalImpactQuerySchema }),
  impactController.getGlobalImpact
);

// Classement inter-filières ESSECT (public)
impactRouter.get(
  '/filieres',
  impactController.getFilieresImpact
);
