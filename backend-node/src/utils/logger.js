// 💡 Concept & Analogie : Comme la boîte noire d'un avion qui consigne chaque manœuvre et anomalie avec un horodatage précis, ce logger structuré enregistre les événements serveur au format JSON.
// 🔄 Comparaison React / Flutter : Permet un suivi télémétrique propre en production sans polluer la sortie standard par des `console.log` sauvages.
// 🎯 À retenir pour la soutenance : "Nous utilisons Pino pour produire des journaux applicatifs structurés et performants adaptés à un environnement de production sur le cloud."
// Module : Architecture & Infrastructure

import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
