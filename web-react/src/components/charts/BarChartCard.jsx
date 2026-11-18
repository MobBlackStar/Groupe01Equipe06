// 💡 Concept & Analogie : Comme les rayonnages d'un magasin comparant les ventes d'un jour à l'autre, ce diagramme en barres met en relief les flux de commandes et de revenus.
// 🔄 Comparaison React / Flutter : En React, `BarChartCard` exploite `recharts` avec animations vectorielles SVG ; en Flutter, nous utilisons `BarChart` de `fl_chart`.
// 🎯 À retenir pour la soutenance : "Ce graphique offre une clarté immédiate aux commerçants pour repérer leurs pics d'activité."

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

// Charte Griddle partagée par les graphiques
const AXIS_TICK = { fontFamily: 'Oswald, sans-serif', fontSize: 14, fill: '#5E5850', fontWeight: 500 };
const GRID_STROKE = 'rgba(17,17,17,0.08)';

/**
 * Tooltip Griddle : papier crème, contour encre 2px
 */
function CustomBarTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayVal = formatter ? formatter(item.value) : item.value;
    return (
      <div className="bg-[#FAF3E6] border-2 border-[#111111] rounded-2xl px-4 py-3">
        <p className="cs-label mb-1">{label}</p>
        <p className="text-base font-semibold text-[#111111] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DA0711]" aria-hidden="true" />
          <span>{item.name || 'Total'} :</span>
          <span className="cs-figure text-2xl text-[#DA0711]">{displayVal}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function BarChartCard({
  title,
  subtitle,
  data = [],
  xKey = 'label',
  yKey = 'value',
  name = 'Total',
  barColor = '#DA0711',
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
          <BarChart data={normalizedData} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
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
              content={<CustomBarTooltip formatter={tooltipFormatter || yFormatter} />}
              cursor={{ fill: 'rgba(17, 17, 17, 0.05)' }}
            />
            <Bar dataKey={yKey} name={name} radius={[8, 8, 0, 0]} maxBarSize={52}>
              {normalizedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || (index % 3 === 2 ? '#111111' : barColor)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
