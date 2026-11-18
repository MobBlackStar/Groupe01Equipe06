// 💡 Concept & Analogie : Comme les compteurs du tableau de bord, chaque tuile KPI isole un indicateur clé pour donner une vue synthétique instantanée.
// 🔄 Comparaison React / Flutter : En React, `KpiCard` est un composant Griddle néo-brutaliste ; en Flutter, `KpiTile` est un `Card` avec bordure et ombre.
// 🎯 À retenir pour la soutenance : "Nos tuiles KPI mettent en lumière l'impact économique et environnemental concret avec relief tactile."

import React from 'react';

/**
 * Tuile d'indicateur clé de performance (KPI) - Griddle Theme
 */
export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'red',
  badge,
  positive = true,
  onClick,
}) {
  const accentStyles = {
    red: {
      valColor: 'text-[#E51C23]',
      iconBg: 'bg-[#FEE2E2] text-[#B91C1C] border-[#141210]',
    },
    lime: {
      valColor: 'text-[#15803D]',
      iconBg: 'bg-[#DCFCE7] text-[#15803D] border-[#141210]',
    },
    green: {
      valColor: 'text-[#15803D]',
      iconBg: 'bg-[#DCFCE7] text-[#15803D] border-[#141210]',
    },
    amber: {
      valColor: 'text-[#C2410C]',
      iconBg: 'bg-[#FFEDD5] text-[#C2410C] border-[#141210]',
    },
    yellow: {
      valColor: 'text-[#854D0E]',
      iconBg: 'bg-[#FEF08A] text-[#854D0E] border-[#141210]',
    },
    cyan: {
      valColor: 'text-[#0369A1]',
      iconBg: 'bg-[#E0F2FE] text-[#0369A1] border-[#141210]',
    },
    purple: {
      valColor: 'text-[#7E22CE]',
      iconBg: 'bg-[#F3E8FF] text-[#7E22CE] border-[#141210]',
    },
    slate: {
      valColor: 'text-[#141210]',
      iconBg: 'bg-[#F4EFE6] text-[#141210] border-[#141210]',
    },
  }[accent] || {
    valColor: 'text-[#E51C23]',
    iconBg: 'bg-[#FEE2E2] text-[#B91C1C] border-[#141210]',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#141210] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-black uppercase tracking-wider text-[#666]">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center shadow-[2px_2px_0px_#141210] ${accentStyles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl sm:text-3xl font-anton tracking-tight ${accentStyles.valColor}`}>
          {value}
        </span>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-md border font-black ${
              positive
                ? 'bg-[#DCFCE7] text-[#15803D] border-[#166534]'
                : 'bg-[#FEE2E2] text-[#B91C1C] border-[#DC2626]'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[#555] font-medium leading-relaxed truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
