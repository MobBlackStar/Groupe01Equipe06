// 💡 Concept & Analogie : Validation des contrats de commande empêchant toute incohérence de quantité ou de format avant l'exécution de la transaction de réservation.
// 🔄 Comparaison React / Flutter : Valide aussi bien les réservations unitaires legacy que les sacs multi-lignes d'un même commerce.
// 🎯 À retenir pour la soutenance : "POST /orders accepte à la fois le format panier items[] (1 à 10 lignes) et l'ancien format unitaire { offerId, quantity } avec rétrocompatibilité 100 %."
// Module : Commandes & Réservations

import { z } from 'zod';

const orderItemSchema = z.object({
  offerId: z.string().min(1, 'L identifiant de l offre est obligatoire'),
  quantity: z.number().int().min(1, 'La quantité minimale est de 1 portion').max(50, 'La quantité maximale est de 50 portions'),
});

const bagOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Le sac doit contenir au moins 1 article')
    .max(10, 'Maximum 10 articles distincts par commande'),
  rewardId: z.string().optional(),
});

const legacyOrderSchema = z.object({
  offerId: z.string().min(1, 'L identifiant de l offre est obligatoire'),
  quantity: z.number().int().min(1, 'La quantité minimale est de 1 portion').max(50, 'La quantité maximale est de 50 portions'),
  rewardId: z.string().optional(),
});

export const createOrderSchema = z
  .union([bagOrderSchema, legacyOrderSchema])
  .transform((payload) => {
    if ('items' in payload && Array.isArray(payload.items)) {
      const totalQuantity = payload.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        items: payload.items,
        offerId: payload.items[0]?.offerId,
        quantity: totalQuantity,
        ...(payload.rewardId ? { rewardId: payload.rewardId } : {}),
      };
    }
    return {
      items: [{ offerId: payload.offerId, quantity: payload.quantity }],
      offerId: payload.offerId,
      quantity: payload.quantity,
      ...(payload.rewardId ? { rewardId: payload.rewardId } : {}),
    };
  });

export const rateOrderSchema = z.object({
  stars: z.number().int().min(1, 'La note minimale est de 1 étoile').max(5, 'La note maximale est de 5 étoiles'),
  comment: z.string().max(280, 'Le commentaire ne peut excéder 280 caractères').optional(),
});
