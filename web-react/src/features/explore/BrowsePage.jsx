// 💡 Concept & Analogie : Comme la traversée d'un diner vintage américain croisé avec un marché de producteurs locaux, le héros full-bleed respire sur la toile crème #FAF3E6.
// 🔄 Comparaison React / Flutter : En React, la page intègre le Time Scrubber dégressif interactif avec calcul en direct de Dutch Auction (`computeUnitPrice`) ; en Flutter, `explore_screen.dart` adapte la timeline.
// 🎯 À retenir pour la soutenance : "Le Time Scrubber Hero permet au jury de voyager dans le temps (12h-20h) et de constater la baisse progressive des prix et l'apposition du tampon PARTI À HH:MM sur les invendus expirés."
// Module : Catalogue & Exploration (M4, I1)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  Flame,
  ArrowRight,
} from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import FilterPanel from './FilterPanel.jsx';
import { OfferCard, MysteryBoxCard } from '../../components/offers/index.js';
import { EmptyState, Spinner } from '../../components/ui/index.js';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { getDistinctGriddleFoodImage } from '../../lib/griddleAssets.js';

// Jeu d'offres de démonstration Montfleury
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
    quantityTotal: 6,
    quantityAvailable: 4,
    distanceFromEssectM: 180,
    pickupStartAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 400,
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
    quantityTotal: 8,
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
  },
  {
    id: 'off-dome-03',
    merchantId: 'merchant-le-dome',
    merchantName: 'Restaurant Le Dôme Montfleury',
    title: 'Riz Sauté & Plat Chaud du Jour',
    description: 'Plat mijoté avec riz sauté wok, légumes frais de saison, sauce douce et épices orientales.',
    category: OFFER_CATEGORIES.PLAT_CHAUD,
    pricingType: 'DUTCH',
    originalPriceMillimes: 8500,
    targetPriceMillimes: 4500,
    quantityTotal: 5,
    quantityAvailable: 3,
    distanceFromEssectM: 350,
    pickupStartAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 450,
  },
  {
    id: 'off-masmoudi-04',
    merchantId: 'merchant-masmoudi',
    merchantName: 'Pâtisserie Masmoudi',
    title: 'Coffret Découverte Pâtisserie Fine',
    description: 'Sélection d assortiment de baklavas aux amandes et cornes de gazelle du jour.',
    category: OFFER_CATEGORIES.PATISSERIE,
    pricingType: 'FIXED',
    originalPriceMillimes: 9500,
    discountedPriceMillimes: 4200,
    targetPriceMillimes: 4200,
    quantityTotal: 7,
    quantityAvailable: 6,
    distanceFromEssectM: 280,
    pickupStartAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 250,
  },
  {
    id: 'off-station-05',
    merchantId: 'merchant-station-gourmande',
    merchantName: 'La Station Gourmande',
    title: 'Double Smash Burger Cheddar Chaud',
    description: 'Steaks hachés smashés, double cheddar coulant, sauce maison secrète et pain brioché.',
    category: OFFER_CATEGORIES.SANDWICH,
    pricingType: 'DUTCH',
    originalPriceMillimes: 9200,
    targetPriceMillimes: 4900,
    quantityTotal: 6,
    quantityAvailable: 2,
    distanceFromEssectM: 210,
    pickupStartAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 420,
  },
];

