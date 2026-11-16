// 💡 Concept & Analogie : Comme les paramètres de zoom temporel d'un tableau de bord de bord boursier (vue 7 jours ou 30 jours), ces schémas garantissent la validité des filtres de consultation des statistiques.
// 🔄 Comparaison React / Flutter : Valide les paramètres `?range=7d|30d` envoyés par les graphiques Recharts (Web) et FlChart (Flutter).
// 🎯 À retenir pour la soutenance : "La validation Zod empêche les injections de paramètres temporels invalides et standardise les fenêtres d'analyse à 7 ou 30 jours."
// Module : Tableaux de Bord & Indicateurs Décisionnels

import { z } from 'zod';

export const merchantDashboardQuerySchema = z.object({
  range: z.enum(['7d', '30d']).default('7d'),
});
