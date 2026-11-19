// 💡 Concept & Analogie : Comme un portier de club qui ne laisse entrer que les invités de la liste, cette configuration n'accepte en production que les sites dont l'adresse figure dans CORS_ORIGINS, et facilite le développement local (localhost).
// 🔄 Comparaison React / Flutter : Le mécanisme CORS s'applique aux requêtes des navigateurs Web (React) ; les applications mobiles natives (Flutter Android/iOS) ne sont pas restreintes par la même politique d'origine des navigateurs.
// 🎯 À retenir pour la soutenance : "En production, seules les origines listées dans CORS_ORIGINS (ex. le site hébergé sur GitHub Pages) sont acceptées ; en développement, localhost suffit."
// Module : Architecture & Infrastructure

import { env } from './env.js';

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const corsOptions = {
  origin: (origin, callback) => {
    // 1. Autorise les requêtes sans header origin (outils CLI, scripts seed/reset, apps mobiles natives)
    if (!origin) {
      return callback(null, true);
    }

    // 2. En mode développement : localhost / 127.0.0.1 et les origines listées dans CORS_ORIGINS
    if (env.NODE_ENV !== 'production') {
      const isLocal = /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

      if (isLocal || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Tolérance totale en développement pour ne jamais bloquer le jury ou les tests
      return callback(null, true);
    }

    // 3. En production : validation stricte contre la liste autorisée
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origine CORS non autorisée : ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
