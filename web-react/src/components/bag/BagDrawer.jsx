// 💡 Concept & Analogie : Tiroir coulissant latéral du sac mono-commerçant et modale d'arbitrage Griddle lorsqu'un étudiant sélectionne un plat d'un autre établissement.
// 🔄 Comparaison React / Flutter : Équivalent Web de la feuille modale `BagSheet` en Flutter.

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useBag } from '../../context/BagContext.jsx';
import BagContent from './BagContent.jsx';

export default function BagDrawer() {
  const {
    bag,
    isBagOpen,
    closeBag,
    conflictPending,
    confirmReplaceMerchant,
    cancelReplaceMerchant,
  } = useBag();

  useEffect(() => {
    if (!isBagOpen && !conflictPending) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (conflictPending) cancelReplaceMerchant();
        else if (isBagOpen) closeBag();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBagOpen, conflictPending, closeBag, cancelReplaceMerchant]);

  return (
    <>
      {isBagOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#111111]/60 animate-fadeIn"
          onClick={closeBag}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mon sac CampusSave"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[460px] h-full bg-[#FAF3E6] border-l-2 border-[#111111] shadow-2xl overflow-y-auto p-4 sm:p-6 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="cs-sticker cs-sticker-mustard !text-base !px-3.5 !py-1.5">
                Mon sac
              </span>
              <button
                type="button"
                onClick={closeBag}
                aria-label="Fermer le sac"
                className="w-10 h-10 rounded-full border-2 border-[#111111] bg-white hover:bg-[#111111] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <BagContent onClose={closeBag} />
            </div>
          </aside>
        </div>
      )}

      {conflictPending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111111]/65 animate-fadeIn"
          onClick={cancelReplaceMerchant}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-conflict-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FAF3E6] border-2 border-[#111111] shadow-[8px_8px_0_#111111] p-6 sm:p-7 text-[#111111]"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD000] border border-[#111111] text-xs font-mono font-bold uppercase mb-3">
              <AlertTriangle className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
              1 Sac = 1 Seul Commerce
            </div>
            <h2 id="bag-conflict-title" className="cs-h3 text-2xl">
              Changer de restaurant ?
            </h2>
            <p className="text-base text-[#5E5850] mt-2 leading-relaxed">
              Votre sac contient déjà des articles de{' '}
              <strong className="text-[#111111]">{bag.merchantName}</strong>. Vider le sac pour commander chez{' '}
              <strong className="text-[#DA0711]">{conflictPending.incomingMerchantName}</strong> ?
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={cancelReplaceMerchant}
                className="cs-btn cs-btn-cream flex-1"
              >
                Garder mon sac
              </button>
              <button
                type="button"
                onClick={confirmReplaceMerchant}
                className="cs-btn cs-btn-red flex-1"
              >
                Vider et ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
