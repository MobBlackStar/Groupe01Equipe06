// 💡 Concept & Analogie : Schémas Zod pour valider la création et la mise à jour d'un commerce partenaire.
// 🔄 Comparaison React / Flutter : Miroir des validations clientes pour bloquer les saisies invalides avant traitement.
// 🎯 À retenir pour la soutenance : "Ces schémas vérifient strictement les types de commerce agréés et le format de numéro tunisien."
// Module : Commerces & Partenaires

import { z } from 'zod';
import { MERCHANT_TYPES } from '../../../../shared/constants.js';

export const createMerchantSchema = z.object({
  name: z.string().min(2, 'Le nom du commerce doit comporter au moins 2 caractères').max(80),
  type: z.nativeEnum(MERCHANT_TYPES),
  description: z.string().max(500).optional().default(''),
  phone: z.string().regex(/^\+216[2-9]\d{7}$/, 'Numéro tunisien invalide (+216XXXXXXXX)'),
  address: z.object({
    street: z.string().min(3, 'Adresse requise'),
    area: z.string().default('Montfleury'),
    city: z.string().default('Tunis'),
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  openingHours: z.string().trim().max(80, 'Horaires trop longs (80 caractères maximum)').optional().nullable(),
  logoUrl: z.string().url('URL de logo invalide').optional().nullable(),
  coverImageUrl: z.string().url('URL d image invalide').optional().nullable(),
});

export const updateMerchantSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  type: z.nativeEnum(MERCHANT_TYPES).optional(),
  description: z.string().max(500).optional(),
  phone: z.string().regex(/^\+216[2-9]\d{7}$/, 'Numéro tunisien invalide (+216XXXXXXXX)').optional(),
  address: z.object({
    street: z.string().min(3).optional(),
    area: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  openingHours: z.string().trim().max(80).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});
