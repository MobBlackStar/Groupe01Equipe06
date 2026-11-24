// 💡 Concept & Analogie : Schémas Zod pour la modération administrateur exigeant un motif dès qu'une action punitive est engagée.
// 🔄 Comparaison React / Flutter : Valide les actions du panneau d'administration React (`AdminMerchantsPage`).
// 🎯 À retenir pour la soutenance : "Tout refus ou suspension exige obligatoirement un motif explicite consigné dans l'audit trail, avec tolérance sur les clés statusReason ou reason."
// Module : Administration & Modération

import { z } from 'zod';
import { MERCHANT_STATUS, USER_STATUS, ROLES } from '../../../../shared/constants.js';
import { createMerchantSchema } from '../merchants/merchants.schemas.js';

export const updateMerchantStatusSchema = z.object({
  status: z.enum([
    MERCHANT_STATUS.APPROVED,
    MERCHANT_STATUS.REJECTED,
    MERCHANT_STATUS.SUSPENDED,
    MERCHANT_STATUS.PENDING,
  ]),
  statusReason: z.string().optional(),
  reason: z.string().optional(),
}).transform((data) => ({
  ...data,
  statusReason: data.statusReason || data.reason,
})).refine(
  (data) => {
    if ([MERCHANT_STATUS.REJECTED, MERCHANT_STATUS.SUSPENDED].includes(data.status)) {
      return !!data.statusReason && data.statusReason.trim().length >= 3;
    }
    return true;
  },
  {
    message: 'Un motif d au moins 3 caractères est obligatoire pour refuser ou suspendre un commerce',
    path: ['statusReason'],
  }
);

export const updateUserStatusSchema = z.object({
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]),
  statusReason: z.string().optional(),
  reason: z.string().optional(),
}).transform((data) => ({
  ...data,
  statusReason: data.statusReason || data.reason,
})).refine(
  (data) => {
    if (data.status === USER_STATUS.SUSPENDED) {
      return !!data.statusReason && data.statusReason.trim().length >= 3;
    }
    return true;
  },
  {
    message: 'Un motif d au moins 3 caractères est obligatoire pour suspendre un utilisateur',
    path: ['statusReason'],
  }
);

/** Modification complète d'un utilisateur par un administrateur. */
export const updateUserDataSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères').max(80).optional(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Format de téléphone invalide (+216...)').optional().nullable(),
  filiereId: z.string().optional().nullable(),
  role: z.enum([ROLES.STUDENT, ROLES.MERCHANT, ROLES.ADMIN]).optional(),
});

/** Spot de démonstration créé par un administrateur : mêmes champs qu'un commerce (le rayon de 3 km est vérifié par le service). */
export const createSpotSchema = createMerchantSchema;

/** Déplacement d'un spot / commerce par un administrateur. */
export const updateSpotLocationSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

/** Suppression : archivage par défaut ; `hard=true` n'est accepté que pour un spot de démonstration sans offre active. */
export const deleteSpotQuerySchema = z.object({
  hard: z.enum(['true', 'false']).optional().default('false'),
});
