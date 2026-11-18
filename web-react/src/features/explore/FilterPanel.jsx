// 💡 Concept & Analogie : Comme les onglets tactiles d'une carte de menu, ce panneau regroupe les filtres par pilules avec décompte d'articles en direct.
// 🔄 Comparaison React / Flutter : En React, les pilules utilisent des classes Tailwind Griddle ; en Flutter, `filter_bottom_sheet.dart` présente des ChoiceChip arrondis.
// 🎯 À retenir pour la soutenance : "Chaque pilule affiche le décompte réel d'offres disponibles dans la catégorie."

import React from 'react';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { Sparkles, RotateCcw } from 'lucide-react';

const CATEGORY_DEFINITIONS = [
  { id: 'ALL', label: 'Tous' },
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
  maxPriceMillimes = 20000,
  onChangeMaxPrice,
  surpriseOnly = false,
  onToggleSurpriseOnly,
  sortBy = 'distance',
  onChangeSortBy,
  onResetFilters,
  categoryCounts = {},
  className = '',
}) {
  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Catégories (on ne montre que les rayons qui ont des offres) */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Catégories">
        {CATEGORY_DEFINITIONS.map((cat) => {
          const count = cat.id === 'ALL' ? totalCount : categoryCounts[cat.id] || 0;
          const isSelected = selectedCategory === cat.id;
          if (cat.id !== 'ALL' && count === 0 && !isSelected) return null;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className="cs-chip shrink-0"
            >
              {cat.label}
              {count > 0 && <span className="cs-chip-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 2. Budget, tri, paniers mystères */}
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <div className="flex items-baseline justify-between mb-3">
            <label htmlFor="budget-max" className="cs-field-label !mb-0">Budget max</label>
            <span className="font-display text-[2.25rem] leading-none text-[#DA0711] tabular-nums">
              {formatTND(maxPriceMillimes)}
            </span>
          </div>
          <input
            id="budget-max"
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={maxPriceMillimes}
            onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
            className="cs-range"
          />
        </div>

        <div className="md:col-span-4">
          <p className="cs-field-label">Trier par</p>
          <div className="flex gap-2" role="group" aria-label="Tri">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={sortBy === s.id}
                onClick={() => onChangeSortBy(s.id)}
                className="cs-chip flex-1 justify-center"
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
            className={`cs-chip flex-1 md:flex-none justify-center ${surpriseOnly ? '!bg-[#FFD000] !text-[#111111]' : ''}`}
          >
            <Sparkles className="w-[18px] h-[18px]" />
            Paniers mystères
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            title="Réinitialiser tous les filtres"
            aria-label="Réinitialiser tous les filtres"
            className="cs-icon-btn shrink-0"
          >
            <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
