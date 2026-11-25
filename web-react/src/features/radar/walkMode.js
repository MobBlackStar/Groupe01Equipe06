// 💡 Concept & Analogie : Comme une visite guidée en réalité augmentée où la caméra descend au niveau des yeux et suit le trottoir jusqu'à la porte du restaurant, où une barrière rayée vous arrête avant d'entrer.
// 🔄 Comparaison React / Flutter : Boucle d'animation `requestAnimationFrame` pilotant la « caméra libre » de MapLibre (position + point regardé), exactement comme un `Ticker` Flutter qui met à jour une scène à chaque image.
// 🎯 À retenir pour la soutenance : "Le mode Marcher suit l'itinéraire piéton réel (OSRM) à hauteur d'yeux 1,7 m ; le point d'arrivée est une barrière : on n'entre pas dans le commerce, on réserve son panier."

import maplibregl from 'maplibre-gl';

const M_LAT = 111320;
const EYE_HEIGHT_M = 2.0; // hauteur d'yeux « de jeu » : à 1,7 m, regarder plus loin que 19 m dépasserait l'inclinaison max de 85°
const STOP_BEFORE_END_M = 9; // on s'arrête devant la barrière : assez loin pour la voir en entier, au centre de l'écran
const BARRIER_SRC = 'walk-barrier-src';
const BARRIER_LAYER = 'walk-barrier';
const TRAIL_SRC = 'walk-trail-src';
const TRAIL_GLOW = 'walk-trail-glow';
const TRAIL_DOTS = 'walk-trail-dots';
const CRUMB_STEP_M = 4;

export const WALK_SPEEDS = {
  calm: { label: 'Balade', metersPerSecond: 5 },
  brisk: { label: 'Rapide', metersPerSecond: 11 },
  dash: { label: 'Sprint', metersPerSecond: 24 },
};

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Repère local en mètres (est, nord) autour d'un point : suffisant sur quelques centaines de mètres. */
function makeFrame(origin) {
  const k = Math.cos(toRad(origin[1])) * M_LAT;
  return {
    toM: ([lng, lat]) => [(lng - origin[0]) * k, (lat - origin[1]) * M_LAT],
    toLL: ([x, y]) => [origin[0] + x / k, origin[1] + y / M_LAT],
  };
}

/** Itinéraire rééchantillonné en mètres, avec distances cumulées. */
export function buildPath(coords) {
  const frame = makeFrame(coords[0]);
  const pts = [];
  coords.forEach((c) => {
    const p = frame.toM(c);
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.3) pts.push(p);
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { frame, pts, cum, length: cum[cum.length - 1] };
}

/** Position (m) à la distance d le long du chemin. */
export function sampleAt(path, d) {
  const dist = clamp(d, 0, path.length);
  let i = 1;
  while (i < path.cum.length - 1 && path.cum[i] < dist) i++;
  const a = path.pts[i - 1];
  const b = path.pts[i];
  const seg = path.cum[i] - path.cum[i - 1] || 1;
  const t = (dist - path.cum[i - 1]) / seg;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Cap (radians, 0 = nord, sens horaire) pour aller de p vers q. */
const bearingRad = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]);

/** Écart angulaire le plus court, dans [-PI, PI]. */
function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// ---------------------------------------------------------------------------------------------
// Barrière de la porte (extrusions rayées rouge / crème + deux poteaux)
// ---------------------------------------------------------------------------------------------

