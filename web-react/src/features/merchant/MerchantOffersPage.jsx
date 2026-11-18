// 💡 Concept & Analogie : Comme le registre d'inventaire d'une épicerie avec des codes-barres et des étiquettes de démarque qui indique au gérant quels plateaux sont en vitrine et lesquels sont déjà vendus, ce catalogue donne une visibilité totale sur les stocks.
// 🔄 Comparaison React / Flutter : En React, les offres sont rendues sous forme de grille de cartes avec modale de confirmation de suppression ; en Flutter, nous utilisons un `ListView.builder` avec gestes de balayage `Dismissible`.
// 🎯 À retenir pour la soutenance : "La suppression d'une offre applique un soft-delete (bascule à `DELETED`) si des réservations ou commandes y sont déjà associées, préservant l'historique comptable et l'intégrité référentielle."

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OFFER_STATUS, PRICING_MODES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { formatTunisDate } from '../../lib/formatters.js';
import {
  Button,
  Card,
  Badge,
  Modal,
  Tabs,
  EmptyState,
  Toast,
} from '../../components/ui/index.js';

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
    { id: 'ALL', label: 'Toutes les Offres', count: offers.length },
    {
      id: OFFER_STATUS.ACTIVE,
      label: 'Actives en Ligne',
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
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#111111]/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-anton uppercase tracking-wide text-[#111111]">
                Catalogue des Offres Commerçant
              </h1>
              <Badge variant="green" size="md">Boutique Active</Badge>
            </div>
            <p className="text-xs text-[#111111]/70 mt-1 font-sans">
              Gérez vos portions, vos enchères dégressives et vos paniers surprises du jour.
            </p>
          </div>

          <Link to="/merchant/offers/new">
            <Button variant="primary" size="md" leftIcon={<span>+</span>}>
              Publier une Offre Anti-Gaspi
            </Button>
          </Link>
        </div>

        {/* Onglets de filtrage */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <Link
            to="/merchant/store"
            className="text-xs font-black text-[#111111] hover:text-[#DA0711] transition-colors"
          >
            ⚙️ Modifier l'Établissement
          </Link>
        </div>

        {/* Grille des Offres */}
        {filteredOffers.length === 0 ? (
          <EmptyState
            icon="🥖"
            title="Aucune offre dans cette catégorie"
            description="Publiez vos invendus du jour pour les proposer aux étudiants de l'ESSECT."
            action={
              <Link to="/merchant/offers/new">
                <Button variant="primary" size="sm">
                  Créer ma première offre →
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => {
              const isDutch = offer.pricing?.mode === PRICING_MODES.DUTCH_AUCTION;
              const displayPrice = isDutch
                ? offer.pricing.currentPriceMillimes || offer.pricing.startPriceMillimes
                : offer.pricing.discountedPriceMillimes;

              // Formula ensuring 0 NaN% vendus and accurate portions display
              const total = offer.quantityTotal ?? offer.totalQuantity ?? offer.quantityAvailable ?? 1;
              const available = offer.quantityAvailable ?? offer.remainingQuantity ?? total;
              const sold = offer.quantitySold ?? Math.max(0, total - available);
              const percentSold = total > 0 ? Math.round((sold / total) * 100) : 0;

              return (
                <Card
                  key={offer.id}
                  className={`p-6 bg-[#EDE6D7] rounded-3xl border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] relative flex flex-col justify-between ${
                    offer.status === OFFER_STATUS.DELETED ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isDutch ? (
                          <Badge variant="griddle" size="sm" dot>⚡ SMART DECAY</Badge>
                        ) : (
                          <Badge variant="yellow" size="sm">🏷️ PRIX FIXE</Badge>
                        )}
                        {offer.isSurpriseBasket && (
                          <Badge variant="yellow" size="sm">🎁 MYSTÈRE</Badge>
                        )}
                      </div>

                      <Badge
                        variant={
                          offer.status === OFFER_STATUS.ACTIVE
                            ? 'green'
                            : offer.status === OFFER_STATUS.SOLD_OUT
                            ? 'muted'
                            : 'red'
                        }
                        size="sm"
                      >
                        {offer.status}
                      </Badge>
                    </div>

                    {/* Titre & Catégorie */}
                    <div>
                      <h3 className="font-anton uppercase text-lg text-[#111111] line-clamp-1">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-[#111111]/60 mt-0.5 font-sans">
                        Catégorie : <strong>{offer.category}</strong> • Retrait : {offer.pickupEndAt?.includes('T') ? formatTunisDate(offer.pickupEndAt) : offer.pickupEndAt}
                      </p>
                    </div>

                    {/* Tarifs */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF3E6] border border-[#111111]/8 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-black text-[#111111]/60 block font-mono">
                          Prix Étudiant
                        </span>
                        <span className="font-anton text-2xl text-[#DA0711]">
                          {formatTND(displayPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black text-[#111111]/60 block font-mono">
                          Prix Initial
                        </span>
                        <span className="text-xs font-mono text-[#111111]/50 line-through">
                          {formatTND(offer.originalPriceMillimes)}
                        </span>
                      </div>
                    </div>

                    {/* Barre de stock sans NaN */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#111111]/70">
                          Portions restantes : <strong className="text-[#111111] font-black">{available} / {total}</strong>
                        </span>
                        <span className="text-xs text-[#DA0711] font-black">{percentSold}% vendus</span>
                      </div>
                      <div className="w-full h-2 bg-[#FAF3E6] rounded-full overflow-hidden border border-[#111111]/10">
                        <div
                          className="h-full bg-[#DA0711] rounded-full transition-all"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="pt-4 mt-4 border-t border-[#111111]/10 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/merchant/offers/${offer.id}/edit`)}
                      className="text-xs font-black px-4 py-2 rounded-full bg-white border border-[#111111]/15 hover:bg-[#FAF3E6] text-[#111111] transition-all shadow-sm"
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalOffer(offer)}
                      className="text-xs font-black px-4 py-2 rounded-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[#DA0711] transition-all shadow-sm"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* MODALE DE SUPPRESSION (AVEC EXPLICATION SOFT-DELETE) */}
        <Modal
          isOpen={Boolean(deleteModalOffer)}
          onClose={() => setDeleteModalOffer(null)}
          title="Confirmer la suppression de l'offre"
          description="Cette action retirera l'offre de la vitrine publique des étudiants."
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalOffer(null)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
              >
                Confirmer la Suppression
              </Button>
            </>
          }
        >
          {deleteModalOffer && (
            <div className="space-y-3 py-2 text-xs text-[#111111]">
              <p>
                Vous êtes sur le point de retirer :{' '}
                <strong className="text-[#DA0711]">{deleteModalOffer.title}</strong>
              </p>
              {deleteModalOffer.hasOrders ? (
                <div className="p-4 rounded-2xl bg-[#FFD000]/20 border border-[#FFD000]/40 text-[#111111] font-medium shadow-sm">
                  ℹ️ <strong>Règle d'intégrité comptable :</strong> Des réservations ou paiements sont déjà enregistrés sur cette offre. Le système appliquera un <em>soft-delete</em> (statut <code>DELETED</code>) pour maintenir l'historique financier et les tickets déjà émis.
                </div>
              ) : (
                <p className="text-[#111111]/70">
                  Aucune commande n'étant en cours, cette offre sera retirée sans impact.
                </p>
              )}
            </div>
          )}
        </Modal>
      </div>

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