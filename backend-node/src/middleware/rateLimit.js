// 💡 Concept & Analogie : Comme un tourniquet de métro qui ne laisse passer les usagers qu'un par un pour éviter la cohue, la limitation de débit protège l'API contre le spam et les attaques par déni de service.
// 🔄 Comparaison React / Flutter : Le rate limiting est géré de façon transparente au niveau HTTP ; en cas de dépassement, le client reçoit un code 429 avec une invite à patienter.
// 🎯 À retenir pour la soutenance : "Nous appliquons une limitation de débit différenciée : 10 requêtes/minute pour l'IA et 20 scans/minute pour la validation des QR codes."
// Module : Architecture & Sécurité

import rateLimit from 'express-rate-limit';

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes, veuillez réessayer dans quelques minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'Limite de requêtes IA atteinte (max 10 par minute)',
    },
  },
});

export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: {
      code: 'SCAN_RATE_LIMIT_EXCEEDED',
      message: 'Limite de validation de billets atteinte (max 20 par minute)',
    },
  },
});
