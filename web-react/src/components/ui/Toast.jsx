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
    success: 'bg-[#EDE6D7] border-l-4 border-l-[#15803D] border border-[#111111]/8 text-[#111111] shadow-[0_8px_30px_rgba(17,17,17,0.12)]',
    error: 'bg-[#EDE6D7] border-l-4 border-l-[#DA0711] border border-[#111111]/8 text-[#111111] shadow-[0_8px_30px_rgba(17,17,17,0.12)]',
    warning: 'bg-[#EDE6D7] border-l-4 border-l-[#D97706] border border-[#111111]/8 text-[#111111] shadow-[0_8px_30px_rgba(17,17,17,0.12)]',
    info: 'bg-[#EDE6D7] border-l-4 border-l-[#111111] border border-[#111111]/8 text-[#111111] shadow-[0_8px_30px_rgba(17,17,17,0.12)]',
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all transform animate-in slide-in-from-bottom-4 duration-200 ${
        styles[type] || styles.success
      } ${className}`}
    >
      <span className="text-base select-none">{icons[type] || '✨'}</span>
      <p className="text-xs font-bold text-[#111111] pr-2">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#666] hover:text-[#DA0711] transition-colors p-1 rounded-full font-bold"
          aria-label="Fermer la notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
