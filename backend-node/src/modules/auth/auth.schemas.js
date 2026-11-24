// 💡 Concept & Analogie : Schéma de validation Zod pour l'enregistrement d'un profil utilisateur.
// 🔄 Comparaison React / Flutter : Côté client, les formulaires React Hook Form et Flutter utilisent des règles calquées sur ce schéma.
// 🎯 À retenir pour la soutenance : "Ce schéma Zod valide strictement le rôle, le nom complet, le téléphone tunisien et la filière ESSECT."
// Module : Architecture Backend

import { z } from 'zod';
import { ROLES, FILIERES } from '../../../../shared/constants.js';

export const registerProfileSchema = z.object({
  role: z.enum([ROLES.STUDENT, ROLES.MERCHANT]),
  displayName: z.string().min(2).max(60),
  phone: z.union([
    z.string().regex(/^\+216[2-9]\d{7}$/, 'Numéro tunisien invalide (+216XXXXXXXX)'),
    z.literal(''),
    z.null(),
  ]).optional(),
  filiereId: z.union([
    z.nativeEnum(FILIERES),
    z.literal(''),
    z.null(),
  ]).optional(),
});
