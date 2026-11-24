// 💡 Concept & Analogie : Contrôleur HTTP pour le profil utilisateur et la synchronisation des notifications.
// 🔄 Comparaison React / Flutter : Traite les requêtes de `ProfilePage` (React) et `ProfileScreen` (Flutter).
// 🎯 À retenir pour la soutenance : "Ce contrôleur aiguille les consultations et mises à jour du profil personnel de l'utilisateur connecté."
// Module : Logique Métier Backend

import { usersService } from './users.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const usersController = {
  getMe: asyncHandler(async (req, res) => {
    const data = await usersService.getMe(req.user.uid);
    res.json(data);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const data = await usersService.updateMe(req.user.uid, req.body);
    res.json(data);
  }),

  addFcmToken: asyncHandler(async (req, res) => {
    await usersService.addFcmToken(req.user.uid, req.body.token);
    res.status(204).send();
  }),

  sendFcmTest: asyncHandler(async (req, res) => {
    const data = await usersService.sendFcmTest(req.user.uid, req.user.role);
    res.json(data);
  }),

  removeFcmToken: asyncHandler(async (req, res) => {
    const token = req.body?.token || req.query?.token;
    await usersService.removeFcmToken(req.user.uid, token);
    res.status(204).send();
  }),
};
