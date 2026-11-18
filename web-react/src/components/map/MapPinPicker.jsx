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
    <div className="cs-card p-6 sm:p-8 text-[#111111]">
      {/* En-tête et Statut du Rayon */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div className="min-w-0">
          <h3 className="cs-h3 flex items-center gap-2">
            <span aria-hidden="true">📍</span> Position du commerce
          </h3>
          <p className="text-base text-[#5E5850] mt-1">
            Touchez le plan pour placer votre boutique autour de l'ESSECT.
          </p>
        </div>
        <span className={`cs-pill !min-h-[2.25rem] !px-4 !text-[15px] ${isEligible ? 'cs-pill-leaf' : 'cs-pill-red'}`}>
          <span>{isEligible ? '✓ Zone éligible' : '✗ Trop éloigné'}</span>
          <span className="cs-mono normal-case">{Math.round(distanceM)} m</span>
        </span>
      </div>

      {/* Plan SVG interactif, cadre photo arrondi 2px encre */}
      <div className="relative w-full max-w-[460px] mx-auto aspect-square bg-[#FAF3E6] rounded-[1.25rem] border-2 border-[#111111] overflow-hidden select-none cursor-crosshair">
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
            fill="rgba(218, 7, 17, 0.05)"
            stroke={isEligible ? '#1F7A3A' : '#DA0711'}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          {/* Cercle 2000m */}
          <circle
            cx="150"
            cy="150"
            r={130 * (2000 / maxRangeM)}
            fill="none"
            stroke="rgba(17, 17, 17, 0.15)"
            strokeWidth="1.5"
          />
          {/* Cercle 1000m (Rayon piéton immédiat) */}
          <circle
            cx="150"
            cy="150"
            r={130 * (1000 / maxRangeM)}
            fill="rgba(255, 208, 0, 0.25)"
            stroke="rgba(17, 17, 17, 0.25)"
            strokeWidth="1.5"
          />

          {/* Axes cardinaux */}
          <line x1="150" y1="16" x2="150" y2="284" stroke="rgba(17, 17, 17, 0.12)" strokeWidth="1.5" />
          <line x1="16" y1="150" x2="284" y2="150" stroke="rgba(17, 17, 17, 0.12)" strokeWidth="1.5" />

          {/* Centre : Campus ESSECT Montfleury */}
          <circle cx="150" cy="150" r="8" fill="#DA0711" stroke="#111111" strokeWidth="2.5" />
          <circle cx="150" cy="150" r="15" fill="none" stroke="#DA0711" strokeWidth="1.5" opacity="0.6" />
          <text x="150" y="180" fill="#111111" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="Oswald, sans-serif">
            ESSECT
          </text>

          {/* Ligne reliant l'ESSECT au commerce sélectionné */}
          <line
            x1="150"
            y1="150"
            x2={pinPos.x}
            y2={pinPos.y}
            stroke={isEligible ? '#1F7A3A' : '#DA0711'}
            strokeWidth="2.5"
            strokeDasharray="3 3"
          />

          {/* Épingle Commerce Déplaçable */}
          <g transform={`translate(${pinPos.x}, ${pinPos.y})`}>
            <circle
              r="12"
              fill={isEligible ? '#1F7A3A' : '#DA0711'}
              className="animate-pulse"
              opacity="0.3"
            />
            <circle
              r="7"
              fill={isEligible ? '#1F7A3A' : '#DA0711'}
              stroke="#111111"
              strokeWidth="2.5"
            />
            <text
              y="-16"
              fill="#111111"
              fontSize="13"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="Oswald, sans-serif"
            >
              Votre boutique
            </text>
          </g>

          {/* Étiquette d'échelle */}
          <text x="262" y="140" fill="rgba(17, 17, 17, 0.7)" fontSize="12" fontWeight="600" textAnchor="middle" fontFamily="Oswald, sans-serif">
            3 km
          </text>
        </svg>

        {/* Coordonnées en superposition */}
        <div className="absolute bottom-3 left-3 cs-pill cs-mono !normal-case !tracking-normal !text-[13px] bg-white pointer-events-none">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>
      </div>

      {/* Raccourcis Repères de Montfleury */}
      <div className="mt-6">
        <span className="cs-field-label">Repères rapides</span>
        <div className="flex flex-wrap gap-2.5">
          {montfleuryLandmarks.map((lm, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => updateLocation(lm.lat, lm.lng)}
              className="cs-chip !normal-case !text-[15px] !font-medium !whitespace-normal text-left disabled:opacity-50"
            >
              {lm.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