function barrierFeatureCollection(frame, endM, headingRad) {
  const tx = Math.sin(headingRad); // direction de marche
  const ty = Math.cos(headingRad);
  const nx = ty; // perpendiculaire (gauche -> droite)
  const ny = -tx;
  const half = 1.9;
  const sections = 8;
  const box = (cx, cy, halfAlong, halfAcross, props) => {
    const corners = [
      [cx - nx * halfAlong - tx * halfAcross, cy - ny * halfAlong - ty * halfAcross],
      [cx + nx * halfAlong - tx * halfAcross, cy + ny * halfAlong - ty * halfAcross],
      [cx + nx * halfAlong + tx * halfAcross, cy + ny * halfAlong + ty * halfAcross],
      [cx - nx * halfAlong + tx * halfAcross, cy - ny * halfAlong + ty * halfAcross],
    ].map(frame.toLL);
    corners.push(corners[0]);
    return { type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [corners] } };
  };
  const features = [];
  const w = (half * 2) / sections;
  for (let s = 0; s < sections; s++) {
    const off = -half + w * (s + 0.5);
    features.push(box(endM[0] + nx * off, endM[1] + ny * off, w / 2, 0.06, { c: s % 2 ? '#FFFFFF' : '#F0121C', base: 0.85, top: 1.2 }));
  }
  [-half - 0.12, half + 0.12].forEach((off) => {
    features.push(box(endM[0] + nx * off, endM[1] + ny * off, 0.14, 0.14, { c: '#111111', base: 0, top: 1.45 }));
  });
  // Pieds de la barrière
  features.push(box(endM[0], endM[1], half + 0.3, 0.02, { c: '#DA0711', base: 0, top: 0.05 }));
  return { type: 'FeatureCollection', features };
}

function addBarrier(map, frame, endM, headingRad) {
  const data = barrierFeatureCollection(frame, endM, headingRad);
  if (map.getSource(BARRIER_SRC)) map.getSource(BARRIER_SRC).setData(data);
  else map.addSource(BARRIER_SRC, { type: 'geojson', data });
  if (!map.getLayer(BARRIER_LAYER)) {
    map.addLayer({
      id: BARRIER_LAYER,
      type: 'fill-extrusion',
      source: BARRIER_SRC,
      paint: {
        'fill-extrusion-color': ['get', 'c'],
        'fill-extrusion-base': ['get', 'base'],
        'fill-extrusion-height': ['get', 'top'],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': false,
      },
    });
  }
}

function removeBarrier(map) {
  try {
    if (map.getLayer(BARRIER_LAYER)) map.removeLayer(BARRIER_LAYER);
    if (map.getSource(BARRIER_SRC)) map.removeSource(BARRIER_SRC);
  } catch {
    /* carte déjà détruite */
  }
}

// ---------------------------------------------------------------------------------------------
// Fil d'Ariane lumineux : des points tous les 4 m sur le reste du chemin, une onde moutarde qui avance vers la porte
// (une seule source, deux calques ; l'animation ne change qu'une propriété de peinture, ~12 fois par seconde)
// ---------------------------------------------------------------------------------------------

function trailData(path) {
  const features = [];
  for (let d = 0; d <= path.length; d += CRUMB_STEP_M) {
    features.push({ type: 'Feature', properties: { d }, geometry: { type: 'Point', coordinates: path.frame.toLL(sampleAt(path, d)) } });
  }
  const line = { type: 'Feature', properties: { d: -1 }, geometry: { type: 'LineString', coordinates: path.pts.map(path.frame.toLL) } };
  return { type: 'FeatureCollection', features: [line, ...features] };
}

function addTrail(map, path) {
  const data = trailData(path);
  if (map.getSource(TRAIL_SRC)) map.getSource(TRAIL_SRC).setData(data);
  else map.addSource(TRAIL_SRC, { type: 'geojson', data });
  if (!map.getLayer(TRAIL_GLOW)) {
    map.addLayer({
      id: TRAIL_GLOW,
      type: 'line',
      source: TRAIL_SRC,
      filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFD000', 'line-width': ['interpolate', ['linear'], ['zoom'], 16, 6, 20, 26], 'line-blur': 8, 'line-opacity': 0.55 },
    });
  }
  if (!map.getLayer(TRAIL_DOTS)) {
    map.addLayer({
      id: TRAIL_DOTS,
      type: 'circle',
      source: TRAIL_SRC,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': '#FFD000',
        'circle-stroke-color': '#111111',
        'circle-stroke-width': 1.5,
        'circle-pitch-alignment': 'map',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 2.5, 20, 9],
        'circle-opacity': 0.9,
        'circle-stroke-opacity': 0.9,
      },
    });
  }
}

