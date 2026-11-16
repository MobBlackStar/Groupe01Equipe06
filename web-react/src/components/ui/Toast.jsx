// 💡 Concept & Analogie : Comme le signal sonore discret et bienveillant d'un grille-pain ou d'une notification smartphone qui vous prévient que votre tartine est prête, le toast informe du succès sans interrompre la lecture.
// 🔄 Comparaison React / Flutter : En React, `Toast` est rendu en surimpression temporaire avec minuterie `setTimeout` ; en Flutter, il correspond au widget `SnackBar` invoqué via `ScaffoldMessenger.of(context).showSnackBar()`.
// 🎯 À retenir pour la soutenance : "Le toast confirme les actions réussies (ex: profil sauvegardé, offre réservée) de façon non intrusive sans bloquer la navigation."

import React, { useEffect } from 'react';

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 4000,
  className = '',
}) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-[#161920] border-[#CCFF00] text-white shadow-[0_0_25px_rgba(204,255,0,0.15)]',
    error: 'bg-[#161920] border-[#FF1744] text-white shadow-[0_0_25px_rgba(255,23,68,0.15)]',
    warning: 'bg-[#161920] border-[#FF5500] text-white shadow-[0_0_25px_rgba(255,85,0,0.15)]',
    info: 'bg-[#161920] border-[#38bdf8] text-white shadow-[0_0_25px_rgba(56,189,248,0.15)]',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all transform animate-in slide-in-from-bottom-4 duration-200 ${
        styles[type] || styles.success
      } ${className}`}
    >
      <span className="text-base select-none">{icons[type] || '✨'}</span>
      <p className="text-xs font-medium text-gray-200 pr-2">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#8A92A6] hover:text-white transition-colors p-1 rounded-md"
          aria-label="Fermer la notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