export default function BrowsePage() {
  const [offers, setOffers] = useState(DEFAULT_MONTFLEURY_OFFERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxPriceMillimes, setMaxPriceMillimes] = useState(20000);
  const [surpriseOnly, setSurpriseOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance');

  // Time Scrubber state (12h à 20h)
  const [scrubberHour, setScrubberHour] = useState(18.0);

  // Chargement des offres depuis le backend
  useEffect(() => {
    let isMounted = true;
    async function fetchOffers() {
      setLoading(true);
      try {
        const res = await apiClient.get(ENDPOINTS.OFFERS);
        if (isMounted && res.data && Array.isArray(res.data.offers)) {
          if (res.data.offers.length > 0) {
            setOffers(res.data.offers);
          }
        }
      } catch (err) {
        console.warn('API Offres indisponible, fallback offres Montfleury actives :', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setMaxPriceMillimes(20000);
    setSurpriseOnly(false);
    setSortBy('distance');
  }, []);

  // Formatage de l'heure du Time Scrubber
  const formatScrubberTime = (hourDecimal) => {
    const hours = Math.floor(hourDecimal);
    const minutes = Math.round((hourDecimal - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const scrubberTimeMs = useMemo(() => {
    const d = new Date();
    const hours = Math.floor(scrubberHour);
    const minutes = Math.round((scrubberHour - hours) * 60);
    d.setHours(hours, minutes, 0, 0);
    return d.getTime();
  }, [scrubberHour]);

  // Décomptes de catégories
  const categoryCounts = useMemo(() => {
    const counts = {};
    offers.forEach((o) => {
      const cat = o.category || 'MIXTE';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [offers]);

  // Filtrage et Tri
  const filteredOffers = useMemo(() => {
    const now = Date.now();

    return offers.filter((offer) => {
      try {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (offer.title || '').toLowerCase().includes(q);
          const matchMerchant = (offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || '').toLowerCase().includes(q);
          const matchDesc = (offer.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchMerchant && !matchDesc) return false;
        }

        if (selectedCategory !== 'ALL' && offer.category !== selectedCategory) {
          return false;
        }

        if (surpriseOnly && !(offer.isSurpriseBasket || offer.surprise)) {
          return false;
        }

        const currentPrice = computeUnitPrice(offer, now);
        if (currentPrice > maxPriceMillimes) {
          return false;
        }

        return true;
      } catch {
        return true;
      }
    }).sort((a, b) => {
      try {
        if (sortBy === 'price') {
          const priceA = computeUnitPrice(a, now);
          const priceB = computeUnitPrice(b, now);
          return priceA - priceB;
        }
        if (sortBy === 'ending') {
          const endA = new Date(a.pickupEndAt || a.pricing?.pickupEndAt || (now + 3600000)).getTime();
          const endB = new Date(b.pickupEndAt || b.pricing?.pickupEndAt || (now + 3600000)).getTime();
          return endA - endB;
        }
        const distA = a.distanceFromEssectM ?? a.merchantSnapshot?.distanceFromEssectM ?? a.merchant?.distanceFromEssectM ?? 500;
        const distB = b.distanceFromEssectM ?? b.merchantSnapshot?.distanceFromEssectM ?? b.merchant?.distanceFromEssectM ?? 500;
        return distA - distB;
      } catch {
        return 0;
      }
    });
  }, [offers, searchQuery, selectedCategory, maxPriceMillimes, surpriseOnly, sortBy]);

  // Items du Time Scrubber Hero
  const scrubberShowcaseItems = useMemo(() => {
    const showcaseOffers = offers.slice(0, 5);
    return showcaseOffers.map((offer, idx) => {
      const simulatedPrice = computeUnitPrice(offer, scrubberTimeMs);
      const endTimestamp = new Date(offer.pickupEndAt || offer.pricing?.pickupEndAt || (Date.now() + 3600000)).getTime();
      const isGone = scrubberTimeMs > endTimestamp;

      const endDate = new Date(endTimestamp);
      const endFormatted = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      const foodImage = getDistinctGriddleFoodImage(offer.category || 'fast-food', offer.id || idx);

      return {
        offer,
        simulatedPrice,
        isGone,
        endFormatted,
        image: foodImage,
      };
    });
  }, [offers, scrubberTimeMs]);

  const activeScrubberItemsCount = scrubberShowcaseItems.filter((i) => !i.isGone).length;

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] pb-16">
      
      {/* =========================================================================
          SECTION A : OPEN FULL-BLEED GRIDDLE HERO (NO ENCLOSING BOX)
          ========================================================================= */}
      <section className="pt-8 sm:pt-14 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Griddle Floating Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="sticker-yellow">
              👑 #1 ESSECT MONTFLEURY
            </span>
            <span className="sticker-red">
              ⚡ SMART DECAY ACTIF
            </span>
            <span className="sticker-yellow">
              🔥 JUSQU'À -70%
            </span>
          </div>
          <span className="text-xs font-mono text-[#777] font-bold hidden sm:inline">
            Glissez le curseur pour simuler les prix
          </span>
        </div>

        {/* Grand Titre Griddle : CUISINÉ. BRADÉ. SAUVÉ. */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6">
          <div>
            <h1 className="font-anton uppercase text-5xl sm:text-7xl lg:text-8xl tracking-tight text-[#111111] leading-none mb-3">
              CUISINÉ. <span className="text-[#DA0711]">BRADÉ.</span> SAUVÉ.
            </h1>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111]">
              Passe à {formatScrubberTime(scrubberHour)}.{' '}
              <span className="relative inline-block">
                <span className="relative z-10">{activeScrubberItemsCount} portions sont encore là.</span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 right-0 h-3 bg-[#FFD000] -rotate-1 rounded-sm -z-0"
                />
              </span>
            </h2>
            <p className="mt-2 text-sm text-[#555] max-w-2xl font-medium leading-relaxed">
              Une fournée par jour chez les artisans de Montfleury. Glisse la ligne d'heure pour prévisualiser la baisse de prix en direct et réserver avant épuisement.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <a
              href="#bestsellers"
              className="btn-griddle-primary"
            >
              <span>Commander</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </a>
            <Link
              to="/app/radar"
              className="btn-griddle-outline"
            >
              <MapPin className="w-4 h-4 text-[#111111]" />
              <span>Voir le Radar</span>
            </Link>
          </div>
        </div>

        {/* Vitrine des aliments sur la ligne de temps */}
        <div className="relative pt-6 pb-4 overflow-x-auto scrollbar-none">
          <div className="min-w-[700px] flex items-end justify-around gap-4 relative z-10">
            {scrubberShowcaseItems.map((item, idx) => (
              <div
                key={item.offer.id || idx}
                className="flex flex-col items-center group relative cursor-pointer"
                onClick={() => {
                  setSelectedCategory(item.offer.category || 'ALL');
                }}
              >
                {/* Carte étiquette du produit */}
                <div className="mb-3 px-3.5 py-1.5 rounded-full bg-[#EDE6D7] border border-[#111111]/8 text-center pointer-events-none transition-transform group-hover:-translate-y-1 shadow-sm">
                  <p className="font-anton text-xs text-[#111111] truncate max-w-[130px]">
                    {item.offer.title}
                  </p>
                  <p className="font-anton text-sm font-black text-[#DA0711]">
                    {formatTND(item.simulatedPrice)}
                    <span className="text-[10px] text-[#777] font-normal font-sans ml-1">
                      · fin {item.endFormatted}
                    </span>
                  </p>
                </div>

                {/* Photo de l'aliment */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                  {item.isGone ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl opacity-30">🍞</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-anton text-xs uppercase px-2 py-1 rounded-full bg-[#DA0711] text-white rotate-[-6deg] shadow-md whitespace-nowrap">
                          PARTI À {item.endFormatted}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.image}
                      alt={item.offer.title}
                      className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getDistinctGriddleFoodImage(item.offer.category);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ligne chronologique du Scrubber Draggable */}
          <div className="relative mt-8 pt-4 border-t border-[#111111]/10 max-w-4xl mx-auto">
            <input
              type="range"
              min={12}
              max={20}
              step={0.25}
              value={scrubberHour}
              onChange={(e) => setScrubberHour(parseFloat(e.target.value))}
              className="w-full accent-[#DA0711] bg-[#EDE6D7] h-2.5 rounded-full cursor-ew-resize relative z-20"
            />

            {/* Repères d'heures en bas */}
            <div className="flex justify-between text-[11px] font-mono text-[#555] mt-2 font-bold">
              <span>12:00 Midi</span>
              <span>14:00</span>
              <span>16:00 Pause</span>
              <span>18:00 Sortie cours</span>
              <span>20:00 Clôture</span>
            </div>

            {/* Curseur badge interactif sous la barre */}
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111111] text-[#FFD000] font-mono text-xs font-bold shadow-md">
                <Clock className="w-3.5 h-3.5 text-[#FFD000]" />
                <span>Tu passes à {formatScrubberTime(scrubberHour)} · glisser pour simuler</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B : FULL-BLEED RED TICKER RIBBON (MARQUEE)
          ========================================================================= */}
      <div className="griddle-ticker my-6 shadow-sm">
        <div className="griddle-ticker-track">
          <div className="griddle-ticker-item">
            <span>ANTI-GASPILLAGE</span><span className="griddle-ticker-star">★</span>
            <span>PLATS DU JOUR DU MONTFLEURY</span><span className="griddle-ticker-star">★</span>
            <span>JUSQU'À -70% DE RÉDUCTION</span><span className="griddle-ticker-star">★</span>
            <span>ÉCONOMIES ÉTUDIANTES ESSECT</span><span className="griddle-ticker-star">★</span>
            <span>SMART DECAY DYNAMIQUE</span><span className="griddle-ticker-star">★</span>
            <span>REPAS FRAIS DU SOIR</span><span className="griddle-ticker-star">★</span>
          </div>
          <div className="griddle-ticker-item" aria-hidden="true">
            <span>ANTI-GASPILLAGE</span><span className="griddle-ticker-star">★</span>
            <span>PLATS DU JOUR DU MONTFLEURY</span><span className="griddle-ticker-star">★</span>
            <span>JUSQU'À -70% DE RÉDUCTION</span><span className="griddle-ticker-star">★</span>
            <span>ÉCONOMIES ÉTUDIANTES ESSECT</span><span className="griddle-ticker-star">★</span>
            <span>SMART DECAY DYNAMIQUE</span><span className="griddle-ticker-star">★</span>
            <span>REPAS FRAIS DU SOIR</span><span className="griddle-ticker-star">★</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-4">

        {/* =========================================================================
            SECTION C : RECHERCHE & PILL CATEGORY BAR
            ========================================================================= */}
        <section className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un plat, burger smash, baguette farcie, restaurant..."
          />

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
            categoryCounts={categoryCounts}
          />
        </section>

        {/* =========================================================================
            SECTION D : NOS PÉPITES ANTI-GASPI (AUTHENTIC GRIDDLE BESTSELLERS)
            ========================================================================= */}
        <section id="bestsellers" className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#111111]/8">
            <div>
              <h2 className="font-anton uppercase text-3xl sm:text-4xl tracking-wide text-[#111111]">
                NOS PÉPITES ANTI-GASPI
              </h2>
              <p className="text-xs text-[#666] font-medium mt-0.5">
                Plats cuisinés du jour sauvés chez les artisans voisins de l'ESSECT
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-anton uppercase px-3 py-1.5 rounded-full bg-[#EDE6D7] text-[#111111]">
                ⚡ {filteredOffers.length} OFFRE{filteredOffers.length > 1 ? 'S' : ''} DISPONIBLE{filteredOffers.length > 1 ? 'S' : ''}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-griddle-outline text-xs py-1.5 px-4 hidden sm:inline-flex"
              >
                TOUT LE MENU →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Spinner size="lg" />
              <p className="text-xs text-[#555] font-bold">Recherche des meilleurs tickets en direct...</p>
            </div>
          ) : filteredOffers.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Aucun plat ne correspond à ces critères"
              description="Essayez d'élargir votre budget maximal, de sélectionner une autre catégorie ou de réinitialiser vos filtres."
              action={
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-griddle-yellow text-xs"
                >
                  Réinitialiser tous les filtres
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              {filteredOffers.map((offer, idx) =>
                offer.isSurpriseBasket ? (
                  <MysteryBoxCard key={offer.id} offer={offer} index={idx} />
                ) : (
                  <OfferCard key={offer.id} offer={offer} index={idx} />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
