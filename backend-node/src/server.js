// 💡 Concept & Analogie : Comme le chef de gare qui ouvre les portes de la station et s'assure que les trains partent à l'heure, ce fichier démarre le serveur HTTP et écoute les requêtes entrantes.
// 🔄 Comparaison React / Flutter : Le serveur Node.js est le point d'ancrage central unique auquel se connectent indifféremment l'application Web React et l'application Mobile Flutter.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée de notre backend Node.js, initialisant les connexions et démarrant l'écoute sur le port configuré."
// Module : Architecture & Infrastructure

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startReservationSweeper } from './jobs/reservationSweeper.js';
import { startOfferExpirySweeper } from './jobs/offerExpirySweeper.js';
import { startNoShowSweeper } from './jobs/noShowSweeper.js';
import { startDemoAutoResetSweeper } from './jobs/demoAutoResetSweeper.js';

const PORT = env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Serveur CampusSave démarré sur le port ${PORT} [0.0.0.0] [${env.NODE_ENV}]`);
  if (env.NODE_ENV !== 'test') {
    startReservationSweeper();
    startOfferExpirySweeper();
    startNoShowSweeper();
    startDemoAutoResetSweeper(); // démo : jamais de catalogue vide (hors production, ou ALLOW_DEMO_TOKENS=true)
  }
});
