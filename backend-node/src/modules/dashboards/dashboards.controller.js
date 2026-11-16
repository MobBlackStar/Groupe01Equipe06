// 💡 Concept & Analogie : Contrôleur HTTP réceptionnant les requêtes des tableaux de bord analytiques et transmettant les indicateurs synthétisés.
// 🔄 Comparaison React / Flutter : Alimente aussi bien les composants Recharts React que les jauges graphiques FlChart Flutter.
// 🎯 À retenir pour la soutenance : "Ce contrôleur oriente chaque appel vers la logique analytique du rôle demandeur (étudiant, commerçant ou admin)."
// Module : Tableaux de Bord & Indicateurs Décisionnels

import { dashboardsService } from './dashboards.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const dashboardsController = {
  getStudentDashboard: asyncHandler(async (req, res) => {
    const dashboard = await dashboardsService.getStudentDashboard(req.user.uid);
    res.json(dashboard);
  }),

  getMerchantDashboard: asyncHandler(async (req, res) => {
    const range = req.query.range || '7d';
    const dashboard = await dashboardsService.getMerchantDashboard(req.user.uid, range);
    res.json(dashboard);
  }),

  getAdminDashboard: asyncHandler(async (req, res) => {
    const dashboard = await dashboardsService.getAdminDashboard();
    res.json(dashboard);
  }),
};
