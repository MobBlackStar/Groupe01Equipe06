// 💡 Concept & Analogie : Comme le signal sonore discret d'un grille-pain qui vous prévient que votre tartine est prête, le toast informe du succès sans interrompre la lecture.
// 🔄 Comparaison React / Flutter : En React, `Toast` est rendu en surimpression temporaire ; en Flutter, il correspond au widget `SnackBar`.
// 🎯 À retenir pour la soutenance : "Le toast confirme les actions réussies de façon non intrusive."

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
    success: 'bg-[#111111] text-[#FAF3E6] [--accent:#7BD88F]',
    error: 'bg-[#DA0711] text-white [--accent:#FFD000]',
    warning: 'bg-[#FFD000] text-[#111111] [--accent:#111111]',
    info: 'bg-[#111111] text-[#FAF3E6] [--accent:#FFD000]',
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
      className={`fixed bottom-24 lg:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex items-center gap-3 pl-5 pr-3 min-h-[3.5rem] rounded-full border-2 border-[#111111] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.6)] animate-fadeIn ${
        styles[type] || styles.success
      } ${className}`}
    >
      <span className="text-base select-none">{icons[type] || '✨'}</span>
      <p className="text-base font-medium pr-2 leading-snug">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto w-9 h-9 shrink-0 rounded-full flex items-center justify-center hover:bg-white/15 font-bold"
          aria-label="Fermer la notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
