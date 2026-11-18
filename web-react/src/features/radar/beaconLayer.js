// Module : Holo-Radar 3D WebGL - Balises 3D & Repères Numérotés Fika
// Inspiré des balises d'urgence holographiques et des pins numérotés d'image3.png
// Prismes 3D polygonaux extrudés et marqueurs HTML avec temps de marche.

import maplibregl from 'maplibre-gl';
import { MAP_CONFIG, isMapReady } from './mapStyle.js';

/**
 * Génère un polygone régulier à 6 côtés (hexagone) centré sur des coordonnées géographiques.
 * @param {[number, number]} center - [Longitude, Latitude]
 * @param {number} radiusM - Rayon en mètres
 * @returns {Array<[number, number]>} Anneau de coordonnées GeoJSON fermé
 */
export function createHexagonCoordinates([lng, lat], radiusM = 14) {
  const coords = [];
  const latOffset = radiusM / 111320;
  const lngOffset = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const x = lng + lngOffset * Math.cos(angle);
    const y = lat + latOffset * Math.sin(angle);
    coords.push([x, y]);
  }
  // Fermeture du polygone (le premier point répété à la fin)
  coords.push(coords[0]);
  return coords;
}

/**
 * Construit la collection GeoJSON du pilier central de l'ESSECT Montfleury.
 */
export function buildEssectPillarGeoJson() {
  const [lng, lat] = MAP_CONFIG.ESSECT_COORDS;
  const hexCoords = createHexagonCoordinates([lng, lat], 20);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'essect-home-base',
          name: 'Campus ESSECT Montfleury',
          height: 52, // Pilier repère de 52 mètres de hauteur
          base: 0,
          color: MAP_CONFIG.COLORS.ESSECT_PILLAR,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [hexCoords],
        },
      },
    ],
  };
}

/**
 * Construit la collection GeoJSON des prismes 3D représentant les commerçants partenaires.
 * @param {Array<object>} merchants - Liste des commerçants du radar
 */
