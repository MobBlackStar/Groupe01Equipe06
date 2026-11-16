// 💡 Concept & Analogie : Comme un laboratoire photographique qui développe, optimise et archive les clichés sur un serveur distant sécurisé, ce service téléverse les photos vers le CDN Cloudinary.
// 🔄 Comparaison React / Flutter : React envoie un `FormData` via `fetch`/`axios` ; Flutter envoie un `FormData` multipart via Dio.
// 🎯 À retenir pour la soutenance : "Nous stockons les images sur Cloudinary avec un CDN mondial et une limitation de taille à 5 Mo pour préserver la bande passante mobile."
// Module : Médias & Téléversements

import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

let isCloudinaryConfigured = false;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  isCloudinaryConfigured = true;
}

export const uploadsService = {
  /**
   * Téléverse une image en mémoire vers Cloudinary ou produit une URL de secours en mode local/test.
   * @param {Express.Multer.File} file - Fichier extrait par Multer
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async uploadImage(file) {
    if (!file || !file.buffer) {
      throw new AppError('Fichier image manquant', 400, 'FILE_MISSING');
    }

    // Validation du type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError('Format d image non supporté. Utilisez JPEG, PNG ou WEBP', 422, 'INVALID_FILE_TYPE');
    }

    // Vérification de la taille (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError('L image ne doit pas dépasser 5 Mo', 422, 'FILE_TOO_LARGE');
    }

    // Si Cloudinary est configuré en production/staging
    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'campussave/offers',
            transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) {
              return reject(new AppError('Échec du téléversement vers Cloudinary', 500, 'CLOUDINARY_ERROR'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );
        stream.end(file.buffer);
      });
    }

    // Mode simulation locale / test (quand aucune clé Cloudinary n'est fournie)
    const mockPublicId = `campussave/dev_${Date.now()}`;
    const mockUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80&sig=${Date.now()}`;
    return {
      url: mockUrl,
      publicId: mockPublicId,
    };
  },
};
