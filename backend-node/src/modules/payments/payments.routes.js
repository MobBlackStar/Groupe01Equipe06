// 💡 Concept & Analogie : Routeur Express définissant les points de terminaison pour Passerelle de paiement Konnect et webhooks de confirmation.
// 🔄 Comparaison React / Flutter : Contrat d API consommé de façon symétrique par Web et Mobile.
// 🎯 À retenir pour la soutenance : "Nous isolons la déclaration des routes par domaine fonctionnel pour une maintenance modulaire."
// Module : Logique Métier Backend

import { Router } from 'express';
export const paymentsRouter = Router();
