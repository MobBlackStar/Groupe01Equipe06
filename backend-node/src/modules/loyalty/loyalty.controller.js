// 💡 Concept & Analogie : Contrôleur gérant les requêtes de consultation de fidélité étudiante.
// 🔄 Comparaison React / Flutter : Point de terminaison `GET /api/v1/loyalty/me`.
// 🎯 À retenir pour la soutenance : "Ce contrôleur injecte l'uid de l'étudiant vérifié par le token Firebase et renvoie le profil fidélité complet."
// Module : Fidélité & Récompenses Backend

import { loyaltyService } from './loyalty.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const loyaltyController = {
  getMyLoyalty: asyncHandler(async (req, res) => {
    const result = await loyaltyService.getStudentLoyalty(req.user.uid);
    res.json(result);
  }),
};
