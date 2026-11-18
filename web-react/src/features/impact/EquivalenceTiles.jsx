// 💡 Concept & Analogie : Comme convertir des devises étrangères en monnaie locale pour comprendre leur valeur réelle, ce composant convertit des grammes de CO₂ en équivalences tangibles de la vie quotidienne.
// 🔄 Comparaison React / Flutter : En React, les tuiles exploitent Tailwind CSS avec des bordures franches et des ombres portées ; en Flutter, nous construisons des `Card` avec des jauges de progression.
// 🎯 À retenir pour la soutenance : "Nous nous appuyons rigoureusement sur les standards officiels de la FAO (Food Wastage Footprint, 2013) et de l'US EPA pour asseoir la crédibilité scientifique du projet."

import React from 'react';
import { Smartphone, Car, Utensils } from 'lucide-react';
import { calculateEquivalences } from '@shared/impact.js';

// Format français déterministe : espace insécable tous les 3 chiffres (y compris 4 chiffres : "1 168"),
// virgule décimale. Évite les différences d'Intl selon les navigateurs.
const frNumber = (n, digits = 0) => {
  const fixed = Math.abs(Number(n)).toFixed(digits);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${Number(n) < 0 ? '-' : ''}${grouped}${dec ? `,${dec}` : ''}`;
};

/**
 * Tuiles d'équivalences écologiques basées sur les sources officielles FAO et US EPA
 * @param {Object} props
 * @param {number} props.co2SavedGrams - Volume total de CO₂ évité en grammes
 * @param {number} props.foodSavedGrams - Poids total de nourriture sauvée en grammes
 */
export default function EquivalenceTiles({ co2SavedGrams = 1450000, foodSavedGrams = 580000 }) {
  const co2 = Number(co2SavedGrams);
  const food = Number(foodSavedGrams);
  const hasCo2 = Number.isFinite(co2);
  const hasFood = Number.isFinite(food);

  const equivalences = calculateEquivalences(hasCo2 ? co2 : 0);
  const foodSavedKg = hasFood ? frNumber(food / 1000, food >= 100000 ? 0 : 1) : '—';
  const roundTrips = hasCo2 ? Math.round(equivalences.kmCarAvoided / 140) : null;

  const tiles = [
    {
      key: 'phones',
      icon: Smartphone,
      iconClass: 'bg-[#111111] text-[#FAF3E6]',
      value: hasCo2 ? frNumber(equivalences.smartphonesCharged) : '—',
      valueClass: 'text-[#111111]',
      title: 'Recharges de smartphone',
      text: 'Énergie épargnée au réseau électrique grâce à la valorisation des invendus.',
      source: '8,22 g CO₂ / charge',
    },
    {
      key: 'car',
      icon: Car,
      iconClass: 'bg-[#FFD000] text-[#111111]',
      value: hasCo2 ? `${frNumber(equivalences.kmCarAvoided)} km` : '—',
      valueClass: 'text-[#111111]',
      title: 'De voiture thermique évités',
      text:
        roundTrips !== null
          ? `Soit plus de ${frNumber(roundTrips)} allers-retours Tunis–Sousse sans émission.`
          : 'Trajets urbains évités grâce aux repas sauvés.',
      source: '244 g CO₂ / km',
    },
    {
      key: 'food',
      icon: Utensils,
      iconClass: 'bg-[#DA0711] text-[#FAF3E6]',
      value: hasFood ? `${foodSavedKg} kg` : '—',
      valueClass: 'text-[#DA0711]',
      title: 'De nourriture réorientée',
      text: 'Chaque kilo de repas sauvé évite 2,5 kg de CO₂e (FAO, Food Wastage Footprint).',
      source: 'Ratio 2,5x FAO',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiles.map(({ key, icon: Icon, iconClass, value, valueClass, title, text, source }, i) => (
        <article
          key={key}
          className="cs-card cs-card-hover cs-fade-up p-7 sm:p-8 flex flex-col gap-4"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={`w-14 h-14 rounded-full flex items-center justify-center ${iconClass}`} aria-hidden="true">
              <Icon className="w-6 h-6" />
            </span>
            <span className="cs-pill cs-pill-outline">{source}</span>
          </div>
          <p className={`cs-figure text-[clamp(3.5rem,6vw,5rem)] break-words ${valueClass}`}>{value}</p>
          <h3 className="cs-h3">{title}</h3>
          <p className="text-base leading-relaxed text-[#5E5850]">{text}</p>
        </article>
      ))}
    </div>
  );
}
