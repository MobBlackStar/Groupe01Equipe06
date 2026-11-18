// 💡 Concept & Analogie : Comme convertir des devises étrangères en monnaie locale pour comprendre leur valeur réelle, ce composant convertit des grammes de CO₂ en équivalences tangibles de la vie quotidienne.
// 🔄 Comparaison React / Flutter : En React, les tuiles exploitent Tailwind CSS avec des bordures franches et des ombres portées ; en Flutter, nous construisons des `Card` avec des jauges de progression.
// 🎯 À retenir pour la soutenance : "Nous nous appuyons rigoureusement sur les standards officiels de la FAO (Food Wastage Footprint, 2013) et de l'US EPA pour asseoir la crédibilité scientifique du projet."

import React from 'react';
import { Smartphone, Car, Utensils } from 'lucide-react';
import { calculateEquivalences } from '@shared/impact.js';

/**
 * Tuiles d'équivalences écologiques basées sur les sources officielles FAO et US EPA
 * @param {Object} props
 * @param {number} props.co2SavedGrams - Volume total de CO₂ évité en grammes
 * @param {number} props.foodSavedGrams - Poids total de nourriture sauvée en grammes
 */
export default function EquivalenceTiles({ co2SavedGrams = 1450000, foodSavedGrams = 580000 }) {
  const equivalences = calculateEquivalences(co2SavedGrams);
  const foodSavedKg = (foodSavedGrams / 1000).toFixed(1);
  const co2SavedKg = (co2SavedGrams / 1000).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Grille des 3 Tuiles d'Équivalences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tuile 1 : Smartphones rechargés */}
        <div className="group p-6 rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-[#DCFCE7] text-[#15803D] shadow-sm group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white text-[#111111] border border-[#111111]/10 shadow-sm">
              8,22 g CO₂ / charge
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="font-anton text-3xl text-[#111111] tracking-wide">
              {equivalences.smartphonesCharged.toLocaleString('fr-FR')}
            </h4>
            <p className="text-sm font-bold text-[#15803D]">
              Recharges complètes de smartphone
            </p>
            <p className="text-xs text-[#666] pt-1 font-sans leading-relaxed">
              Énergie propre épargnée au réseau électrique grâce à la valorisation des invendus.
            </p>
          </div>
        </div>

        {/* Tuile 2 : Kilomètres en voiture thermique évités */}
        <div className="group p-6 rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-[#FFD000] text-[#111111] shadow-sm group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white text-[#111111] border border-[#111111]/10 shadow-sm">
              244 g CO₂ / km
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="font-anton text-3xl text-[#111111] tracking-wide">
              {equivalences.kmCarAvoided.toLocaleString('fr-FR')} km
            </h4>
            <p className="text-sm font-bold text-[#111111]">
              Trajet urbain en voiture évité
            </p>
            <p className="text-xs text-[#666] pt-1 font-sans leading-relaxed">
              Soit l'équivalent de plus de {Math.round(equivalences.kmCarAvoided / 140)} allers-retours Tunis-Sousse sans émission toxique.
            </p>
          </div>
        </div>

        {/* Tuile 3 : Ratio Carbone Alimentaire FAO */}
        <div className="group p-6 rounded-3xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3.5 rounded-2xl bg-[#FEE2E2] text-[#DA0711] shadow-sm group-hover:scale-105 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-white text-[#111111] border border-[#111111]/10 shadow-sm">
              Ratio 2,5x FAO
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="font-anton text-3xl text-[#DA0711] tracking-wide">
              {foodSavedKg} kg
            </h4>
            <p className="text-sm font-bold text-[#DA0711]">
              Nourriture réorientée vers les étudiants
            </p>
            <p className="text-xs text-[#666] pt-1 font-sans leading-relaxed">
              Chaque kilogramme de repas sauvé évite 2,5 kg de CO₂e selon le rapport FAO Food Wastage Footprint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}