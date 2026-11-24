/**
 * Pré-calcule les itinéraires PIÉTONS réels (réseau de rues OpenStreetMap) entre l'ESSECT et les commerces
 * de démonstration, puis les écrit dans src/features/radar/streetRoutes.data.json.
 *
 * Pourquoi : le Holo-Radar doit tracer des chemins qui suivent les rues, jamais des lignes droites ou en L
 * qui traversent les bâtiments. Les routes embarquées fonctionnent hors-ligne (soutenance) ; les commerces
 * inscrits plus tard sont routés en direct par src/features/radar/streetRoutes.js.
 *
 * Usage : node scripts/build-street-routes.mjs
 * Source : https://routing.openstreetmap.de/routed-foot (OSRM, profil piéton, données © OpenStreetMap contributors)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OSRM = process.env.ROUTING_URL || 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/features/radar/streetRoutes.data.json');

// [lng, lat] : l'ESSECT + les 12 commerces de Montfleury lus dans le jeu de données officiel du seed (source unique)
const MERCHANTS_JSON = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend-node/scripts/seed-data/merchants.json');
const POINTS = { essect: [10.1748, 36.7871] };
for (const m of JSON.parse(fs.readFileSync(MERCHANTS_JSON, 'utf8')).merchants) {
  POINTS[m.id.replace(/^merchant-/, '')] = [m.location.lng, m.location.lat];
}

const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
const pairKey = (a, b) => [key(a), key(b)].sort().join('|');
const round5 = (c) => [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const names = Object.keys(POINTS);
const routes = {};
let done = 0;
const total = (names.length * (names.length - 1)) / 2;

for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = POINTS[names[i]];
    const b = POINTS[names[j]];
    const url = `${OSRM}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson&steps=false`;
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const r = data.routes?.[0];
        if (data.code === 'Ok' && r) {
          // Le routeur "accroche" chaque extrémité à la rue la plus proche : on garde les vrais points d'origine
          // et de destination aux deux bouts (raccords courts) pour que la ligne touche les marqueurs.
          const coords = [a, ...r.geometry.coordinates, b].map(round5);
          routes[pairKey(a, b)] = { d: Math.round(r.distance), t: Math.round(r.duration), c: coords };
          ok = true;
        }
      } catch {
        await sleep(800);
      }
    }
    done++;
    console.log(`[${done}/${total}] ${names[i]} -> ${names[j]} ${ok ? routes[pairKey(a, b)].d + ' m' : 'ÉCHEC'}`);
    await sleep(250);
  }
}

const missing = total - Object.keys(routes).length;
fs.writeFileSync(OUT, JSON.stringify({ source: 'OpenStreetMap contributors / OSRM foot', generatedAt: new Date().toISOString().slice(0, 10), routes }));
console.log(`\n${Object.keys(routes).length}/${total} itinéraires écrits dans ${OUT}${missing ? ` (${missing} manquants)` : ''}`);
process.exit(missing ? 1 : 0);
