// 💡 Concept & Analogie : Contrôleur gérant la réception des demandes de réservation et d'annulation de commandes.
// 🔄 Comparaison React / Flutter : Point d'accès unique pour les boutons de validation de panier.
// 🎯 À retenir pour la soutenance : "Ce contrôleur renvoie immédiatement l'objet commande avec son orderCode unique et son horodatage de fin de validité."
// Module : Commandes & Réservations

import { ordersService } from './orders.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const ordersController = {
  createOrder: asyncHandler(async (req, res) => {
    const result = await ordersService.createOrder(req.user, req.body);
    res.status(201).json(result);
  }),

  cancelOrder: asyncHandler(async (req, res) => {
    const result = await ordersService.cancelOrder(req.params.id, req.user.uid);
    res.json(result);
  }),

  getOrderById: asyncHandler(async (req, res) => {
    const result = await ordersService.getOrderById(req.params.id, req.user);
    res.json(result);
  }),

  listOrders: asyncHandler(async (req, res) => {
    const result = await ordersService.listOrders(req.user);
    res.json(result);
  }),

  getMyOrders: asyncHandler(async (req, res) => {
    const result = await ordersService.getMyOrders(req.user.uid);
    res.json(result);
  }),

  getOrderTicket: asyncHandler(async (req, res) => {
    const result = await ordersService.getOrderTicket(req.params.id, req.user);
    res.set('Cache-Control', 'no-store');
    res.json(result);
  }),

  rateOrder: asyncHandler(async (req, res) => {
    const result = await ordersService.rateOrder(req.params.id, req.user.uid, req.body);
    res.json(result);
  }),
};
