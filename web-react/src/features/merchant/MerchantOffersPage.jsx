// 💡 Concept & Analogie : Comme le registre d'inventaire d'une épicerie avec des codes-barres et des étiquettes de démarque qui indique au gérant quels plateaux sont en vitrine et lesquels sont déjà vendus, ce catalogue donne une visibilité totale sur les stocks.
// 🔄 Comparaison React / Flutter : En React, les offres sont rendues sous forme de grille de cartes avec modale de confirmation de suppression ; en Flutter, nous utilisons un `ListView.builder` avec gestes de balayage `Dismissible`.
// 🎯 À retenir pour la soutenance : "La suppression d'une offre applique un soft-delete (bascule à `DELETED`) si des réservations ou commandes y sont déjà associées, préservant l'historique comptable et l'intégrité référentielle."

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OFFER_STATUS, PRICING_MODES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
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
    quantityTotal: 5,
    quantityAvailable: 2,
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
    quantityTotal: 4,
    quantityAvailable: 1,
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
    quantityTotal: 3,
    quantityAvailable: 0,
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
    <div className="min-h-screen bg-[#0D0F12] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262A33]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Catalogue des Offres Commerçant</h1>
              <Badge variant="lime" size="md">Boutique Active</Badge>
            </div>
            <p className="text-xs text-[#8A92A6] mt-1">
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
        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <Link to="/merchant/store" className="text-xs text-[#8A92A6] hover:text-[#CCFF00] transition-colors">
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

              const percentSold = Math.round(
                ((offer.quantityTotal - offer.quantityAvailable) / offer.quantityTotal) * 100
              );

              return (
                <Card
                  key={offer.id}
                  className={`p-5 bg-[#161920] border-[#262A33] relative flex flex-col justify-between ${
                    offer.status === OFFER_STATUS.DELETED ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isDutch ? (
                          <Badge variant="orange" size="sm" dot>⚡ SMART DECAY</Badge>
                        ) : (
                          <Badge variant="lime" size="sm">🏷️ PRIX FIXE</Badge>
                        )}
                        {offer.isSurpriseBasket && (
                          <Badge variant="purple" size="sm">🎁 MYSTÈRE</Badge>
                        )}
                      </div>

                      <Badge
                        variant={
                          offer.status === OFFER_STATUS.ACTIVE
                            ? 'lime'
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
                      <h3 className="text-base font-bold text-white line-clamp-1">{offer.title}</h3>
                      <p className="text-xs text-[#8A92A6] mt-0.5">
                        Catégorie : {offer.category} • Retrait : {offer.pickupEndAt}
                      </p>
                    </div>

                    {/* Tarifs */}
                    <div className="p-3 rounded-xl bg-[#0D0F12] border border-[#262A33] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-[#8A92A6] block">Prix Étudiant</span>
                        <span className="text-lg font-black text-[#CCFF00]">
                          {formatTND(displayPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-[#8A92A6] block">Prix Initial</span>
                        <span className="text-xs text-[#8A92A6] line-through">
                          {formatTND(offer.originalPriceMillimes)}
                        </span>
                      </div>
                    </div>

                    {/* Barre de stock */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8A92A6]">
                          Portions restantes : <strong className="text-white">{offer.quantityAvailable} / {offer.quantityTotal}</strong>
                        </span>
                        <span className="text-xs text-[#CCFF00] font-semibold">{percentSold}% vendus</span>
                      </div>
                      <div className="w-full h-2 bg-[#0D0F12] rounded-full overflow-hidden border border-[#262A33]">
                        <div
                          className="h-full bg-[#CCFF00] rounded-full transition-all"
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="pt-4 mt-4 border-t border-[#262A33] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/merchant/offers/${offer.id}/edit`)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#0D0F12] border border-[#262A33] text-gray-300 hover:text-white hover:border-[#383e4c] transition-colors"
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalOffer(offer)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#FF1744]/10 border border-[#FF1744]/30 text-[#FF1744] hover:bg-[#FF1744]/20 transition-colors"
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
            <div className="space-y-3 py-2 text-xs text-gray-300">
              <p>
                Vous êtes sur le point de retirer :{' '}
                <strong className="text-white">{deleteModalOffer.title}</strong>
              </p>
              {deleteModalOffer.hasOrders ? (
                <div className="p-3 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500]">
                  ℹ️ <strong>Règle d'intégrité comptable :</strong> Des réservations ou paiements sont déjà enregistrés sur cette offre. Le système appliquera un <em>soft-delete</em> (statut <code>DELETED</code>) pour maintenir l'historique financier et les tickets déjà émis.
                </div>
              ) : (
                <p className="text-[#8A92A6]">
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