/** Points déjà dépassés : effacés ; points à venir : une onde lumineuse court vers la porte. */
function animateTrail(map, walked, phase) {
  if (!map.getLayer(TRAIL_DOTS)) return;
  const ahead = ['-', ['get', 'd'], walked];
  const wave = ['%', ['+', ['-', 0, ahead], phase], 24];
  const visible = ['case', ['<', ahead, -1], 0, ['>', ahead, 140], 0, 1];
  map.setPaintProperty(TRAIL_DOTS, 'circle-opacity', ['*', visible, ['interpolate', ['linear'], wave, 0, 1, 6, 0.35, 24, 0.35]]);
  map.setPaintProperty(TRAIL_DOTS, 'circle-stroke-opacity', ['*', visible, 0.8]);
  const pulse = ['interpolate', ['linear'], wave, 0, 1.55, 6, 1, 24, 1];
  // le zoom doit rester l'entrée de l'interpolation de plus haut niveau (règle des expressions MapLibre)
  map.setPaintProperty(TRAIL_DOTS, 'circle-radius', ['interpolate', ['linear'], ['zoom'], 16, ['*', 2.5, pulse], 20, ['*', 9, pulse]]);
}

function removeTrail(map) {
  try {
    [TRAIL_DOTS, TRAIL_GLOW].forEach((id) => map.getLayer(id) && map.removeLayer(id));
    if (map.getSource(TRAIL_SRC)) map.removeSource(TRAIL_SRC);
  } catch {
    /* carte déjà détruite */
  }
}

/** Virages du chemin (changement de cap > 35°), pour le repère flottant « prochain virage ». */
function findTurns(path) {
  const turns = [];
  for (let d = 12; d < path.length - 10; d += 3) {
    const before = bearingRad(sampleAt(path, d - 8), sampleAt(path, d));
    const after = bearingRad(sampleAt(path, d), sampleAt(path, d + 8));
    const delta = angleDelta(before, after);
    if (Math.abs(delta) > toRad(35) && (!turns.length || d - turns[turns.length - 1].d > 18)) turns.push({ d, right: delta > 0 });
  }
  return turns;
}

function createWaypoint() {
  const el = document.createElement('div');
  el.className = 'cs-walk-waypoint';
  el.innerHTML = '<span class="cs-walk-waypoint__arrow" aria-hidden="true"></span><span class="cs-walk-waypoint__txt"></span>';
  return el;
}

/** Confettis Griddle à l'arrivée (éléments CSS, retirés après l'animation ; rien si l'utilisateur limite les animations). */
function celebrate(container) {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'cs-confetti';
  box.setAttribute('aria-hidden', 'true');
  const colors = ['#DA0711', '#FFD000', '#1F7A3A', '#FAF3E6', '#111111'];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('i');
    const a = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
    const r = 140 + Math.random() * 180;
    c.style.setProperty('--dx', `${Math.cos(a) * r}px`);
    c.style.setProperty('--dy', `${Math.sin(a) * r * 0.8 - 120}px`);
    c.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
    c.style.setProperty('--delay', `${Math.round(Math.random() * 120)}ms`);
    c.style.background = colors[i % colors.length];
    box.appendChild(c);
  }
  container.appendChild(box);
  setTimeout(() => box.remove(), 2200);
}

/** Panneau posé devant la barrière (texte via textContent : aucun HTML venant de l'API n'est interprété). */
function createSign({ name, subtitle, onReserve, reserveLabel }) {
  const el = document.createElement('div');
  el.className = 'cs-walk-sign';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'cs-walk-sign__eyebrow';
  eyebrow.textContent = 'Vous êtes arrivé';
  const title = document.createElement('strong');
  title.className = 'cs-walk-sign__title';
  title.textContent = name;
  const sub = document.createElement('span');
  sub.className = 'cs-walk-sign__sub';
  sub.textContent = subtitle;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cs-btn cs-btn-red';
  btn.textContent = reserveLabel;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onReserve?.();
  });
  el.append(eyebrow, title, sub, btn);
  return el;
}

// ---------------------------------------------------------------------------------------------
// Marche
// ---------------------------------------------------------------------------------------------

/**
 * Lance la visite à pied.
 * @param {object} map - Instance MapLibre GL
 * @param {object} opts
 * @param {Array<[number,number]>} opts.coordinates - tracé de rue [lng, lat] (sans les raccords dans les bâtiments)
 * @param {string} opts.name - nom du commerce (panneau d'arrivée)
 * @param {string} opts.subtitle - ligne sous le nom (ex. « 3 paniers »)
 * @param {string} opts.reserveLabel
 * @param {() => void} opts.onReserve
 * @param {(s: {progress:number, metersLeft:number, paused:boolean, arrived:boolean, speed:string}) => void} opts.onState
 * @returns {{stop:Function, togglePause:Function, setSpeed:Function, setProgress:Function, nudge:Function}}
 */
