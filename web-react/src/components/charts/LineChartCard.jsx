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

/**
 * Tooltip Griddle néo-brutaliste pour Recharts
 */
function CustomTooltip({ active, payload, label, unit = '', formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayValue = formatter ? formatter(item.value) : `${item.value} ${unit}`.trim();
    return (
      <div className="bg-white border border-[#111111]/10 rounded-xl p-3 shadow-lg">
        <p className="text-xs text-[#666] font-bold mb-1">{label}</p>
        <p className="text-sm font-black text-[#111111] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DA0711]" />
          <span>{item.name || 'Valeur'} :</span>
          <span className="text-[#DA0711] font-bold">{displayValue}</span>
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
    <div className="p-6 rounded-2xl bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_20px_rgba(17,17,17,0.04)] flex flex-col justify-between">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-anton uppercase text-[#111111] tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-[#666] font-medium mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="self-start sm:self-auto">{headerAction}</div>}
      </div>

      {/* Graphique SVG */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#141210" strokeOpacity={0.12} vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="#141210"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#141210', strokeWidth: 1.5 }}
            />
            <YAxis
              stroke="#141210"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#141210', strokeWidth: 1.5 }}
              tickFormatter={yFormatter}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={tooltipFormatter}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={yKey}
              name={name}
              stroke={strokeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
