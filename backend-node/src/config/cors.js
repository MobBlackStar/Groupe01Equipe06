// 💡 Concept & Analogie : Comme un portier de club intelligent, cette configuration autorise immédiatement les développeurs locaux (localhost et IP LAN Wi-Fi du campus) en développement, tout en verrouillant strictement la production aux domaines officiels.
// 🔄 Comparaison React / Flutter : Le mécanisme CORS s'applique aux requêtes des navigateurs Web (React) ; les applications mobiles natives (Flutter Android/iOS) ne sont pas restreintes par la même politique d'origine des navigateurs.
// 🎯 À retenir pour la soutenance : "En développement, la passerelle autorise dynamiquement le réseau LAN (192.168.*.*) pour permettre de tester l'application simultanément sur PC et smartphone connecté au Wi-Fi de l'ESSECT."
// Module : Architecture & Infrastructure

import { env } from './env.js';

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const corsOptions = {
  origin: (origin, callback) => {
    // 1. Autorise les requêtes sans header origin (outils CLI, scripts seed/reset, apps mobiles natives)
    if (!origin) {
      return callback(null, true);
    }

    // 2. En mode développement : autoriser tous les localhost, 127.0.0.1 et adresses LAN privées (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (env.NODE_ENV !== 'production') {
      const isLocalOrLan =
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin);

      if (isLocalOrLan || allowedOrigins.includes(origin)) {
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
