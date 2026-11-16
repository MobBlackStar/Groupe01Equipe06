// 💡 Concept & Analogie : Contrôleur HTTP d'analyse d'offres par IA.
// 🔄 Comparaison React / Flutter : Point de terminaison unique pour le bouton "Remplir avec l'IA" sur React et Flutter.
// 🎯 À retenir pour la soutenance : "Ce contrôleur soumet le texte au service d'analyse et garantit un retour JSON même si le fournisseur externe est en panne."
// Module : Intelligence Artificielle & Automatisation

import { aiService } from './ai.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const aiController = {
  autofillOffer: asyncHandler(async (req, res) => {
    const result = await aiService.autofillOffer(req.body.text);
    res.json(result);
  }),
};
