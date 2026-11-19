// 💡 Concept & Analogie : Comme un plan de quartier en relief sur lequel on plante une épingle (en cliquant, en la glissant ou en collant l'adresse GPS d'un autre plan), l'éditeur de spot dit tout de suite : « à 240 m de l'ESSECT, 4 min à pied, la porte est sur telle rue, zone éligible ».
// 🔄 Comparaison React / Flutter : Composant contrôlé (valeur + onChange) réutilisé par l'inscription commerçant, la fiche boutique et la console admin ; équivalent web de `map_pin_picker.dart`.
// 🎯 À retenir pour la soutenance : "La règle des 3 km est celle de BUSINESS_RULES (jamais un 3000 écrit en dur) ; le serveur la revérifie (422 TOO_FAR) : l'éditeur n'est qu'un guide, le serveur reste l'arbitre."

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, MapPin, ClipboardPaste } from 'lucide-react';
import { assessSpot, parseCoordinates, snapToRoads } from '@shared/spot.js';
import { BUSINESS_RULES, ESSECT_COORDINATES } from '@shared/constants.js';
import { MAP_CONFIG, add3DBuildingsLayer, isMapReady } from './mapStyle.js';
import { applyWorld, loadWorld } from './world/worldLayer.js';
import { applyAtmosphere } from './atmosphere.js';
import { applyTimeOfDay } from './timeControl.js';

const RADIUS_SRC = 'spot-radius-src';
const CONNECTOR_SRC = 'spot-connector-src';
const ROAD_NAMES = ['Autoroute', 'Grande avenue', 'Avenue', 'Rue', 'Rue résidentielle', 'Zone de rencontre', 'Voie de service', 'Place piétonne', 'Sentier'];

/** Cercle (polygone) de rayon `radiusM` autour de l'ESSECT, pour tracer la limite des 3 km. */
function circleFeature(radiusM, steps = 96) {
  const { lat, lng } = ESSECT_COORDINATES;
  const kLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + (Math.cos(a) * radiusM) / kLng, lat + (Math.sin(a) * radiusM) / 111320]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: ring } };
}

const emptyFC = { type: 'FeatureCollection', features: [] };

/**
 * @param {object} props
 * @param {{lat:number, lng:number}|null} props.value - position courante (composant contrôlé)
 * @param {(spot: {lat:number, lng:number, distanceM:number, walkingMinutes:number, withinRadius:boolean, entry: object|null}) => void} props.onChange
 * @param {Array<{name:string, lat:number, lng:number}>} [props.presets] - raccourcis d'adresses
 * @param {boolean} [props.disabled]
 */
