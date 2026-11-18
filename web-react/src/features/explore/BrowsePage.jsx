// 💡 Concept & Analogie : Comme la traversée d'un marché gourmand scandinave (Fika) croisé avec l'énergie brute d'un street-food nocturne (StreetWok).
// 🔄 Comparaison React / Flutter : En React, la page intègre la frise chronologique dégressive Fika interactive avec calcul en direct de Dutch Auction (`computeUnitPrice`) ; en Flutter, `explore_screen.dart` adapte la timeline.
// 🎯 À retenir pour la soutenance : "Le Time Scrubber Hero permet au jury de voyager dans le temps (12h-20h) et de constater la baisse progressive des prix et l'apposition du tampon PARTI À HH:MM sur les invendus expirés."
// Module : Catalogue & Exploration (M4, I1)

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BarChart3,
  Ticket,
  MapPin,
  Globe,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
} from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import FilterPanel from './FilterPanel.jsx';
import { OfferCard, MysteryBoxCard } from '../../components/offers/index.js';
import { EmptyState, Spinner } from '../../components/ui/index.js';
import { DepthCard, DepthLayer } from '../../components/common/DepthCard.jsx';
import { apiClient } from '../../lib/api.js';
import { ENDPOINTS } from '../../lib/endpoints.js';
import { computeUnitPrice } from '@shared/pricing.js';
import { formatTND } from '@shared/money.js';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { FRAMER_ASSETS, getFramerFoodImage } from '../../lib/framerAssets.js';

// Jeu d'offres de démonstration Montfleury (Fallback résilient avec vraies photos appétissantes)
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
    imageUrl: '/assets/framer/burgers/sandwich-hot-chicken.png',
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
    imageUrl: '/assets/framer/pastries/box-assortiment-fika.png',
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
    quantityAvailable: 3,
    distanceFromEssectM: 350,
    pickupStartAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 450,
    imageUrl: '/assets/framer/bowls/riz-saute-crevettes.webp',
  },
  {
    id: 'off-masmoudi-04',
    merchantId: 'merchant-masmoudi',
    merchantName: 'Pâtisserie Masmoudi',
    title: 'Coffret Découverte Pâtisserie Fine',
    description: 'Sélection raffinée de douceurs traditionnelles tunisiennes et gâteaux feuilletés.',
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
    imageUrl: '/assets/framer/pastries/tarte-citron-meringuee.png',
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
    imageUrl: '/assets/framer/burgers/burger-smash-classic.png',
  },
  {
    id: 'off-phare-06',
    merchantId: 'merchant-le-phare',
    merchantName: 'Fast Food Le Phare',
    title: 'Double Smash Burger Spécial Étudiant',
    description: 'Double steak smashé croustillant, cheddar coulant, oignons grillés et sauce secrète.',
    category: OFFER_CATEGORIES.SANDWICH,
    pricingType: 'FIXED',
    originalPriceMillimes: 8500,
    discountedPriceMillimes: 4200,
    targetPriceMillimes: 4200,
    quantityAvailable: 6,
    distanceFromEssectM: 620,
    pickupStartAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    pickupEndAt: new Date(Date.now() + 80 * 60 * 1000).toISOString(),
    isSurpriseBasket: false,
    weightGramsPerUnit: 420,
    imageUrl: '/assets/framer/burgers/burger-double-smash.png',
  },
];

