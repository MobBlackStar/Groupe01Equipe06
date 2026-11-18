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
    <div className={`flex flex-col gap-4 p-4 sm:p-5 rounded-xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] text-[#141210] ${className}`}>
      
      {/* 1. Pill Category Bar avec compteurs */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[11px] font-mono uppercase tracking-widest text-[#141210] flex items-center gap-1.5 font-black">
            <Flame className="w-3.5 h-3.5 text-[#E51C23]" />
            <span>Rayons du Marché (Catégories)</span>
          </label>
          <span className="text-[11px] text-[#555] font-mono font-bold">
            Sélectionnez un rayon
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_DEFINITIONS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? (cat.id === 'ALL' ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : 0);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E51C23] text-white border-[#141210] shadow-[2px_2px_0px_#141210]'
                    : 'bg-white text-[#141210] border-[#141210] hover:bg-[#F4EFE6]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black border ${
                      isSelected
                        ? 'bg-white text-[#E51C23] border-[#141210]'
                        : 'bg-[#FFD000] text-[#141210] border-[#141210]'
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3.5 border-t-2 border-[#141210]/15 items-center">
        
        {/* Curseur Budget Max */}
        <div className="md:col-span-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666]">
              Budget Max :
            </span>
            <span className="font-anton text-base text-[#E51C23]">
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
            className="w-full accent-[#E51C23] bg-[#FAF6EE] h-2 rounded-lg cursor-pointer border border-[#141210]"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#777] mt-1 font-bold">
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
          <div className="flex rounded-lg bg-white p-1 border-2 border-[#141210] text-xs">
            <button
              type="button"
              onClick={() => onChangeSortBy('distance')}
              className={`flex-1 py-1 px-2 rounded-md font-bold transition-all text-center cursor-pointer ${
                sortBy === 'distance'
                  ? 'bg-[#E51C23] text-white shadow-sm'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              Proximité
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('price')}
              className={`flex-1 py-1 px-2 rounded-md font-bold transition-all text-center cursor-pointer ${
                sortBy === 'price'
                  ? 'bg-[#FFD000] text-[#141210] shadow-sm font-black'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              Prix bas
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('ending')}
              className={`flex-1 py-1 px-2 rounded-md font-bold transition-all text-center cursor-pointer ${
                sortBy === 'ending'
                  ? 'bg-[#C2410C] text-white shadow-sm font-black'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              Urgence
            </button>
          </div>
        </div>

        {/* Toggle Panier Surprise & Reset */}
        <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => onToggleSurpriseOnly(!surpriseOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-[#141210] transition-all flex items-center gap-1.5 cursor-pointer ${
              surpriseOnly
                ? 'bg-[#FFD000] text-[#141210] shadow-[2px_2px_0px_#141210]'
                : 'bg-white text-[#141210] hover:bg-[#F4EFE6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E51C23]" />
            <span>Paniers Mystères</span>
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            title="Réinitialiser tous les filtres"
            className="p-1.5 rounded-lg bg-white border-2 border-[#141210] text-[#141210] hover:bg-[#F4EFE6] transition-colors shadow-[2px_2px_0px_#141210] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
