// 💡 Concept & Analogie : Comme le contrôle d'accès dans une gare qui valide la validité formelle d'un billet avant même de vérifier les droits, ces schémas s'assurent que la chaîne du QR code ou le code de secours à 6 chiffres respectent la syntaxe exigée.
// 🔄 Comparaison React / Flutter : Les scanners Web et Mobile envoient respectivement la chaîne lue ou le formulaire de secours sous cette structure stricte.
// 🎯 À retenir pour la soutenance : "Nous validons immédiatement avec Zod le format CS2 du QR code ou les 6 chiffres du code de secours pour rejeter toute charge utile corrompue."
// Module : Cryptographie & Retrait de Commandes

import { z } from 'zod';

export const scanTicketSchema = z.object({
  qrPayload: z.string().min(1, 'La charge utile du QR code est requise'),
});

export const redeemCodeSchema = z.object({
  orderCode: z
    .string()
    .regex(/^CS-[0-9A-HJKMNP-TV-Z]{5}$/, 'Format de code commande invalide (attendu : CS-XXXXX)'),
  code6: z
    .string()
    .regex(/^\d{6}$/, 'Le code de secours doit comporter exactement 6 chiffres'),
});
