// 💡 Concept & Analogie : Contrôleur HTTP d'offres assurant la réception des paramètres et la transmission des réponses JSON.
// 🔄 Comparaison React / Flutter : Point de convergence pour les actions de publication, modification et suppression d'offres.
// 🎯 À retenir pour la soutenance : "Ce contrôleur injecte le snapshot commerçant validé par le middleware requireApprovedMerchant."
// Module : Offres & Catalogue

import { offersService } from './offers.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const offersController = {
  createOffer: asyncHandler(async (req, res) => {
    const result = await offersService.createOffer(req.merchant, req.body);
    res.status(201).json(result);
  }),

  getOfferById: asyncHandler(async (req, res) => {
    const result = await offersService.getOfferById(req.params.id, req.user);
    res.json(result);
  }),

  updateOffer: asyncHandler(async (req, res) => {
    const result = await offersService.updateOffer(req.params.id, req.user.uid, req.body);
    res.json(result);
  }),

  deleteOffer: asyncHandler(async (req, res) => {
    const result = await offersService.deleteOffer(req.params.id, req.user.uid);
    res.json(result);
  }),
};
