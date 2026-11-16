// 💡 Concept & Analogie : Comme le guichet de réception des colis d'un bureau de poste, ce routeur filtre la taille et le format des fichiers avant expédition.
// 🔄 Comparaison React / Flutter : Point d'entrée pour les formulaires d'offres `OfferFormPage` (React) et `OfferFormScreen` (Flutter).
// 🎯 À retenir pour la soutenance : "Multer traite les fichiers en mémoire vive avec un plafond strict de 5 Mo avant envoi vers Cloudinary."
// Module : Médias & Téléversements

import { Router } from 'express';
import multer from 'multer';
import { uploadsController } from './uploads.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
});

export const uploadsRouter = Router();

// Téléversement d'image réservé aux utilisateurs authentifiés
uploadsRouter.post('/image', authenticate, upload.single('file'), uploadsController.uploadImage);
