// 💡 Concept & Analogie : Comme un contrôle de passeport strict à la douane qui vérifie la validité des documents avant de laisser passer le voyageur, ces schémas Zod rejettent immédiatement toute donnée invalide avant même de solliciter le serveur.
// 🔄 Comparaison React / Flutter : En React, Zod valide la structure et s'intègre avec `@hookform/resolvers/zod` ; en Flutter, nous écrivons des validateurs statiques équivalents dans `validators.dart`.
// 🎯 À retenir pour la soutenance : "Nous appliquons une validation isomorphe : les schémas Zod frontend sont le miroir exact des schémas de validation backend, assurant une intégrité totale."

import { z } from 'zod';
import { ROLES, FILIERES } from '@shared/constants.js';

/**
 * Expression régulière pour valider un numéro de téléphone mobile tunisien au format international (+216 suivi de 8 chiffres commençant par 2, 4, 5, ou 9).
 */
export const TUNISIAN_PHONE_REGEX = /^\+216[2-9]\d{7}$/;

/**
 * Schéma de connexion par identifiant (email + mot de passe)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L adresse email est obligatoire')
    .email('Format d adresse email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
});

/**
 * Schéma d'inscription multi-rôles (Étudiant ou Commerçant)
 */
export const registerSchema = z
  .object({
    role: z.enum([ROLES.STUDENT, ROLES.MERCHANT], {
      errorMap: () => ({ message: 'Veuillez sélectionner un profil (Étudiant ou Commerçant)' }),
    }),
    displayName: z
      .string()
      .min(2, 'Le nom doit comporter au moins 2 caractères')
      .max(60, 'Le nom ne peut pas dépasser 60 caractères')
      .trim(),
    email: z
      .string()
      .min(1, 'L adresse email est obligatoire')
      .email('Format d adresse email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
      .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre (0-9)'),
    phone: z
      .string()
      .regex(
        TUNISIAN_PHONE_REGEX,
        'Numéro tunisien invalide (ex: +21698123456 ou +21622123456)'
      ),
    filiereId: z
      .enum([
        FILIERES.EBUSINESS_3A,
        FILIERES.FINANCE,
        FILIERES.MARKETING,
        FILIERES.GESTION,
        FILIERES.COMPTABILITE,
      ])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.role === ROLES.STUDENT && !data.filiereId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['filiereId'],
        message: 'La filière ESSECT est obligatoire pour un compte étudiant',
      });
    }
  });

/**
 * Schéma de mise à jour du profil utilisateur
 */
export const profileSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Le nom doit comporter au moins 2 caractères')
      .max(60, 'Le nom ne peut pas dépasser 60 caractères')
      .trim(),
    phone: z
      .string()
      .regex(
        TUNISIAN_PHONE_REGEX,
        'Numéro tunisien invalide (ex: +21698123456)'
      ),
    filiereId: z
      .enum([
        FILIERES.EBUSINESS_3A,
        FILIERES.FINANCE,
        FILIERES.MARKETING,
        FILIERES.GESTION,
        FILIERES.COMPTABILITE,
      ])
      .optional()
      .nullable(),
    notificationPrefs: z
      .object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
      })
      .optional(),
  });
