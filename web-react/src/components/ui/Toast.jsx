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
    success: 'bg-[#FAF6EE] border-2 border-[#15803D] text-[#141210] shadow-[4px_4px_0px_#15803D]',
    error: 'bg-[#FAF6EE] border-2 border-[#E51C23] text-[#141210] shadow-[4px_4px_0px_#E51C23]',
    warning: 'bg-[#FAF6EE] border-2 border-[#D97706] text-[#141210] shadow-[4px_4px_0px_#D97706]',
    info: 'bg-[#FAF6EE] border-2 border-[#141210] text-[#141210] shadow-[4px_4px_0px_#141210]',
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all transform animate-in slide-in-from-bottom-4 duration-200 ${
        styles[type] || styles.success
      } ${className}`}
    >
      <span className="text-base select-none">{icons[type] || '✨'}</span>
      <p className="text-xs font-bold text-[#141210] pr-2">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#141210] hover:text-[#E51C23] transition-colors p-1 rounded-md font-bold"
          aria-label="Fermer la notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
