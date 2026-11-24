// 💡 Concept & Analogie : Comme un douanier qui vérifie scrupuleusement la validité de chaque document avant d'autoriser l'entrée sur le territoire, ce module valide au démarrage du serveur que toutes les variables d'environnement requises sont présentes et conformes.
// 🔄 Comparaison React / Flutter : Côté Node, nous utilisons Zod pour parser `process.env` ; côté React, Vite injecte `import.meta.env` ; côté Flutter, on utilise `--dart-define` ou un fichier d'environnement.
// 🎯 À retenir pour la soutenance : "Nous validons nos variables d'environnement avec Zod dès le démarrage pour appliquer le principe du 'fail-fast' et prévenir toute erreur de configuration silencieuse."
// Module : Architecture & Infrastructure

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Jetons de démo (test-token:/mock-token:/demo-) : actifs hors production, désactivés en production sauf ALLOW_DEMO_TOKENS=true
  ALLOW_DEMO_TOKENS: z.enum(['true', 'false']).optional(),
  PORT: z.coerce.number().default(4000),
  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),
  WEB_APP_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  FIREBASE_PROJECT_ID: z.string().default('campussave-essect-dev'),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  KONNECT_API_BASE: z.string().default('https://api.sandbox.konnect.network/api/v2'),
  KONNECT_API_KEY: z.string().optional(),
  KONNECT_RECEIVER_WALLET_ID: z.string().optional(),
  KONNECT_PAYMENT_LIFESPAN_MIN: z.coerce.number().default(10),
  QR_SECRET: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  QR_WINDOW_SECONDS: z.coerce.number().default(30),
  RESERVATION_HOLD_MINUTES: z.coerce.number().default(10),
  AI_PROVIDER: z.enum(['gemini', 'anthropic', 'none']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().default(8000),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
