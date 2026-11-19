// 💡 Concept & Analogie : Contrôleur HTTP d'offres assurant la réception des paramètres et la transmission des réponses JSON.
// 🔄 Comparaison React / Flutter : Point de convergence pour les actions de publication, modification et suppression d'offres.
// 🎯 À retenir pour la soutenance : "Ce contrôleur injecte le snapshot commerçant validé par le middleware requireApprovedMerchant."
// Module : Offres & Catalogue

import { offersService } from './offers.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { resolveMerchantId } from '../../utils/merchantResolver.js';

export const offersController = {
  listOffers: asyncHandler(async (req, res) => {
    const result = await offersService.listOffers(req.query);
    res.json(result);
  }),

  createOffer: asyncHandler(async (req, res) => {
    const result = await offersService.createOffer(req.merchant, req.body);
    res.status(201).json(result);
  }),

  getOfferById: asyncHandler(async (req, res) => {
    const result = await offersService.getOfferById(req.params.id, req.user);
    res.json(result);
  }),

  updateOffer: asyncHandler(async (req, res) => {
    // Le propriétaire d'une offre est le COMMERCE (merchants/{id}), pas forcément l'uid de connexion (compte démo)
    const merchantId = (await resolveMerchantId(req.user.uid)) ?? req.user.uid;
    const result = await offersService.updateOffer(req.params.id, merchantId, req.body);
    res.json(result);
  }),

  deleteOffer: asyncHandler(async (req, res) => {
    const merchantId = (await resolveMerchantId(req.user.uid)) ?? req.user.uid;
    const result = await offersService.deleteOffer(req.params.id, merchantId);
    res.json(result);
  }),
};
