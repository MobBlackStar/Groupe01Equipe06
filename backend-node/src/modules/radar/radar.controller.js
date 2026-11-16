// 💡 Concept & Analogie : Contrôleur HTTP réceptionnant les requêtes radar et retournant les coordonnées et offres calculées.
// 🔄 Comparaison React / Flutter : Point de terminaison public `GET /api/v1/radar?radiusM=1500`.
// 🎯 À retenir pour la soutenance : "Ce contrôleur injecte le rayon validé et transmet la cartographie temps réel au format JSON."
// Module : Radar Géospatial Backend

import { radarService } from './radar.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const radarController = {
  getRadar: asyncHandler(async (req, res) => {
    const radiusM = req.query.radiusM ? parseInt(req.query.radiusM, 10) : 1500;
    const result = await radarService.getRadarData(radiusM);
    res.json(result);
  }),
};
