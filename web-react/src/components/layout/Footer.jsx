// 💡 Concept & Analogie : Comme les fondations d'un édifice, le pied de page ancre le projet dans son contexte académique et institutionnel.
// 🔄 Comparaison React / Flutter : En React, `Footer` conclut la page web ; en Flutter mobile, l'espace restreint privilégie un panneau dans le profil.
// 🎯 À retenir pour la soutenance : "Ce footer certifie le rattachement universitaire à l'ESSECT Montfleury et rappelle les engagements écologiques fondateurs."

import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAF6EE] border-t-2 border-[#141210] text-[#141210] text-xs py-10 px-4 sm:px-6 lg:px-8 mt-auto shadow-[0_-4px_0px_rgba(20,18,16,0.03)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Colonne 1 : Projet & Université */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E51C23] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] flex items-center justify-center text-white font-anton text-xs">
              CS
            </div>
            <span className="font-anton uppercase text-[#141210] text-lg tracking-wider">
              Campus<span className="text-[#E51C23]">Save</span>
            </span>
          </div>
          <p className="text-[#555] text-xs leading-relaxed max-w-md font-medium">
            Plateforme intelligente anti-gaspillage alimentaire et de solidarité étudiante développée pour le campus de l'<strong>ESSECT Montfleury</strong> (Université de Tunis).
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#15803D] font-bold">
            <Leaf className="w-3.5 h-3.5" />
            <span>Chaque repas sauvé évite 2,5 kg d'équivalent CO₂ (Standard FAO 2013)</span>
          </div>
        </div>

        {/* Colonne 2 : Espaces de la Plateforme */}
        <div className="space-y-2">
          <h4 className="font-black text-[#141210] uppercase tracking-wider text-[11px]">
            Navigation
          </h4>
          <ul className="space-y-1.5 text-xs font-bold">
            <li>
              <Link to="/app" className="text-[#555] hover:text-[#E51C23] transition-colors">
                Catalogue Étudiant
              </Link>
            </li>
            <li>
              <Link to="/app/radar" className="text-[#555] hover:text-[#E51C23] transition-colors">
                Holo-Radar 3D Montfleury
              </Link>
            </li>
            <li>
              <Link to="/app/loyalty" className="text-[#555] hover:text-[#E51C23] transition-colors">
                Carte de Fidélité Éco
              </Link>
            </li>
            <li>
              <Link to="/merchant/dashboard" className="text-[#555] hover:text-[#E51C23] transition-colors">
                Espace Commerçant
              </Link>
            </li>
            <li>
              <Link to="/impact" className="text-[#E51C23] hover:underline transition-colors font-black">
                Impact Écologique Campus
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Équipe & Soutenance */}
        <div className="space-y-2">
          <h4 className="font-black text-[#141210] uppercase tracking-wider text-[11px]">
            Projet Universitaire
          </h4>
          <p className="text-xs text-[#333]">
            <strong>Licence E-Business 3ème Année</strong>
          </p>
          <p className="text-xs text-[#666] font-medium">
            Projet Intégrateur Web & Mobile
          </p>
          <p className="text-xs text-[#666] pt-1">
            Développé par <strong className="text-[#141210]">Ritej Bejaoui</strong> & <strong className="text-[#141210]">Fedi Touati</strong>.
          </p>
          <p className="text-[11px] text-[#888] pt-1 font-mono">
            © 2026 CampusSave • ESSECT Montfleury
          </p>
        </div>
      </div>
    </footer>
  );
}
