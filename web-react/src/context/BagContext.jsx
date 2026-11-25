// 💡 Concept & Analogie : Comme un cabas personnel posé sur le comptoir d'un seul restaurant : tant qu'il n'est pas validé, il vit dans votre navigateur (localStorage) ; dès qu'on change de restaurant, un choix explicite s'impose.
// 🔄 Comparaison React / Flutter : En React, `BagContext` orchestre l'état mono-commerçant avec recalcul Smart Decay par seconde ; en Flutter, `BagService` (`ChangeNotifier`) suit exactement la même règle métier.
// 🎯 À retenir pour la soutenance : "1 Sac = 1 Seul Commerce = 1 Réservation Atomique. Zéro collection Firestore temporaire inutile avant la validation réelle."
// Module : Sac Mono-Commerçant (Client)

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { computeUnitPrice } from '@shared/pricing.js';
import { calculateImpact } from '@shared/impact.js';
import { BUSINESS_RULES } from '@shared/constants.js';

const STORAGE_KEY = 'campussave_bag_v1';
const EMPTY_BAG = { merchantId: null, merchantName: '', items: [] };

const BagContext = createContext(null);

function extractMerchantId(offer) {
  return offer?.merchantId || offer?.merchantSnapshot?.id || offer?.merchant?.id || null;
}

function extractMerchantName(offer) {
  return offer?.merchantName || offer?.merchantSnapshot?.name || offer?.merchant?.name || 'Commerce Montfleury';
}

function buildOfferSnapshot(offer) {
  return {
    id: offer.id || offer._id,
    offerId: offer.id || offer._id,
    title: offer.title || 'Offre anti-gaspi',
    photoUrl: offer.photoUrl || offer.imageUrl || null,
    imageUrl: offer.imageUrl || offer.photoUrl || null,
    category: offer.category || 'MIXTE',
    isSurpriseBasket: Boolean(offer.isSurpriseBasket || offer.surprise),
    rarity: offer.rarity || offer.surprise?.rarity || null,
    pickupStartAt: offer.pickupStartAt,
    pickupEndAt: offer.pickupEndAt,
    weightGramsPerUnit: Number(offer.weightGramsPerUnit || offer.weightGrams) || 400,
    pricing: offer.pricing || null,
    pricingType: offer.pricingType || offer.pricing?.mode || 'FIXED',
    originalPriceMillimes: offer.pricing?.originalPriceMillimes ?? offer.originalPriceMillimes ?? 0,
    discountedPriceMillimes: offer.pricing?.discountedPriceMillimes ?? offer.discountedPriceMillimes ?? 0,
    startPriceMillimes: offer.pricing?.startPriceMillimes ?? offer.startPriceMillimes ?? null,
    floorPriceMillimes: offer.pricing?.floorPriceMillimes ?? offer.floorPriceMillimes ?? null,
    quantityAvailable: offer.quantityAvailable ?? offer.remainingQuantity ?? offer.quantity ?? 10,
    maxPerOrder: offer.maxPerOrder || 50,
    merchantId: extractMerchantId(offer),
    merchantName: extractMerchantName(offer),
  };
}

function loadInitialBag() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_BAG;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY_BAG;
    if (parsed.items.length === 0) return EMPTY_BAG;
    return {
      merchantId: parsed.merchantId || null,
      merchantName: parsed.merchantName || '',
      items: parsed.items.filter((it) => it?.offerId && Number(it.quantity) > 0),
    };
  } catch {
    return EMPTY_BAG;
  }
}

