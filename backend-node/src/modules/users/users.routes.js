// 💡 Concept & Analogie : Routeur Express définissant les points de terminaison pour Gestion des profils utilisateurs et tokens push FCM.
// 🔄 Comparaison React / Flutter : Contrat d API consommé de façon symétrique par Web et Mobile.
// 🎯 À retenir pour la soutenance : "Nous isolons la déclaration des routes par domaine fonctionnel pour une maintenance modulaire."
// Module : Logique Métier Backend

import { Router } from 'express';
export const usersRouter = Router();
