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
    ROUTE_CORE: '#DA0711',
    AMBER_GOLD: '#FFD000', // Jaune moutarde
    RED_FLAME: '#DA0711',
    URGENCY_LOW: '#FFD000', // > 60 min (Jaune moutarde)
    URGENCY_MEDIUM: '#FF8A00', // 20 - 60 min (Orange)
    URGENCY_HIGH: '#DA0711', // < 20 min (Rouge alerte)
  },
};

/**
 * Couleurs d'urgence de l'API/du module partagé (néon `#CCFF00`, orange `#FF5500`, rouge `#FF1744`) -> palette Griddle.
 * Le contrat serveur et ses tests ne changent pas : la traduction se fait au dernier moment, à l'affichage de la carte.
 * @param {string} [hex]
 * @returns {string}
 */
export function griddleUrgencyColor(hex) {
  const map = {
    '#CCFF00': MAP_CONFIG.COLORS.URGENCY_LOW, // > 60 min : moutarde (plus jamais de vert fluo)
    '#FF5500': MAP_CONFIG.COLORS.URGENCY_MEDIUM, // 20-60 min : orange
    '#FF1744': MAP_CONFIG.COLORS.URGENCY_HIGH, // < 20 min : rouge Griddle
  };
  const key = String(hex || '').toUpperCase();
  return map[key] || hex || MAP_CONFIG.COLORS.ROUTE_GLOW;
}

/**
 * Le style est-il assez chargé pour accepter addSource/addLayer ?
 * `map.isStyleLoaded()` est trop strict : il repasse à false dès qu'une source ou un calque vient d'être ajouté
 * (le helper suivant abandonnait alors en silence). `getStyle()` n'est défini qu'une fois le style chargé.
 */
export function isMapReady(map) {
  try {
    return Boolean(map && map.getStyle());
  } catch {
    return false;
  }
}

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
          // CORRECTIF : ce jeu de tuiles (OpenFreeMap) n'a PAS de propriété `extrude` ; l'ancien filtre
          // ['==', 'extrude', 'true'] ne laissait passer aucun bâtiment, donc la ville n'était jamais extrudée.
          // La donnée porte `render_height` (hauteur réelle OSM) et `hide_3d` (parties à ne pas extruder).
          filter: ['!=', ['get', 'hide_3d'], true],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            // Ton par hauteur : bas = crème sable, haut = terre cuite. Avec le dégradé vertical, façades claires en haut,
            // sombres au pied : c'est ce qui donne du volume (structure de valeurs).
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'render_height'], 8],
              0, '#EFE3CB',
              15, '#E3D1B0',
              40, '#D4BB92',
              90, '#BFA073',
            ],
            'fill-extrusion-vertical-gradient': true,
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
            'fill-extrusion-opacity': 0.97,
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

    // La lumière (soleil réel de Tunis, ou lumière dorée la nuit) est posée par `applyAtmosphere` (atmosphere.js)
  } catch (e) {
    console.warn('[MapLibre] Impossible d injecter la couche 3D des bâtiments :', e);
  }
}

/**
 * Style de secours hors ligne : fond crème seul. Le monde 3D (rues, trottoirs, parcs, immeubles, arbres) et les plaques de
 * rue sont dessinés par l'application : la carte reste complète même si les tuiles externes ne répondent pas.
 */
export const OFFLINE_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': MAP_CONFIG.COLORS.BACKGROUND } }],
};

/**
 * Bascule sur OFFLINE_STYLE si le style distant n'est pas chargé après `timeoutMs` ou échoue avant d'être chargé.
 * @returns {() => void} annule la surveillance
 */
export function installStyleFallback(map, timeoutMs = 4500) {
  let loaded = false;
  let switched = false;
  const toOffline = () => {
    if (loaded || switched) return;
    switched = true;
    try {
      map.setStyle(OFFLINE_STYLE);
    } catch {
      /* carte démontée */
    }
  };
  const onLoad = () => {
    loaded = true;
  };
  const onError = () => {
    if (!loaded) toOffline();
  };
  map.on('style.load', onLoad);
  map.on('error', onError);
  const timer = setTimeout(toOffline, timeoutMs);
  return () => {
    clearTimeout(timer);
    map.off('style.load', onLoad);
    map.off('error', onError);
  };
}
