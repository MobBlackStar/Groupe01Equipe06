// 💡 Concept & Analogie : Comme les cadrans et compteurs en laiton d'un grand restaurant, chaque tuile KPI isole un indicateur clé pour donner une vue synthétique instantanée.
// 🔄 Comparaison React / Flutter : En React, `KpiCard` est une tuile biscuit chaleureuse (#EDE6D7) sans bordures lourdes ; en Flutter, `KpiTile` est un `Card` aux bords arrondis.
// 🎯 À retenir pour la soutenance : "Nos tuiles KPI mettent en lumière l'impact économique et environnemental concret avec élégance et lisibilité."

import React from 'react';

/**
 * Tuile d'indicateur clé de performance (KPI) - Griddle `cs-stat`
 * Label Oswald + valeur monumentale League Gothic + petite pastille de tendance.
 */
const ACCENTS = {
  red: { value: 'text-[#DA0711]', icon: 'bg-[#DA0711] text-[#FAF3E6]' },
  lime: { value: 'text-[#1F7A3A]', icon: 'bg-[#DDEFD9] text-[#1F7A3A]' },
  green: { value: 'text-[#1F7A3A]', icon: 'bg-[#DDEFD9] text-[#1F7A3A]' },
  amber: { value: 'text-[#111111]', icon: 'bg-[#FFD000] text-[#111111]' },
  yellow: { value: 'text-[#111111]', icon: 'bg-[#FFD000] text-[#111111]' },
  cyan: { value: 'text-[#111111]', icon: 'bg-[#111111] text-[#FAF3E6]' },
  purple: { value: 'text-[#111111]', icon: 'bg-[#111111] text-[#FAF3E6]' },
  slate: { value: 'text-[#111111]', icon: 'bg-[#FAF3E6] text-[#111111]' },
};

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
  const styles = ACCENTS[accent] || ACCENTS.red;
  const isMissing =
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'number' && !Number.isFinite(value)) ||
    (typeof value === 'string' && /NaN|undefined|null/.test(value));
  const displayValue = isMissing ? '—' : value;

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`cs-stat w-full h-full text-left min-w-0 ${onClick ? 'cs-card-hover cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="cs-label leading-snug">{title}</span>
        {icon && (
          <span
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${styles.icon} [&_svg]:!text-current`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      <span className={`cs-stat-value mt-1 break-words ${styles.value}`}>{displayValue}</span>

      {(badge || subtitle) && (
        <div className="flex flex-col gap-2 mt-2">
          {badge && (
            <span className={`cs-pill self-start ${positive ? 'cs-pill-leaf' : 'cs-pill-red'}`}>
              {badge}
            </span>
          )}
          {subtitle && <p className="text-[15px] leading-snug text-[#5E5850]">{subtitle}</p>}
        </div>
      )}
    </Tag>
  );
}
