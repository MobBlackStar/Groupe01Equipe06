// 💡 Concept & Analogie : Validation des paramètres de consultation de l'impact écologique campus (nombre de jours d'historique).
// 🔄 Comparaison React / Flutter : Valide les paramètres de requête de la page publique `/impact`.
// 🎯 À retenir pour la soutenance : "Limite la requête d'historique à un horizon raisonnable (1 à 30 jours, 14 par défaut) pour préserver les performances."
// Module : Impact Écologique & Responsabilité Sociétale

import { z } from 'zod';

export const globalImpactQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(14),
});
