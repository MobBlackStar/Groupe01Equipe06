// 💡 Concept & Analogie : Comme le registre d'inventaire d'une épicerie avec des codes-barres et des étiquettes de démarque qui indique au gérant quels plateaux sont en vitrine et lesquels sont déjà vendus, ce catalogue donne une visibilité totale sur les stocks.
// 🔄 Comparaison React / Flutter : En React, les offres sont rendues sous forme de grille de cartes avec modale de confirmation de suppression ; en Flutter, nous utilisons un `ListView.builder` avec gestes de balayage `Dismissible`.
// 🎯 À retenir pour la soutenance : "La suppression d'une offre applique un soft-delete (bascule à `DELETED`) si des réservations ou commandes y sont déjà associées, préservant l'historique comptable et l'intégrité référentielle."

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OFFER_STATUS, PRICING_MODES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTunisDate, formatTunisTime } from '../../lib/formatters.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';
import { Plus, Pencil, Trash2, Clock, Store } from 'lucide-react';
import {
  Button,
  Modal,
  Tabs,
  EmptyState,
  Toast,
} from '../../components/ui/index.js';

const SAFE_FALLBACK_IMG = getDistinctGriddleFoodImage('fast-food', 0);

// Catégorie d'offre → famille de photos Griddle
const CATEGORY_POOL = {
  SANDWICH: 'fast-food',
  SNACK: 'fast-food',
  PLAT_CHAUD: 'restaurant',
  SALADE: 'restaurant',
  PIZZA: 'pizza',
  PATISSERIE: 'patisserie',
  VIENNOISERIE: 'cafeteria',
  BOISSON: 'cafeteria',
  MIXTE: 'patisserie',
};

// Affichage sûr : jamais de NaN / 0,000 DT à l'écran
function money(millimes) {
  const n = Number(millimes);
  return millimes != null && Number.isFinite(n) && n > 0 ? formatTND(n) : '—';
}

// Fin de retrait lisible (ISO, timestamp Firestore ou libellé démo)
function pickupLabel(value) {
  let input = value;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const s = value._seconds ?? value.seconds;
    input = Number.isFinite(s) ? s * 1000 : null;
  }
  const time = formatTunisTime(input);
  if (time !== '--:--') return `Jusqu'à ${time} · ${formatTunisDate(input)}`;
  return typeof value === 'string' && value.trim() ? value : 'Créneau à définir';
}

const STATUS_VIEW = {
  [OFFER_STATUS.ACTIVE]: { label: 'En ligne', cls: 'cs-pill-leaf' },
  [OFFER_STATUS.SOLD_OUT]: { label: 'Épuisée', cls: 'cs-pill-ink' },
  [OFFER_STATUS.EXPIRED]: { label: 'Expirée', cls: '' },
  [OFFER_STATUS.DELETED]: { label: 'Archivée', cls: 'cs-pill-red' },
};

// Données d'offres démo pour démonstration immédiate
const DEMO_OFFERS = [
  {
    id: 'off-01',
    title: 'Baguette Farcie Escalope Panée',
    category: 'SANDWICH',
    pricing: {
      mode: PRICING_MODES.DUTCH_AUCTION,
      startPriceMillimes: 5500,
      floorPriceMillimes: 3000,
      currentPriceMillimes: 4200,
    },
    originalPriceMillimes: 7500,
    quantityTotal: 6,
    quantityAvailable: 4,
    quantitySold: 2,
    status: OFFER_STATUS.ACTIVE,
    isSurpriseBasket: false,
    pickupEndAt: 'Ce soir à 20h00',
    hasOrders: true,
  },
  {
    id: 'off-02',
    title: 'Makloub Chawarma Poulet',
    category: 'SANDWICH',
    pricing: {
      mode: PRICING_MODES.FIXED,
      discountedPriceMillimes: 4000,
    },
    originalPriceMillimes: 6800,
    quantityTotal: 5,
    quantityAvailable: 2,
    quantitySold: 3,
    status: OFFER_STATUS.ACTIVE,
    isSurpriseBasket: false,
    pickupEndAt: 'Ce soir à 19h30',
    hasOrders: true,
  },
  {
    id: 'off-03',
    title: 'Panier Surprise Douceurs du Chef',
    category: 'MIXTE',
    pricing: {
      mode: PRICING_MODES.FIXED,
      discountedPriceMillimes: 5000,
    },
    originalPriceMillimes: 12000,
    quantityTotal: 4,
    quantityAvailable: 0,
    quantitySold: 4,
    status: OFFER_STATUS.SOLD_OUT,
    isSurpriseBasket: true,
    surpriseRarity: 'RARE',
    pickupEndAt: 'Épuisé à 18h15',
    hasOrders: true,
  },
];

