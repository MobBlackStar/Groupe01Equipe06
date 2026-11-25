// 💡 Concept & Analogie : Comme les plaques de rue vissées aux angles des immeubles : même si le fond de carte ne se charge pas, on sait toujours où l'on est (Boulevard Ali Trad, Rue Galilée...).
// 🔄 Comparaison React / Flutter : Quelques marqueurs HTML posés une fois (comme des `Positioned` dans un `Stack`), jamais recréés pendant les gestes ; seule la classe « masqué » change avec le zoom.
// 🎯 À retenir pour la soutenance : "Les noms de rues ne dépendent pas des tuiles externes : la carte reste lisible hors ligne ; chaque plaque est recalée sur l'axe de rue le plus proche du monde 3D."

import maplibregl from 'maplibre-gl';
import { snapToRoads } from '@shared/spot.js';

/** Rues principales de Montfleury (mêmes repères que les raccourcis de l'éditeur de spot et de l'application mobile). */
export const MONTFLEURY_STREETS = [
  { name: 'Boulevard Ali Trad', lat: 36.7885, lng: 10.1762 },
  { name: 'Rue Galilée', lat: 36.7864, lng: 10.1742 },
  { name: 'Avenue Bab Jedid', lat: 36.7915, lng: 10.171 },
  { name: 'Rue des Silos', lat: 36.7845, lng: 10.178 },
  { name: 'Avenue de Bellevue', lat: 36.7838, lng: 10.1772 },
];

const MIN_ZOOM = 15.2;

/**
 * Pose les plaques de rue (idempotent). Retourne une fonction de nettoyage.
 * @param {object} map - instance MapLibre
 * @param {object} [world] - monde chargé (`raw.roads`, `raw.origin`) pour recaler chaque plaque sur sa rue
 */
export function addStreetLabels(map, world) {
  if (!map || map.__csStreetLabels) return map?.__csStreetLabels || (() => {});
  const raw = world?.raw;
  const markers = MONTFLEURY_STREETS.map((s) => {
    const snap = raw ? snapToRoads({ lat: s.lat, lng: s.lng }, raw.roads || [], raw.origin, 80) : null;
    const el = document.createElement('div');
    el.className = 'cs-street-label';
    el.textContent = s.name;
    el.setAttribute('aria-hidden', 'true'); // décoratif : les noms figurent aussi dans les fiches des commerces
    return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(snap ? [snap.lng, snap.lat] : [s.lng, s.lat]).addTo(map);
  });
  const onZoom = () => {
    const hide = map.getZoom() < MIN_ZOOM;
    markers.forEach((m) => m.getElement().classList.toggle('is-hidden', hide));
  };
  map.on('zoomend', onZoom);
  onZoom();
  const cleanup = () => {
    map.off('zoomend', onZoom);
    markers.forEach((m) => m.remove());
    map.__csStreetLabels = null;
  };
  map.__csStreetLabels = cleanup;
  return cleanup;
}
