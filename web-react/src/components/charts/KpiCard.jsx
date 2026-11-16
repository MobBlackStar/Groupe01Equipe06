// 💡 Concept & Analogie : Comme les compteurs du tableau de bord d'un avion supersonique, chaque tuile KPI isole un indicateur clé pour donner une vue synthétique instantanée.
// 🔄 Comparaison React / Flutter : En React, `KpiCard` est un composant stylisé avec Tailwind CSS et des reflets néon ; en Flutter, `KpiTile` est un `Card` avec bordure dégradée et `InkWell`.
// 🎯 À retenir pour la soutenance : "Nos tuiles KPI mettent en lumière l'impact économique et environnemental concret de chaque acteur (étudiant, commerçant ou administrateur) grâce à un code couleur rigoureux."

import React from 'react';

/**
 * Tuile d'indicateur clé de performance (KPI)
 * @param {Object} props
 * @param {string} props.title - Intitulé de l'indicateur
 * @param {string|number} props.value - Valeur mise en exergue
 * @param {string} [props.subtitle] - Complément d'information ou tendance
 * @param {React.ReactNode} [props.icon] - Icône illustrative Lucide
 * @param {'lime'|'amber'|'cyan'|'purple'|'slate'} [props.accent='lime'] - Teinte d'accentuation
 * @param {string} [props.badge] - Petit badge d'évolution (+15%, etc.)
 * @param {boolean} [props.positive] - Indique si la tendance est positive
 */
export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = 'lime',
  badge,
  positive = true,
  onClick,
}) {
  const accentStyles = {
    lime: {
      border: 'hover:border-[#CCFF00]/40',
      glow: 'group-hover:shadow-[0_0_20px_rgba(204,255,0,0.12)]',
      iconBg: 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20',
      badgeBg: 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30',
      valColor: 'text-[#CCFF00]',
    },
    amber: {
      border: 'hover:border-[#FF5500]/40',
      glow: 'group-hover:shadow-[0_0_20px_rgba(255,85,0,0.12)]',
      iconBg: 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/20',
      badgeBg: 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/30',
      valColor: 'text-[#FF5500]',
    },
    cyan: {
      border: 'hover:border-[#00E5FF]/40',
      glow: 'group-hover:shadow-[0_0_20px_rgba(0,229,255,0.12)]',
      iconBg: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20',
      badgeBg: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30',
      valColor: 'text-[#00E5FF]',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      valColor: 'text-purple-300',
    },
    slate: {
      border: 'hover:border-slate-500/40',
      glow: '',
      iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      valColor: 'text-white',
    },
  }[accent] || {
    border: 'hover:border-[#CCFF00]/40',
    glow: '',
    iconBg: 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20',
    badgeBg: 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30',
    valColor: 'text-[#CCFF00]',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl bg-[#161920] border border-white/10 transition-all duration-300 ${accentStyles.border} ${accentStyles.glow} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${accentStyles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl sm:text-3xl font-black tracking-tight ${accentStyles.valColor}`}>
          {value}
        </span>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-bold ${
              positive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 leading-relaxed truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
