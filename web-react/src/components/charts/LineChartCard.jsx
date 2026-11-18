// 💡 Concept & Analogie : Comme l'électrocardiogramme de l'activité économique et environnementale, cette courbe illustre l'évolution dans le temps des économies et de l'impact carbone.
// 🔄 Comparaison React / Flutter : En React, `LineChartCard` utilise `recharts` avec rendu SVG dynamique vectoriel ; en Flutter, le dashboard utilise `LineChart` du package `fl_chart`.
// 🎯 À retenir pour la soutenance : "Nous offrons une visualisation chronologique interactive pour matérialiser la progression continue."

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Charte Griddle partagée par les graphiques
const AXIS_TICK = { fontFamily: 'Oswald, sans-serif', fontSize: 14, fill: '#5E5850', fontWeight: 500 };
const GRID_STROKE = 'rgba(17,17,17,0.08)';

/**
 * Tooltip Griddle : papier crème, contour encre 2px
 */
function CustomTooltip({ active, payload, label, unit = '', formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayValue = formatter ? formatter(item.value) : `${item.value} ${unit}`.trim();
    return (
      <div className="bg-[#FAF3E6] border-2 border-[#111111] rounded-2xl px-4 py-3">
        <p className="cs-label mb-1">{label}</p>
        <p className="text-base font-semibold text-[#111111] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DA0711]" aria-hidden="true" />
          <span>{item.name || 'Valeur'} :</span>
          <span className="cs-figure text-2xl text-[#DA0711]">{displayValue}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function LineChartCard({
  title,
  subtitle,
  data = [],
  xKey = 'label',
  yKey = 'value',
  name = 'Valeur',
  strokeColor = '#DA0711',
  gradientId = 'lineGradient',
  yFormatter,
  tooltipFormatter,
  headerAction,
  height = 260,
}) {
  const normalizedData = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return Object.entries(data)
        .filter(([key]) => key !== 'total')
        .map(([key, val]) => ({
          label: key,
          name: key,
          value: typeof val === 'number' ? val : Number(val?.count ?? val?.value ?? 0),
          count: typeof val === 'number' ? val : (val?.count ?? 0),
        }));
    }
    return [];
  }, [data]);

  return (
    <div className="cs-card p-6 sm:p-8 flex flex-col h-full">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="font-sans font-bold text-[22px] leading-tight uppercase text-[#111111]">{title}</h3>
          {subtitle && <p className="text-base text-[#5E5850] mt-1">{subtitle}</p>}
        </div>
        {headerAction && <div className="self-start shrink-0">{headerAction}</div>}
      </div>

      {/* Graphique SVG */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
            <defs>
              {/* Aplat uni très léger (pas de dégradé décoratif) */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.14} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.14} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: '#111111', strokeWidth: 2 }}
              tickMargin={8}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormatter}
              width={56}
            />
            <Tooltip
              content={<CustomTooltip formatter={tooltipFormatter} />}
              cursor={{ stroke: '#111111', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              name={name}
              stroke={strokeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              dot={{ r: 4, fill: '#FAF3E6', stroke: '#111111', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: strokeColor, stroke: '#111111', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
