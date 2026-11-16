// 💡 Concept & Analogie : Comme les rayonnages d'un magasin comparant les ventes d'un jour à l'autre, ce diagramme en barres met en relief les flux de commandes et de revenus.
// 🔄 Comparaison React / Flutter : En React, `BarChartCard` exploite `recharts` avec animations vectorielles SVG ; en Flutter, nous utilisons `BarChart` de `fl_chart`.
// 🎯 À retenir pour la soutenance : "Ce graphique offre une clarté immédiate aux commerçants pour repérer leurs pics d'activité et leurs créneaux de sauvetage les plus rentables."

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
 * Tooltip personnalisé pour diagramme en barres
 */
function CustomBarTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayVal = formatter ? formatter(item.value) : item.value;
    return (
      <div className="bg-[#161920]/95 backdrop-blur-md border border-[#FF5500]/40 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
          <span>{item.name || 'Total'} :</span>
          <span className="text-[#FF5500]">{displayVal}</span>
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Composant de graphique en barres
 * @param {Object} props
 * @param {string} props.title - Titre du graphique
 * @param {string} [props.subtitle] - Sous-titre
 * @param {Array<Object>} props.data - Série de données
 * @param {string} props.xKey - Clé d'abscisse
 * @param {string} props.yKey - Clé d'ordonnée
 * @param {string} [props.name='Total'] - Nom de la métrique
 * @param {string} [props.barColor='#FF5500'] - Couleur par défaut
 * @param {Function} [props.yFormatter] - Formateur d'ordonnée
 * @param {Function} [props.tooltipFormatter] - Formateur pour l'infobulle
 * @param {React.ReactNode} [props.headerAction] - Action en haut à droite
 * @param {number} [props.height=260] - Hauteur en pixels
 */
export default function BarChartCard({
  title,
  subtitle,
  data = [],
  xKey = 'label',
  yKey = 'value',
  name = 'Total',
  barColor = '#FF5500',
  yFormatter,
  tooltipFormatter,
  headerAction,
  height = 260,
}) {
  // Normalisation résiliente de la prop data (Array ou Objet clé-valeur)
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
    <div className="p-6 rounded-2xl bg-[#161920] border border-white/10 flex flex-col justify-between">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="self-start sm:self-auto">{headerAction}</div>}
      </div>

      {/* Graphique SVG */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252A36" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#252A36' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#252A36' }}
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
              radius={[6, 6, 0, 0]}
              maxBarSize={45}
            >
              {normalizedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || barColor}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
