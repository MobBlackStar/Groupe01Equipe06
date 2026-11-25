// 💡 Concept & Analogie : Validation des paramètres pour les requêtes d'initialisation et de vérification de paiement électronique.
// 🔄 Comparaison React / Flutter : Valide les requêtes issues de la page de checkout web ou de l'écran de paiement Flutter.
// 🎯 À retenir pour la soutenance : "Nous contrôlons rigoureusement la présence de l'orderId pour chaque étape de la transaction financière."
// Module : Paiements & Konnect

import { z } from 'zod';

export const initPaymentSchema = z.object({
  orderId: z.string().min(1, 'L identifiant de la commande est obligatoire'),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'L identifiant de la commande est obligatoire'),
  paymentRef: z.string().nullish(), // absent en passerelle simulée ; le serveur retrouve alors la référence de la commande
  receiptEmail: z.string().email('Adresse e-mail invalide').or(z.literal('')).nullish(),
});

export const emailTestSchema = z.object({
  email: z.string().email('Adresse e-mail invalide').optional().or(z.literal('')),
});