export function buildMerchantBeaconsGeoJson(merchants = []) {
  const features = merchants.map((m) => {
    const lng = m.location?.lng ?? MAP_CONFIG.ESSECT_COORDS[0];
    const lat = m.location?.lat ?? MAP_CONFIG.ESSECT_COORDS[1];
    const hexCoords = createHexagonCoordinates([lng, lat], 14);

    // Hauteur proportionnelle au nombre de paniers disponibles (20 m min jusqu'à 70 m)
    const offerCount = m.activeOfferCount || (m.activeOffers ? m.activeOffers.length : 1);
    const height = Math.min(70, 20 + offerCount * 12);

    return {
      type: 'Feature',
      properties: {
        id: m.id || m.merchantId,
        merchantId: m.id || m.merchantId,
        name: m.name,
        type: m.type,
        height,
        base: 0,
        color: m.beaconUrgencyColor || MAP_CONFIG.COLORS.ROUTE_GLOW,
        activeOfferCount: offerCount,
        walkingMinutes: m.walkingMinutes || 5,
        distanceM: m.distanceM || m.distanceFromEssectM || 300,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [hexCoords],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Configure et injecte les calques MapLibre pour le pilier ESSECT et les balises commerçants.
 * @param {object} map - Instance MapLibre GL
 * @param {Array<object>} merchants - Données des commerçants
 * @param {Function} onSelectMerchant - Callback lors du clic sur un prisme
 */
export function setupBeaconLayers(map, merchants, onSelectMerchant) {
  if (!isMapReady(map)) return;

  // 1. Source & Calque pour le Pilier Central ESSECT
  const essectData = buildEssectPillarGeoJson();
  if (map.getSource('essect-pillar-src')) {
    map.getSource('essect-pillar-src').setData(essectData);
  } else {
    map.addSource('essect-pillar-src', {
      type: 'geojson',
      data: essectData,
    });

    map.addLayer({
      id: 'essect-pillar-layer',
      type: 'fill-extrusion',
      source: 'essect-pillar-src',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-opacity': 0.95,
      },
    });
  }

  // 2. Source & Calque pour les Balises Hexagonales Commerçants
  const beaconData = buildMerchantBeaconsGeoJson(merchants);
  if (map.getSource('merchant-beacons-src')) {
    map.getSource('merchant-beacons-src').setData(beaconData);
  } else {
    map.addSource('merchant-beacons-src', {
      type: 'geojson',
      data: beaconData,
    });

    map.addLayer({
      id: 'merchant-beacons-layer',
      type: 'fill-extrusion',
      source: 'merchant-beacons-src',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-opacity': 0.9,
      },
    });

    // Interaction : changement de curseur au survol
    map.on('mouseenter', 'merchant-beacons-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'merchant-beacons-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    // Interaction : clic sur une balise 3D
    map.on('click', 'merchant-beacons-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        const merchantId = props.merchantId || props.id;
        const found = merchants.find((m) => (m.id || m.merchantId) === merchantId);
        if (found && onSelectMerchant) {
          onSelectMerchant(found);
        }
      }
    });
  }
}

/**
 * Crée les marqueurs HTML numérotés [1], [2], [3] façon Fika (image3.png)
 * avec pastille jaune moutarde et étiquette noire avec temps de marche.
 *
 * @param {object} map - Instance MapLibre GL
 * @param {Array<object>} merchants - Liste des commerçants
 * @param {Function} onSelectMerchant - Callback lors du clic
 * @returns {Array<maplibregl.Marker>} Liste des marqueurs instanciés
 */
export function createFikaNumberedMarkers(map, merchants = [], onSelectMerchant) {
  if (!map) return [];

  const markers = [];

  // Trie par distance pour numéroter 1, 2, 3...
  const sorted = [...merchants].sort(
    (a, b) => (a.distanceM || a.distanceFromEssectM || 0) - (b.distanceM || b.distanceFromEssectM || 0)
  );

  sorted.forEach((m, idx) => {
    const num = idx + 1;
    const lng = m.location?.lng ?? MAP_CONFIG.ESSECT_COORDS[0];
    const lat = m.location?.lat ?? MAP_CONFIG.ESSECT_COORDS[1];
    const walkMin = m.walkingMinutes || 3;

    // Création de l'élément DOM du marqueur
    const el = document.createElement('div');
    el.className = 'group cursor-pointer flex items-center transition-transform hover:scale-110 select-none';
    el.style.transformOrigin = 'bottom center';

    el.innerHTML = `
      <div class="relative flex items-center drop-shadow-[0_8px_14px_rgba(17,17,17,0.25)]">
        <!-- Pastille numérotée rouge Griddle -->
        <div class="w-9 h-9 rounded-full bg-[#DA0711] text-white font-bold text-base flex items-center justify-center border-2 border-[#111111] z-10">
          ${num}
        </div>
        <!-- Étiquette crème, contour encre -->
        <div class="-ml-2 pl-4 pr-3 py-1 bg-[#FAF3E6] text-[#111111] border-2 border-[#111111] rounded-full text-[13px] font-semibold uppercase whitespace-nowrap flex items-center gap-2">
          <span>${m.name}</span>
          <span class="text-[#DA0711]">${walkMin} min</span>
        </div>
      </div>
    `;

    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (onSelectMerchant) {
        onSelectMerchant(m);
      }
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);

    markers.push(marker);
  });

  // Marqueur spécial pour le Campus ESSECT lui-même
  const essectEl = document.createElement('div');
  essectEl.className = 'flex items-center group cursor-pointer transition-transform hover:scale-105';
  essectEl.innerHTML = `
    <div class="flex items-center shadow-2xl">
      <div class="w-10 h-10 rounded-full bg-[#FFD000] text-[#111111] font-bold text-lg flex items-center justify-center border-2 border-[#111111] z-10">
        ★
      </div>
      <div class="-ml-2 pl-4 pr-3 py-1 bg-[#111111] text-[#FAF3E6] border-2 border-[#111111] rounded-full text-[13px] font-semibold uppercase whitespace-nowrap">
        Campus ESSECT
      </div>
    </div>
  `;
  const essectMarker = new maplibregl.Marker({ element: essectEl, anchor: 'bottom' })
    .setLngLat(MAP_CONFIG.ESSECT_COORDS)
    .addTo(map);

  markers.push(essectMarker);

  return markers;
}
