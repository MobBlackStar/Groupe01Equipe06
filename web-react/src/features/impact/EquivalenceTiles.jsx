// 💡 Concept & Analogie : Comme convertir des devises étrangères en monnaie locale pour comprendre leur valeur réelle, ce composant convertit des grammes de CO₂ en équivalences tangibles de la vie quotidienne.
// 🔄 Comparaison React / Flutter : En React, les tuiles exploitent Tailwind CSS avec des dégradés néon et des icônes réactives ; en Flutter, nous construisons des `Card` avec des jauges circulaires de progression.
// 🎯 À retenir pour la soutenance : "Nous nous appuyons rigoureusement sur les standards officiels de la FAO (Food Wastage Footprint, 2013) et de l'US EPA pour asseoir la crédibilité scientifique du projet."

import React from 'react';
import { Smartphone, Car, Utensils, BookOpen } from 'lucide-react';
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
        <div className="group p-6 rounded-2xl bg-[#161920] border border-white/10 hover:border-[#00E5FF]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
              8,22 g CO₂ / charge
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-white tracking-tight">
              {equivalences.smartphonesCharged.toLocaleString('fr-FR')}
            </h4>
            <p className="text-sm font-bold text-[#00E5FF]">
              Recharges complètes de smartphone
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Énergie propre épargnée au réseau électrique grâce à la valorisation des invendus.
            </p>
          </div>
        </div>

        {/* Tuile 2 : Kilomètres en voiture thermique évités */}
        <div className="group p-6 rounded-2xl bg-[#161920] border border-white/10 hover:border-[#CCFF00]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 group-hover:scale-110 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
              244 g CO₂ / km
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-white tracking-tight">
              {equivalences.kmCarAvoided.toLocaleString('fr-FR')} km
            </h4>
            <p className="text-sm font-bold text-[#CCFF00]">
              Trajet urbain en voiture évité
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Soit l'équivalent de plus de {Math.round(equivalences.kmCarAvoided / 140)} allers-retours Tunis-Sousse sans émission toxique.
            </p>
          </div>
        </div>

        {/* Tuile 3 : Ratio Carbone Alimentaire FAO */}
        <div className="group p-6 rounded-2xl bg-[#161920] border border-white/10 hover:border-[#FF5500]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 group-hover:scale-110 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30">
              Ratio 2,5x FAO
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-white tracking-tight">
              {foodSavedKg} kg
            </h4>
            <p className="text-sm font-bold text-[#FF5500]">
              Aliments sauvés = {co2SavedKg} kg CO₂e évités
            </p>
            <p className="text-xs text-slate-400 pt-1 leading-relaxed">
              Calculé à partir du standard universel de l'empreinte carbone alimentaire.
            </p>
          </div>
        </div>
      </div>

      {/* Bandeau de Références Académiques & Scientifiques */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs text-slate-400">
        <BookOpen className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-slate-300 font-bold">Méthodologie & Références Scientifiques Officielles :</span>
          <p>
            (1) <em>Organisation des Nations Unies pour l'alimentation et l'agriculture (FAO)</em>, <strong>Food Wastage Footprint: Impacts on Natural Resources</strong> (2013) : 1 kg d'aliments gaspillés génère en moyenne 2,5 kg d'équivalent CO₂.
          </p>
          <p>
            (2) <em>United States Environmental Protection Agency (US EPA)</em>, <strong>Greenhouse Gas Equivalencies Calculator</strong> : 8,22 g CO₂ par charge de smartphone et 244 g CO₂ / km parcouru par un véhicule particulier moyen.
          </p>
        </div>
      </div>
    </div>
  );
}
