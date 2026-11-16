// 💡 Concept & Analogie : Comme la configuration d'un affichage tête haute (HUD) dans un cockpit d'avion de chasse, ce module définit le style visuel sombre et les bâtiments 3D extrudés en relief.
// 🔄 Comparaison React / Flutter : Spécifique à MapLibre GL WebGL ; sur mobile, Flutter utilise `flutter_map` avec un fond de carte sombre équivalent.
// 🎯 À retenir pour la soutenance : "Nous exploitons la propriété WebGL `fill-extrusion` de MapLibre avec un pitch de 60° pour transformer la cartographie plane 2D d'OpenStreetMap en maquette 3D volumétrique de Montfleury."
// Module : Holo-Radar 3D WebGL

export const MAP_CONFIG = {
  DEFAULT_STYLE: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark',
  ESSECT_COORDS: [10.1748, 36.7871], // [Longitude, Latitude] selon convention MapLibre / GeoJSON
  DEFAULT_CAMERA: {
    center: [10.1748, 36.7871],
    zoom: 16,
    pitch: 60,
    bearing: -20,
  },
  COLORS: {
    BACKGROUND: '#0D0F12',
    ESSECT_PILLAR: '#CCFF00', // Lime électrique campus
    BUILDINGS: '#1A1E26',
    BUILDINGS_OUTLINE: '#282F3D',
    URGENCY_LOW: '#CCFF00',
    URGENCY_MEDIUM: '#FF5500',
    URGENCY_HIGH: '#FF1744',
  },
};

/**
 * Injecte la couche d'extrusion 3D des bâtiments urbains dans le style MapLibre.
 * @param {object} map - Instance MapLibre GL
 */
export function add3DBuildingsLayer(map) {
  if (map.getLayer('3d-buildings')) return;

  const layers = map.getStyle().layers;
  let labelLayerId = null;

  // Insère les bâtiments en-dessous des étiquettes de texte pour conserver la lisibilité
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  const sources = map.getStyle().sources;
  const sourceName = sources.openmaptiles ? 'openmaptiles' : sources.osm ? 'osm' : null;

  if (sourceName) {
    try {
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
              '#2E3846',
              MAP_CONFIG.COLORS.BUILDINGS,
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['coalesce', ['get', 'render_height'], 10],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14,
              0,
              15.05,
              ['coalesce', ['get', 'render_min_height'], 0],
            ],
            'fill-extrusion-opacity': 0.85,
          },
        },
        labelLayerId
      );
    } catch (e) {
      console.warn('Impossible d ajouter la couche 3D de bâtiments :', e);
    }
  }
}
