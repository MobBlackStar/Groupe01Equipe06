// 💡 Concept & Analogie : Comme un guichet confidentiel qui s'ouvre au premier plan pour finaliser une transaction importante sans quitter la pièce principale, la modale concentre l'attention sur une action isolée.
// 🔄 Comparaison React / Flutter : En React, `Modal` est souvent monté dans un portail DOM avec backdrop sombre ; en Flutter, nous appelons `showDialog`.
// 🎯 À retenir pour la soutenance : "La modale capture le focus utilisateur pour les décisions importantes."

import React, { useEffect } from 'react';

export default function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizes[size] || sizes.md} bg-[#FAF6EE] border-2 border-[#141210] rounded-xl shadow-[8px_8px_0px_#141210] p-6 sm:p-7 z-10 my-8 transition-all transform animate-in fade-in zoom-in-95 duration-200 text-[#141210] ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-xl font-black text-[#141210] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#555] mt-1">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#141210] hover:bg-[#F4EFE6] border border-[#141210] transition-colors p-1.5 rounded-lg -mr-1.5 -mt-1.5"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="text-sm text-[#141210]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t-2 border-[#141210]/15 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
