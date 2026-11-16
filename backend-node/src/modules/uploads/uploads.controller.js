// 💡 Concept & Analogie : Contrôleur HTTP réceptionnant le flux binaire multipart et retournant l'URL publique de l'image.
// 🔄 Comparaison React / Flutter : Traite les uploads de photos d'offres soumises par les commerçants.
// 🎯 À retenir pour la soutenance : "Ce contrôleur intercepte le fichier binaire, vérifie son intégrité et délègue au service Cloudinary."
// Module : Médias & Téléversements

import { uploadsService } from './uploads.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const uploadsController = {
  uploadImage: asyncHandler(async (req, res) => {
    const result = await uploadsService.uploadImage(req.file);
    res.status(201).json(result);
  }),
};
