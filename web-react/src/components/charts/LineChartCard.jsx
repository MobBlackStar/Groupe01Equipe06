// 💡 Concept & Analogie : Comme l'électrocardiogramme de l'activité économique et environnementale, cette courbe illustre l'évolution dans le temps des économies et de l'impact carbone.
// 🔄 Comparaison React / Flutter : En React, `LineChartCard` utilise `recharts` avec rendu SVG dynamique vectoriel ; en Flutter, le dashboard utilise `LineChart` du package `fl_chart`.
// 🎯 À retenir pour la soutenance : "Nous offrons une visualisation chronologique interactive avec dégradé semi-transparent pour matérialiser la progression continue de l'engagement étudiant."

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
 * Tooltip sombre personnalisé pour Recharts
 */
function CustomTooltip({ active, payload, label, unit = '', formatter }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const displayValue = formatter ? formatter(item.value) : `${item.value} ${unit}`.trim();
    return (
      <div className="bg-[#161920]/95 backdrop-blur-md border border-[#CCFF00]/40 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
          <span>{item.name || 'Valeur'} :</span>
          <span className="text-[#CCFF00]">{displayValue}</span>
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Composant de graphique en ligne / aire
 * @param {Object} props
 * @param {string} props.title - Titre du graphique
 * @param {string} [props.subtitle] - Sous-titre explicatif
 * @param {Array<Object>} props.data - Données de la série temporelle
 * @param {string} props.xKey - Clé d'abscisse (ex: 'date', 'day')
 * @param {string} props.yKey - Clé d'ordonnée (ex: 'savedMillimes', 'co2Grams')
 * @param {string} [props.name='Impact'] - Nom de la série dans le tooltip
 * @param {string} [props.strokeColor='#CCFF00'] - Couleur de la ligne
 * @param {string} [props.gradientId='lineGradient'] - Identifiant unique SVG
 * @param {Function} [props.yFormatter] - Formateur d'ordonnée
 * @param {Function} [props.tooltipFormatter] - Formateur de tooltip
 * @param {React.ReactNode} [props.headerAction] - Action en haut à droite
 * @param {number} [props.height=260] - Hauteur du graphique en pixels
 */
export default function LineChartCard({
  title,
  subtitle,
  data = [],
  xKey = 'label',
  yKey = 'value',
  name = 'Valeur',
  strokeColor = '#CCFF00',
  gradientId = 'lineGradient',
  yFormatter,
  tooltipFormatter,
  headerAction,
  height = 260,
}) {
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
