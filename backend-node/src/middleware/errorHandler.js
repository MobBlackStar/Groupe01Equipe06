// 💡 Concept & Analogie : Comme un filet de sécurité sous des trapézistes, ce gestionnaire capture toute exception non interceptée et renvoie un message d'erreur standardisé sans jamais divulguer les détails internes du serveur.
// 🔄 Comparaison React / Flutter : Nos deux applications clientes reçoivent une enveloppe d'erreur identique `{ error: { code, message, details } }` facilitant l'affichage de notifications explicites à l'utilisateur.
// 🎯 À retenir pour la soutenance : "Ce gestionnaire d'erreur global uniformise nos retours HTTP et masque les stack traces en production pour respecter les meilleures pratiques de sécurité."
// Module : Architecture & Infrastructure

import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Une erreur inattendue est survenue';

  logger.error({
    err,
    statusCode,
    errorCode,
    url: req.originalUrl,
    method: req.method,
  }, message);

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details: err.details || null,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
    serverTime: Date.now(),
  });
}
