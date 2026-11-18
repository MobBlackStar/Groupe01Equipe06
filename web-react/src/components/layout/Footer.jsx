// 💡 Concept & Analogie : Comme le bas de page signature du site Griddle, ce footer conclut l'expérience par 4 colonnes épurées et l'impression monumentale du logo bulle rouge vif CAMPUSSAVE mur-à-mur.
// 🔄 Comparaison React / Flutter : En React, `Footer` intègre la typographie géante responsive Griddle ; en Flutter, l'espace restreint privilégie un panneau de certification dans le profil.
// 🎯 À retenir pour la soutenance : "Ce footer ancre le projet dans l'écosystème de l'ESSECT Montfleury avec l'impact visuel inoubliable de la marque."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAF3E6] text-[#111111] pt-16 pb-6 px-4 sm:px-6 lg:px-8 mt-auto overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* 4 Colonnes Épurées Griddle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#111111]/8">
          
          {/* Colonne 1 : Adresse & Contact (span 4) */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-[#DA0711] shrink-0 mt-0.5" />
              <div>
                <p className="font-anton uppercase tracking-wider text-sm text-[#111111]">
                  ESSECT MONTFLEURY
                </p>
                <p className="text-xs text-[#666] font-medium leading-relaxed">
                  65 Rue Abdelaziz Thâalbi, Montfleury, 1089 Tunis
                </p>
                <p className="text-xs text-[#DA0711] font-bold mt-1">
                  contact@campussave.tn
                </p>
              </div>
            </div>
          </div>

          {/* Colonne 2 : Liens Rapides (span 2) */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="font-anton uppercase tracking-wider text-xs text-[#111111]">
              ACCÈS RAPIDE
            </h4>
            <ul className="space-y-1.5 text-xs font-bold text-[#666]">
              <li>
                <Link to="/app" className="hover:text-[#DA0711] transition-colors">
                  OFFRES ANTI-GASPI
                </Link>
              </li>
              <li>
                <Link to="/app/radar" className="hover:text-[#DA0711] transition-colors">
                  HOLO-RADAR 3D
                </Link>
              </li>
              <li>
                <Link to="/app/loyalty" className="hover:text-[#DA0711] transition-colors">
                  FIDÉLITÉ & BADGES
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-[#DA0711] transition-colors">
                  IMPACT CARBONE
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Campus & Soutenance (span 2) */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="font-anton uppercase tracking-wider text-xs text-[#111111]">
              PROJET 2026
            </h4>
            <ul className="space-y-1.5 text-xs font-bold text-[#666]">
              <li>LICENCE E-BUSINESS</li>
              <li>ESSECT MONTFLEURY</li>
              <li>RITEJ BEJAOUI</li>
              <li>FEDI TOUATI</li>
            </ul>
          </div>

          {/* Colonne 4 : Newsletter / Alertes Anti-Gaspi (span 4) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-anton uppercase tracking-wider text-xs text-[#111111]">
              REJOINDRE LA COMMUNAUTÉ
            </h4>
            <p className="text-xs text-[#666]">
              Reçois les alertes flash 15 min avant la fin des cours à l'ESSECT.
            </p>
            <div className="relative flex items-center max-w-sm">
              <input
                type="email"
                placeholder="prenom.nom@essect.u-tunis.tn"
                className="w-full pl-4 pr-12 py-2.5 rounded-full bg-[#EDE6D7] border border-[#111111]/10 text-xs text-[#111111] placeholder:text-[#888] focus:outline-none focus:ring-1 focus:ring-[#DA0711]"
              />
              <button
                type="button"
                className="absolute right-1 w-8 h-8 rounded-full bg-[#DA0711] text-white flex items-center justify-center hover:bg-[#bd060f] transition-transform active:scale-90"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Le Logo Bulle Géant Monumental : CAMPUSSAVE */}
        <div className="pt-8 pb-4">
          <div className="griddle-bubble-logo select-none">
            CAMPUSSAVE
          </div>
        </div>

        {/* Mentions Légales et Badge Bas de Page */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#888] pt-2">
          <p>© 2026 CampusSave • Conçu avec passion pour les étudiants de l'ESSECT Montfleury</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE6D7] text-[#111111] font-bold text-[10px]">
            <span>⚡ Standard Anti-Gaspillage ESSECT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
