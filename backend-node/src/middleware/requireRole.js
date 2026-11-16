// 💡 Concept & Analogie : Comme un badge d'accès magnétique qui n'ouvre que les portes du service autorisé (zone réservée au personnel ou aux étudiants), ce middleware filtre les accès selon le rôle présent dans le jeton.
// 🔄 Comparaison React / Flutter : Côté client, nous utilisons des composants de garde de route (`RoleRoute`) ; ce middleware en constitue le verrou impénétrable côté serveur.
// 🎯 À retenir pour la soutenance : "Le contrôle d'accès basé sur les rôles (RBAC) s'appuie sur les Custom Claims Firebase vérifiés par ce middleware pour garantir l'étanchéité absolue entre profils."
// Module : Architecture & Sécurité

import { AppError } from '../utils/AppError.js';

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Accès interdit : rôle requis [${allowedRoles.join(', ')}], rôle actuel [${req.user.role || 'AUCUN'}]`,
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}
