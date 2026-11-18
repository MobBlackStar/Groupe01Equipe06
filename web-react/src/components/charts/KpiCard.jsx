// 💡 Concept & Analogie : Comme les cadrans et compteurs en laiton d'un grand restaurant, chaque tuile KPI isole un indicateur clé pour donner une vue synthétique instantanée.
// 🔄 Comparaison React / Flutter : En React, `KpiCard` est une tuile biscuit chaleureuse (#EDE6D7) sans bordures lourdes ; en Flutter, `KpiTile` est un `Card` aux bords arrondis.
// 🎯 À retenir pour la soutenance : "Nos tuiles KPI mettent en lumière l'impact économique et environnemental concret avec élégance et lisibilité."

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
      valColor: 'text-[#DA0711]',
      iconBg: 'bg-[#DA0711]/10 text-[#DA0711]',
    },
    lime: {
      valColor: 'text-[#15803D]',
      iconBg: 'bg-[#15803D]/10 text-[#15803D]',
    },
    green: {
      valColor: 'text-[#15803D]',
      iconBg: 'bg-[#15803D]/10 text-[#15803D]',
    },
    amber: {
      valColor: 'text-[#C2410C]',
      iconBg: 'bg-[#C2410C]/10 text-[#C2410C]',
    },
    yellow: {
      valColor: 'text-[#854D0E]',
      iconBg: 'bg-[#FFD000]/20 text-[#854D0E]',
    },
    cyan: {
      valColor: 'text-[#0369A1]',
      iconBg: 'bg-[#0369A1]/10 text-[#0369A1]',
    },
    purple: {
      valColor: 'text-[#7E22CE]',
      iconBg: 'bg-[#7E22CE]/10 text-[#7E22CE]',
    },
    slate: {
      valColor: 'text-[#111111]',
      iconBg: 'bg-[#111111]/5 text-[#111111]',
    },
  }[accent] || {
    valColor: 'text-[#DA0711]',
    iconBg: 'bg-[#DA0711]/10 text-[#DA0711]',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_16px_rgba(17,17,17,0.03)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(17,17,17,0.06)] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#555]">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${accentStyles.iconBg}`}
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
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              positive
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[#666] font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
