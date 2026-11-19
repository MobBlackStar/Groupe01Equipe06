// 💡 Concept & Analogie : Comme le bas de page signature du site Griddle, ce footer conclut l'expérience par 4 colonnes épurées et l'impression monumentale du logo bulle rouge vif CAMPUSSAVE mur-à-mur.
// 🔄 Comparaison React / Flutter : En React, `Footer` intègre la typographie géante responsive Griddle ; en Flutter, l'espace restreint privilégie un panneau de certification dans le profil.
// 🎯 À retenir pour la soutenance : "Ce footer ancre le projet dans l'écosystème de l'ESSECT Montfleury avec l'impact visuel inoubliable de la marque."

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Offres anti-gaspi', to: '/app/explore' },
  { label: 'Holo-Radar 3D', to: '/app/radar' },
  { label: 'Fidélité', to: '/app/loyalty' },
  { label: 'Impact campus', to: '/impact' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAF3E6] text-[#111111] mt-auto overflow-hidden">
      <div className="cs-container pt-20 lg:pt-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Adresse */}
          <div className="lg:col-span-4 flex items-start gap-4">
            <MapPin className="w-7 h-7 shrink-0 mt-0.5" strokeWidth={2.5} />
            <div>
              <p className="font-semibold uppercase text-[1.375rem] leading-tight">
                ESSECT Montfleury
                <br />
                1089 Tunis
              </p>
              <p className="mt-3 text-lg">contact@campussave.tn</p>
            </div>
          </div>

          {/* Liens rapides */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold uppercase text-[1.375rem] mb-4">Accès rapide</h4>
            <ul className="space-y-1.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="uppercase text-lg hover:text-[#DA0711] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={import.meta.env.VITE_APK_DOWNLOAD_URL || 'https://github.com/MobBlackStar/campussave/releases/latest/download/CampusSave.apk'}
                  download="CampusSave.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uppercase text-lg text-[#DA0711] hover:underline font-bold transition-colors"
                >
                  📱 APK Android
                </a>
              </li>
            </ul>
          </div>

          {/* Projet */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold uppercase text-[1.375rem] mb-4">Projet 2026</h4>
            <ul className="space-y-1.5 uppercase text-lg">
              <li>Licence E-Business</li>
              <li>Ritej Bejaoui</li>
              <li>Fedi Touati</li>
            </ul>
          </div>

          {/* Alertes */}
          <div className="lg:col-span-4">
            <h4 className="font-semibold uppercase text-[1.375rem] mb-2">Rejoins la brigade anti-gaspi</h4>
            <p className="text-lg mb-5">Les alertes flash 15 min avant la fin des cours.</p>
            <form className="relative max-w-md" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">Adresse e-mail étudiante</label>
              <input
                id="footer-email"
                type="email"
                placeholder="prenom.nom@essect.u-tunis.tn"
                className="cs-input !pr-16"
              />
              <button
                type="submit"
                aria-label="S'inscrire aux alertes"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#DA0711] text-white flex items-center justify-center hover:bg-[#B0050D] transition-colors"
              >
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Wordmark monumental */}
      <div className="cs-container pt-16 lg:pt-24" aria-hidden="true">
        <div className="cs-wordmark translate-y-[0.12em]">CampusSave</div>
      </div>

      <div className="bg-[#DA0711] text-[#FAF3E6]">
        <div className="cs-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-base">
          <p>© 2026 CampusSave · ESSECT Montfleury</p>
          <p className="uppercase font-semibold tracking-wide">Zéro gaspi, prix étudiant</p>
        </div>
      </div>
    </footer>
  );
}
