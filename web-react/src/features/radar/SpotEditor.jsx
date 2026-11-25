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
const ROADS_SRC = 'spot-local-roads-src';
const ROAD_NAMES = ['Autoroute', 'Grande avenue', 'Avenue', 'Rue', 'Rue résidentielle', 'Zone de rencontre', 'Voie de service', 'Place piétonne', 'Sentier'];
const M_LAT = 111320;

const LOCAL_FALLBACK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#FAF3E6' } }],
};

function roadsGeoJson(raw) {
  if (!raw?.roads?.length || !raw?.origin) return emptyFC;
  const [lng0, lat0] = raw.origin;
  const mLng = M_LAT * Math.cos((lat0 * Math.PI) / 180);
  const features = raw.roads.map((road) => {
    const coordinates = [];
    for (let i = 0; i < road.r.length; i += 2) {
      coordinates.push([
        Number((lng0 + road.r[i] / 10 / mLng).toFixed(7)),
        Number((lat0 + road.r[i + 1] / 10 / M_LAT).toFixed(7)),
      ]);
    }
    return { type: 'Feature', properties: { k: road.k ?? 3 }, geometry: { type: 'LineString', coordinates } };
  });
  return { type: 'FeatureCollection', features };
}

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
const DEFAULT_PRESETS = [
  { name: "Face ESSECT (Rue de l'ESSECT)", lat: 36.7865, lng: 10.1739 },
  { name: 'Boulevard Ali Trad', lat: 36.7885, lng: 10.1762 },
  { name: 'Rue Galilée', lat: 36.7872, lng: 10.1748 },
  { name: 'Avenue Bab Jedid', lat: 36.7915, lng: 10.1710 },
  { name: 'Rue des Silos (Beb El Falla)', lat: 36.7845, lng: 10.1780 },
  { name: 'Avenue de Bellevue', lat: 36.7838, lng: 10.1772 },
];

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
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const activePresets = presets.length > 0 ? presets : DEFAULT_PRESETS;

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

    let styleReady = false;
    let switchedToFallback = false;

    const installLayers = async () => {
      styleReady = true;
      if (!isMapReady(map)) return;
      try {
        if (!map.getSource(RADIUS_SRC)) {
          map.addSource(RADIUS_SRC, { type: 'geojson', data: circleFeature(BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS) });
        }
        if (!map.getLayer('spot-radius')) {
          map.addLayer({ id: 'spot-radius', type: 'line', source: RADIUS_SRC, paint: { 'line-color': '#1F7A3A', 'line-width': 3, 'line-dasharray': [2, 2] } });
        }
        if (!map.getSource(CONNECTOR_SRC)) {
          map.addSource(CONNECTOR_SRC, { type: 'geojson', data: emptyFC });
        }
        if (!map.getLayer('spot-connector')) {
          map.addLayer({ id: 'spot-connector', type: 'line', source: CONNECTOR_SRC, paint: { 'line-color': '#111111', 'line-width': 3, 'line-dasharray': [1.2, 1.4] } });
        }

        add3DBuildingsLayer(map);
        const world = await applyWorld(map);
        if (world?.raw) {
          worldRef.current = world;
          if (!map.getSource(ROADS_SRC)) {
            map.addSource(ROADS_SRC, { type: 'geojson', data: roadsGeoJson(world.raw) });
          }
          if (!map.getLayer('spot-local-roads')) {
            map.addLayer(
              {
                id: 'spot-local-roads',
                type: 'line',
                source: ROADS_SRC,
                paint: {
                  'line-color': '#D7CBB6',
                  'line-width': ['match', ['get', 'k'], 0, 5, 1, 4.5, 2, 3.5, 3, 2.5, 1.8],
                  'line-opacity': 0.9,
                },
              },
              map.getLayer('world-buildings') ? 'world-buildings' : 'spot-radius'
            );
          }
        }
        applyAtmosphere(map, world || undefined);
        applyTimeOfDay(map, null);
      } catch (e) {
        console.warn('SpotEditor : erreur ajout couches locales :', e);
      }
    };

    const activateFallbackStyle = () => {
      if (switchedToFallback || styleReady) return;
      switchedToFallback = true;
      try {
        map.setStyle(LOCAL_FALLBACK_STYLE);
      } catch {
        /* carte démontée */
      }
    };

    map.on('style.load', installLayers);
    map.on('error', () => {
      if (!styleReady) activateFallbackStyle();
    });
    const fallbackTimer = setTimeout(activateFallbackStyle, 3500);

    return () => {
      clearTimeout(fallbackTimer);
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

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre appareil.");
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setPasteText(`${lat}, ${lng}`);
        emit({ lat, lng });
      },
      (err) => {
        setGeoLoading(false);
        setGeoError("Position GPS indisponible : activez la localisation de votre appareil ou choisissez une rue ci-dessous.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

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
      {/* Outils d'aide à la localisation rapide */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={disabled || geoLoading}
          className="cs-btn cs-btn-cream cs-btn-sm"
        >
          <Crosshair className="w-4 h-4 text-[#DA0711]" aria-hidden="true" />
          <span>{geoLoading ? 'Localisation GPS…' : '📍 Utiliser ma position GPS'}</span>
        </button>
        <a
          href="https://www.google.com/maps/@36.7865,10.1739,17z"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn cs-btn-cream cs-btn-sm"
        >
          <span>🗺️ Ouvrir Google Maps</span>
        </a>
      </div>
      {geoError && <p className="cs-error-text" role="alert">{geoError}</p>}

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
          {pasteError || 'Sur Google Maps : clic droit sur votre commerce puis cliquez sur les coordonnées pour les copier ici.'}
        </p>
      </div>

      {/* Raccourcis de rues de Montfleury */}
      {activePresets.length > 0 && (
        <div>
          <span className="cs-field-label">Ou sélectionnez une rue de Montfleury en 1 clic :</span>
          <div className="flex flex-wrap gap-2">
            {activePresets.map((p) => {
              const selected = value && Math.abs(value.lat - p.lat) < 1e-6 && Math.abs(value.lng - p.lng) < 1e-6;
              return (
                <button
                  key={p.name}
                  type="button"
                  disabled={disabled}
                  aria-pressed={Boolean(selected)}
                  onClick={() => {
                    setPasteText(`${p.lat}, ${p.lng}`);
                    emit({ lat: p.lat, lng: p.lng });
                  }}
                  className={`cs-chip ${selected ? '!bg-[#DA0711] !text-white' : ''}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
    </div>
  );
}

function start0(value) {
  return value || { lat: ESSECT_COORDINATES.lat, lng: ESSECT_COORDINATES.lng };
}