export default function SpotEditor({ value, onChange, presets = [], disabled = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const worldRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [mapFailed, setMapFailed] = useState(false);

  const assessment = useMemo(() => (value ? assessSpot(value.lat, value.lng) : null), [value]);
  const [entry, setEntry] = useState(null);

  // Porte sur la rue : point de la voie la plus proche, calculé sur les axes pré-calculés du monde 3D
  const computeEntry = useCallback(async (p) => {
    try {
      if (!worldRef.current) worldRef.current = await loadWorld();
      const raw = worldRef.current.raw;
      return snapToRoads(p, raw.roads || [], raw.origin);
    } catch {
      return null;
    }
  }, []);

  const emit = useCallback(
    async (p) => {
      const lat = Number(p.lat.toFixed(6));
      const lng = Number(p.lng.toFixed(6));
      const a = assessSpot(lat, lng);
      const snap = await computeEntry({ lat, lng });
      setEntry(snap);
      onChangeRef.current?.({ lat, lng, ...a, entry: snap });
    },
    [computeEntry]
  );

  // --- création de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    let map;
    try {
      const start = value || { lat: ESSECT_COORDINATES.lat, lng: ESSECT_COORDINATES.lng };
      map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_CONFIG.DEFAULT_STYLE,
        center: [start.lng, start.lat],
        zoom: 15.6,
        pitch: 52,
        bearing: -12,
        maxPitch: 70,
        antialias: true,
        attributionControl: false,
      });
    } catch (e) {
      console.warn('Éditeur de spot : WebGL indisponible, saisie par coordonnées uniquement :', e);
      setMapFailed(true);
      return undefined;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap · Overture Maps (vue stylisée)' }), 'bottom-right');

    // Repère de l'ESSECT (point rouge) — élément HTML, indépendant du style de carte
    const essectEl = document.createElement('div');
    essectEl.className = 'cs-spot-essect';
    essectEl.title = 'ESSECT Montfleury';
    essectEl.textContent = 'ESSECT';
    new maplibregl.Marker({ element: essectEl, anchor: 'center' }).setLngLat([ESSECT_COORDINATES.lng, ESSECT_COORDINATES.lat]).addTo(map);

    // Épingle du spot : déplaçable
    const pinEl = document.createElement('div');
    pinEl.className = 'cs-spot-pin';
    const marker = new maplibregl.Marker({ element: pinEl, draggable: true, anchor: 'center' }).setLngLat([start0(value).lng, start0(value).lat]);
    marker.on('dragend', () => {
      if (disabledRef.current) return;
      const ll = marker.getLngLat();
      emit({ lat: ll.lat, lng: ll.lng });
    });
    markerRef.current = marker;
    if (value) marker.addTo(map);

    map.on('click', (e) => {
      if (disabledRef.current) return;
      emit({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on('load', () => {
      map.addSource(RADIUS_SRC, { type: 'geojson', data: circleFeature(BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS) });
      map.addLayer({ id: 'spot-radius', type: 'line', source: RADIUS_SRC, paint: { 'line-color': '#1F7A3A', 'line-width': 3, 'line-dasharray': [2, 2] } });
      map.addSource(CONNECTOR_SRC, { type: 'geojson', data: emptyFC });
      map.addLayer({ id: 'spot-connector', type: 'line', source: CONNECTOR_SRC, paint: { 'line-color': '#111111', 'line-width': 3, 'line-dasharray': [1.2, 1.4] } });
      // Monde 3D de Montfleury (immeubles, arbres, rues) : le même que le radar
      if (isMapReady(map)) {
        add3DBuildingsLayer(map);
        applyWorld(map).then((world) => {
          applyAtmosphere(map, world || undefined);
          applyTimeOfDay(map, null);
        });
      }
    });

    return () => {
      try {
        map.remove();
      } catch {
        /* déjà détruite */
      }
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- synchronisation de l'épingle et du connecteur avec la valeur contrôlée
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (!value) {
      marker.remove();
      return;
    }
    marker.setLngLat([value.lng, value.lat]);
    if (!marker._map) marker.addTo(map);
    const inside = assessSpot(value.lat, value.lng).withinRadius;
    marker.getElement().classList.toggle('is-outside', !inside);
    if (map.getLayer('spot-radius')) map.setPaintProperty('spot-radius', 'line-color', inside ? '#1F7A3A' : '#DA0711');
    if (map.getSource(CONNECTOR_SRC)) {
      map.getSource(CONNECTOR_SRC).setData(
        entry
          ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[value.lng, value.lat], [entry.lng, entry.lat]] } }
          : emptyFC
      );
    }
  }, [value, entry]);

  // Quand la valeur change de l'extérieur (raccourci, formulaire), on recalcule la porte sur la rue et on recentre
  const lastFlownRef = useRef(null);
  useEffect(() => {
    if (!value) return;
    const key = `${value.lat},${value.lng}`;
    if (lastFlownRef.current === key) return;
    lastFlownRef.current = key;
    computeEntry(value).then(setEntry);
    const map = mapRef.current;
    if (map && !map.isMoving()) map.easeTo({ center: [value.lng, value.lat], duration: 700 });
  }, [value, computeEntry]);

  function handlePaste(text) {
    setPasteText(text);
    const parsed = parseCoordinates(text);
    if (!text.trim()) {
      setPasteError('');
      return;
    }
    if (!parsed) {
      setPasteError('Format non reconnu. Collez « 36.7875, 10.1758 » ou un lien Google Maps.');
      return;
    }
    setPasteError('');
    emit(parsed);
  }

  const maxKm = BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS / 1000;

  return (
    <div className="space-y-4" data-testid="spot-editor">
      {/* Saisie par coordonnées : Google Maps (clic droit -> copier les coordonnées) ou lien */}
      <div>
        <label htmlFor="spot-paste" className="cs-field-label flex items-center gap-2">
          <ClipboardPaste className="w-4 h-4" aria-hidden="true" /> Coordonnées Google Maps
        </label>
        <input
          id="spot-paste"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          value={pasteText}
          onChange={(e) => handlePaste(e.target.value)}
          placeholder="36.7875, 10.1758   ou   un lien google.com/maps/…@36.78,10.17"
          className="cs-input"
          aria-describedby="spot-paste-help"
          aria-invalid={Boolean(pasteError)}
        />
        <p id="spot-paste-help" className={pasteError ? 'cs-error-text mt-2' : 'cs-help-text mt-2'} role={pasteError ? 'alert' : undefined}>
          {pasteError || 'Sur Google Maps : clic droit sur le lieu, puis cliquez sur les coordonnées pour les copier.'}
        </p>
      </div>

      {/* Carte 3D : clic pour poser l'épingle, glisser pour la déplacer */}
      {mapFailed ? (
        <div className="cs-card p-6 text-base">La carte 3D n'est pas disponible sur cet appareil : utilisez le champ de coordonnées ci-dessus.</div>
      ) : (
        <div className="relative rounded-[1.25rem] border-2 border-[#111111] overflow-hidden bg-[#EDE6D7]">
          <div ref={containerRef} className="w-full h-[340px] sm:h-[420px]" aria-label="Carte 3D de Montfleury : cliquez pour placer le commerce" />
          <span className="absolute left-3 top-3 cs-pill cs-pill-mustard pointer-events-none">
            <MapPin className="w-4 h-4" aria-hidden="true" /> {disabled ? 'Position verrouillée' : 'Cliquez ou glissez l\'épingle'}
          </span>
        </div>
      )}

      {/* Retour en direct */}
      <div className="cs-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
        {assessment ? (
          <>
            <div className="min-w-0">
              <span className="cs-figure text-[44px] leading-none">{assessment.distanceM} m</span>
              <span className="text-lg text-[#5E5850] ml-3">• {assessment.walkingMinutes} min à pied</span>
              <p className="text-base text-[#5E5850] mt-1 flex items-center gap-2">
                <Crosshair className="w-4 h-4" aria-hidden="true" />
                {entry ? `Porte sur la rue : ${ROAD_NAMES[entry.roadClass] || 'Rue'} à ${entry.distM} m` : 'Aucune rue proche trouvée'}
              </p>
            </div>
            <span className={`cs-pill !min-h-[2.5rem] !px-4 !text-base ${assessment.withinRadius ? 'cs-pill-leaf' : 'cs-pill-red'}`}>
              {assessment.withinRadius ? `✓ Dans les ${maxKm} km` : `✗ Hors zone : ${assessment.overByM} m au-delà de ${maxKm} km`}
            </span>
          </>
        ) : (
          <p className="text-base text-[#5E5850]">Placez l'épingle sur la carte ou collez des coordonnées pour voir la distance de l'ESSECT.</p>
        )}
      </div>

      {presets.length > 0 && (
        <div>
          <span className="cs-field-label">Ou choisissez une adresse de Montfleury</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const selected = value && Math.abs(value.lat - p.lat) < 1e-6 && Math.abs(value.lng - p.lng) < 1e-6;
              return (
                <button key={p.name} type="button" disabled={disabled} aria-pressed={Boolean(selected)} onClick={() => emit({ lat: p.lat, lng: p.lng })} className="cs-chip">
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function start0(value) {
  return value || { lat: ESSECT_COORDINATES.lat, lng: ESSECT_COORDINATES.lng };
}
