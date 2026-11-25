// 💡 Concept & Analogie : Schémas Zod validant la structure des paramètres et données pour users.
// 🔄 Comparaison React / Flutter : Miroir des validations clientes pour bloquer les entrées non conformes.
// 🎯 À retenir pour la soutenance : "Nous utilisons Zod pour garantir un typage runtime strict dès l entrée de chaque endpoint."
// Module : Logique Métier Backend

import { z } from 'zod';
import { isValidAvatarValue } from '../../../../shared/avatars.js';
import { FILIERES } from '../../../../shared/constants.js';
import { normalizeTunisianPhone } from '../auth/auth.service.js';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(60).optional(),
  phone: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : normalizeTunisianPhone(v)),
    z.string().regex(/^\+216[2-9]\d{7}$/, 'Numéro tunisien invalide (+216XXXXXXXX)').nullable()
  ).optional(),
  avatarUrl: z.string().refine(isValidAvatarValue, 'Avatar invalide (adresse http(s) ou avatar prédéfini)').optional().nullable(),
  filiereId: z.nativeEnum(FILIERES).optional().nullable(),
  notificationPrefs: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    dailyDigest: z.boolean().optional(),
  }).optional(),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(10, 'Le jeton FCM doit contenir au moins 10 caractères'),
});
