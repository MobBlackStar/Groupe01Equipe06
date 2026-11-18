// 💡 Concept & Analogie : Comme un GPS piéton qui ne traverse jamais un immeuble, ce module renvoie un vrai trajet à pied qui suit les rues d'OpenStreetMap entre deux points.
// 🔄 Comparaison React / Flutter : Même logique que `directions_service.dart` côté Flutter : cache local d'abord, appel réseau ensuite, repli explicite si le routeur est injoignable.
// 🎯 À retenir pour la soutenance : "Les itinéraires de démonstration sont embarqués (hors-ligne garanti) ; les nouveaux commerces sont routés en direct par le profil piéton OSRM, jamais par une ligne droite à travers les bâtiments."

import PRECOMPUTED from './streetRoutes.data.json';

const ROUTING_URL =
  import.meta.env.VITE_ROUTING_URL || 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const REQUEST_TIMEOUT_MS = 6000;
const STORAGE_PREFIX = 'cs.streetRoute.v1:';

const memoryCache = new Map(); // pairKey -> route | null (échec mémorisé pour la session)
const inflight = new Map(); // pairKey -> Promise

const keyOf = (p) => `${Number(p[0]).toFixed(5)},${Number(p[1]).toFixed(5)}`;
const pairKeyOf = (a, b) => [keyOf(a), keyOf(b)].sort().join('|');

/** Distance de marche → minutes (5 km/h), identique à OSRM foot. */
export function walkingMinutesFromMeters(meters) {
  const m = Number(meters);
  return Number.isFinite(m) && m > 0 ? Math.max(1, Math.round(m / 83)) : null;
}

function orient(route, from) {
  // Les routes sont stockées une seule fois par paire (clé triée) : on les retourne si besoin.
  const first = route.coordinates[0];
  const same = keyOf(first) === keyOf(from);
  return same ? route : { ...route, coordinates: [...route.coordinates].reverse() };
}

function fromBundle(from, to) {
  const hit = PRECOMPUTED.routes?.[pairKeyOf(from, to)];
  if (!hit) return null;
  return orient({ coordinates: hit.c, distanceM: hit.d, durationS: hit.t, source: 'bundle' }, from);
}

function fromStorage(from, to) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + pairKeyOf(from, to));
    if (!raw) return null;
    const r = JSON.parse(raw);
    return orient({ ...r, source: 'cache' }, from);
  } catch {
    return null;
  }
}

function saveToStorage(from, to, route) {
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + pairKeyOf(from, to),
      JSON.stringify({ coordinates: route.coordinates, distanceM: route.distanceM, durationS: route.durationS })
    );
  } catch {
    /* quota / mode privé : le cache mémoire suffit */
  }
}

/** Itinéraire déjà connu (embarqué, local ou mémoire) : synchrone, ou null. */
export function getKnownStreetRoute(from, to) {
  const k = pairKeyOf(from, to);
  if (memoryCache.has(k)) {
    const r = memoryCache.get(k);
    return r ? orient(r, from) : null;
  }
  const known = fromBundle(from, to) || fromStorage(from, to);
  if (known) memoryCache.set(k, known);
  return known;
}

/**
 * Itinéraire piéton réel entre deux points [lng, lat].
 * Ordre : embarqué → cache navigateur → routeur OSRM en direct. Renvoie null si tout échoue
 * (l'appelant dessine alors un trait « à vol d'oiseau » explicitement distinct, jamais un faux chemin).
 * @returns {Promise<{coordinates:number[][], distanceM:number, durationS:number, source:string}|null>}
 */
export async function getStreetRoute(from, to) {
  const known = getKnownStreetRoute(from, to);
  if (known) return known;

  const k = pairKeyOf(from, to);
  if (memoryCache.has(k)) return null; // échec déjà constaté pendant cette session
  if (inflight.has(k)) return inflight.get(k).then((r) => (r ? orient(r, from) : null));

  const promise = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = `${ROUTING_URL}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&steps=false`;
      const res = await fetch(url, { signal: ctrl.signal });
      const data = await res.json();
      const r = data?.routes?.[0];
      if (data?.code !== 'Ok' || !r?.geometry?.coordinates?.length) return null;
      // Raccords : la ligne touche les vrais marqueurs, même si le routeur a accroché les extrémités à la rue.
      const route = {
        coordinates: [from, ...r.geometry.coordinates, to],
        distanceM: Math.round(r.distance),
        durationS: Math.round(r.duration),
        source: 'live',
      };
      saveToStorage(from, to, route);
      return route;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();

  inflight.set(k, promise);
  const result = await promise;
  inflight.delete(k);
  memoryCache.set(k, result);
  return result ? orient(result, from) : null;
}
