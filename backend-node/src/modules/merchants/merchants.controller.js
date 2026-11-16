// 💡 Concept & Analogie : Contrôleur HTTP aiguillant les requêtes de gestion de commerce, consultation et historique d'offres.
// 🔄 Comparaison React / Flutter : Répond aux formulaires d'onboarding commerçant des deux clients.
// 🎯 À retenir pour la soutenance : "Ce contrôleur gère la réception des coordonnées et délègue au service avec validation Zod."
// Module : Commerces & Partenaires

import { merchantsService } from './merchants.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const merchantsController = {
  createMerchant: asyncHandler(async (req, res) => {
    const result = await merchantsService.createMerchant(req.user, req.body);
    res.status(201).json(result);
  }),

  getMe: asyncHandler(async (req, res) => {
    const result = await merchantsService.getMe(req.user.uid);
    res.json(result);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const result = await merchantsService.updateMe(req.user.uid, req.body);
    res.json(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await merchantsService.getById(req.params.id, req.user);
    res.json(result);
  }),

  getMyOffers: asyncHandler(async (req, res) => {
    const result = await merchantsService.getMyOffers(req.user.uid, req.query.status);
    res.json(result);
  }),

  getMyOrders: asyncHandler(async (req, res) => {
    const result = await merchantsService.getMyOrders(req.user.uid, req.query.status, req.query.date);
    res.json(result);
  }),
};