export default function BrowsePage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxPriceMillimes, setMaxPriceMillimes] = useState(20000);
  const [surpriseOnly, setSurpriseOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'price', 'ending'

  // Time Scrubber Hero state (12:00 -> 20:00) (Inspiré de image2.png)
  // Par défaut 17.5 = 17:30
  const [scrubberHour, setScrubberHour] = useState(17.5);

  // Chargement des offres
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

  // Convertit l'heure du scrubber en timestamp millisecondes pour aujourd'hui
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

  // Items du Time Scrubber Hero (image2.png)
  const scrubberShowcaseItems = useMemo(() => {
    const showcaseOffers = offers.slice(0, 5);
    return showcaseOffers.map((offer, idx) => {
      // Échéance horaire
      const endAt = new Date(offer.pickupEndAt || (Date.now() + (idx + 1) * 3600000));
      const endHourDecimal = endAt.getHours() + endAt.getMinutes() / 60;
      const isGone = scrubberHour > endHourDecimal;
      const simulatedPrice = computeUnitPrice(offer, scrubberTimeMs);

      return {
        offer,
        isGone,
        endFormatted: `${String(endAt.getHours()).padStart(2, '0')}:${String(endAt.getMinutes()).padStart(2, '0')}`,
        simulatedPrice,
        image: offer.imageUrl || getFramerFoodImage(offer.title),
      };
    });
  }, [offers, scrubberHour, scrubberTimeMs]);

  const activeScrubberItemsCount = scrubberShowcaseItems.filter((i) => !i.isGone).length;

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F6F1E7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* =========================================================================
            SECTION A : FIKA-STYLE SMART DECAY TIME SCRUBBER HERO (image2.png)
            ========================================================================= */}
        <section className="relative rounded-3xl bg-[#F6F1E7] text-[#161412] p-6 sm:p-10 shadow-2xl overflow-hidden border border-black/10">
          
          {/* Badge haut gauche */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161412]/10 text-[#161412] text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#EE3124] animate-pulse" />
              <span>Fournée du jour · ESSECT Montfleury</span>
            </div>
            <span className="text-xs font-mono text-stone-500 hidden sm:inline">
              Glissez le curseur pour simuler les prix
            </span>
          </div>

          {/* Titre Éditorial Fraunces avec Highlighter Bar Jaune (image2.png) */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-[#161412]">
                Passe à {formatScrubberTime(scrubberHour)}.{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">{activeScrubberItemsCount} sont encore là.</span>
                  {/* Surlignage jaune moutarde style feutre (image2.png) */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-4 bg-[#F5C400] -rotate-1 rounded-sm -z-0 opacity-80"
                  />
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-stone-600 font-sans max-w-2xl leading-relaxed">
                Une fournée par jour. Glisse la ligne à l'heure à laquelle tu passes à pied après les cours et regarde le prix dégressif en temps réel sur le comptoir.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link
                to="/app/radar"
                className="px-4 py-2.5 rounded-full bg-[#0E0D0C] text-[#F6F1E7] font-oswald uppercase text-xs font-bold tracking-wider hover:bg-[#EE3124] transition-all flex items-center gap-2 shadow-lg"
              >
                <MapPin className="w-3.5 h-3.5 text-[#F5C400]" />
                <span>Voir le Radar 3D</span>
              </Link>
            </div>
          </div>

          {/* Vitrine des aliments sur la ligne de temps */}
          <div className="relative pt-6 pb-12 overflow-x-auto scrollbar-none">
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
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-white shadow-md border-t-2 border-dashed border-[#F5C400] text-center pointer-events-none transition-transform group-hover:-translate-y-1">
                    <p className="font-mono text-[11px] font-bold text-[#161412] truncate max-w-[120px]">
                      {item.offer.title}
                    </p>
                    <p className="font-oswald text-xs font-black text-[#EE3124]">
                      {formatTND(item.simulatedPrice)}
                      <span className="text-[10px] text-stone-400 font-normal font-sans ml-1">
                        · fin {item.endFormatted}
                      </span>
                    </p>
                  </div>

                  {/* Photo de l'aliment avec ombre ou tampon PARTI */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    {item.isGone ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-3xl opacity-30">🍞</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="rubber-stamp rubber-stamp-red text-[10px] whitespace-nowrap shadow-md">
                            PARTI À {item.endFormatted}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <DepthCard maxTilt={15} glare={false} className="w-full h-full">
                        <DepthLayer depth={20} shadow className="w-full h-full flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.offer.title}
                            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFramerFoodImage(item.offer.category);
                            }}
                          />
                        </DepthLayer>
                      </DepthCard>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ligne chronologique du Scrubber Draggable */}
            <div className="relative mt-8 pt-4 border-t border-stone-300">
              {/* Curseur de contrôle interactif */}
              <input
                type="range"
                min={12}
                max={20}
                step={0.25}
                value={scrubberHour}
                onChange={(e) => setScrubberHour(parseFloat(e.target.value))}
                className="w-full accent-[#0E0D0C] bg-stone-300 h-2 rounded-lg cursor-ew-resize relative z-20"
              />

              {/* Repères d'heures en bas */}
              <div className="flex justify-between text-[11px] font-mono text-stone-500 mt-2 font-bold">
                <span>12:00 Midi</span>
                <span>14:00</span>
                <span>16:00 Pause</span>
                <span>18:00 Sortie cours</span>
                <span>20:00 Clôture</span>
              </div>

              {/* Curseur badge interactif sous la barre */}
              <div
                className="mt-3 flex justify-center"
              >
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0E0D0C] text-[#F5C400] font-mono text-xs font-bold shadow-xl">
                  <Clock className="w-3.5 h-3.5 text-[#F5C400]" />
                  <span>Tu passes à {formatScrubberTime(scrubberHour)} · glisser pour simuler</span>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* =========================================================================
              SECTION B : RECHERCHE & PILL CATEGORY BAR (image5.png)
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
              SECTION C : STREETWOK HANGING SERRATED ORDER TICKETS (image8.png)
              ========================================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#EE3124]" />
                <h2 className="font-oswald uppercase text-2xl font-black tracking-wide text-white">
                  Bons de Commande Suspendus
                </h2>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#161412] border border-white/10 text-[#F5C400] font-bold">
                ⚡ {filteredOffers.length} ticket{filteredOffers.length > 1 ? 's' : ''} disponible{filteredOffers.length > 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" />
                <p className="text-xs text-stone-400 font-mono">Recherche des meilleurs tickets en direct...</p>
              </div>
            ) : filteredOffers.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="Aucun ticket ne correspond à ces critères"
                description="Essayez d'élargir votre budget maximal, de sélectionner une autre catégorie ou de réinitialiser vos filtres."
                action={
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-full bg-[#F5C400] text-[#0E0D0C] font-oswald uppercase font-black text-xs hover:bg-[#e0b300] transition-colors"
                  >
                    Réinitialiser tous les filtres
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredOffers.map((offer) =>
                  offer.isSurpriseBasket ? (
                    <MysteryBoxCard key={offer.id} offer={offer} />
                  ) : (
                    <OfferCard key={offer.id} offer={offer} />
                  )
                )}
              </div>
            )}
          </section>
      </div>
    </div>
  );
}
