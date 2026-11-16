// 💡 Concept & Analogie : Comme le hall central d'un marché gourmand où les étals sont organisés par allées, cette page est le carrefour d'exploration où les étudiants découvrent les repas sauvés autour de l'ESSECT.
// 🔄 Comparaison React / Flutter : En React, `BrowsePage` gère l'état global des filtres avec `useState` et un debounce personnalisé ; en Flutter, `ExploreScreen` utilise un `StatefulWidget` avec un contrôleur de défilement infini et des cartes adaptatives.
// 🎯 À retenir pour la soutenance : "L'architecture garantit un fonctionnement continu : si le serveur REST est indisponible, un fallback intelligent sur les commerces réels de Montfleury assure une démonstration 100% interactive."

import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from './SearchBar.jsx';
import FilterPanel from './FilterPanel.jsx';
import { OfferCard } from '../../components/offers/index.js';
import { EmptyState, Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { OFFER_CATEGORIES } from '@shared/constants.js';

// Jeu d'offres de démonstration Montfleury (Fallback résilient)
const DEFAULT_MONTFLEURY_OFFERS = [
  {
    id: 'off-baguette-01',
    merchantId: 'merchant-baguette-baguette',
    merchantName: 'Baguette & Baguette Montfleury',
    title: 'Baguette Farcie Escalope & Mozzarella',
    description: 'Baguette artisanale croustillante, escalope panée marinée, frites et double fromage fondant.',
    category: OFFER_CATEGORIES.SANDWICH,
    pricingType: 'DUTCH',
    originalPriceMillimes: 7800,
    targetPriceMillimes: 3800,
    quantityAvailable: 4,
    distanceFromEssectM: 180,
    pickupStartAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 400,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'off-etoile-02',
    merchantId: 'merchant-etoile-savoir',
    merchantName: "Cafétéria L'Étoile du Savoir",
    title: 'Panier Surprise Viennoiseries du Matin',
    description: 'Assortiment surprise de 4 croissants au beurre et pains au chocolat cuits sur place.',
    category: OFFER_CATEGORIES.MIXTE,
    pricingType: 'FIXED',
    originalPriceMillimes: 6000,
    discountedPriceMillimes: 2500,
    targetPriceMillimes: 2500,
    quantityAvailable: 5,
    distanceFromEssectM: 120,
    pickupStartAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    isSurpriseBasket: true,
    surprise: {
      rarity: 'LEGENDARY',
      teaser: '4 viennoiseries dorées pur beurre à déguster entre deux cours',
      itemCountHint: 4,
    },
    weightGramsPerUnit: 320,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'off-dome-03',
    merchantId: 'merchant-le-dome',
    merchantName: 'Restaurant Le Dôme Montfleury',
    title: 'Ojja Royale aux Merguez & Œuf',
    description: 'Plat tunisien mijoté à base de tomates fraîches, poivrons, merguez artisanales et œuf coulant.',
    category: OFFER_CATEGORIES.PLAT_CHAUD,
    pricingType: 'DUTCH',
    originalPriceMillimes: 8500,
    targetPriceMillimes: 4500,
    quantityAvailable: 3,
    distanceFromEssectM: 350,
    pickupStartAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 450,
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'off-masmoudi-04',
    merchantId: 'merchant-masmoudi',
    merchantName: 'Pâtisserie Masmoudi',
    title: 'Coffret Découverte Pâtisserie Fine',
    description: 'Sélection raffinée de douceurs traditionnelles tunisiennes (makroudh, baklawa, cornes de gazelle).',
    category: OFFER_CATEGORIES.PATISSERIE,
    pricingType: 'FIXED',
    originalPriceMillimes: 12000,
    discountedPriceMillimes: 5500,
    targetPriceMillimes: 5500,
    quantityAvailable: 2,
    distanceFromEssectM: 420,
    pickupStartAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
    isSurpriseBasket: true,
    surprise: {
      rarity: 'RARE',
      teaser: 'Sélection artisanale de 6 pièces de pâtisserie tunisienne',
      itemCountHint: 6,
    },
    weightGramsPerUnit: 250,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'off-bella-05',
    merchantId: 'merchant-bella-napoli',
    merchantName: 'Pizzeria Bella Napoli Montfleury',
    title: 'Pizza Calzone Tunisienne Soufflée',
    description: 'Pâte à pizza fine pliée en chausson, garnie de thon, fromage, harissa douce et olives noires.',
    category: OFFER_CATEGORIES.PIZZA,
    pricingType: 'DUTCH',
    originalPriceMillimes: 9000,
    targetPriceMillimes: 4500,
    quantityAvailable: 4,
    distanceFromEssectM: 520,
    pickupStartAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 500,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'off-phare-06',
    merchantId: 'merchant-le-phare',
    merchantName: 'Fast Food Le Phare',
    title: 'Menu Chapati Mahdia Spécial Étudiant',
    description: 'Pain chapati rond cuit sur plaque avec omelette persillée, thon et fromage fondant.',
    category: OFFER_CATEGORIES.SANDWICH,
    pricingType: 'FIXED',
    originalPriceMillimes: 5000,
    discountedPriceMillimes: 2800,
    targetPriceMillimes: 2800,
    quantityAvailable: 6,
    distanceFromEssectM: 620,
    pickupStartAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 80 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 350,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
  },
];

export default function BrowsePage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxPriceMillimes, setMaxPriceMillimes] = useState(15000);
  const [surpriseOnly, setSurpriseOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'price', 'ending'

  // Chargement des offres depuis l'API ou fallback
  useEffect(() => {
    let isMounted = true;

    async function fetchOffers() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(ENDPOINTS.OFFERS);
        const data = response.data?.offers || response.data || [];
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setOffers(data);
          } else {
            setOffers(DEFAULT_MONTFLEURY_OFFERS);
          }
        }
      } catch (err) {
        console.warn('API indisponible, utilisation du catalogue Montfleury de secours :', err.message);
        if (isMounted) {
          setOffers(DEFAULT_MONTFLEURY_OFFERS);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setMaxPriceMillimes(15000);
    setSurpriseOnly(false);
    setSortBy('distance');
  };

  // Filtrage et Tri en mémoire
  const filteredOffers = useMemo(() => {
    const now = Date.now();

    return offers.filter((offer) => {
      // 1. Recherche texte (titre, nom commerce, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (offer.title || '').toLowerCase().includes(q);
        const matchMerchant = (offer.merchantName || offer.merchant?.name || '').toLowerCase().includes(q);
        const matchDesc = (offer.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMerchant && !matchDesc) return false;
      }

      // 2. Filtre Catégorie
      if (selectedCategory !== 'ALL' && offer.category !== selectedCategory) {
        return false;
      }

      // 3. Filtre Panier Surprise
      if (surpriseOnly && !(offer.isSurpriseBasket || offer.surprise)) {
        return false;
      }

      // 4. Filtre Prix Max
      const currentPrice = computeUnitPrice(offer, now);
      if (currentPrice > maxPriceMillimes) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Tri
      if (sortBy === 'price') {
        const priceA = computeUnitPrice(a, now);
        const priceB = computeUnitPrice(b, now);
        return priceA - priceB;
      }
      if (sortBy === 'ending') {
        const endA = new Date(a.pickupEndAt || a.pricing?.pickupEndAt).getTime();
        const endB = new Date(b.pickupEndAt || b.pricing?.pickupEndAt).getTime();
        return endA - endB;
      }
      // Par défaut : distance ESSECT
      const distA = a.distanceFromEssectM ?? a.merchant?.distanceFromEssectM ?? 500;
      const distB = b.distanceFromEssectM ?? b.merchant?.distanceFromEssectM ?? 500;
      return distA - distB;
    });
  }, [offers, searchQuery, selectedCategory, maxPriceMillimes, surpriseOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec repère campus */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping" />
              <span>Campus ESSECT Montfleury • Rayon &le; 3 km</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Catalogue des Offres Anti-Gaspillage
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Sauvez de délicieux repas invendus à prix dégressif avant la fermeture des commerces voisins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-[#161920] border border-white/10 text-xs text-slate-300">
              ⚡ <strong className="text-[#CCFF00]">{filteredOffers.length}</strong> offre{filteredOffers.length > 1 ? 's' : ''} disponible{filteredOffers.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Barre de recherche avec Debounce 300 ms */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un plat, makloub, baguette farcie, restaurant..."
        />

        {/* Panneau de filtres interactif */}
        <FilterPanel
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          maxPriceMillimes={maxPriceMillimes}
          onChangeMaxPrice={setMaxPriceMillimes}
          surpriseOnly={surpriseOnly}
          onToggleSurpriseOnly={setSurpriseOnly}
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          onResetFilters={handleResetFilters}
        />

        {/* Grille d'offres ou états de chargement / vide */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400">Recherche des meilleures offres en direct...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucune offre ne correspond à ces critères"
            description="Essayez d'élargir votre budget maximal, de sélectionner une autre catégorie ou de réinitialiser vos filtres."
            action={
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-bold text-xs hover:bg-[#b8e600] transition-colors"
              >
                Réinitialiser tous les filtres
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
