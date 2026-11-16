// 💡 Concept & Analogie : Comme les balises lumineuses de science-fiction qui jaillissent du sol pour signaler des points de ravitaillement, chaque restaurant projette un prisme hexagonal 3D dont la hauteur traduit le stock d'invendus et la couleur l'urgence de sauvetage.
// 🔄 Comparaison React / Flutter : En React, rendu via des polygones GeoJSON extrudés en WebGL ; en Flutter, rendu via des marqueurs animés colorés sur la carte 2D.
// 🎯 À retenir pour la soutenance : "La hauteur du prisme (15 à 60 mètres) est proportionnelle au nombre d'offres actives et sa couleur (#CCFF00, #FF5500, #FF1744) alerte instantanément sur la proximité de l'heure de fermeture."
// Module : Holo-Radar 3D WebGL

import { MAP_CONFIG } from './mapStyle.js';

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
  const hexCoords = createHexagonCoordinates([lng, lat], 18);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'essect-home-base',
          name: 'Campus ESSECT Montfleury',
          height: 45, // Pilier repère de 45 mètres de hauteur
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
    const lng = m.location?.lng ?? 10.1748;
    const lat = m.location?.lat ?? 36.7871;
    const hexCoords = createHexagonCoordinates([lng, lat], 13);

    // Hauteur proportionnelle au nombre de paniers disponibles (18 m min jusqu'à 65 m)
    const offerCount = m.activeOfferCount || 0;
    const height = Math.min(65, 18 + offerCount * 12);

    return {
      type: 'Feature',
      properties: {
        id: m.id || m.merchantId,
        merchantId: m.id || m.merchantId,
        name: m.name,
        type: m.type,
        height,
        base: 0,
        color: m.beaconUrgencyColor || MAP_CONFIG.COLORS.URGENCY_LOW,
        activeOfferCount: offerCount,
        walkingMinutes: m.walkingMinutes,
        distanceM: m.distanceM || m.distanceFromEssectM,
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

    // Interaction : clic sur une balise 3D pour afficher le tiroir et déclencher le drone swoop
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
