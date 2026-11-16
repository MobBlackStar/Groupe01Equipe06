// 💡 Concept & Analogie : Comme le panneau de commande d'un filtre optique multicouche, il affine la vue des offres selon le budget étudiant, la faim du moment ou l'urgence de la fermeture.
// 🔄 Comparaison React / Flutter : En React, les filtres sont présentés sous forme de panneau déroulant ou de barre d'onglets horizontaux ; en Flutter, ils s'ouvrent dans une `FilterBottomSheet` modale.
// 🎯 À retenir pour la soutenance : "Trois axes de tri essentiels pour l'étudiant de l'ESSECT : proximité immédiate à pied, prix le plus bas en millimes, et offres arrivant à expiration."

import React from 'react';
import { OFFER_CATEGORIES } from '@shared/constants.js';
import { formatTND } from '@shared/money.js';

const CATEGORY_LABELS = [
  { id: 'ALL', label: 'Tous', icon: '🍽️' },
  { id: OFFER_CATEGORIES.SANDWICH, label: 'Sandwiches', icon: '🥪' },
  { id: OFFER_CATEGORIES.PLAT_CHAUD, label: 'Plats Chauds', icon: '🍲' },
  { id: OFFER_CATEGORIES.PIZZA, label: 'Pizzas', icon: '🍕' },
  { id: OFFER_CATEGORIES.VIENNOISERIE, label: 'Viennoiseries', icon: '🥐' },
  { id: OFFER_CATEGORIES.PATISSERIE, label: 'Pâtisseries', icon: '🧁' },
  { id: OFFER_CATEGORIES.SALADE, label: 'Salades', icon: '🥗' },
  { id: OFFER_CATEGORIES.SNACK, label: 'Snacks', icon: '🥟' },
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
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-4 p-4 rounded-2xl bg-[#161920] border border-white/10 ${className}`}>
      {/* 1. Catégories en puces défilables */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-2">
          Catégorie d'aliments
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_LABELS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20 scale-[1.02]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5 items-center">
        {/* 2. Curseur Prix Maximum */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400">Budget Maximum :</span>
            <span className="font-bold text-[#CCFF00]">
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
            className="w-full accent-[#CCFF00] bg-slate-700 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>1,000 DT</span>
            <span>10,000 DT</span>
            <span>20,000 DT</span>
          </div>
        </div>

        {/* 3. Sélecteur de Tri */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Trier les offres par
          </label>
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => onChangeSortBy('distance')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center ${
                sortBy === 'distance'
                  ? 'bg-[#CCFF00] text-black font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📍 Proximité
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('price')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center ${
                sortBy === 'price'
                  ? 'bg-[#CCFF00] text-black font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              💰 Prix bas
            </button>
            <button
              type="button"
              onClick={() => onChangeSortBy('ending')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center ${
                sortBy === 'ending'
                  ? 'bg-[#CCFF00] text-black font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ⏳ Urgence
            </button>
          </div>
        </div>

        {/* 4. Switch Paniers Surprise & Réinitialisation */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={surpriseOnly}
                onChange={(e) => onToggleSurpriseOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#CCFF00]"></div>
            </div>
            <span className="text-xs text-slate-300 font-medium">
              🎁 Paniers Surprise
            </span>
          </label>

          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-slate-400 hover:text-[#CCFF00] underline transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
