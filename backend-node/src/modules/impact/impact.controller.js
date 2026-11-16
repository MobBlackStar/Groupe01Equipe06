// 💡 Concept & Analogie : Contrôleur HTTP pour la diffusion publique des indicateurs d'impact environnemental.
// 🔄 Comparaison React / Flutter : Point de distribution unifié pour la page Web `/impact` et l'écran mobile d'impact.
// 🎯 À retenir pour la soutenance : "Ces endpoints sont publics afin de sensibiliser l'ensemble de la communauté universitaire sans exiger de compte préalable."
// Module : Impact Écologique & Responsabilité Sociétale

import { impactService } from './impact.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const impactController = {
  getGlobalImpact: asyncHandler(async (req, res) => {
    const days = req.query.days ? parseInt(req.query.days, 10) : 14;
    const result = await impactService.getGlobalImpact(days);
    res.json(result);
  }),

  getFilieresImpact: asyncHandler(async (req, res) => {
    const result = await impactService.getFilieresImpact();
    res.json(result);
  }),
};
