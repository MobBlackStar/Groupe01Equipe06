// 💡 Concept & Analogie : Comme le tableau d'affichage des Jeux Olympiques inter-promotions, ce classement stimule une saine émulation écologique entre les départements de l'ESSECT.
// 🔄 Comparaison React / Flutter : En React, les barres de progression sont animées avec Tailwind CSS et des transitions fluides ; en Flutter, nous utilisons des `LinearProgressIndicator` stylisés.
// 🎯 À retenir pour la soutenance : "La gamification collective via le challenge inter-filières démultiplie l'engagement étudiant en transformant un acte individuel en fierté de promotion."

import React from 'react';
import { Trophy, Award, Users, Leaf, Flame } from 'lucide-react';
import { FILIERES } from '@shared/constants.js';

// Données réalistes pour les 5 filières de l'ESSECT
const DEFAULT_FILIERES_DATA = [
  {
    filiere: FILIERES.EBUSINESS_3A,
    name: '3ème Année E-Business',
    badge: 'Pionniers Numériques ⚡',
    co2SavedKg: 520,
    foodSavedKg: 208,
    ecoPoints: 10400,
    studentsCount: 184,
  },
  {
    filiere: FILIERES.FINANCE,
    name: 'Département Finance',
    badge: 'Éco-Investisseurs 📈',
    co2SavedKg: 380,
    foodSavedKg: 152,
    ecoPoints: 7600,
    studentsCount: 142,
  },
  {
    filiere: FILIERES.MARKETING,
    name: 'Département Marketing',
    badge: 'Créateurs d’Impact 🎯',
    co2SavedKg: 295,
    foodSavedKg: 118,
    ecoPoints: 5900,
    studentsCount: 115,
  },
  {
    filiere: FILIERES.GESTION,
    name: 'Département Gestion',
    badge: 'Organisateurs Zéro-Gaspi 📋',
    co2SavedKg: 210,
    foodSavedKg: 84,
    ecoPoints: 4200,
    studentsCount: 96,
  },
  {
    filiere: FILIERES.COMPTABILITE,
    name: 'Département Comptabilité',
    badge: 'Chasseurs d’Économies 🧾',
    co2SavedKg: 165,
    foodSavedKg: 66,
    ecoPoints: 3300,
    studentsCount: 82,
  },
];

/**
 * Composant de classement inter-filières ESSECT
 * @param {Object} props
 * @param {Array<Object>} [props.leaderboard] - Liste ordonnée des filières
 * @param {string} [props.userFiliere] - Filière de l'étudiant connecté
 */
export default function FiliereLeaderboard({ leaderboard = DEFAULT_FILIERES_DATA, userFiliere }) {
  const sorted = [...leaderboard].sort((a, b) => b.co2SavedKg - a.co2SavedKg);
  const maxCo2 = Math.max(...sorted.map((item) => item.co2SavedKg), 1);

  const getRankBadge = (index) => {
    if (index === 0) return { icon: '🥇', label: '1er', color: 'text-amber-500', border: 'border-amber-500' };
    if (index === 1) return { icon: '🥈', label: '2ème', color: 'text-slate-600', border: 'border-slate-400' };
    if (index === 2) return { icon: '🥉', label: '3ème', color: 'text-amber-700', border: 'border-amber-700' };
    return { icon: `#${index + 1}`, label: `${index + 1}ème`, color: 'text-[#141210]', border: 'border-[#141210]' };
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b-2 border-[#141210]/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFD000] text-[#141210] border-2 border-[#141210] shadow-[2px_2px_0px_#141210]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-anton uppercase text-xl sm:text-2xl text-[#141210] tracking-wide">
              Challenge Inter-Filières ESSECT 🏆
            </h3>
            <p className="text-xs text-[#141210]/70 mt-0.5 font-sans">
              Classement en direct de la mobilisation anti-gaspillage par promotion.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#E51C23] text-white text-xs font-black uppercase self-start sm:self-auto flex items-center gap-1.5 shadow-[2px_2px_0px_#141210]">
          <Flame className="w-3.5 h-3.5" />
          <span>Saison Universitaire 2026</span>
        </span>
      </div>

      {/* Liste des Filières */}
      <div className="space-y-4">
        {sorted.map((item, index) => {
          const rank = getRankBadge(index);
          const percent = Math.round((item.co2SavedKg / maxCo2) * 100);
          const isUserFiliere = userFiliere && item.filiere === userFiliere;

          return (
            <div
              key={item.filiere}
              className={`p-4 rounded-2xl border-2 transition-all ${
                isUserFiliere
                  ? 'bg-white border-[#E51C23] shadow-[4px_4px_0px_#E51C23]'
                  : 'bg-white border-[#141210] shadow-[2px_2px_0px_#141210]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-anton text-sm border-2 border-[#141210] shadow-[1px_1px_0px_#141210] bg-[#FAF6EE]`}>
                    {rank.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-anton uppercase text-base text-[#141210]">{item.name}</h4>
                      {isUserFiliere && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E51C23] text-white">
                          Votre Promotion
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#141210]/60 font-sans">{item.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-anton text-lg text-[#15803D] block">
                    {item.co2SavedKg} kg CO₂
                  </span>
                  <span className="text-[11px] font-mono text-[#141210]/60">
                    {item.studentsCount} étudiants • {item.ecoPoints} pts
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-[#F4EFE6] h-3 rounded-full overflow-hidden border border-[#141210]">
                <div
                  className="bg-[#15803D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}