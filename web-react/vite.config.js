// 💡 Concept & Analogie : Comme un aiguilleur du ciel qui route les pièces détachées vers la chaîne d'assemblage, Vite assemble notre application React et crée un alias pour importer directement le code métier de `/shared`.
// 🔄 Comparaison React / Flutter : L'alias `@shared` permet à React de consommer le même code JavaScript pur que le backend Node.js sans duplication.
// 🎯 À retenir pour la soutenance : "Nous configurons un alias de chemin `@shared` dans Vite pour partager strictement nos calculs de prix et nos constantes entre le web et l'API."
// Module : Backend & Infrastructure (Architecture Web)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
