// 💡 Concept & Analogie : Comme une épingle plantée sur un plan de quartier en liège, ce composant permet au commerçant de positionner son établissement et vérifie immédiatement qu'il se trouve dans la zone piétonne des 3 km de l'ESSECT.
// 🔄 Comparaison React / Flutter : Équivalent direct de `map_pin_picker.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce sélecteur calcule en direct la distance Haversine par rapport au campus et bloque la soumission si l'établissement dépasse 3000 mètres."
// Module : Cartographie & Géolocalisation

import React, { useState, useEffect, useCallback } from 'react';
import { ESSECT_COORDINATES } from '@shared/constants.js';
import { distanceFromEssect } from '@shared/geo.js';

export function MapPinPicker({
  initialLat = 36.7885,
  initialLng = 10.1762,
  onChange,
  disabled = false,
}) {
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [distanceM, setDistanceM] = useState(0);

  // Recalcul de la distance et notification au parent
  const updateLocation = useCallback(
    (newLat, newLng) => {
      const lat = parseFloat(Number(newLat).toFixed(6));
      const lng = parseFloat(Number(newLng).toFixed(6));
      const dist = distanceFromEssect(lat, lng);
      const isWithinRadius = dist <= 3000;

      setCoords({ lat, lng });
      setDistanceM(dist);

      if (onChange) {
        onChange({
          lat,
          lng,
          distanceM: dist,
          isWithinRadius,
        });
      }
    },
    [onChange]
  );

  useEffect(() => {
    updateLocation(initialLat, initialLng);
  }, [initialLat, initialLng, updateLocation]);

  // Points de repère du quartier Montfleury pour positionnement rapide
  const montfleuryLandmarks = [
    { label: "Face ESSECT (120 m)", lat: 36.7891, lng: 10.1748 },
    { label: "Baguette & Baguette (210 m)", lat: 36.7885, lng: 10.1762 },
    { label: "Pâtisserie Masmoudi (340 m)", lat: 36.7876, lng: 10.1775 },
    { label: "Boulevard 9 Avril (410 m)", lat: 36.7865, lng: 10.1735 },
    { label: "Avenue de Madrid (620 m)", lat: 36.7852, lng: 10.1788 },
  ];

  const isEligible = distanceM <= 3000;

  // Calcul relatif pour le radar SVG interactif (échelle ~ 3500 mètres)
  const centerLat = ESSECT_COORDINATES.lat; // 36.7871
  const centerLng = ESSECT_COORDINATES.lng; // 10.1748
  const maxRangeM = 3500;

  const getSvgCoordinates = (lat, lng) => {
    const dLatM = (lat - centerLat) * 111000;
    const dLngM = (lng - centerLng) * 89000;
    const scale = 130 / maxRangeM;
    const x = 150 + dLngM * scale;
    const y = 150 - dLatM * scale;
    return { x: Math.max(10, Math.min(290, x)), y: Math.max(10, Math.min(290, y)) };
  };

  const handleSvgClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const normX = (clickX / rect.width) * 300;
    const normY = (clickY / rect.height) * 300;

    const scale = 130 / maxRangeM;
    const dLngM = (normX - 150) / scale;
    const dLatM = (150 - normY) / scale;

    const newLat = centerLat + dLatM / 111000;
    const newLng = centerLng + dLngM / 89000;
    updateLocation(newLat, newLng);
  };

  const pinPos = getSvgCoordinates(coords.lat, coords.lng);

  return (
    <div className="bg-[#EDE6D7] border border-[#111111]/8 rounded-3xl p-5 text-[#111111] shadow-[0_4px_20px_rgba(17,17,17,0.04)]">
      {/* En-tête et Statut du Rayon */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-anton uppercase text-base text-[#111111] flex items-center gap-2 tracking-wide">
            <span>📍</span> Localisation du Commerce (Montfleury)
          </h3>
          <p className="text-xs text-[#666] mt-0.5 font-sans">
            Cliquez sur le radar pour ajuster le repère GPS de votre boutique.
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            isEligible
              ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20'
              : 'bg-[#FEE2E2] text-[#DA0711] border-[#DA0711]/20'
          }`}
        >
          <span>{isEligible ? '✓ Zone Éligible' : '✗ Trop Éloigné'}</span>
          <span className="font-mono">({Math.round(distanceM)} m)</span>
        </div>
      </div>

      {/* Radar SVG Interactif Haute Fidélité */}
      <div className="relative w-full aspect-[4/3] max-h-72 bg-white rounded-2xl border border-[#111111]/10 shadow-sm overflow-hidden select-none cursor-crosshair">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full"
          onClick={handleSvgClick}
        >
          {/* Cercles de distance concentriques */}
          {/* Cercle 3000m (Limite campus) */}
          <circle
            cx="150"
            cy="150"
            r={130 * (3000 / maxRangeM)}
            fill="rgba(229, 28, 35, 0.04)"
            stroke={isEligible ? 'rgba(21, 128, 61, 0.5)' : 'rgba(229, 28, 35, 0.6)'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Cercle 2000m */}
          <circle
            cx="150"
            cy="150"
            r={130 * (2000 / maxRangeM)}
            fill="none"
            stroke="rgba(20, 18, 16, 0.1)"
            strokeWidth="1"
          />
          {/* Cercle 1000m (Rayon piéton immédiat) */}
          <circle
            cx="150"
            cy="150"
            r={130 * (1000 / maxRangeM)}
            fill="rgba(255, 208, 0, 0.08)"
            stroke="rgba(20, 18, 16, 0.2)"
            strokeWidth="1"
          />

          {/* Axes cardinaux */}
          <line x1="150" y1="20" x2="150" y2="280" stroke="rgba(20, 18, 16, 0.1)" strokeWidth="1" />
          <line x1="20" y1="150" x2="280" y2="150" stroke="rgba(20, 18, 16, 0.1)" strokeWidth="1" />

          {/* Centre : Campus ESSECT Montfleury */}
          <circle cx="150" cy="150" r="7" fill="#E51C23" stroke="#141210" strokeWidth="2" />
          <circle cx="150" cy="150" r="14" fill="none" stroke="#E51C23" strokeWidth="1" opacity="0.6" />
          <text x="150" y="174" fill="#141210" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            ESSECT
          </text>

          {/* Ligne reliant l'ESSECT au commerce sélectionné */}
          <line
            x1="150"
            y1="150"
            x2={pinPos.x}
            y2={pinPos.y}
            stroke={isEligible ? '#15803D' : '#E51C23'}
            strokeWidth="2"
            strokeDasharray="2 2"
          />

          {/* Épingle Commerce Déplaçable */}
          <g transform={`translate(${pinPos.x}, ${pinPos.y})`}>
            <circle
              r="10"
              fill={isEligible ? '#15803D' : '#E51C23'}
              className="animate-pulse"
              opacity="0.3"
            />
            <circle
              r="6"
              fill={isEligible ? '#15803D' : '#E51C23'}
              stroke="#141210"
              strokeWidth="2"
            />
            <text
              y="-12"
              fill="#141210"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              className="drop-shadow"
              fontFamily="sans-serif"
            >
              Votre boutique
            </text>
          </g>

          {/* Étiquette d'échelle */}
          <text x="245" y="145" fill="rgba(17, 17, 17, 0.6)" fontSize="7" textAnchor="middle" fontFamily="monospace">
            Limite 3 km
          </text>
        </svg>

        {/* Badge d'aide contextuel en superposition */}
        <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-white/95 border border-[#111111]/15 text-[11px] text-[#111111] font-mono font-bold shadow-sm">
          Lat: {coords.lat.toFixed(4)} | Lng: {coords.lng.toFixed(4)}
        </div>
      </div>

      {/* Raccourcis Repères de Montfleury */}
      <div className="mt-4">
        <label className="block text-[11px] font-black text-[#111111]/70 uppercase tracking-wider mb-2 font-mono">
          Repères rapides autour du campus :
        </label>
        <div className="flex flex-wrap gap-2">
          {montfleuryLandmarks.map((lm, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => updateLocation(lm.lat, lm.lng)}
              className="px-3 py-1 rounded-full text-xs bg-white border border-[#111111]/15 hover:bg-[#FFD000] text-[#111111] font-bold transition-all shadow-sm"
            >
              {lm.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}