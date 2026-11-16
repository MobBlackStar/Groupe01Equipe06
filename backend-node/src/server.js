// 💡 Concept & Analogie : Comme le chef de gare qui ouvre les portes de la station et s'assure que les trains partent à l'heure, ce fichier démarre le serveur HTTP et écoute les requêtes entrantes.
// 🔄 Comparaison React / Flutter : Le serveur Node.js est le point d'ancrage central unique auquel se connectent indifféremment l'application Web React et l'application Mobile Flutter.
// 🎯 À retenir pour la soutenance : "Ce fichier constitue le point d'entrée de notre backend Node.js, initialisant les connexions et démarrant l'écoute sur le port configuré."
// Module : Architecture & Infrastructure

import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Serveur CampusSave démarré sur le port ${PORT} [${env.NODE_ENV}]`);
});
