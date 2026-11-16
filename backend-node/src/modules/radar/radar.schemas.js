// 💡 Concept & Analogie : Comme le réglage de la portée d'un sonar de sous-marin, ce schéma valide le rayon de recherche en mètres autour du campus ESSECT.
// 🔄 Comparaison React / Flutter : Valide les paramètres de requête de `GET /api/v1/radar?radiusM=1500`.
// 🎯 À retenir pour la soutenance : "Nous validons avec Zod que le rayon de recherche se situe entre 100 et 5000 mètres (1500 m par défaut)."
// Module : Radar Géospatial Backend

import { z } from 'zod';

export const radarQuerySchema = z.object({
  radiusM: z.coerce.number().min(100, 'Rayon minimum : 100 m').max(5000, 'Rayon maximum : 5000 m').default(1500),
});
