// 💡 Concept & Analogie : Validation des contrats de commande empêchant toute incohérence de quantité ou de format avant l'exécution de la transaction de réservation.
// 🔄 Comparaison React / Flutter : Valide les paramètres envoyés par `OfferDetailPage` (React) et `OfferDetailScreen` (Flutter).
// 🎯 À retenir pour la soutenance : "La quantité commandée est plafonnée pour éviter l'accaparement de stock et garantir l'équité entre étudiants."
// Module : Commandes & Réservations

import { z } from 'zod';

export const createOrderSchema = z.object({
  offerId: z.string().min(1, 'L identifiant de l offre est obligatoire'),
  quantity: z.number().int().min(1, 'La quantité minimale est de 1 portion').max(50, 'La quantité maximale est de 50 portions'),
  rewardId: z.string().optional(),
});

export const rateOrderSchema = z.object({
  stars: z.number().int().min(1, 'La note minimale est de 1 étoile').max(5, 'La note maximale est de 5 étoiles'),
  comment: z.string().max(280, 'Le commentaire ne peut excéder 280 caractères').optional(),
});
