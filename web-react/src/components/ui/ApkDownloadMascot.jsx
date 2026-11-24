// 💡 Concept & Analogie : Comme la mascotte emblématique d'un diner rétro invitant les clients à emporter l'expérience sur leur téléphone portable, ce widget offre un accès immédiat à l'application Android native.
// 🔄 Comparaison React / Flutter : En React, ce composant Web présente le QR code de téléchargement de l'APK Flutter compilé pour permettre au jury d'installer l'application mobile en direct.
// 🎯 À retenir pour la soutenance : "Ce widget permet aux membres du jury de scanner l'écran de projection pour installer instantanément le bundle APK officiel sur leurs propres smartphones."
// Module : Interface Web React & Téléchargement Mobile

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { isEmbedded } from '../../lib/embed.js';

const DEFAULT_APK_URL = 'https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk';
const STORAGE_KEY = 'cs.mascot_dismissed';

export default function ApkDownloadMascot() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register';
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
        className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:bottom-5 right-4 sm:right-5 z-40 select-none max-w-[calc(100vw-2rem)] w-auto ${
          isAuthPage ? 'hidden sm:block' : ''
        }`}
      >
        {isDismissed ? (
          /* Version miniature discrète après fermeture */
          <button
            type="button"
            onClick={handleRestore}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#EDE6D7] border-2 border-[#111111] text-[#111111] text-xs font-black shadow-[3px_3px_0px_#111111] hover:bg-[#FFD000] transition-all cursor-pointer whitespace-nowrap"
            title="Afficher le widget APK Android"
          >
            <span className="text-base">📱</span>
            <span className="font-mono text-xs uppercase tracking-wide">APK Android</span>
          </button>
        ) : (
          /* Mascotte Griddle complète avec bulle d'appel */
          <div className="relative group max-w-full w-auto">
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
              className="relative flex items-center gap-2 p-2 pr-3.5 rounded-3xl bg-[#FAF3E6] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group-hover:border-[#DA0711] max-w-[calc(100vw-2rem)] w-auto"
            >
              {/* Mascotte officielle CampusSave */}
              <div className="relative w-12 sm:w-14 h-12 sm:h-14 shrink-0 flex items-center justify-center">
                <img src="/assets/brand/mascot-sticker-256.png" alt="Mascotte CampusSave" width="56" height="56" className="w-full h-full object-contain drop-shadow-sm" decoding="async" />

                {/* Sticker incliné APP ANDROID */}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-[#FFD000] text-[#111111] font-black text-[9px] uppercase tracking-wider border border-[#111111] shadow-[1px_1px_0px_#111111] rotate-[-8deg]">
                  APP
                </span>
              </div>

              {/* Texte d'appel du widget avec copy concise anti-dépassement */}
              <div className="text-left pr-1 hidden sm:block whitespace-nowrap min-w-0">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#DA0711]">
                  ✦ Soutenance 2026
                </span>
                <span className="block font-black text-xs sm:text-sm text-[#111111] leading-tight">
                  App Android • Scan QR / APK
                </span>
                <span className="block text-[10px] sm:text-[11px] text-[#666] font-medium">
                  Installation directe jury
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
