// 💡 Concept & Analogie : Comme un moule en silicone qui force la pâte à prendre exactement la forme voulue sans déborder, ce schéma Zod et JSON Schema force le LLM à répondre dans une structure rigoureusement validée.
// 🔄 Comparaison React / Flutter : Le JSON validé remplit directement les champs du formulaire Web `OfferFormPage` et Mobile `OfferFormScreen`.
// 🎯 À retenir pour la soutenance : "Nous utilisons la fonctionnalité de Structured Outputs de l'API Anthropic adossée à une validation Zod stricte pour garantir l'absence totale de dérive de schéma."
// Module : Logique Métier Backend

import { z } from 'zod';
import { OFFER_CATEGORIES, PRICING_MODES, SURPRISE_RARITY } from '../../../../shared/constants.js';

export const aiSuggestionSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(500),
  category: z.nativeEnum(OFFER_CATEGORIES),
  originalPriceMillimes: z.number().int().min(500).max(100000),
  discountedPriceMillimes: z.number().int().min(100),
  startPriceMillimes: z.number().int().min(200).optional(),
  floorPriceMillimes: z.number().int().min(100).optional(),
  pricingMode: z.nativeEnum(PRICING_MODES).default(PRICING_MODES.FIXED),
  quantityTotal: z.number().int().min(1).max(100),
  weightGramsPerUnit: z.number().int().min(50).max(5000),
  isSurpriseBasket: z.boolean().default(false),
  surprise: z
    .object({
      rarity: z.nativeEnum(SURPRISE_RARITY).default(SURPRISE_RARITY.COMMON),
      teaser: z.string().max(120),
      itemCountHint: z.number().int().min(1).max(10),
    })
    .optional(),
  surpriseContents: z.string().max(300).optional(),
  surpriseItems: z
    .array(z.object({ name: z.string(), quantity: z.number().int().min(1) }))
    .optional(),
  suggestedPickupStartAt: z.string().optional(),
  suggestedPickupEndAt: z.string().optional(),
  closingHour: z.number().int().min(0).max(23).optional(),
  closingMinute: z.number().int().min(0).max(59).optional(),
});
