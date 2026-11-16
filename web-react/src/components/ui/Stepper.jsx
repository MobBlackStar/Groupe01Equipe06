// 💡 Concept & Analogie : Comme un parcours fléché dans un salon d'orientation universitaire (Étape 1 ➔ Étape 2 ➔ Étape 3), ce composant montre clairement à l'étudiant où il se situe dans un processus multi-étapes.
// 🔄 Comparaison React / Flutter : En React, `Stepper` génère une liste horizontale avec connecteurs en flexbox ; en Flutter, nous utilisons le widget natif `Stepper` ou une rangée `Row` personnalisée.
// 🎯 À retenir pour la soutenance : "Le stepper réduit l'abandon de panier en indiquant clairement aux étudiants qu'il ne reste que 3 étapes simples entre le choix de l'offre et l'obtention du QR code."

import React from 'react';

export default function Stepper({
  steps = [],
  currentStep = 0,
  className = '',
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background connecting bar */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-[#262A33] -z-0" />
        
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const stepLabel = typeof step === 'string' ? step : step.title;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                  isCompleted
                    ? 'bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : isCurrent
                    ? 'bg-[#0D0F12] border-[#CCFF00] text-[#CCFF00] ring-4 ring-[#CCFF00]/20'
                    : 'bg-[#161920] border-[#262A33] text-[#8A92A6]'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] font-medium mt-2 max-w-[90px] text-center leading-tight truncate ${
                  isCurrent
                    ? 'text-[#CCFF00] font-semibold'
                    : isCompleted
                    ? 'text-white'
                    : 'text-[#8A92A6]'
                }`}
              >
                {stepLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
