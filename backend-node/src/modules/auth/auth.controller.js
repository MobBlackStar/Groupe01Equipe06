// 💡 Concept & Analogie : Contrôleur HTTP d'authentification orchestrant les requêtes de profils et réponses JSON.
// 🔄 Comparaison React / Flutter : Même format de réponse retourné aux deux clients.
// 🎯 À retenir pour la soutenance : "Ce contrôleur gère la réception de la requête d'inscription et délègue au service d'authentification."
// Module : Architecture Backend

import { authService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authController = {
  registerProfile: asyncHandler(async (req, res) => {
    const result = await authService.registerProfile(req.user, req.body);
    res.status(201).json(result);
  }),
};
