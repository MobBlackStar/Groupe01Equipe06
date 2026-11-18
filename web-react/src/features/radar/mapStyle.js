// Module : Holo-Radar 3D WebGL - Carte crème Griddle (papier boucher, bâtiments sable, tracé rouge)
// Directives : Inspiré des dashboards Griddlecar (image6.png) et Fika (image3.png)
// Rendu 3D temps réel avec pitch à 62° et extrusion volumétrique des îlots de Montfleury.

export const MAP_CONFIG = {
  // Style sombre haute performance sans clé propriétaire requise
  DEFAULT_STYLE: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron',
  ESSECT_COORDS: [10.1748, 36.7871], // [Longitude, Latitude] ESSECT Montfleury
  DEFAULT_CAMERA: {
    center: [10.1748, 36.7871],
    zoom: 16.2,
    pitch: 62,
    bearing: -22,
  },
  COLORS: {
    BACKGROUND: '#FAF3E6', // Crème papier boucher Griddle
    ESSECT_PILLAR: '#DA0711', // Rouge Griddle : repère campus
    BUILDINGS: '#E2D8C5', // Sable chaud extrudé
    BUILDINGS_HOVER: '#FFD000', // Moutarde au survol
    BUILDINGS_OUTLINE: '#CFC3AB',
    ROUTE_GLOW: '#DA0711', // Tracé rouge Griddle
    ROUTE_CORE: '#FF5A60',
    AMBER_GOLD: '#FFD000', // Jaune moutarde
    RED_FLAME: '#DA0711',
    URGENCY_LOW: '#FFD000', // > 60 min (Jaune moutarde)
    URGENCY_MEDIUM: '#FF8A00', // 20 - 60 min (Orange)
    URGENCY_HIGH: '#DA0711', // < 20 min (Rouge alerte)
  },
};

/**
 * Injecte la couche d'extrusion 3D des bâtiments urbains dans le style MapLibre.
 * Configure un éclairage chaud rasant typique des scènes nocturnes (image6.png).
 * @param {object} map - Instance MapLibre GL
 */
export function add3DBuildingsLayer(map) {
  if (!map || map.getLayer('3d-buildings')) return;

  try {
    const layers = map.getStyle().layers || [];
    let labelLayerId = null;

    // Repère la couche de symboles pour placer les bâtiments sous le texte
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
        labelLayerId = layers[i].id;
        break;
      }
    }

    const sources = map.getStyle().sources || {};
    const sourceName = sources.openmaptiles ? 'openmaptiles' : sources.osm ? 'osm' : null;

    if (sourceName) {
      map.addLayer(
        {
          id: '3d-buildings',
          source: sourceName,
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              MAP_CONFIG.COLORS.BUILDINGS_HOVER,
              MAP_CONFIG.COLORS.BUILDINGS,
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.2,
              ['coalesce', ['get', 'render_height'], 12],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.2,
              ['coalesce', ['get', 'render_min_height'], 0],
            ],
            'fill-extrusion-opacity': 0.92,
          },
        },
        labelLayerId
      );
    }

    // Ambiance lumineuse ambrée/crépusculaire sur les facettes 3D
    // Fond de carte crème Griddle (indépendant du style de base chargé)
    layers
      .filter((l) => l.type === 'background')
      .forEach((l) => map.setPaintProperty(l.id, 'background-color', MAP_CONFIG.COLORS.BACKGROUND));

    if (map.setLight) {
      map.setLight({
        anchor: 'viewport',
        color: '#FFAA55',
        intensity: 0.35,
        position: [1.15, 210, 30],
      });
    }
  } catch (e) {
    console.warn('[MapLibre] Impossible d injecter la couche 3D des bâtiments :', e);
  }
}
