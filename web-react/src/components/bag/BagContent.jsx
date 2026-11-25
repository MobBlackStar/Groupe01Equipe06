// 💡 Concept & Analogie : Inspiré de la colonne de droite/gauche de Fika : un sac tactile en papier crème dentelé (« DANS MON SAC · Nom du Commerce ») suivi des pilules rapides « COMPLÉTER AVEC CE COMMERCE » pour sauver dessert ou boisson en 1 clic.
// 🔄 Comparaison React / Flutter : Composant partagé entre le tiroir latéral (`BagDrawer`) et la page dédiée (`BagPage`) ; côté Flutter, `BagSheet` / `BagScreen` offre le même flux.
// 🎯 À retenir pour la soutenance : "Une seule requête POST /orders envoie tout le sac atomiquement avec le coupon fidélité choisi, puis vide le panier et redirige vers Checkout Konnect."
// Module : UI Sac Mono-Commerçant

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Leaf, Flame, AlertTriangle, PlusCircle } from 'lucide-react';
import { useBag } from '../../context/BagContext.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTND } from '@shared/money.js';
import { rewardKey } from '@shared/loyalty.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { resolveOfferImage, SAFE_FOOD_FALLBACK_IMG } from '../../lib/offerImages.js';

export default function BagContent({ onClose }) {
  const navigate = useNavigate();
  const { bag, pricedItems, totals, addToBag, updateQuantity, removeItem, clearBag } = useBag();

  const [sameMerchantOffers, setSameMerchantOffers] = useState([]);
  const [loadingUpsells, setLoadingUpsells] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [selectedRewardId, setSelectedRewardId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Charger les autres offres actives du même commerce pour « Compléter avec ce commerce »
  useEffect(() => {
    if (!bag.merchantId) {
      setSameMerchantOffers([]);
      return undefined;
    }
    let alive = true;
    setLoadingUpsells(true);
    apiClient
      .get(ENDPOINTS.OFFERS, { params: { merchantId: bag.merchantId, status: 'ACTIVE', limit: 30 } })
      .then((res) => {
        if (!alive) return;
        const raw = res.data?.offers || res.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setSameMerchantOffers(list.filter((o) => (o.merchantId || o.merchantSnapshot?.id) === bag.merchantId));
      })
      .catch(() => {
        if (alive) setSameMerchantOffers([]);
      })
      .finally(() => {
        if (alive) setLoadingUpsells(false);
      });

    return () => {
      alive = false;
    };
  }, [bag.merchantId]);

  // Charger les coupons fidélité disponibles
  useEffect(() => {
    let alive = true;
    apiClient
      .get(ENDPOINTS.LOYALTY_ME)
      .then((res) => {
        if (!alive) return;
        const available = (res.data?.rewards || []).filter((r) => {
          if (r.status !== 'AVAILABLE') return false;
          if (!r.expiresAt) return true;
          const ms = r.expiresAt?._seconds ? r.expiresAt._seconds * 1000 : new Date(r.expiresAt).getTime();
          return !Number.isFinite(ms) || ms > Date.now();
        });
        setRewards(available);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const inBagIds = useMemo(() => new Set(pricedItems.map((it) => it.offerId)), [pricedItems]);

  const complementaryOffers = useMemo(() => {
    const nowMs = Date.now();
    return sameMerchantOffers.filter((o) => {
      const oid = o.id || o._id;
      if (!oid || inBagIds.has(oid)) return false;
      const qtyAvail = o.quantityAvailable ?? o.remainingQuantity ?? 0;
      if (qtyAvail <= 0) return false;
      const endMs = o.pickupEndAt?._seconds
        ? o.pickupEndAt._seconds * 1000
        : new Date(o.pickupEndAt || 0).getTime();
      return !Number.isFinite(endMs) || endMs > nowMs;
    });
  }, [sameMerchantOffers, inBagIds]);

  const commonSurpriseLine = useMemo(
    () => pricedItems.find((it) => it.offerSnapshot?.isSurpriseBasket && it.offerSnapshot?.rarity === 'COMMON'),
    [pricedItems]
  );

  const selectedReward = useMemo(
    () => rewards.find((r) => rewardKey(r) === selectedRewardId) || null,
    [rewards, selectedRewardId]
  );

  // Si un coupon FREE_SURPRISE était sélectionné mais le panier surprise COMMON a été retiré, on le désélectionne
  useEffect(() => {
    if (selectedReward?.type === 'FREE_SURPRISE' && !commonSurpriseLine) {
      setSelectedRewardId(null);
    }
  }, [selectedReward, commonSurpriseLine]);

  let rewardDiscountMillimes = 0;
  if (selectedReward) {
    if (selectedReward.type === 'FREE_SURPRISE' && commonSurpriseLine) {
      rewardDiscountMillimes = commonSurpriseLine.unitPriceMillimes;
    } else if (selectedReward.type === 'PERCENT_OFF') {
      rewardDiscountMillimes = Math.round((totals.subtotalMillimes * (selectedReward.percentOff || 10)) / 100);
    }
    if (Number.isInteger(selectedReward.maxDiscountMillimes)) {
      rewardDiscountMillimes = Math.min(rewardDiscountMillimes, selectedReward.maxDiscountMillimes);
    }
  }

  const finalTotalMillimes = Math.max(0, totals.subtotalMillimes - rewardDiscountMillimes);
  const totalSavingsMillimes = totals.savedBeforeRewardMillimes + rewardDiscountMillimes;

  async function handleCheckoutBag() {
    if (pricedItems.length === 0 || submitting) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        items: pricedItems.map((it) => ({
          offerId: it.offerId,
          quantity: it.quantity,
        })),
        ...(selectedRewardId ? { rewardId: selectedRewardId } : {}),
      };
      const res = await apiClient.post(ENDPOINTS.ORDERS.CREATE, payload);
      const created = res.data?.order || res.data || {};
      const orderId = created.orderId || created.id;
      if (!orderId) {
        throw new Error('Identifiant de commande manquant');
      }
      clearBag();
      onClose?.();
      navigate(`/app/checkout/${orderId}`);
    } catch (err) {
      const serverMsg = err?.response?.data?.error?.message;
      setErrorMsg(serverMsg || 'Impossible de valider votre sac : vérifiez le stock disponible.');
    } finally {
      setSubmitting(false);
    }
  }

  if (pricedItems.length === 0) {
    return (
      <div className="cs-receipt rounded-t-[1.25rem] p-6 sm:p-8 text-center text-[#111111]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#EDE6D7] border-2 border-[#111111] flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-[#DA0711]" aria-hidden="true" />
        </div>
        <p className="cs-label mb-2">Sac mono-commerçant</p>
        <h2 className="cs-h3 text-2xl">Votre sac est vide</h2>
        <p className="text-base text-[#5E5850] mt-2 max-w-sm mx-auto">
          Ajoutez un ou plusieurs plats d'un même commerce de Montfleury pour tout réserver en un seul Living Ticket.
        </p>
        <Link
          to="/app/explore"
          onClick={onClose}
          className="cs-btn cs-btn-red mt-6 inline-flex"
        >
          Explorer les offres
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="cs-receipt rounded-t-[1.25rem] p-5 sm:p-7 text-[#111111]">
      {/* Bande rouge en-tête type ticket */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-[#111111]">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A3A] shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-mono font-bold uppercase tracking-[0.16em] text-[#5E5850]">
              Dans mon sac
            </span>
          </div>
          <h2 className="font-display uppercase text-2xl sm:text-3xl leading-tight mt-0.5 truncate">
            {bag.merchantName}
          </h2>
        </div>
        <button
          type="button"
          onClick={clearBag}
          className="text-xs font-bold uppercase tracking-wide text-[#5E5850] hover:text-[#DA0711] underline underline-offset-4 cursor-pointer"
        >
          Vider
        </button>
      </div>

      {/* Articles du sac */}
      <ul className="divide-y-2 divide-dashed divide-[#111111]/15">
        {pricedItems.map((item) => {
          const snap = item.offerSnapshot || {};
          const photo =
            snap.photoUrl ||
            snap.imageUrl ||
            resolveOfferImage({
              category: snap.category,
              title: snap.title,
              isSurpriseBasket: snap.isSurpriseBasket,
            });
          const isDutch = (snap.pricingType || snap.pricing?.mode) === 'DUTCH_AUCTION';
          const maxCap = Math.min(snap.maxPerOrder || 50, snap.quantityAvailable || 50, 50);

          return (
            <li key={item.offerId} className="py-4 flex items-start gap-3.5">
              <img
                src={photo}
                alt={snap.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = SAFE_FOOD_FALLBACK_IMG;
                }}
                className="w-16 h-16 rounded-xl object-cover border-2 border-[#111111] shrink-0 bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-[15px] leading-snug line-clamp-2">{snap.title}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.offerId)}
                    aria-label={`Retirer ${snap.title}`}
                    className="p-1.5 rounded-lg text-[#5E5850] hover:text-[#DA0711] hover:bg-[#EDE6D7] transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#111111] bg-white px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.offerId, item.quantity - 1)}
                      aria-label={`Diminuer ${snap.title}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDE6D7] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-sm tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={item.quantity >= maxCap}
                      onClick={() => updateQuantity(item.offerId, item.quantity + 1)}
                      aria-label={`Augmenter ${snap.title}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDE6D7] disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-xl text-[#DA0711] tabular-nums">
                      {formatTND(item.lineSubtotalMillimes)}
                    </span>
                    <span className="block text-[11px] font-mono text-[#5E5850]">
                      {formatTND(item.unitPriceMillimes)}/u {isDutch && <Flame className="inline w-3 h-3 text-[#DA0711]" />}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Section Fika : COMPLÉTER AVEC CE COMMERCE */}
      {(loadingUpsells || complementaryOffers.length > 0) && (
        <>
          <hr className="cs-receipt-rule !my-5" />
          <section aria-label="Compléter avec ce commerce">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[12px] font-mono font-bold uppercase tracking-[0.16em] text-[#DA0711]">
                Compléter avec ce commerce
              </p>
              {loadingUpsells && <span className="text-xs text-[#5E5850]">Chargement…</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {complementaryOffers.slice(0, 6).map((extra) => {
                const extraId = extra.id || extra._id;
                const extraPrice = computeUnitPrice(extra, Date.now());
                const extraPhoto =
                  extra.photoUrl ||
                  extra.imageUrl ||
                  resolveOfferImage({
                    category: extra.category,
                    title: extra.title,
                    isSurpriseBasket: extra.isSurpriseBasket,
                  });
                return (
                  <button
                    key={extraId}
                    type="button"
                    onClick={() => addToBag(extra, 1, { openDrawer: false })}
                    className="inline-flex items-center gap-2 min-h-[42px] pl-1.5 pr-3 py-1 rounded-full border-2 border-[#111111] bg-[#FAF3E6] hover:bg-[#FFD000] transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={extraPhoto}
                      alt=""
                      aria-hidden="true"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = SAFE_FOOD_FALLBACK_IMG;
                      }}
                      className="w-7 h-7 rounded-full object-cover border border-[#111111]/40 shrink-0"
                    />
                    <span className="text-xs sm:text-[13px] font-semibold line-clamp-1 max-w-[140px]">
                      {extra.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#DA0711] shrink-0">
                      {formatTND(extraPrice)}
                    </span>
                    <PlusCircle className="w-4 h-4 text-[#111111] shrink-0" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Coupons fidélité */}
      {rewards.length > 0 && (
        <>
          <hr className="cs-receipt-rule !my-5" />
          <div>
            <p className="text-[12px] font-mono font-bold uppercase tracking-[0.16em] text-[#5E5850] mb-2.5">
              Coupon fidélité
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!selectedRewardId}
                onClick={() => setSelectedRewardId(null)}
                className="cs-chip !text-xs !min-h-[36px] !px-3"
              >
                Aucun
              </button>
              {rewards.map((r) => {
                const key = rewardKey(r);
                const disabled = r.type === 'FREE_SURPRISE' && !commonSurpriseLine;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selectedRewardId === key}
                    onClick={() => setSelectedRewardId(key)}
                    title={disabled ? 'Ajoutez un panier surprise COMMON pour utiliser ce coupon' : undefined}
                    className="cs-chip !text-xs !min-h-[36px] !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🎟️ {r.type === 'FREE_SURPRISE' ? 'Panier offert' : `−${r.percentOff || 10}%`}
                  </button>
                );
              })}
            </div>
            {selectedReward && rewardDiscountMillimes > 0 && (
              <p className="mt-2 text-xs font-bold text-[#1F7A3A]">
                Avantage appliqué : −{formatTND(rewardDiscountMillimes)}
              </p>
            )}
          </div>
        </>
      )}

      <hr className="cs-receipt-rule !my-5" />

      {/* Totaux, Impact et Validation Atomique */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline text-sm text-[#5E5850]">
          <span>{totals.totalCount} portion{totals.totalCount > 1 ? 's' : ''}</span>
          {totalSavingsMillimes > 0 && (
            <span className="font-bold text-[#1F7A3A]">
              Tu économises {formatTND(totalSavingsMillimes)}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-4 pt-1">
          <div>
            <p className="cs-label">Total à payer</p>
            <p className="font-display text-4xl sm:text-5xl leading-[0.88] text-[#DA0711] tabular-nums">
              {finalTotalMillimes === 0 && rewardDiscountMillimes > 0 ? 'OFFERT' : formatTND(finalTotalMillimes)}
            </p>
          </div>
          <span className="cs-pill cs-pill-leaf !text-xs">
            <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
            ≈ {totals.co2SavedGrams} g CO₂
          </span>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 rounded-xl border-2 border-[#DA0711] bg-white px-4 py-3 text-sm font-semibold text-[#DA0711] flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleCheckoutBag}
        className="cs-btn cs-btn-red cs-btn-lg cs-btn-block mt-5"
      >
        <span>{submitting ? 'Réservation atomique…' : 'Réserver & Payer'}</span>
        {!submitting && <ArrowRight className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />}
      </button>
    </div>
  );
}
