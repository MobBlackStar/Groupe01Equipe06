// 💡 Concept & Analogie : Comme les onglets tactiles d'une carte de menu, ce panneau regroupe les filtres par pilules avec décompte d'articles en direct.
// 🔄 Comparaison React / Flutter : En React, les pilules utilisent des classes Tailwind Griddle ; en Flutter, `filter_bottom_sheet.dart` présente des ChoiceChip arrondis.
// 🎯 À retenir pour la soutenance : "Chaque pilule affiche le décompte réel d'offres disponibles dans la catégorie."

import React from 'react';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { Flame, Sparkles, RotateCcw } from 'lucide-react';

const CATEGORY_DEFINITIONS = [
  { id: 'ALL', label: 'Tous', icon: '🍽️' },
  { id: OFFER_CATEGORIES.SANDWICH, label: 'Sandwichs', icon: '🥪' },
  { id: OFFER_CATEGORIES.PLAT_CHAUD, label: 'Plats Chauds', icon: '🍲' },
  { id: OFFER_CATEGORIES.PIZZA, label: 'Pizzas', icon: '🍕' },
  { id: OFFER_CATEGORIES.VIENNOISERIE, label: 'Viennoiseries', icon: '🥐' },
  { id: OFFER_CATEGORIES.PATISSERIE, label: 'Pâtisseries', icon: '🧁' },
  { id: OFFER_CATEGORIES.SALADE, label: 'Salades', icon: '🥗' },
  { id: OFFER_CATEGORIES.SNACK, label: 'Snacks & Frites', icon: '🍟' },
  { id: OFFER_CATEGORIES.BOISSON, label: 'Boissons', icon: '🥤' },
  { id: OFFER_CATEGORIES.MIXTE, label: 'Paniers Mixtes', icon: '🎁' },
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
  return (
    <div className={`flex flex-col gap-4 p-5 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.03)] text-[#111111] ${className}`}>
      
      {/* 1. Pill Category Bar avec compteurs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[11px] font-anton uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#DA0711]" />
            <span>Rayons du Marché (Catégories)</span>
          </label>
          <span className="text-[11px] text-[#666] font-medium">
            Sélectionnez un rayon
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_DEFINITIONS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? (cat.id === 'ALL' ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : 0);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-anton uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#DA0711] text-white shadow-sm'
                    : 'bg-white text-[#111111] hover:bg-[#FAF3E6] border border-[#111111]/8'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FFD000] text-[#111111]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filtres secondaires : Budget, Tri, et Panier Surprise */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3.5 border-t border-[#111111]/8 items-center">
        
        {/* Curseur Budget Max */}
        <div className="md:col-span-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666]">
              Budget Max :
            </span>
            <span className="font-anton text-base text-[#DA0711]">
              {formatTND(maxPriceMillimes)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={maxPriceMillimes}
            onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
            className="w-full accent-[#DA0711] bg-[#FAF3E6] h-2 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-medium text-[#777] mt-1">
            <span>1.000 DT</span>
            <span>10.000 DT</span>
            <span>20.000 DT</span>
          </div>
        </div>

        {/* Boutons de Tri */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666] mb-1.5">
            Trier les tickets par :
          </label>
          <div className="flex rounded-full bg-white p-1 border border-[#111111]/8 text-xs font-anton uppercase tracking-wider">
            <button
              type="button"
              onClick={() => onChangeSortBy('distance')}
              className={`flex-1 py-1 px-3 rounded-full transition-all text-center cursor-pointer ${
                sortBy === 'distance'
                  ? 'bg-[#DA0711] text-white shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
              }`}
            >
              Proximité
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('price')}
              className={`flex-1 py-1 px-3 rounded-full transition-all text-center cursor-pointer ${
                sortBy === 'price'
                  ? 'bg-[#FFD000] text-[#111111] shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
              }`}
            >
              Prix bas
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('ending')}
              className={`flex-1 py-1 px-3 rounded-full transition-all text-center cursor-pointer ${
                sortBy === 'ending'
                  ? 'bg-[#DA0711] text-white shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
              }`}
            >
              Urgence
            </button>
          </div>
        </div>

        {/* Toggle Panier Surprise & Reset */}
        <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => onToggleSurpriseOnly(!surpriseOnly)}
            className={`px-4 py-2 rounded-full text-xs font-anton uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              surpriseOnly
                ? 'bg-[#FFD000] text-[#111111] shadow-sm'
                : 'bg-white text-[#111111] hover:bg-[#FAF3E6] border border-[#111111]/8'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DA0711]" />
            <span>Paniers Mystères</span>
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            title="Réinitialiser tous les filtres"
            className="p-2 rounded-full bg-white border border-[#111111]/8 text-[#111111] hover:bg-[#FAF3E6] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
