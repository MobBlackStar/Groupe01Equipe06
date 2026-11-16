// 💡 Concept & Analogie : Aiguillage public pour la détection et la cartographie géospatiale des commerces proches de l'ESSECT.
// 🔄 Comparaison React / Flutter : Point de terminaison consommé par MapLibre 3D WebGL et Flutter Map.
// 🎯 À retenir pour la soutenance : "Cette route est publique et légère afin d'assurer un chargement instantané de la vue radar."
// Module : Radar Géospatial Backend

import { Router } from 'express';
import { radarController } from './radar.controller.js';
import { validate } from '../../middleware/validate.js';
import { radarQuerySchema } from './radar.schemas.js';

export const radarRouter = Router();

// Consultation de la cartographie radar autour du campus ESSECT
radarRouter.get(
  '/',
  validate({ query: radarQuerySchema }),
  radarController.getRadar
);
