// 💡 Concept & Analogie : Comme la traversée d'un diner vintage américain croisé avec un marché de producteurs locaux, le héros full-bleed respire sur la toile crème #FAF3E6.
// 🔄 Comparaison React / Flutter : En React, la page intègre le Time Scrubber dégressif interactif avec calcul en direct de Dutch Auction (`computeUnitPrice`) ; en Flutter, `explore_screen.dart` adapte la timeline.
// 🎯 À retenir pour la soutenance : "Le Time Scrubber Hero permet au jury de voyager dans le temps (12h-20h) et de constater la baisse progressive des prix et l'apposition du tampon PARTI À HH:MM sur les invendus expirés."
// Module : Catalogue & Exploration (M4, I1)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
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

export default function BrowsePage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showDecay, setShowDecay] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMerchant, setSelectedMerchant] = useState('ALL');
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
      setLoadError('');
      try {
        const res = await apiClient.get(ENDPOINTS.OFFERS);
        if (isMounted && res.data && Array.isArray(res.data.offers)) {
          // Le catalogue du serveur fait foi, même vide : jamais d'offres inventées qu'on ne pourrait pas réserver
          setOffers(res.data.offers);
        }
      } catch (err) {
        if (isMounted) setLoadError(err?.response?.data?.error?.message || 'Impossible de charger les offres. Vérifiez la connexion.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedMerchant('ALL');
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

  // Liste unique des commerces présents dans le catalogue
  const merchantList = useMemo(() => {
    const map = new Map();
    offers.forEach((o) => {
      const name = o.merchantName || o.merchantSnapshot?.name || o.merchant?.name;
      const id = o.merchantId || o.merchantSnapshot?.id || o.merchant?.id || name;
      if (name && id) {
        if (!map.has(name)) {
          map.set(name, { id, name, count: 0 });
        }
        map.get(name).count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [offers]);

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

        if (selectedMerchant !== 'ALL') {
          const mName = (offer.merchantName || offer.merchantSnapshot?.name || offer.merchant?.name || '').toLowerCase();
          const mId = offer.merchantId || offer.merchantSnapshot?.id || offer.merchant?.id;
          if (mId !== selectedMerchant && mName !== selectedMerchant.toLowerCase()) {
            return false;
          }
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

      const foodImage = offer.photoUrl || offer.imageUrl || getDistinctGriddleFoodImage(offer.category || 'fast-food', offer.id || idx);

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
    <div className="bg-[#FAF3E6] text-[#111111]">
      {/* =========================================================================
          SECTION A : HERO GRIDDLE (titre monumental + plateau + stickers)
          ========================================================================= */}
      <section className="cs-container pt-6 sm:pt-10 lg:pt-12">
        <h1 className="cs-hero text-center cs-fade-up">
          Cuisiné. <span className="text-[#DA0711]">Bradé.</span> Sauvé.
        </h1>

        <div className="relative grid lg:grid-cols-12 items-center gap-6 lg:gap-4 mt-4 lg:mt-0">
          <div className="lg:col-span-4 order-2 lg:order-1 cs-fade-up" style={{ animationDelay: '120ms' }}>
            <p className="cs-lead">
              Les invendus du jour des artisans de Montfleury, jusqu'à <strong className="font-semibold text-[#DA0711]">-70%</strong>, à cinq minutes à pied de l'ESSECT.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#bestsellers" className="cs-btn cs-btn-red">
                Commander
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </a>
              <Link to="/app/radar" className="cs-btn cs-btn-cream">
                <MapPin className="w-5 h-5" strokeWidth={2.5} />
                Voir le radar
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2 relative">
            <img
              src="/assets/griddle/food/hero-double-smash-tray.png"
              alt="Plateau de plats chauds sauvés du gaspillage"
              className="w-full max-w-[860px] ml-auto drop-shadow-[0_40px_40px_rgba(17,17,17,0.25)]"
            />
            <img src="/assets/griddle/stickers/sticker-bestseller-framer.png" alt="" aria-hidden="true" className="absolute left-[2%] top-[12%] w-[18%] cs-float" style={{ '--r': '-12deg' }} />
            <img src="/assets/griddle/stickers/sticker-new-framer.png" alt="" aria-hidden="true" className="absolute right-[1%] top-[6%] w-[19%] cs-float" style={{ '--r': '-8deg', animationDelay: '1.2s' }} />
            <img src="/assets/griddle/stickers/sticker-hot-framer.png" alt="" aria-hidden="true" className="absolute right-[4%] bottom-[10%] w-[17%] cs-float" style={{ '--r': '6deg', animationDelay: '2.4s' }} />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION D : NOS PÉPITES ANTI-GASPI (catalogue)
          ========================================================================= */}
      <section id="bestsellers" className="cs-container pt-10 sm:pt-12 pb-16 scroll-mt-24">
        <div className="mb-6">
          <p className="cs-eyebrow mb-2">
            {filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''} disponible{filteredOffers.length > 1 ? 's' : ''}
          </p>
          <h2 className="cs-title-lg">Nos pépites anti-gaspi</h2>
        </div>

        <div className="space-y-4 mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Un plat, une baguette farcie, un restaurant…"
          />

          {/* Filtre rapide par restaurant / établissement partenaire */}
          {merchantList.length > 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="cs-eyebrow !text-xs !tracking-wider flex items-center gap-1.5 text-[#5E5850]">
                  <span>🏪</span> Établissements partenaires de Montfleury
                </span>
                {selectedMerchant !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMerchant('ALL')}
                    className="text-xs font-bold text-[#DA0711] hover:underline"
                  >
                    Voir tous les restaurants ({offers.length} offres)
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                  type="button"
                  onClick={() => setSelectedMerchant('ALL')}
                  className={`cs-chip shrink-0 ${selectedMerchant === 'ALL' ? '!bg-[#111111] !text-[#FAF3E6]' : ''}`}
                  aria-pressed={selectedMerchant === 'ALL'}
                >
                  Tous ({offers.length})
                </button>
                {merchantList.map((m) => {
                  const isSel = selectedMerchant === m.id || selectedMerchant === m.name;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMerchant(isSel ? 'ALL' : m.name)}
                      className={`cs-chip shrink-0 ${isSel ? '!bg-[#DA0711] !text-white !border-[#DA0711]' : ''}`}
                      aria-pressed={isSel}
                    >
                      {m.name} ({m.count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-5">
            <Spinner size="lg" />
            <p className="cs-lead">Recherche des meilleurs plats en direct…</p>
          </div>
        ) : loadError ? (
          <EmptyState
            icon="📡"
            title="Connexion impossible"
            description={loadError}
            action={
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="cs-btn cs-btn-red">
                Réessayer
              </button>
            }
          />
        ) : filteredOffers.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Rien ne correspond"
            description="Élargis ton budget, change de catégorie ou réinitialise les filtres."
            action={
              <button type="button" onClick={handleResetFilters} className="cs-btn cs-btn-red">
                Réinitialiser les filtres
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filteredOffers.map((offer, idx) => (
              <div key={offer.id} className="cs-fade-up" style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}>
                {offer.isSurpriseBasket ? (
                  <MysteryBoxCard offer={offer} index={idx} />
                ) : (
                  <OfferCard offer={offer} index={idx} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION C : SIMULATEUR SMART DECAY (replié par défaut : le catalogue passe en premier)
          ========================================================================= */}
      <section className="cs-container pb-12">
        <button
          type="button"
          onClick={() => setShowDecay((v) => !v)}
          aria-expanded={showDecay}
          className="cs-btn cs-btn-cream w-full sm:w-auto"
        >
          <span aria-hidden="true">⏱</span>
          Simulateur Smart Decay : le prix baisse, tu choisis quand
          <span aria-hidden="true">{showDecay ? '−' : '+'}</span>
        </button>
        {showDecay && (
          <div className="mt-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-end mb-10">
          <div className="lg:col-span-7">
            <p className="cs-eyebrow mb-3">Smart Decay · simulateur</p>
            <h2 className="cs-title-lg">Le prix baisse. Tu choisis quand.</h2>
            <p className="cs-lead mt-4 max-w-xl">
              Glisse l'heure de passage : les prix baissent en direct, mais les portions partent aussi.
            </p>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="cs-label">Tu passes à</p>
            <p className="font-display text-[7rem] sm:text-[9rem] leading-[0.8] tabular-nums text-[#DA0711]">
              {formatScrubberTime(scrubberHour)}
            </p>
            <p className="mt-2 text-xl font-medium">
              <span className="cs-highlight">
                {activeScrubberItemsCount} portion{activeScrubberItemsCount > 1 ? 's' : ''} encore là
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {scrubberShowcaseItems.map((item, idx) => (
            <button
              key={item.offer.id || idx}
              type="button"
              onClick={() => setSelectedCategory(item.offer.category || 'ALL')}
              className="group text-left"
              title={`Filtrer : ${item.offer.title}`}
            >
              <div className="cs-photo cs-photo-zoom aspect-square">
                <img
                  src={item.image}
                  alt={item.offer.title}
                  loading="lazy"
                  className={item.isGone ? 'grayscale opacity-40' : ''}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getDistinctGriddleFoodImage(item.offer.category);
                  }}
                />
                {item.isGone && (
                  <span className="absolute inset-0 z-10 grid place-items-center">
                    <span className="cs-stamp !text-xl bg-[#FAF3E6]/90">Parti à {item.endFormatted}</span>
                  </span>
                )}
              </div>
              <p className="mt-3 font-semibold uppercase leading-tight line-clamp-2 group-hover:text-[#DA0711] transition-colors">
                {item.offer.title}
              </p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className={`font-display text-[2.1rem] leading-none tabular-nums ${item.isGone ? 'text-[#5E5850] line-through' : 'text-[#DA0711]'}`}>
                  {Number.isFinite(item.simulatedPrice) ? formatTND(item.simulatedPrice) : '—'}
                </span>
                <span className="text-[0.9375rem] text-[#5E5850] uppercase">fin {item.endFormatted}</span>
              </p>
            </button>
          ))}
        </div>

        {/* Curseur horaire */}
        <div className="mt-12 max-w-4xl mx-auto">
          <label htmlFor="time-scrubber" className="sr-only">Heure de passage simulée</label>
          <input
            id="time-scrubber"
            type="range"
            min={12}
            max={20}
            step={0.25}
            value={scrubberHour}
            onChange={(e) => setScrubberHour(parseFloat(e.target.value))}
            className="cs-range"
          />
          <div className="mt-3 flex justify-between text-[0.9375rem] font-semibold uppercase text-[#5E5850]">
            <span>12h Midi</span>
            <span className="hidden sm:inline">14h</span>
            <span>16h Pause</span>
            <span className="hidden sm:inline">18h Sortie</span>
            <span>20h Clôture</span>
          </div>
        </div>
                </div>
        )}
      </section>

      {/* =========================================================================
          SECTION E : TUILES PHOTO (comme « Our Story / Menu » de Griddle)
          ========================================================================= */}
      <section className="cs-container pb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/app/radar" className="group cs-photo cs-photo-zoom cs-photo-tile aspect-[4/3] md:aspect-[5/4] block">
            <img src="/assets/griddle/food/night-market-wok-stall.webp" alt="Stand de rue à Montfleury" loading="lazy" />
            <span className="absolute inset-0 z-10 grid place-items-center cs-title-lg !text-[clamp(2.75rem,6vw,5rem)] text-white text-center px-4">
              Holo-Radar
            </span>
          </Link>
          <Link to="/impact" className="group cs-photo cs-photo-zoom cs-photo-tile aspect-[4/3] md:aspect-[5/4] block">
            <img src="/assets/griddle/food/lantern-dining-room.webp" alt="Salle de restaurant chaleureuse" loading="lazy" />
            <span className="absolute inset-0 z-10 grid place-items-center cs-title-lg !text-[clamp(2.75rem,6vw,5rem)] text-white text-center px-4">
              Notre impact
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
