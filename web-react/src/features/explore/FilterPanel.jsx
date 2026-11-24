// 💡 Concept & Analogie : Comme les onglets tactiles d'une carte de menu, ce panneau regroupe les filtres par pilules avec décompte d'articles en direct.
// 🔄 Comparaison React / Flutter : En React, les pilules utilisent des classes Tailwind Griddle ; en Flutter, `filter_bottom_sheet.dart` présente des ChoiceChip arrondis.
// 🎯 À retenir pour la soutenance : "Chaque pilule affiche le décompte réel d'offres disponibles selon l'établissement et le budget choisis."

import React, { useState } from 'react';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { Sparkles, RotateCcw, SlidersHorizontal, X } from 'lucide-react';

export const MAX_BUDGET_UNLIMITED = 20000;

const CATEGORY_DEFINITIONS = [
  { id: 'ALL', label: 'Toutes catégories' },
  { id: OFFER_CATEGORIES.SANDWICH, label: 'Sandwichs' },
  { id: OFFER_CATEGORIES.PLAT_CHAUD, label: 'Plats chauds' },
  { id: OFFER_CATEGORIES.PIZZA, label: 'Pizzas' },
  { id: OFFER_CATEGORIES.VIENNOISERIE, label: 'Viennoiseries' },
  { id: OFFER_CATEGORIES.PATISSERIE, label: 'Pâtisseries' },
  { id: OFFER_CATEGORIES.SALADE, label: 'Salades' },
  { id: OFFER_CATEGORIES.SNACK, label: 'Snacks & frites' },
  { id: OFFER_CATEGORIES.BOISSON, label: 'Boissons' },
  { id: OFFER_CATEGORIES.MIXTE, label: 'Paniers mixtes' },
];

const SORTS = [
  { id: 'distance', label: 'Proximité' },
  { id: 'price', label: 'Prix bas' },
  { id: 'ending', label: 'Urgence' },
];

export default function FilterPanel({
  selectedCategory = 'ALL',
  onSelectCategory,
  maxPriceMillimes = MAX_BUDGET_UNLIMITED,
  onChangeMaxPrice,
  surpriseOnly = false,
  onToggleSurpriseOnly,
  sortBy = 'distance',
  onChangeSortBy,
  onResetFilters,
  categoryCounts = {},
  activeFilters = [],
  hasActiveFilters = false,
  className = '',
}) {
  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  // Téléphone : budget, tri et paniers mystères sont repliés derrière un bouton ; toujours visibles dès md
  const [moreOpen, setMoreOpen] = useState(false);

  const secondaryActiveCount =
    (maxPriceMillimes < MAX_BUDGET_UNLIMITED ? 1 : 0) +
    (surpriseOnly ? 1 : 0) +
    (sortBy !== 'distance' ? 1 : 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Catégories (dynamiques selon l'établissement et les filtres actifs) */}
      <div
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        {CATEGORY_DEFINITIONS.map((cat) => {
          const count = cat.id === 'ALL' ? totalCount : categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;
          if (cat.id !== 'ALL' && count === 0 && !isSelected) return null;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(isSelected && cat.id !== 'ALL' ? 'ALL' : cat.id)}
              className="cs-chip shrink-0"
            >
              {cat.label}
              {count > 0 && <span className="cs-chip-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 2. Bouton mobile pour déplier Budget, tri et paniers mystères */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="cs-btn cs-btn-cream cs-btn-sm !min-h-[44px] flex-1 justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span>{moreOpen ? 'Masquer les options' : 'Budget, tri & mystère'}</span>
          {secondaryActiveCount > 0 && (
            <span className="cs-chip-count !ml-1">{secondaryActiveCount}</span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="cs-btn cs-btn-cream cs-btn-sm !min-h-[44px] !text-[#DA0711]"
            aria-label="Réinitialiser tous les filtres"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {/* 3. Panneau structuré : Budget, Tri, Paniers mystères & Réinitialisation */}
      <div
        className={`rounded-3xl bg-[#F4EBDA]/70 border-2 border-[#111111]/10 p-4 sm:p-5 grid gap-5 md:grid-cols-12 md:items-end ${
          moreOpen ? '' : 'hidden md:grid'
        }`}
      >
        <div className="md:col-span-5">
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="budget-max" className="cs-field-label !mb-0">
              Budget max
            </label>
            <span
              className={`font-display text-[1.75rem] sm:text-[2rem] leading-none tabular-nums ${
                maxPriceMillimes < MAX_BUDGET_UNLIMITED ? 'text-[#DA0711]' : 'text-[#111111]'
              }`}
            >
              {maxPriceMillimes >= MAX_BUDGET_UNLIMITED ? 'Tout budget' : formatTND(maxPriceMillimes)}
            </span>
          </div>
          <input
            id="budget-max"
            type="range"
            min={1500}
            max={MAX_BUDGET_UNLIMITED}
            step={500}
            value={maxPriceMillimes}
            onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
            className="cs-range"
          />
        </div>

        <div className="md:col-span-4">
          <p className="cs-field-label !mb-2">Trier par</p>
          <div className="flex gap-2" role="group" aria-label="Ordre d'affichage">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={sortBy === s.id}
                onClick={() => onChangeSortBy(s.id)}
                className="cs-chip flex-1 justify-center !px-3"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 flex items-center gap-2 md:justify-end">
          <button
            type="button"
            aria-pressed={surpriseOnly}
            onClick={() => onToggleSurpriseOnly(!surpriseOnly)}
            className={`cs-chip flex-1 md:flex-none justify-center ${
              surpriseOnly ? '!bg-[#FFD000] !text-[#111111] !border-[#111111]' : ''
            }`}
          >
            <Sparkles className="w-[18px] h-[18px]" aria-hidden="true" />
            <span>Paniers mystères</span>
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
            title="Réinitialiser tous les filtres"
            aria-label="Réinitialiser tous les filtres"
            className={`cs-icon-btn shrink-0 ${
              hasActiveFilters
                ? '!border-[#DA0711] !text-[#DA0711]'
                : 'opacity-45 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 4. Bandeau récapitulatif des filtres actifs (suppression en 1 clic) */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1" role="region" aria-label="Filtres actifs">
          <span className="text-[13px] font-bold uppercase tracking-wider text-[#5E5850] mr-1">
            Filtres actifs :
          </span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.onClear}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#111111] text-[#FAF3E6] px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#DA0711] transition-colors cursor-pointer"
            >
              <span>{f.label}</span>
              <X className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[13px] font-bold text-[#DA0711] hover:underline ml-1 px-2 py-1"
            >
              Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
