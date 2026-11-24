// 💡 Concept & Analogie : Comme un hall de réception d'hôtel qui applique les contrôles de sécurité (sécurité Helmet, limitation de débit, CORS) avant d'aiguiller les visiteurs vers les bons étages, ce fichier configure l'application Express.
// 🔄 Comparaison React / Flutter : Express reçoit les requêtes AJAX/Fetch de React et les requêtes Dio de Flutter sous le même format JSON standardisé.
// 🎯 À retenir pour la soutenance : "Ce module assemble les middlewares de sécurité (Helmet, CORS, rate-limit), la compression Gzip, le cache de lecture 30s et route toutes les requêtes vers l'API préfixée /api/v1."
// Module : Architecture & Infrastructure

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { serverTimeMiddleware } from './middleware/serverTime.js';
import { readCacheMiddleware } from './middleware/readCache.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../public/uploads');

const app = express();

// Configuration du reverse proxy (Render, Cloudflare, etc.) pour express-rate-limit
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(serverTimeMiddleware);
app.use(readCacheMiddleware);

// Servir les images téléversées localement
app.use('/uploads', express.static(uploadsDir));

// Montage des routes sous le préfixe officiel /api/v1
app.use('/api/v1', apiRouter);

// Gestion globale des erreurs
app.use(errorHandler);

export default app;
