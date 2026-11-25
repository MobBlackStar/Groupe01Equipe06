// 💡 Concept & Analogie : Comme le bordereau de préparation qui transforme aussi bien un ticket simple qu'un panier complet du même commerce en une liste uniforme de lignes, ces helpers garantissent zéro divergence entre backend, web et mobile.
// 🔄 Comparaison React / Flutter : En JS (Node + React via @shared), `normalizeOrderItems` unifie anciennes et nouvelles commandes ; en Flutter, `OrderModel.normalizedItems` suit exactement la même règle.
// 🎯 À retenir pour la soutenance : "Les nouvelles commandes multi-articles conservent les champs racines (offerId, offerSnapshot, quantity) et s'appuient sur items[] via un helper partagé unique."

import { BUSINESS_RULES } from './constants.js';

/**
 * Normalise n'importe quelle commande (nouveau sac multi-lignes `order.items[]` OU ancienne commande unitaire)
 * vers un tableau homogène de lignes de commande.
 */
export function normalizeOrderItems(order) {
  if (!order || typeof order !== 'object') return [];

  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(item.unitPriceMillimes ?? item.lockedUnitPriceMillimes ?? 0);
      const origPrice = Number(item.originalUnitPriceMillimes ?? unitPrice);
      const weight = Number(item.weightGramsPerUnit) || 400;
      const foodSavedGrams = Number(item.foodSavedGrams ?? qty * weight);
      const co2SavedGrams = Number(
        item.co2SavedGrams ?? Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD)
      );
      return {
        offerId: item.offerId || order.offerId || '',
        title: item.title || order.offerSnapshot?.title || 'Offre anti-gaspi',
        photoUrl: item.photoUrl ?? item.imageUrl ?? null,
        category: item.category || order.offerSnapshot?.category || 'MIXTE',
        quantity: qty,
        unitPriceMillimes: unitPrice,
        originalUnitPriceMillimes: origPrice,
        lineSubtotalMillimes: Number(item.lineSubtotalMillimes ?? unitPrice * qty),
        isSurpriseBasket: Boolean(item.isSurpriseBasket),
        rarity: item.rarity || null,
        pickupStartAt: item.pickupStartAt ?? order.offerSnapshot?.pickupStartAt ?? null,
        pickupEndAt: item.pickupEndAt ?? order.offerSnapshot?.pickupEndAt ?? null,
        weightGramsPerUnit: weight,
        foodSavedGrams,
        co2SavedGrams,
        pricingMode: item.pricingMode || 'FIXED',
      };
    });
  }

  if (!order.offerId && !order.offerSnapshot?.title) return [];

  const qty = Math.max(1, Number(order.quantity) || 1);
  const snap = order.offerSnapshot || {};
  const pricing = order.pricing || {};
  const unitPrice = Number(
    pricing.lockedUnitPriceMillimes ??
      pricing.discountedPriceMillimes ??
      Math.round((Number(pricing.subtotalMillimes ?? pricing.totalMillimes ?? 0)) / qty)
  );
  const origPrice = Number(pricing.originalUnitPriceMillimes ?? unitPrice);
  const weight = Number(snap.weightGramsPerUnit) || 400;
  const foodSavedGrams = Number(order.impact?.foodSavedGrams ?? qty * weight);
  const co2SavedGrams = Number(
    order.impact?.co2SavedGrams ?? Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD)
  );

  return [
    {
      offerId: order.offerId || '',
      title: snap.title || order.offerTitle || 'Offre anti-gaspi',
      photoUrl: snap.photoUrl ?? snap.imageUrl ?? null,
      category: snap.category || 'MIXTE',
      quantity: qty,
      unitPriceMillimes: unitPrice,
      originalUnitPriceMillimes: origPrice,
      lineSubtotalMillimes: Number(pricing.subtotalMillimes ?? unitPrice * qty),
      isSurpriseBasket: Boolean(snap.isSurpriseBasket),
      rarity: snap.rarity || null,
      pickupStartAt: snap.pickupStartAt ?? order.pickupStartAt ?? null,
      pickupEndAt: snap.pickupEndAt ?? order.pickupEndAt ?? null,
      weightGramsPerUnit: weight,
      foodSavedGrams,
      co2SavedGrams,
      pricingMode: pricing.mode || 'FIXED',
    },
  ];
}

/**
 * Formate un titre synthétique pour les vues mono-ligne et `offerSnapshot.title`.
 */
export function formatOrderSummaryTitle(items = []) {
  if (!Array.isArray(items) || items.length === 0) return 'Commande CampusSave';
  if (items.length === 1) return String(items[0].title || 'Offre CampusSave').slice(0, 80);
  const extraCount = items.length - 1;
  const suffix = ` (+${extraCount} article${extraCount > 1 ? 's' : ''})`;
  const base = String(items[0].title || 'Offre').slice(0, Math.max(10, 80 - suffix.length));
  return `${base}${suffix}`;
}

/**
 * Calcule le total des portions d'une commande normalisée.
 */
export function getTotalOrderQuantity(order) {
  const items = normalizeOrderItems(order);
  if (items.length === 0) return Math.max(1, Number(order?.quantity) || 1);
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
