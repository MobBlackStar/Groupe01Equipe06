// 💡 Concept & Analogie : Comme un parcours fléché dans un salon d'orientation universitaire (Étape 1 ➔ Étape 2 ➔ Étape 3), ce composant montre clairement où l'on se situe.
// 🔄 Comparaison React / Flutter : En React, `Stepper` génère une liste horizontale avec connecteurs ; en Flutter, nous utilisons le widget natif `Stepper`.
// 🎯 À retenir pour la soutenance : "Le stepper réduit l'abandon en guidant l'utilisateur étape par étape."

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
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-[#111111]/15 -z-0" />
        
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const stepLabel = typeof step === 'string' ? step : step.title;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#15803D] text-white shadow-sm'
                    : isCurrent
                    ? 'bg-[#DA0711] text-white shadow-md ring-4 ring-[#DA0711]/20 scale-110'
                    : 'bg-[#EDE6D7] text-[#888] border border-[#111111]/10'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] font-anton uppercase tracking-wider mt-2 max-w-[100px] text-center leading-tight truncate ${
                  isCurrent
                    ? 'text-[#DA0711]'
                    : isCompleted
                    ? 'text-[#111111]'
                    : 'text-[#888]'
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
