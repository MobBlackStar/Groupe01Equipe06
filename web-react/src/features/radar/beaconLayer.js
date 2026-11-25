// Module : Holo-Radar 3D WebGL - Balises 3D & Repères Numérotés Fika
// Inspiré des balises d'urgence holographiques et des pins numérotés d'image3.png
// Prismes 3D polygonaux extrudés et marqueurs HTML avec temps de marche.

import maplibregl from 'maplibre-gl';
import { MAP_CONFIG, isMapReady, griddleUrgencyColor } from './mapStyle.js';
import { formatTND } from '@shared/money.js';

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
        color: griddleUrgencyColor(m.beaconUrgencyColor),
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
export function createFikaNumberedMarkers(map, merchants = [], onSelectMerchant, opts = {}) {
  if (!map) return [];

  const markers = [];
  const items = []; // { el, label, lngLat, priority, w, h }

  // Trie par distance pour numéroter 1, 2, 3...
  const sorted = [...merchants].sort(
    (a, b) => (a.distanceM || a.distanceFromEssectM || 0) - (b.distanceM || b.distanceFromEssectM || 0)
  );

  sorted.forEach((m, idx) => {
    const num = idx + 1;
    const lng = m.location?.lng ?? MAP_CONFIG.ESSECT_COORDS[0];
    const lat = m.location?.lat ?? MAP_CONFIG.ESSECT_COORDS[1];
    const walkMin = m.walkingMinutes || 3;
    const prices = (m.activeOffers || []).map((o) => Number(o.currentPriceMillimes ?? o.currentPrice)).filter((n) => Number.isFinite(n) && n > 0);
    const price = prices.length ? formatTND(Math.min(...prices)) : '';
    const urgency = griddleUrgencyColor(m.beaconUrgencyColor);

    const el = document.createElement('div');
    el.className = 'cs-badge select-none';
    el.dataset.merchantId = String(m.id ?? '');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${m.name}${price ? `, dès ${price}` : ''}, ${walkMin} min à pied`);
    el.style.setProperty('--cs-urgency', urgency);
    el.innerHTML = `
      <div class="cs-badge__body">
        <span class="cs-badge__num">${num}</span>
        <span class="cs-badge__label">
          <span class="cs-badge__name">${escapeHtml(m.name || 'Commerce')}</span>
          ${price ? `<span class="cs-badge__price">${price}</span>` : ''}
          <span class="cs-badge__min">${walkMin} min</span>
        </span>
      </div>
      <span class="cs-badge__stem" aria-hidden="true"></span>
    `;

    const select = (ev) => {
      ev.stopPropagation();
      el.classList.remove('is-pop');
      void el.offsetWidth; // relance l'animation « pop »
      el.classList.add('is-pop');
      onSelectMerchant?.(m);
    };
    el.addEventListener('click', select);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') select(ev);
    });
    el.addEventListener('mouseenter', () => opts.onHover?.(m));
    el.addEventListener('mouseleave', () => opts.onHover?.(null));

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
    markers.push(marker);
    items.push({ el, id: String(m.id ?? ''), lngLat: [lng, lat], priority: idx + 1, w: 0, h: 0, open: true });
  });

  // Marqueur spécial pour le Campus ESSECT lui-même
  const essectEl = document.createElement('div');
  essectEl.className = 'cs-badge cs-badge--essect select-none';
  essectEl.innerHTML = `
    <div class="cs-badge__body">
      <span class="cs-badge__num">★</span>
      <span class="cs-badge__label"><span class="cs-badge__name">Campus ESSECT</span></span>
    </div>
    <span class="cs-badge__stem" aria-hidden="true"></span>
  `;
  const essectMarker = new maplibregl.Marker({ element: essectEl, anchor: 'bottom' }).setLngLat(MAP_CONFIG.ESSECT_COORDS).addTo(map);
  markers.push(essectMarker);
  items.push({ el: essectEl, id: '__essect', lngLat: MAP_CONFIG.ESSECT_COORDS, priority: 0, w: 0, h: 0, open: true });

  // --- Anti-chevauchement : par priorité (choisi > ESSECT > plus proches), une étiquette ne s'ouvre que si sa boîte
  // ne touche aucune boîte déjà ouverte ; sinon elle se replie en simple pastille numérotée. Tailles mesurées UNE fois,
  // positions projetées sur le CPU : aucun reflow pendant les gestes, au plus un calcul par image.
  let selectedId = null;
  let raf = 0;
  // largeur NATURELLE (étiquette ouverte) : on ne mesure jamais une étiquette repliée
  const measure = () => {
    items.forEach((it) => {
      if (it.el.classList.contains('is-collapsed') && it.w) return;
      const was = it.el.classList.contains('is-collapsed');
      if (was) it.el.classList.remove('is-collapsed');
      it.w = it.el.offsetWidth || 160;
      it.h = it.el.offsetHeight || 40;
      if (was) it.el.classList.add('is-collapsed');
    });
  };
  const declutter = () => {
    raf = 0;
    if (!items[0]?.w) measure();
    const order = [...items].sort((a, b) => (a.id === selectedId ? -1 : b.id === selectedId ? 1 : a.priority - b.priority));
    const labels = []; // étiquettes ouvertes
    const bubbles = []; // pastilles seules
    const pad = 6;
    const hits = (box, list) => list.some((q) => box.x0 < q.x1 + pad && box.x1 > q.x0 - pad && box.y0 < q.y1 + pad && box.y1 > q.y0 - pad);
    for (const it of order) {
      const p = map.project(it.lngLat);
      const box = { x0: p.x - 18, x1: p.x - 18 + it.w, y0: p.y - it.h, y1: p.y };
      const bubble = { x0: p.x - 18, x1: p.x + 18, y0: p.y - 46, y1: p.y };
      const open = !hits(box, labels) && !hits(box, bubbles);
      // une pastille repliée posée SOUS une étiquette ouverte disparaît (jamais de chiffre par-dessus un nom)
      const hidden = !open && hits(bubble, labels);
      if (open !== it.open) {
        it.open = open;
        it.el.classList.toggle('is-collapsed', !open);
      }
      if (hidden !== it.hidden) {
        it.hidden = hidden;
        it.el.classList.toggle('is-hidden', hidden);
      }
      if (open) labels.push(box);
      else if (!hidden) bubbles.push(bubble);
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(declutter);
  };
  map.on('move', schedule);
  map.on('resize', schedule);
  // première passe après la mise en page (les polices peuvent changer la largeur)
  requestAnimationFrame(() => {
    measure();
    declutter();
  });
  if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); schedule(); });

  markers.setSelected = (id) => {
    selectedId = id == null ? null : String(id);
    items.forEach((it) => it.el.classList.toggle('is-selected', it.id === selectedId));
    schedule();
  };
  markers.dispose = () => {
    map.off('move', schedule);
    map.off('resize', schedule);
    if (raf) cancelAnimationFrame(raf);
  };

  return markers;
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