export function BagProvider({ children }) {
  const [bag, setBag] = useState(loadInitialBag);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [conflictPending, setConflictPending] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
    } catch {
      // Ignorer si stockage navigateur restreint
    }
  }, [bag]);

  // Recalcul Smart Decay toutes les secondes uniquement quand le sac contient au moins 1 article
  useEffect(() => {
    if (bag.items.length === 0) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [bag.items.length]);

  const upsertIntoBag = useCallback((currentBag, offer, qtyToAdd) => {
    const offerId = offer.id || offer._id;
    const snapshot = buildOfferSnapshot(offer);
    const maxCap = Math.min(snapshot.maxPerOrder || 50, snapshot.quantityAvailable || 50, 50);
    const existingIdx = currentBag.items.findIndex((it) => it.offerId === offerId);

    const nextItems = [...currentBag.items];
    if (existingIdx >= 0) {
      const nextQty = Math.min(maxCap, nextItems[existingIdx].quantity + qtyToAdd);
      nextItems[existingIdx] = { ...nextItems[existingIdx], quantity: Math.max(1, nextQty), offerSnapshot: snapshot };
    } else {
      nextItems.push({ offerId, quantity: Math.min(maxCap, Math.max(1, qtyToAdd)), offerSnapshot: snapshot });
    }

    return {
      merchantId: snapshot.merchantId,
      merchantName: snapshot.merchantName,
      items: nextItems,
    };
  }, []);

  const addToBag = useCallback(
    (offer, quantity = 1, { openDrawer = true } = {}) => {
      if (!offer) return false;
      const incomingMerchantId = extractMerchantId(offer);
      const incomingMerchantName = extractMerchantName(offer);

      if (bag.items.length > 0 && bag.merchantId && incomingMerchantId && bag.merchantId !== incomingMerchantId) {
        setConflictPending({
          offer,
          quantity: Math.max(1, Number(quantity) || 1),
          incomingMerchantName,
          openDrawer,
        });
        return false;
      }

      setBag((prev) => upsertIntoBag(prev, offer, Math.max(1, Number(quantity) || 1)));
      if (openDrawer) setIsBagOpen(true);
      return true;
    },
    [bag.items.length, bag.merchantId, upsertIntoBag]
  );

  const confirmReplaceMerchant = useCallback(() => {
    if (!conflictPending) return;
    const { offer, quantity, openDrawer } = conflictPending;
    setBag(upsertIntoBag(EMPTY_BAG, offer, quantity));
    setConflictPending(null);
    if (openDrawer) setIsBagOpen(true);
  }, [conflictPending, upsertIntoBag]);

  const cancelReplaceMerchant = useCallback(() => {
    setConflictPending(null);
  }, []);

  const updateQuantity = useCallback((offerId, nextQuantity) => {
    setBag((prev) => {
      const qty = Math.round(Number(nextQuantity) || 0);
      if (qty <= 0) {
        const filtered = prev.items.filter((it) => it.offerId !== offerId);
        return filtered.length === 0 ? EMPTY_BAG : { ...prev, items: filtered };
      }
      const nextItems = prev.items.map((it) => {
        if (it.offerId !== offerId) return it;
        const maxCap = Math.min(it.offerSnapshot?.maxPerOrder || 50, it.offerSnapshot?.quantityAvailable || 50, 50);
        return { ...it, quantity: Math.min(maxCap, Math.max(1, qty)) };
      });
      return { ...prev, items: nextItems };
    });
  }, []);

  const removeItem = useCallback((offerId) => {
    setBag((prev) => {
      const filtered = prev.items.filter((it) => it.offerId !== offerId);
      return filtered.length === 0 ? EMPTY_BAG : { ...prev, items: filtered };
    });
  }, []);

  const clearBag = useCallback(() => {
    setBag(EMPTY_BAG);
    setConflictPending(null);
  }, []);

  const pricedItems = useMemo(() => {
    return bag.items.map((item) => {
      const snap = item.offerSnapshot || {};
      const unitPriceMillimes = computeUnitPrice(snap, now);
      const originalUnitPriceMillimes =
        Number(snap.pricing?.originalPriceMillimes ?? snap.originalPriceMillimes) || unitPriceMillimes;
      const lineSubtotalMillimes = unitPriceMillimes * item.quantity;
      const weightGramsPerUnit = Number(snap.weightGramsPerUnit) || 400;
      const foodSavedGrams = weightGramsPerUnit * item.quantity;
      return {
        ...item,
        unitPriceMillimes,
        originalUnitPriceMillimes,
        lineSubtotalMillimes,
        foodSavedGrams,
        co2SavedGrams: Math.round(foodSavedGrams * BUSINESS_RULES.CO2_FACTOR_PER_GRAM_FOOD),
      };
    });
  }, [bag.items, now]);

  const totals = useMemo(() => {
    const totalCount = pricedItems.reduce((sum, it) => sum + it.quantity, 0);
    const subtotalMillimes = pricedItems.reduce((sum, it) => sum + it.lineSubtotalMillimes, 0);
    const originalTotalMillimes = pricedItems.reduce(
      (sum, it) => sum + it.originalUnitPriceMillimes * it.quantity,
      0
    );
    const foodSavedGrams = pricedItems.reduce((sum, it) => sum + it.foodSavedGrams, 0);
    const impact = calculateImpact(foodSavedGrams);
    return {
      totalCount,
      distinctCount: pricedItems.length,
      subtotalMillimes,
      originalTotalMillimes,
      savedBeforeRewardMillimes: Math.max(0, originalTotalMillimes - subtotalMillimes),
      foodSavedGrams,
      co2SavedGrams: impact.co2SavedGrams,
    };
  }, [pricedItems]);

  const value = useMemo(
    () => ({
      bag,
      pricedItems,
      totals,
      isBagOpen,
      conflictPending,
      openBag: () => setIsBagOpen(true),
      closeBag: () => setIsBagOpen(false),
      toggleBag: () => setIsBagOpen((v) => !v),
      addToBag,
      confirmReplaceMerchant,
      cancelReplaceMerchant,
      updateQuantity,
      removeItem,
      clearBag,
    }),
    [
      bag,
      pricedItems,
      totals,
      isBagOpen,
      conflictPending,
      addToBag,
      confirmReplaceMerchant,
      cancelReplaceMerchant,
      updateQuantity,
      removeItem,
      clearBag,
    ]
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) {
    throw new Error('useBag doit être utilisé à l intérieur de BagProvider');
  }
  return ctx;
}
