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
    if (index === 0) return { icon: '🥇', label: '1er', color: 'text-yellow-400', border: 'border-yellow-400/30' };
    if (index === 1) return { icon: '🥈', label: '2ème', color: 'text-slate-300', border: 'border-slate-300/30' };
    if (index === 2) return { icon: '🥉', label: '3ème', color: 'text-amber-500', border: 'border-amber-500/30' };
    return { icon: `#${index + 1}`, label: `${index + 1}ème`, color: 'text-slate-400', border: 'border-white/10' };
  };

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-[#161920] border border-white/10 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Challenge Inter-Filières ESSECT 🏆
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Classement en direct de la mobilisation anti-gaspillage par promotion.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Saison Universitaire 2026</span>
        </span>
      </div>

      {/* Liste des Filières */}
      <div className="space-y-4">
        {sorted.map((item, index) => {
          const rank = getRankBadge(index);
          const percent = Math.round((item.co2SavedKg / maxCo2) * 100);
          const isUserFiliere = userFiliere && (userFiliere === item.filiere || item.name.includes(userFiliere));

          return (
            <div
              key={item.filiere || index}
              className={`p-4 rounded-xl border transition-all ${
                isUserFiliere
                  ? 'bg-[#CCFF00]/10 border-[#CCFF00]/50 shadow-[0_0_20px_rgba(204,255,0,0.15)] ring-1 ring-[#CCFF00]'
                  : 'bg-black/30 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                {/* Colonne gauche : Rang, Nom et Badge */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 bg-[#161920] ${rank.border} ${rank.color}`}
                  >
                    {rank.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      {isUserFiliere && (
                        <span className="px-2 py-0.5 rounded-full bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-wider">
                          Votre Filière ⭐
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{item.badge}</p>
                  </div>
                </div>

                {/* Colonne droite : Statistiques clés */}
                <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs font-black text-white">{item.foodSavedKg} kg</span>
                    <p className="text-[10px] text-slate-400">sauvés</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#CCFF00]">{item.co2SavedKg} kg</span>
                    <p className="text-[10px] text-slate-400">CO₂ évité</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-yellow-300">
                      {item.ecoPoints.toLocaleString('fr-FR')} pts
                    </span>
                    <p className="text-[10px] text-slate-400">{item.studentsCount} étudiants</p>
                  </div>
                </div>
              </div>

              {/* Barre de progression avec dégradé */}
              <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-400 to-[#CCFF00]'
                      : index === 1
                      ? 'bg-gradient-to-r from-slate-400 to-cyan-400'
                      : 'bg-gradient-to-r from-emerald-500 to-[#CCFF00]'
                  }`}
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
