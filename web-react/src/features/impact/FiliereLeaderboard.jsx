// 💡 Concept & Analogie : Comme le tableau d'affichage des Jeux Olympiques inter-promotions, ce classement stimule une saine émulation écologique entre les départements de l'ESSECT.
// 🔄 Comparaison React / Flutter : En React, les barres de progression sont animées avec Tailwind CSS et des transitions fluides ; en Flutter, nous utilisons des `LinearProgressIndicator` stylisés.
// 🎯 À retenir pour la soutenance : "La gamification collective via le challenge inter-filières démultiplie l'engagement étudiant en transformant un acte individuel en fierté de promotion."

import React from 'react';
import { Flame } from 'lucide-react';
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

// Format français déterministe (espace insécable tous les 3 chiffres)
const frInt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Composant de classement inter-filières ESSECT
 * @param {Object} props
 * @param {Array<Object>} [props.leaderboard] - Liste ordonnée des filières
 * @param {string} [props.userFiliere] - Filière de l'étudiant connecté
 */
export default function FiliereLeaderboard({ leaderboard = DEFAULT_FILIERES_DATA, userFiliere }) {
  const sorted = [...leaderboard].sort((a, b) => safeNum(b.co2SavedKg) - safeNum(a.co2SavedKg));
  const maxCo2 = Math.max(...sorted.map((item) => safeNum(item.co2SavedKg)), 1);

  return (
    <div>
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="cs-title">Challenge inter-filières</h2>
          <p className="cs-body mt-3 text-[#5E5850] max-w-2xl">
            Classement en direct de la mobilisation anti-gaspillage par promotion.
          </p>
        </div>
        <span className="cs-pill cs-pill-red self-start sm:self-auto">
          <Flame className="w-4 h-4" aria-hidden="true" />
          <span>Saison universitaire 2026</span>
        </span>
      </div>

      {/* Liste classée */}
      <ol className="cs-card px-5 sm:px-8 py-2">
        {sorted.map((item, index) => {
          const co2 = safeNum(item.co2SavedKg);
          const percent = Math.max(4, Math.round((co2 / maxCo2) * 100));
          const isUserFiliere = userFiliere && item.filiere === userFiliere;
          const isFirst = index === 0;

          return (
            <li
              key={item.filiere || item.name || index}
              className={`grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-5 sm:gap-x-8 gap-y-3 py-6 ${
                index < sorted.length - 1 ? 'border-b-2 border-[#111111]/10' : ''
              }`}
            >
              {/* Grand numéro de rang */}
              <span
                className={`cs-figure row-span-2 sm:row-span-1 w-14 sm:w-20 text-center text-[clamp(3.5rem,7vw,5.5rem)] ${
                  isFirst ? 'text-[#DA0711]' : 'text-[#111111]'
                }`}
                aria-label={`Rang ${index + 1}`}
              >
                {index + 1}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 className="cs-h3 text-[clamp(1.25rem,2vw,1.6rem)]">{item.name}</h3>
                  {isUserFiliere && <span className="cs-pill cs-pill-ink">Votre promotion</span>}
                  {isFirst && <span className="cs-sticker cs-sticker-mustard !text-base">En tête</span>}
                </div>
                {item.badge && <p className="text-base text-[#5E5850] mt-1">{item.badge}</p>}

                {/* Barre de progression */}
                <div
                  className="mt-3 w-full h-4 rounded-full bg-[#FAF3E6] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.name} : ${co2} kg de CO₂ évités`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFirst ? 'bg-[#DA0711]' : 'bg-[#FFD000]'
                    } ${isUserFiliere ? 'outline outline-2 outline-[#111111] -outline-offset-2' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="col-start-2 sm:col-start-3 sm:text-right">
                <p className="cs-figure text-[clamp(2.25rem,3.6vw,3.25rem)] whitespace-nowrap">
                  {frInt(co2)} <span className="text-[0.55em] text-[#5E5850]">kg CO₂</span>
                </p>
                <p className="text-[15px] text-[#5E5850] mt-1 whitespace-nowrap">
                  {frInt(item.studentsCount)} étudiants · {frInt(item.ecoPoints)} pts
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
