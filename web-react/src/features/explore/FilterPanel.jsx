// 💡 Concept & Analogie : Comme les onglets tactiles d'une carte de menu contemporaine (image5.png), ce panneau regroupe les filtres par pilules avec décompte d'articles en direct.
// 🔄 Comparaison React / Flutter : En React, les pilules utilisent des classes Tailwind fluides et des compteurs dynamiques ; en Flutter, `filter_bottom_sheet.dart` présente des ChoiceChip arrondis.
// 🎯 À retenir pour la soutenance : "Chaque pilule affiche le décompte réel d'offres disponibles dans la catégorie, évitant à l'étudiant de cliquer sur des filtres vides."
// Module : Recherche & Filtres (M4)

import React from 'react';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';
import { Flame, Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';

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
    <div className={`flex flex-col gap-4 p-4 sm:p-5 rounded-3xl bg-[#161412] border border-white/10 shadow-xl ${className}`}>
      
      {/* 1. Pill Category Bar avec compteurs (Inspiré de image5.png) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[#F6F1E7]/60 flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-[#EE3124]" />
            <span>Rayons du Marché (Catégories)</span>
          </label>
          <span className="text-[10px] text-[#F5C400] font-mono">
            Sélectionnez une catégorie pour filtrer les tickets
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? 'bg-[#F5C400] text-[#0E0D0C] shadow-md shadow-[#F5C400]/20 scale-[1.02]'
                    : 'bg-white/5 text-[#F6F1E7]/80 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-[#0E0D0C] text-[#F5C400]'
                        : 'bg-white/10 text-[#F6F1E7]/60'
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3.5 border-t border-white/10 items-center">
        
        {/* Curseur Budget Max */}
        <div className="md:col-span-5">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#F6F1E7]/70">
              Budget Max :
            </span>
            <span className="font-oswald text-sm font-black text-[#F5C400]">
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
            className="w-full accent-[#F5C400] bg-stone-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#F6F1E7]/40 mt-1">
            <span>1.000 DT</span>
            <span>10.000 DT</span>
            <span>20.000 DT</span>
          </div>
        </div>

        {/* Boutons de Tri */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#F6F1E7]/70 mb-1.5">
            Trier les tickets par :
          </label>
          <div className="flex rounded-xl bg-black/50 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => onChangeSortBy('distance')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                sortBy === 'distance'
                  ? 'bg-[#EE3124] text-white shadow-sm'
                  : 'text-[#F6F1E7]/70 hover:text-white'
              }`}
            >
              Proximité
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('price')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                sortBy === 'price'
                  ? 'bg-[#F5C400] text-[#0E0D0C] shadow-sm'
                  : 'text-[#F6F1E7]/70 hover:text-white'
              }`}
            >
              Prix bas
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('ending')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                sortBy === 'ending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#F6F1E7]/70 hover:text-white'
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
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              surpriseOnly
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                : 'bg-white/5 border-white/10 text-[#F6F1E7]/70 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Paniers Mystères</span>
          </button>

          <button
            type="button"
            onClick={onResetFilters}
            title="Réinitialiser tous les filtres"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F6F1E7]/60 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
