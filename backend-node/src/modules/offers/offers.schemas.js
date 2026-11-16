// 💡 Concept & Analogie : Schémas Zod pour la publication et l'édition d'offres anti-gaspillage alimentaires.
// 🔄 Comparaison React / Flutter : Valide les soumissions des formulaires `OfferFormPage` (React) et `OfferFormScreen` (Flutter).
// 🎯 À retenir pour la soutenance : "Ces schémas valident rigoureusement les modes tarifaires et les prix stockés sous forme d'entiers stricts en millimes."
// Module : Offres & Catalogue

import { z } from 'zod';
import { OFFER_CATEGORIES, PRICING_MODES } from '../../../../shared/constants.js';

export const createOfferSchema = z.object({
  title: z.string().min(2, 'Le titre doit comporter au moins 2 caractères').max(80),
  description: z.string().max(500).optional().default(''),
  category: z.nativeEnum(OFFER_CATEGORIES),
  pricing: z.object({
    mode: z.nativeEnum(PRICING_MODES),
    originalPriceMillimes: z.number().int().positive('Le prix initial doit être strictement positif'),
    discountedPriceMillimes: z.number().int().nonnegative().optional(),
    startPriceMillimes: z.number().int().positive().optional(),
    floorPriceMillimes: z.number().int().nonnegative().optional(),
    decayStartAt: z.union([z.string(), z.number()]).optional(),
    roundingStepMillimes: z.number().int().positive().optional().default(100),
  }),
  quantity: z.number().int().min(1, 'Au moins 1 unité requise').max(50, 'Maximum 50 unités par publication'),
  pickupStartAt: z.union([z.string(), z.number()]),
  pickupEndAt: z.union([z.string(), z.number()]),
  isSurpriseBasket: z.boolean().optional().default(false),
  surpriseContents: z.union([z.array(z.string()), z.string()]).optional(),
  photoUrl: z.string().url('URL d image invalide').optional().nullable(),
});

export const updateOfferSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(OFFER_CATEGORIES).optional(),
  pricing: z.object({
    mode: z.nativeEnum(PRICING_MODES).optional(),
    originalPriceMillimes: z.number().int().positive().optional(),
    discountedPriceMillimes: z.number().int().nonnegative().optional(),
    startPriceMillimes: z.number().int().positive().optional(),
    floorPriceMillimes: z.number().int().nonnegative().optional(),
    decayStartAt: z.union([z.string(), z.number()]).optional(),
    roundingStepMillimes: z.number().int().positive().optional(),
  }).optional(),
  quantity: z.number().int().min(1).max(50).optional(),
  pickupStartAt: z.union([z.string(), z.number()]).optional(),
  pickupEndAt: z.union([z.string(), z.number()]).optional(),
  photoUrl: z.string().url().optional().nullable(),
});
