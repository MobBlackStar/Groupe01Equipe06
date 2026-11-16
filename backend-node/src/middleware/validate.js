// 💡 Concept & Analogie : Comme un filtre à café qui ne laisse passer que le liquide pur en retenant tous les résidus indésirables, ce middleware passe les données au crible d'un schéma Zod strict et nettoie les champs inconnus.
// 🔄 Comparaison React / Flutter : Même si React et Flutter effectuent déjà une pré-validation dans leurs formulaires, le backend ne fait jamais confiance au client et revalide tout de manière indépendante.
// 🎯 À retenir pour la soutenance : "Nous appliquons une validation systématique via Zod qui supprime les champs superflus (`strip`) pour prévenir toute injection de données non autorisées."
// Module : Architecture & Sécurité

import { AppError } from '../utils/AppError.js';

/**
 * Middleware d'application d'un schéma de validation Zod sur le corps, les query params ou les paramètres de route.
 * @param {object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Données de requête invalides', 422, 'VALIDATION_ERROR', details));
      }
      next(error);
    }
  };
}