export function startWalk(map, opts) {
  const path = buildPath(opts.coordinates);
  const stopAt = Math.max(0, path.length - STOP_BEFORE_END_M);
  const endM = path.pts[path.pts.length - 1];
  const endHeading = bearingRad(sampleAt(path, Math.max(0, path.length - 6)), endM);

  const saved = { center: map.getCenter().toArray(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
  const handlers = ['dragPan', 'dragRotate', 'scrollZoom', 'touchZoomRotate', 'doubleClickZoom', 'keyboard', 'boxZoom'];
  const wasEnabled = {};
  handlers.forEach((h) => {
    wasEnabled[h] = map[h]?.isEnabled?.() ?? false;
    map[h]?.disable?.();
  });
  map.getContainer().classList.add('cs-walking');
  // Vu de près, la lumière rasante noircit les façades à l'ombre : on aplatit l'éclairage pendant la marche
  const savedLight = map.getLight();
  map.setLight({ ...savedLight, intensity: 0.26 });

  const s = {
    d: 0,
    speedKey: 'brisk',
    paused: false,
    arrived: false,
    stopped: false,
    heading: bearingRad(path.pts[0], sampleAt(path, 14)),
    yaw: 0, // regard à gauche/droite (radians), glissé par l'utilisateur
    lookDist: 14, // plus grand = on regarde plus loin (horizon), borné par l'inclinaison max
    last: 0,
    raf: 0,
    sign: null,
    started: false,
    trailTick: 0,
    waypoint: null,
    turnIdx: 0,
  };
  const turns = findTurns(path);

  const emit = () =>
    opts.onState?.({
      progress: stopAt ? clamp(s.d / stopAt, 0, 1) : 1,
      metersLeft: Math.max(0, Math.round(stopAt - s.d)),
      paused: s.paused,
      arrived: s.arrived,
      speed: s.speedKey,
    });

  const placeCamera = (bob, dt = 1 / 60) => {
    const here = sampleAt(path, s.d);
    const ahead = sampleAt(path, Math.min(path.length, s.d + 14));
    const target = bearingRad(here, ahead);
    // virages amortis, indépendants de la cadence d'affichage (même douceur à 30, 60 ou 120 images/s)
    s.heading += angleDelta(s.heading, target) * (1 - Math.exp(-dt * 6.5));
    const look = s.heading + s.yaw;
    const eye = EYE_HEIGHT_M + bob;
    // MapLibre 4.7 n'a pas d'API « caméra libre » : on calcule centre/zoom/inclinaison/cap d'une caméra posée à hauteur d'yeux
    const lookAt = path.frame.toLL([here[0] + Math.sin(look) * s.lookDist, here[1] + Math.cos(look) * s.lookDist]);
    map.jumpTo(map.calculateCameraOptionsFromTo(path.frame.toLL(here), eye, lookAt, 0));
  };

  const finish = () => {
    s.arrived = true;
    s.paused = true;
    if (!s.sign) {
      s.sign = new maplibregl.Marker({
        element: createSign({ name: opts.name, subtitle: opts.subtitle, onReserve: opts.onReserve, reserveLabel: opts.reserveLabel }),
        anchor: 'bottom',
      })
        .setLngLat(path.frame.toLL(endM))
        .addTo(map);
      celebrate(map.getContainer());
      opts.onArrive?.();
    }
    if (s.waypoint) {
      s.waypoint.remove();
      s.waypoint = null;
    }
    emit();
  };

  // repère flottant au-dessus du prochain virage : flèche + distance restante
  const updateWaypoint = () => {
    while (s.turnIdx < turns.length && turns[s.turnIdx].d < s.d + 2) s.turnIdx++;
    const next = turns[s.turnIdx];
    if (!next || next.d - s.d > 120 || s.arrived) {
      if (s.waypoint) s.waypoint.getElement().classList.add('is-hidden');
      return;
    }
    if (!s.waypoint) {
      s.waypoint = new maplibregl.Marker({ element: createWaypoint(), anchor: 'bottom' }).setLngLat(path.frame.toLL(sampleAt(path, next.d))).addTo(map);
      s.waypoint.getElement().classList.add('cs-walk-keep');
    }
    const el = s.waypoint.getElement();
    el.classList.remove('is-hidden');
    el.classList.toggle('is-right', next.right);
    s.waypoint.setLngLat(path.frame.toLL(sampleAt(path, next.d)));
    el.querySelector('.cs-walk-waypoint__txt').textContent = `${Math.max(1, Math.round(next.d - s.d))} m`;
  };

  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const frame = (now) => {
    if (s.stopped) return;
    const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
    s.last = now;
    let bob = 0;
    if (!s.paused && !s.arrived) {
      const remaining = stopAt - s.d;
      const speed = Math.min(WALK_SPEEDS[s.speedKey].metersPerSecond, 1.5 + remaining * 0.9); // ralentit à l'approche
      s.d = Math.min(stopAt, s.d + speed * dt);
      bob = reduceMotion ? 0 : Math.sin(s.d * 2.3) * 0.035;
      if (stopAt - s.d < 0.05) finish();
      else emit();
    }
    placeCamera(bob, dt || 1 / 60);
    s.trailTick += dt;
    if (s.trailTick > 0.08) {
      s.trailTick = 0;
      animateTrail(map, s.d, reduceMotion ? 0 : (now / 1000) * 30);
      updateWaypoint();
    }
    s.raf = requestAnimationFrame(frame);
  };

  // --- regard : glisser au doigt / à la souris
  const canvas = map.getCanvas();
  let drag = null;
  const onDown = (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag) return;
    s.yaw = clamp(s.yaw - toRad((e.clientX - drag.x) * 0.25), -toRad(110), toRad(110));
    s.lookDist = clamp(s.lookDist + (e.clientY - drag.y) * 0.05, 7, 22);
    drag = { x: e.clientX, y: e.clientY };
    if (s.paused) placeCamera(0);
  };
  const onUp = () => {
    drag = null;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  const onKey = (e) => {
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      controller.togglePause();
    }
    if (e.key === 'Escape') controller.stop(true);
  };
  window.addEventListener('keydown', onKey);

  addBarrier(map, path.frame, endM, endHeading);
  addTrail(map, path);
  animateTrail(map, 0, 0);

  // Plongée vers le point de départ, puis la marche démarre
  const startPoint = path.frame.toLL(path.pts[0]);
  map.flyTo({
    center: startPoint,
    zoom: 19,
    pitch: 75,
    bearing: toDeg(s.heading),
    duration: reduceMotion ? 0 : 1500,
    essential: true,
  });
  map.once('moveend', () => {
    if (s.stopped) return;
    s.started = true;
    s.last = 0;
    placeCamera(0);
    emit();
    s.raf = requestAnimationFrame(frame);
  });

  const controller = {
    stop(restoreCamera = true) {
      if (s.stopped) return;
      s.stopped = true;
      cancelAnimationFrame(s.raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      if (s.sign) s.sign.remove();
      if (s.waypoint) s.waypoint.remove();
      removeBarrier(map);
      removeTrail(map);
      handlers.forEach((h) => wasEnabled[h] && map[h]?.enable?.());
      map.getContainer().classList.remove('cs-walking');
      map.setLight(savedLight);
      if (restoreCamera) map.flyTo({ ...saved, duration: reduceMotion ? 0 : 1600, essential: true });
      opts.onStop?.();
    },
    togglePause() {
      if (s.arrived) return;
      s.paused = !s.paused;
      emit();
    },
    setSpeed(key) {
      if (WALK_SPEEDS[key]) {
        s.speedKey = key;
        emit();
      }
    },
    setProgress(fraction) {
      s.d = clamp(fraction, 0, 1) * stopAt;
      if (s.arrived && fraction < 1) {
        s.arrived = false;
        s.paused = false;
        if (s.sign) {
          s.sign.remove();
          s.sign = null;
        }
      }
      s.turnIdx = 0;
      if (stopAt - s.d < 0.05) finish();
      else emit();
      placeCamera(0);
      animateTrail(map, s.d, 0);
      updateWaypoint();
    },
    getState: () => ({ d: s.d, length: stopAt, arrived: s.arrived, paused: s.paused, started: s.started }),
  };
  return controller;
}