export default function MerchantOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState(DEMO_OFFERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [deleteModalOffer, setDeleteModalOffer] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const res = await apiClient.get(ENDPOINTS.MERCHANT_OFFERS);
        if (res.data?.offers && res.data.offers.length > 0) {
          setOffers(res.data.offers);
        }
      } catch (err) {
        console.warn('API merchant offers fallback démo:', err.message);
      }
    }
    loadOffers();
  }, []);

  const tabs = [
    { id: 'ALL', label: 'Toutes', count: offers.length },
    {
      id: OFFER_STATUS.ACTIVE,
      label: 'En ligne',
      count: offers.filter((o) => o.status === OFFER_STATUS.ACTIVE).length,
    },
    {
      id: OFFER_STATUS.SOLD_OUT,
      label: 'Épuisées',
      count: offers.filter((o) => o.status === OFFER_STATUS.SOLD_OUT).length,
    },
  ];

  const filteredOffers = offers.filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  async function confirmDelete() {
    if (!deleteModalOffer) return;
    const targetId = deleteModalOffer.id;

    try {
      await apiClient.delete(ENDPOINTS.OFFER_BY_ID(targetId));
    } catch (err) {
      console.warn('API delete offer fallback:', err.message);
    }

    setOffers((prev) =>
      prev.map((o) =>
        o.id === targetId ? { ...o, status: OFFER_STATUS.DELETED } : o
      )
    );

    setToast({
      type: 'success',
      message: deleteModalOffer.hasOrders
        ? "Offre archivée (soft-delete appliqué car des commandes y sont associées)."
        : "Offre supprimée définitivement.",
    });

    setDeleteModalOffer(null);
  }

  return (
    <div className="cs-container cs-page">
      {/* En-tête */}
      <header className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="min-w-0">
          <p className="cs-eyebrow mb-3">Espace commerçant</p>
          <h1 className="cs-display">Mes offres</h1>
          <p className="cs-lead mt-4 max-w-2xl">
            Vos portions du jour, vos prix Smart Decay et vos paniers surprises, au même endroit.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link to="/merchant/offers/new" className="cs-btn cs-btn-red cs-btn-lg">
            <Plus className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
            <span>Publier une offre</span>
          </Link>
          <Link to="/merchant/store" className="cs-btn cs-btn-cream cs-btn-lg">
            <Store className="w-5 h-5" aria-hidden="true" />
            <span>Ma boutique</span>
          </Link>
        </div>
      </header>

      {/* Filtres */}
      <div className="mb-8">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Grille des offres */}
      {filteredOffers.length === 0 ? (
        <EmptyState
          icon="🥖"
          title="Aucune offre ici"
          description="Publiez vos invendus du jour pour les proposer aux étudiants de l'ESSECT."
          action={
            <Link to="/merchant/offers/new" className="cs-btn cs-btn-red">
              Créer une offre →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer, i) => {
            const isDutch = offer.pricing?.mode === PRICING_MODES.DUTCH_AUCTION;
            const displayPrice = (isDutch
              ? offer.pricing?.currentPriceMillimes || offer.pricing?.startPriceMillimes
              : offer.pricing?.discountedPriceMillimes) || offer.discountedPriceMillimes;

            // Formula ensuring 0 NaN% vendus and accurate portions display
            const toNum = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : null);
            const soldRaw = toNum(offer.quantitySold);
            const availRaw = toNum(offer.quantityAvailable ?? offer.remainingQuantity);
            const total =
              toNum(offer.quantityTotal ?? offer.totalQuantity) ??
              toNum(offer.quantity) ??
              ((availRaw ?? 0) + (soldRaw ?? 0));
            const available = availRaw ?? Math.max(0, total - (soldRaw ?? 0));
            const sold = soldRaw ?? Math.max(0, total - available);
            const percentSold = total > 0 ? Math.min(100, Math.max(0, Math.round((sold / total) * 100))) : 0;

            const isDeleted = offer.status === OFFER_STATUS.DELETED;
            const st = STATUS_VIEW[offer.status] || { label: offer.status || 'Brouillon', cls: '' };
            const imageUrl =
              offer.photoUrl || offer.imageUrl || getDistinctGriddleFoodImage(CATEGORY_POOL[offer.category] || 'fast-food', offer.id || offer.title);
            const original = money(offer.originalPriceMillimes);

            return (
              <article
                key={offer.id}
                className={`group cs-card cs-card-hover cs-fade-up p-3 flex flex-col ${
                  isDeleted ? 'opacity-50 pointer-events-none' : ''
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Photo plein cadre */}
                <div className="cs-photo cs-photo-zoom aspect-[4/3]">
                  <img
                    src={imageUrl}
                    alt={offer.title || 'Offre anti-gaspi'}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = SAFE_FALLBACK_IMG;
                    }}
                  />
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
                    <span className={`cs-pill ${st.cls}`}>{st.label}</span>
                    {offer.isSurpriseBasket ? (
                      <span className="cs-sticker cs-sticker-red !text-lg">Mystère</span>
                    ) : isDutch ? (
                      <span className="cs-sticker cs-sticker-mustard !text-lg">Smart decay</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col flex-1 px-3 pt-5 pb-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    <span className="cs-label">{offer.category || 'Offre'}</span>
                    <span className="cs-label">·</span>
                    <span className="cs-label">{isDutch ? 'Prix dégressif' : 'Prix fixe'}</span>
                  </div>

                  <h3 className="cs-h3 line-clamp-2">{offer.title || 'Offre anti-gaspi'}</h3>

                  <p className="mt-2 inline-flex items-center gap-2 text-[15px] text-[#5E5850]">
                    <Clock className="w-4 h-4 shrink-0 text-[#DA0711]" aria-hidden="true" />
                    <span>{pickupLabel(offer.pickupEndAt)}</span>
                  </p>

                  {/* Prix */}
                  <div className="mt-5 flex items-end gap-3">
                    <span className="cs-figure text-[48px] text-[#DA0711]">{money(displayPrice)}</span>
                    {original !== '—' && (
                      <span className="cs-figure text-[24px] text-[#5E5850] line-through mb-1">{original}</span>
                    )}
                  </div>

                  {/* Stock restant */}
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span className="text-base">
                        <strong className="font-bold">{available}</strong>
                        <span className="text-[#5E5850]"> / {total} restantes</span>
                      </span>
                      <span className="text-[15px] font-semibold text-[#DA0711]">{percentSold}% vendus</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#FAF3E6] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#DA0711] transition-all"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-1 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/merchant/offers/${offer.id}/edit`)}
                      className="cs-btn cs-btn-cream cs-btn-sm flex-1 min-h-[44px]"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOffer(offer)}
                      className="cs-btn cs-btn-cream cs-btn-sm flex-1 min-h-[44px] !text-[#DA0711]"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODALE DE SUPPRESSION (AVEC EXPLICATION SOFT-DELETE) */}
      <Modal
        isOpen={Boolean(deleteModalOffer)}
        onClose={() => setDeleteModalOffer(null)}
        title="Supprimer cette offre ?"
        description="Elle sera retirée de la vitrine publique des étudiants."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteModalOffer(null)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Confirmer la suppression
            </Button>
          </>
        }
      >
        {deleteModalOffer && (
          <div className="space-y-4 py-2 text-base text-[#111111]">
            <p>
              Vous allez retirer :{' '}
              <strong className="text-[#DA0711]">{deleteModalOffer.title}</strong>
            </p>
            {deleteModalOffer.hasOrders ? (
              <div className="rounded-2xl bg-[#FFD000] p-5 leading-relaxed">
                <strong>Règle d'intégrité comptable :</strong> des réservations ou paiements existent déjà sur cette
                offre. Elle sera archivée (statut <span className="cs-mono">DELETED</span>) pour conserver l'historique
                financier et les tickets déjà émis.
              </div>
            ) : (
              <p className="text-[#5E5850]">Aucune commande en cours : l'offre sera retirée sans impact.</p>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
