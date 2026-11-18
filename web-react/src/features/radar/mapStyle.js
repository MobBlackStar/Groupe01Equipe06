// Module : Holo-Radar 3D WebGL - Dark Obsidian & Amber Street Map Engine
// Directives : Inspiré des dashboards Griddlecar (image6.png) et Fika (image3.png)
// Rendu 3D temps réel avec pitch à 62° et extrusion volumétrique des îlots de Montfleury.

export const MAP_CONFIG = {
  // Style sombre haute performance sans clé propriétaire requise
  DEFAULT_STYLE: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark',
  ESSECT_COORDS: [10.1748, 36.7871], // [Longitude, Latitude] ESSECT Montfleury
  DEFAULT_CAMERA: {
    center: [10.1748, 36.7871],
    zoom: 16.2,
    pitch: 62,
    bearing: -22,
  },
  COLORS: {
    BACKGROUND: '#0E0D0C', // Night market carbon obsidian
    ESSECT_PILLAR: '#FF5500', // Flamme orange campus repère
    BUILDINGS: '#181615', // Ardoise obsidienne sombre
    BUILDINGS_HOVER: '#2C2520', // Reflet ambré au survol
    BUILDINGS_OUTLINE: '#2B2622',
    ROUTE_GLOW: '#FF5500', // Tracé néon orange vif Griddlecar
    ROUTE_CORE: '#FF8833',
    AMBER_GOLD: '#F5C400', // Jaune moutarde Fika
    RED_FLAME: '#EE3124',
    URGENCY_LOW: '#F5C400', // > 60 min (Jaune moutarde)
    URGENCY_MEDIUM: '#FF5500', // 20 - 60 min (Orange vif)
    URGENCY_HIGH: '#EE3124', // < 20 min (Rouge alerte)
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
            'fill-extrusion-opacity': 0.88,
          },
        },
        labelLayerId
      );
    }

    // Ambiance lumineuse ambrée/crépusculaire sur les facettes 3D
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
