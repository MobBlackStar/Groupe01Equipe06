// 💡 Concept & Analogie : Comme un hall de réception d'hôtel qui applique les contrôles de sécurité (sécurité Helmet, limitation de débit, CORS) avant d'aiguiller les visiteurs vers les bons étages, ce fichier configure l'application Express.
// 🔄 Comparaison React / Flutter : Express reçoit les requêtes AJAX/Fetch de React et les requêtes Dio de Flutter sous le même format JSON standardisé.
// 🎯 À retenir pour la soutenance : "Ce module assemble les middlewares de sécurité (Helmet, CORS, rate-limit), les analyseurs de requêtes et route toutes les requêtes vers l'API préfixée /api/v1."
// Module : Architecture & Infrastructure

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { serverTimeMiddleware } from './middleware/serverTime.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes.js';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(serverTimeMiddleware);

// Montage des routes sous le préfixe officiel /api/v1
app.use('/api/v1', apiRouter);

// Gestion globale des erreurs
app.use(errorHandler);

export default app;
