// 💡 Concept & Analogie : Comme les fondations d'un édifice ou la page finale d'un livre blanc, le pied de page ancre le projet dans son contexte académique et institutionnel.
// 🔄 Comparaison React / Flutter : En React, `Footer` conclut la page web pour les écrans Desktop et Tablette ; en Flutter mobile, l'espace d'écran restreint privilégie un panneau "À propos" dans le profil.
// 🎯 À retenir pour la soutenance : "Ce footer certifie le rattachement universitaire à l'ESSECT Montfleury et rappelle les engagements écologiques fondateurs du projet."

import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, Globe, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0D0F12] border-t border-white/10 text-slate-400 text-xs py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Colonne 1 : Projet & Université */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center text-black font-black text-xs">
              CS
            </div>
            <span className="font-extrabold text-white text-base">
              Campus<span className="text-[#CCFF00]">Save</span>
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md">
            Plateforme intelligente anti-gaspillage alimentaire et de solidarité étudiante développée pour le campus de l'<strong>ESSECT Montfleury</strong> (Université de Tunis).
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#CCFF00] font-semibold">
            <Leaf className="w-3.5 h-3.5" />
            <span>Chaque repas sauvé évite 2,5 kg d'équivalent CO₂ (Standard FAO 2013)</span>
          </div>
        </div>

        {/* Colonne 2 : Espaces de la Plateforme */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Navigation
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link to="/app" className="hover:text-[#CCFF00] transition-colors">
                Catalogue Étudiant
              </Link>
            </li>
            <li>
              <Link to="/app/radar" className="hover:text-[#CCFF00] transition-colors">
                Holo-Radar 3D Montfleury
              </Link>
            </li>
            <li>
              <Link to="/app/loyalty" className="hover:text-[#CCFF00] transition-colors">
                Carte de Fidélité Éco
              </Link>
            </li>
            <li>
              <Link to="/merchant/dashboard" className="hover:text-[#CCFF00] transition-colors">
                Espace Commerçant
              </Link>
            </li>
            <li>
              <Link to="/impact" className="hover:text-[#00E5FF] transition-colors font-bold">
                Impact Écologique Campus
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Équipe & Soutenance */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Projet Universitaire
          </h4>
          <p className="text-xs text-slate-300">
            <strong>Licence E-Business 3ème Année</strong>
          </p>
          <p className="text-xs text-slate-400">
            Projet Intégrateur Web & Mobile
          </p>
          <p className="text-xs text-slate-400 pt-1">
            Développé par <strong className="text-white">Ritej Bejaoui</strong> & <strong className="text-white">Fedi Touati</strong>.
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            © 2026 CampusSave • ESSECT Montfleury
          </p>
        </div>
      </div>
    </footer>
  );
}
