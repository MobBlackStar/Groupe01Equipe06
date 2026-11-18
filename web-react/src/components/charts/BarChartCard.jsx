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

/**
 * Tooltip Griddle néo-brutaliste pour diagramme en barres
 */
function CustomBarTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayVal = formatter ? formatter(item.value) : item.value;
    return (
      <div className="bg-white border-2 border-[#141210] rounded-lg p-3 shadow-[3px_3px_0px_#141210]">
        <p className="text-xs text-[#666] font-bold mb-1">{label}</p>
        <p className="text-sm font-black text-[#141210] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E51C23]" />
          <span>{item.name || 'Total'} :</span>
          <span className="text-[#E51C23] font-bold">{displayVal}</span>
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
  barColor = '#E51C23',
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
    <div className="p-6 rounded-xl bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] flex flex-col justify-between">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-black text-[#141210] uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-[#666] font-medium mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="self-start sm:self-auto">{headerAction}</div>}
      </div>

      {/* Graphique SVG */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <CustomBarTooltip
                  formatter={tooltipFormatter}
                />
              }
            />
            <Bar
              dataKey={yKey}
              name={name}
              fill={barColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            >
              {normalizedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || barColor}
                  className="transition-opacity hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
