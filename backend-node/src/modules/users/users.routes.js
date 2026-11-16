// 💡 Concept & Analogie : Comme le guichet de mise à jour des coordonnées étudiantes, ce routeur permet à l'utilisateur de consulter et d'ajuster son profil personnel.
// 🔄 Comparaison React / Flutter : Point de terminaison unique pour le Web et le Mobile pour l'écran de profil et la gestion des tokens push.
// 🎯 À retenir pour la soutenance : "Toutes les routes utilisateur sont protégées par le middleware d'authentification et opèrent exclusivement sur le compte du demandeur."
// Module : Logique Métier Backend

import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, fcmTokenSchema } from './users.schemas.js';

export const usersRouter = Router();

// Toutes les routes utilisateurs nécessitent un jeton d'authentification valide
usersRouter.use(authenticate);

// Consultation et modification du profil personnel
usersRouter.get('/me', usersController.getMe);
usersRouter.patch('/me', validate({ body: updateProfileSchema }), usersController.updateMe);

// Enregistrement et révocation des tokens de notifications push Firebase
usersRouter.post('/me/fcm-token', validate({ body: fcmTokenSchema }), usersController.addFcmToken);
usersRouter.delete('/me/fcm-token', usersController.removeFcmToken);
