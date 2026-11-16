// 💡 Concept & Analogie : Comme le guichet des inscriptions d'une université qui vérifie vos identifiants avant de vous remettre votre carte d'étudiant, ce module gère l'enregistrement et la configuration des profils.
// 🔄 Comparaison React / Flutter : Consommé par `RegisterPage` en React et `RegisterScreen` en Flutter lors de la première connexion.
// 🎯 À retenir pour la soutenance : "Ce routeur expose l'initialisation de profil et la liaison de rôle après l'authentification Firebase."
// Module : Architecture Backend

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { registerProfileSchema } from './auth.schemas.js';

export const authRouter = Router();

// Inscription initiale et attribution de rôle
authRouter.post(
  '/register-profile',
  authenticate,
  validate({ body: registerProfileSchema }),
  authController.registerProfile
);
