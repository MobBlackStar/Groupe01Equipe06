// 💡 Concept & Analogie : Comme la mascotte emblématique d'un diner rétro invitant les clients à emporter l'expérience sur leur téléphone portable, ce widget offre un accès immédiat à l'application Android native.
// 🔄 Comparaison React / Flutter : En React, ce composant Web présente le QR code de téléchargement de l'APK Flutter compilé pour permettre au jury d'installer l'application mobile en direct.
// 🎯 À retenir pour la soutenance : "Ce widget permet aux membres du jury de scanner l'écran de projection pour installer instantanément le bundle APK officiel sur leurs propres smartphones."
// Module : Interface Web React & Téléchargement Mobile

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { isEmbedded } from '../../lib/embed.js';

const DEFAULT_APK_URL = 'https://github.com/MobBlackStar/campussave/releases/latest/download/CampusSave.apk';
const STORAGE_KEY = 'cs.mascot_dismissed';

export default function ApkDownloadMascot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const apkUrl = import.meta.env.VITE_APK_DOWNLOAD_URL || DEFAULT_APK_URL;

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      setIsDismissed(dismissed);
    } catch {
      // Ignorer si localStorage restreint
    }
  }, []);

  // Ne jamais afficher dans la WebView mobile (?embed=1)
  if (isEmbedded()) {
    return null;
  }

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // no-op
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  };

  return (
    <>
      {/* =========================================================================
          BOUTON FLOTTANT / MASCOTTE (BAS-DROITE, AU-DESSUS DE LA NAVIGATION MOBILE)
          ========================================================================= */}
      <aside
        aria-label="Téléchargement de l'application Android"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 select-none animate-bounce-subtle"
      >
        {isDismissed ? (
          /* Version miniature discrète après fermeture */
          <button
            type="button"
            onClick={handleRestore}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#EDE6D7] border-2 border-[#111111] text-[#111111] text-xs font-black shadow-[3px_3px_0px_#111111] hover:bg-[#FFD000] transition-all cursor-pointer"
            title="Afficher le widget APK Android"
          >
            <span className="text-base">📱</span>
            <span className="font-mono text-xs uppercase tracking-wide">APK Android</span>
          </button>
        ) : (
          /* Mascotte Griddle complète avec bulle d'appel */
          <div className="relative group">
            {/* Bouton croix pour minimiser */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-black hover:bg-[#DA0711] transition-colors shadow-sm"
              title="Masquer la mascotte"
              aria-label="Masquer la mascotte"
            >
              ×
            </button>

            {/* Corps cliquable de la mascotte */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2 p-2 rounded-3xl bg-[#FAF3E6] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group-hover:border-[#DA0711]"
            >
              {/* Mascotte SVG Griddle : Burger Burger rétro tenant un smartphone */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                  {/* Bun supérieur */}
                  <path
                    d="M 15 50 C 15 22, 85 22, 85 50 Z"
                    fill="#E0A96D"
                    stroke="#111111"
                    strokeWidth="4"
                  />
                  {/* Graines de sésame */}
                  <ellipse cx="38" cy="34" rx="2.5" ry="1.5" fill="#FAF3E6" transform="rotate(-15 38 34)" />
                  <ellipse cx="50" cy="30" rx="2.5" ry="1.5" fill="#FAF3E6" />
                  <ellipse cx="62" cy="35" rx="2.5" ry="1.5" fill="#FAF3E6" transform="rotate(20 62 35)" />
                  <ellipse cx="44" cy="42" rx="2" ry="1.2" fill="#FAF3E6" transform="rotate(-10 44 42)" />
                  <ellipse cx="58" cy="43" rx="2" ry="1.2" fill="#FAF3E6" transform="rotate(15 58 43)" />

                  {/* Yeux expressifs du Diner */}
                  <circle cx="40" cy="40" r="4.5" fill="#111111" />
                  <circle cx="41.5" cy="38.5" r="1.5" fill="#FFFFFF" />
                  <circle cx="60" cy="40" r="4.5" fill="#111111" />
                  <circle cx="61.5" cy="38.5" r="1.5" fill="#FFFFFF" />

                  {/* Joues roses */}
                  <ellipse cx="33" cy="45" rx="3.5" ry="2" fill="#FF8A80" opacity="0.8" />
                  <ellipse cx="67" cy="45" rx="3.5" ry="2" fill="#FF8A80" opacity="0.8" />

                  {/* Sourire amical */}
                  <path d="M 46 44 Q 50 48 54 44" stroke="#111111" strokeWidth="3" fill="none" strokeLinecap="round" />

                  {/* Feuille de salade ondulée */}
                  <path
                    d="M 12 50 C 20 46, 25 54, 35 50 C 45 46, 50 54, 60 50 C 70 46, 75 54, 88 50 L 88 55 C 75 58, 70 52, 60 55 C 50 58, 45 52, 35 55 C 25 58, 20 52, 12 55 Z"
                    fill="#4E9F3D"
                    stroke="#111111"
                    strokeWidth="3.5"
                  />

                  {/* Tomate / Ketchup rouge Griddle */}
                  <rect x="18" y="54" width="64" height="6" rx="3" fill="#DA0711" stroke="#111111" strokeWidth="3" />

                  {/* Steak grillé */}
                  <rect x="16" y="59" width="68" height="9" rx="4.5" fill="#6A381F" stroke="#111111" strokeWidth="3.5" />

                  {/* Fromage cheddar fondu en pointe */}
                  <polygon points="40,65 48,74 54,65" fill="#FFD000" stroke="#111111" strokeWidth="2.5" />

                  {/* Bun inférieur */}
                  <path
                    d="M 18 68 C 18 78, 82 78, 82 68 Z"
                    fill="#E0A96D"
                    stroke="#111111"
                    strokeWidth="4"
                  />

                  {/* Smartphone tenu par la main droite */}
                  <g transform="translate(62, 42) rotate(12)">
                    <rect x="0" y="0" width="16" height="26" rx="3" fill="#111111" stroke="#FAF3E6" strokeWidth="1.5" />
                    <rect x="2" y="2" width="12" height="18" rx="1.5" fill="#FFD000" />
                    <circle cx="8" cy="22.5" r="1.5" fill="#FAF3E6" />
                    {/* Écran avec étincelle */}
                    <path d="M 5 6 L 11 14 M 11 6 L 5 14" stroke="#DA0711" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                </svg>

                {/* Sticker incliné APP ANDROID */}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#FFD000] text-[#111111] font-black text-[9px] uppercase tracking-wider border border-[#111111] shadow-[1px_1px_0px_#111111] rotate-[-8deg]">
                  APP
                </span>
              </div>

              {/* Texte d'appel du widget */}
              <div className="text-left pr-2 hidden sm:block">
                <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#DA0711]">
                  ✦ Soutenance 2026
                </span>
                <span className="block font-black text-sm text-[#111111] leading-tight">
                  Installer l'APK Android
                </span>
                <span className="block text-[11px] text-[#666] font-medium">
                  Scan QR ou Téléchargement direct
                </span>
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MODALE / POPOVER GRIDDLE DE TÉLÉCHARGEMENT AVEC QR CODE DU JURY
          ========================================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/60 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#FAF3E6] text-[#111111] rounded-3xl border-2 border-[#111111] shadow-[8px_8px_0px_#111111] p-6 sm:p-8 animate-scaleUp font-sans"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-apk-title"
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#EDE6D7] border border-[#111111]/20 hover:bg-[#111111] hover:text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              aria-label="Fermer la fenêtre de téléchargement"
            >
              ✕
            </button>

            {/* En-tête */}
            <div className="text-center pb-4 border-b border-dashed border-[#111111]/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD000] text-[#111111] border border-[#111111] text-xs font-mono font-black uppercase tracking-wider mb-2 shadow-sm">
                <span>📱</span> FLUTTER 3.47 · PRODUCTION RELEASE
              </div>
              <h2 id="modal-apk-title" className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-[#111111]">
                Application <span className="text-[#DA0711]">CampusSave</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#666] mt-1 font-medium">
                Pointez l'appareil photo de votre smartphone Android vers le QR code ci-dessous pour installer l'application immédiatement.
              </p>
            </div>

            {/* Conteneur QR Code Haute Visibilité pour le Jury */}
            <div className="my-6 flex flex-col items-center">
              <div className="p-4 rounded-2xl bg-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] relative">
                <QRCodeSVG
                  value={apkUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#111111"
                />
                {/* Pastille centrale de la mascotte */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#FFD000] border-2 border-[#111111] flex items-center justify-center text-lg shadow-sm">
                    🍔
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#666] mt-3 uppercase tracking-wider font-bold">
                Scan direct · URL officielle GitHub Release
              </span>
            </div>

            {/* Bouton de téléchargement direct fichier APK */}
            <div className="space-y-3">
              <a
                href={apkUrl}
                download="CampusSave.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full bg-[#DA0711] hover:bg-[#B9060E] text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-2 border-[#111111] shadow-[3px_3px_0px_#111111] hover:shadow-[1px_1px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
              >
                <span>📥</span>
                <span>Télécharger CampusSave.apk</span>
              </a>

              <div className="p-3 rounded-2xl bg-[#EDE6D7] border border-[#111111]/10 text-center">
                <p className="text-xs text-[#555] font-medium leading-relaxed">
                  💡 <strong>Note soutenance :</strong> Connectée en direct à notre backend Cloud Render (<code className="text-[#DA0711] font-mono font-bold">campussave.onrender.com</code>) et Vercel avec le radar 3D WebGL2 intégré.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
