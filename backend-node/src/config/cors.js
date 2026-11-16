// 💡 Concept & Analogie : Comme une liste d'invités à une fête privée, la configuration CORS autorise exclusivement nos origines clientes connues (Vercel, Vite local, Flutter Web) à échanger avec notre API.
// 🔄 Comparaison React / Flutter : Le mécanisme CORS s'applique aux requêtes des navigateurs Web (React) ; les applications mobiles natives (Flutter Android/iOS) ne sont pas restreintes par la même politique d'origine des navigateurs.
// 🎯 À retenir pour la soutenance : "Nous restreignons strictement les origines autorisées via CORS pour bloquer toute requête malveillante cross-site."
// Module : Architecture & Infrastructure

import { env } from './env.js';

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

export const corsOptions = {
  origin: (origin, callback) => {
    // Autorise les requêtes sans origine (comme les apps mobiles ou curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine CORS non autorisée : ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
