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

  createSpot: asyncHandler(async (req, res) => {
    const result = await adminService.createSpot(req.user.uid, req.body);
    res.status(201).json(result);
  }),

  updateSpotLocation: asyncHandler(async (req, res) => {
    const result = await adminService.updateSpotLocation(req.params.id, req.body.location, req.user.uid);
    res.json(result);
  }),

  updateMerchant: asyncHandler(async (req, res) => {
    const result = await adminService.updateMerchantData(req.params.id, req.body, req.user.uid);
    res.json(result);
  }),

  deleteSpot: asyncHandler(async (req, res) => {
    const result = await adminService.deleteSpot(req.params.id, { hard: req.query.hard === 'true' }, req.user.uid);
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

  updateUser: asyncHandler(async (req, res) => {
    const result = await adminService.updateUser(req.params.uid, req.body, req.user.uid);
    res.json(result);
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const result = await adminService.deleteUser(req.params.uid, req.user.uid);
    res.json(result);
  }),

  resetDemo: asyncHandler(async (req, res) => {
    const isAllowed = process.env.ALLOW_DEMO_TOKENS === 'true' || process.env.NODE_ENV !== 'production';
    if (!isAllowed) {
      return res.status(403).json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'La réinitialisation de démonstration est restreinte aux environnements de démonstration.',
      });
    }
    const result = await adminService.resetDemo();
    res.json(result);
  }),
};
