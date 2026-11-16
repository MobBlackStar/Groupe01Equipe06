// 💡 Concept & Analogie : Contrôleur HTTP d'administration réceptionnant les requêtes de modération et audit.
// 🔄 Comparaison React / Flutter : Uniquement utilisé par le back-office Web React.
// 🎯 À retenir pour la soutenance : "Ce contrôleur restreint tous ses points de terminaison au rôle ADMIN."
// Module : Administration & Modération

import { adminService } from './admin.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const adminController = {
  listMerchants: asyncHandler(async (req, res) => {
    const result = await adminService.listMerchants(req.query.status);
    res.json(result);
  }),

  updateMerchantStatus: asyncHandler(async (req, res) => {
    const result = await adminService.updateMerchantStatus(
      req.params.id,
      req.body.status,
      req.body.statusReason,
      req.user.uid
    );
    res.json(result);
  }),

  listUsers: asyncHandler(async (req, res) => {
    const result = await adminService.listUsers(req.query.role);
    res.json(result);
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
    const result = await adminService.updateUserStatus(
      req.params.uid,
      req.body.status,
      req.body.statusReason,
      req.user.uid
    );
    res.json(result);
  }),
};
