// 💡 Concept & Analogie : Comme un maquettiste qui découpe chaque immeuble dans du carton (4 murs + 1 toit) puis colle tout dans une seule boîte pour que la carte graphique l'avale d'un coup, ce module transforme les empreintes au sol en volumes.
// 🔄 Comparaison React / Flutter : Aucun équivalent direct : on prépare des tableaux typés (Float32Array) qui seront envoyés tels quels au GPU, comme un `CustomPainter` qui prépare un `Vertices` unique plutôt que des milliers de rectangles.
// 🎯 À retenir pour la soutenance : "11 000 immeubles = un seul appel de dessin. Les toits sont triangulés par earcut ; les arbres, palmiers et oiseaux sont des modèles minuscules répliqués par instanciation."

import earcut from 'earcut';

const frac = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Surface signée d'un anneau [x0,y0,x1,y1,...] (positive = sens trigonométrique). */
function signedArea(flat) {
  let a = 0;
  const n = flat.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += flat[2 * i] * flat[2 * j + 1] - flat[2 * j] * flat[2 * i + 1];
  }
  return a / 2;
}

function pointInRing(x, y, flat) {
  let inside = false;
  const n = flat.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = flat[2 * i];
    const yi = flat[2 * i + 1];
    const xj = flat[2 * j];
    const yj = flat[2 * j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Tous les immeubles dans UN maillage (murs + toits) et la liste des accessoires de toit.
 * @param {Array<{r:number[], h:number, k:number, u:number}>} buildings - anneaux en décimètres
 */
export function buildBuildingMesh(buildings, maxDistanceM) {
  let vMax = 0;
  let iMax = 0;
  for (const b of buildings) {
    const n = b.r.length / 2;
    vMax += n * 4 + n;
    iMax += n * 6 + Math.max(0, n - 2) * 3;
  }
  const pos = new Float32Array(vMax * 3);
  const misc = new Float32Array(vMax * 4);
  const nrm = new Int8Array(vMax * 4);
  const idx = new Uint32Array(iMax);
  const props = [];
  // jupe d'ombre de contact : un ruban au sol le long de chaque mur, sombre au pied, transparent à 2-4 m
  const skirtPos = [];
  const skirtFade = [];
  let v = 0;
  let ii = 0;

  for (const b of buildings) {
    const n = b.r.length / 2;
    if (n < 3) continue;
    let flat = new Array(n * 2);
    for (let i = 0; i < n * 2; i++) flat[i] = b.r[i] / 10; // décimètres -> mètres
    if (Number.isFinite(maxDistanceM) && maxDistanceM > 0) {
      let cx = 0; let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += flat[2 * i]; cy += flat[2 * i + 1];
      }
      cx /= n; cy /= n;
      if (Math.hypot(cx, cy) > maxDistanceM) continue;
    }
    if (signedArea(flat) < 0) {
      const rev = new Array(n * 2);
      for (let i = 0; i < n; i++) {
        rev[2 * i] = flat[2 * (n - 1 - i)];
        rev[2 * i + 1] = flat[2 * (n - 1 - i) + 1];
      }
      flat = rev;
    }
    // retrait d'environ 12 cm : deux immeubles mitoyens ne partagent plus le même plan de mur (sinon scintillement)
    {
      let cx0 = 0;
      let cy0 = 0;
      for (let i = 0; i < n; i++) {
        cx0 += flat[2 * i];
        cy0 += flat[2 * i + 1];
      }
      cx0 /= n;
      cy0 /= n;
      const f = Math.max(0.9, 1 - 0.14 / Math.max(2, Math.sqrt(Math.abs(signedArea(flat))) / 2));
      for (let i = 0; i < n; i++) {
        flat[2 * i] = cx0 + (flat[2 * i] - cx0) * f;
        flat[2 * i + 1] = cy0 + (flat[2 * i + 1] - cy0) * f;
      }
    }
    const h = b.h;
    // ESSECT : l'institution au cœur de la scène (< 60 m de l'origine) reçoit un matériau signature
    let kind = b.k;
    if (b.k === 1) {
      let mx = 0; let my = 0;
      for (let i = 0; i < n; i++) { mx += flat[2 * i]; my += flat[2 * i + 1]; }
      if (Math.hypot(mx / n, my / n) < 60) kind = 4;
    }
    let s = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = flat[2 * i];
      const ay = flat[2 * i + 1];
      const cx = flat[2 * j];
      const cy = flat[2 * j + 1];
      const dx = cx - ax;
      const dy = cy - ay;
      const len = Math.hypot(dx, dy) || 1e-6;
      const nx = (dy / len) * 127;
      const ny = (-dx / len) * 127;
      {
        const W = Math.min(4, 1.8 + h * 0.09);
        const ox = (dy / len) * W;
        const oy = (-dx / len) * W;
        // deux triangles : a, c, c', a'  (z 0,06 : au-dessus des chaussées)
        skirtPos.push(ax, ay, 0.06, cx, cy, 0.06, cx + ox, cy + oy, 0.06, ax, ay, 0.06, cx + ox, cy + oy, 0.06, ax + ox, ay + oy, 0.06);
        skirtFade.push(0, 0, 1, 0, 1, 1);
      }
      const base = v;
      const corners = [
        [ax, ay, 0, s],
        [cx, cy, 0, s + len],
        [cx, cy, h, s + len],
        [ax, ay, h, s],
      ];
      for (const [x, y, z, ss] of corners) {
        pos[v * 3] = x;
        pos[v * 3 + 1] = y;
        pos[v * 3 + 2] = z;
        misc[v * 4] = ss;
        misc[v * 4 + 1] = b.u;
        misc[v * 4 + 2] = kind;
        misc[v * 4 + 3] = h;
        nrm[v * 4] = nx;
        nrm[v * 4 + 1] = ny;
        nrm[v * 4 + 2] = 0;
        nrm[v * 4 + 3] = 0;
        v++;
      }
      idx[ii++] = base;
      idx[ii++] = base + 1;
      idx[ii++] = base + 2;
      idx[ii++] = base;
      idx[ii++] = base + 2;
      idx[ii++] = base + 3;
      s += len;
    }
    // toit
    const roofBase = v;
    for (let i = 0; i < n; i++) {
      pos[v * 3] = flat[2 * i];
      pos[v * 3 + 1] = flat[2 * i + 1];
      pos[v * 3 + 2] = h;
      misc[v * 4 + 1] = b.u;
      misc[v * 4 + 2] = kind;
      misc[v * 4 + 3] = h;
      nrm[v * 4 + 2] = 127;
      nrm[v * 4 + 3] = 127;
      v++;
    }
    const tri = earcut(flat);
    for (let t = 0; t < tri.length; t++) idx[ii++] = roofBase + tri[t];

    // accessoires de toit : réservoir d'eau / cage d'escalier sur ~40 % des toits assez grands
    const area = Math.abs(signedArea(flat));
    if (area > 70 && h > 7 && frac(b.u * 977) > 0.58) {
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += flat[2 * i];
        cy += flat[2 * i + 1];
      }
      cx /= n;
      cy /= n;
      if (pointInRing(cx, cy, flat)) {
        const kind = frac(b.u * 331);
        if (kind < 0.55) props.push({ shape: 'tank', x: cx, y: cy, z: h, rot: 0, sx: 0.9 + frac(b.u * 11) * 0.5, sy: 0.9 + frac(b.u * 11) * 0.5, sz: 1.6 + frac(b.u * 5), color: kind < 0.25 ? 1 : 0 });
        else props.push({ shape: 'box', x: cx, y: cy, z: h, rot: frac(b.u * 21) * 3.14, sx: 1.4 + frac(b.u * 13), sy: 1.2 + frac(b.u * 17), sz: 2.2, color: kind < 0.8 ? 0 : 2 });
      }
    }
  }
  return {
    pos: pos.subarray(0, v * 3), misc: misc.subarray(0, v * 4), nrm: nrm.subarray(0, v * 4), idx: idx.subarray(0, ii), vertexCount: v, props,
    skirt: { pos: new Float32Array(skirtPos), fade: new Float32Array(skirtFade) },
  };
}

/** Prisme unitaire à n côtés (rayon 1, hauteur 1, base en z=0) avec normales latérales et couvercle. */
export function prism(n, phase = 0) {
  const pos = [];
  const nrm = [];
  const aux = [];
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a0 = phase + (i / n) * Math.PI * 2;
    const a1 = phase + ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const base = pos.length / 3;
    const nx = Math.cos(am);
    const ny = Math.sin(am);
    pos.push(Math.cos(a0), Math.sin(a0), 0, Math.cos(a1), Math.sin(a1), 0, Math.cos(a1), Math.sin(a1), 1, Math.cos(a0), Math.sin(a0), 1);
    for (let k = 0; k < 4; k++) {
      nrm.push(nx, ny, 0);
      aux.push(0);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const cap = pos.length / 3;
  pos.push(0, 0, 1);
  nrm.push(0, 0, 1);
  aux.push(0);
  for (let i = 0; i <= n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    pos.push(Math.cos(a), Math.sin(a), 1);
    nrm.push(0, 0, 1);
    aux.push(0);
  }
  for (let i = 0; i < n; i++) idx.push(cap, cap + 1 + i, cap + 2 + i);
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), aux: new Float32Array(aux), idx: new Uint16Array(idx) };
}

/** Icosphère unitaire (1 subdivision : 42 sommets) pour les canopées. */
export function icosphere() {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l];
  });
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  const cache = new Map();
  const mid = (a, b) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (cache.has(key)) return cache.get(key);
    const m = [(verts[a][0] + verts[b][0]) / 2, (verts[a][1] + verts[b][1]) / 2, (verts[a][2] + verts[b][2]) / 2];
    const l = Math.hypot(...m);
    verts.push([m[0] / l, m[1] / l, m[2] / l]);
    cache.set(key, verts.length - 1);
    return verts.length - 1;
  };
  const next = [];
  for (const [a, b, c] of faces) {
    const ab = mid(a, b);
    const bc = mid(b, c);
    const ca = mid(c, a);
    next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }
  faces = next;
  const pos = new Float32Array(verts.length * 3);
  verts.forEach((p, i) => pos.set(p, i * 3));
  return { pos, nrm: pos.slice(), aux: new Float32Array(verts.length), idx: new Uint16Array(faces.flat()) };
}

/** Palmier unitaire (hauteur 1) : tronc de 8 anneaux de 5 faces + 9 palmes en lanières. aux : 0 tronc, 1 palme. */
export function palm() {
  const pos = [];
  const nrm = [];
  const aux = [];
  const idx = [];
  const RINGS = 8;
  const SIDES = 5;
  for (let r = 0; r <= RINGS; r++) {
    const z = (r / RINGS) * 0.86;
    const rad = 0.032 - 0.012 * (r / RINGS);
    for (let s = 0; s < SIDES; s++) {
      const a = (s / SIDES) * Math.PI * 2;
      pos.push(Math.cos(a) * rad, Math.sin(a) * rad, z);
      nrm.push(Math.cos(a), Math.sin(a), 0);
      aux.push(0);
    }
  }
  for (let r = 0; r < RINGS; r++) {
    for (let s = 0; s < SIDES; s++) {
      const a = r * SIDES + s;
      const b = r * SIDES + ((s + 1) % SIDES);
      idx.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
    }
  }
  const FRONDS = 9;
  const SEG = 5;
  for (let f = 0; f < FRONDS; f++) {
    const ang = (f / FRONDS) * Math.PI * 2 + (f % 2) * 0.2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const px = -dy;
    const py = dx;
    const start = pos.length / 3;
    for (let sgm = 0; sgm <= SEG; sgm++) {
      const u = sgm / SEG;
      const reach = u * 0.36;
      const z = 0.86 + 0.07 * Math.sin(u * 2.2) - 0.16 * u * u;
      const width = 0.055 * Math.sin(Math.min(1, u * 1.15 + 0.1) * Math.PI) + 0.004;
      for (const side of [-1, 1]) {
        pos.push(dx * reach + px * width * side, dy * reach + py * width * side, z - Math.abs(side) * 0.004);
        nrm.push(0, 0, 1);
        aux.push(1);
      }
    }
    for (let sgm = 0; sgm < SEG; sgm++) {
      const a = start + sgm * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), aux: new Float32Array(aux), idx: new Uint16Array(idx) };
}

/** Oiseau : corps + deux ailes en V (unitaire). */
export function bird() {
  const pos = new Float32Array([
    // aile gauche
    0, 0.1, 0, -1.0, -0.25, 0, -0.35, 0.3, 0,
    // aile droite
    0, 0.1, 0, 0.35, 0.3, 0, 1.0, -0.25, 0,
    // corps
    0, 0.55, 0, -0.12, -0.2, 0, 0.12, -0.2, 0,
  ]);
  return { pos, count: 9 };
}

/** Colonne de lumière : cylindre ouvert (rayon 1, hauteur 1). */
export function column(segments = 20) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pos.push(Math.cos(a), Math.sin(a), 0, Math.cos(a), Math.sin(a), 1);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return { pos: new Float32Array(pos), idx: new Uint16Array(idx) };
}

/** Quad de -1 à 1 (anneau au sol). */
export function quad() {
  return { pos: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), count: 6 };
}

/** Instances d'arbres : (x, y, sol) + (rayon, graine, hauteur de tronc, variante). Les palmiers sont séparés. */
export function buildTreeInstances(trees, maxDistanceM) {
  const round = [];
  const palms = [];
  trees.forEach(([xDm, yDm], i) => {
    const x = xDm / 10;
    const y = yDm / 10;
    if (Number.isFinite(maxDistanceM) && maxDistanceM > 0 && Math.hypot(x, y) > maxDistanceM) return;
    const seed = frac(i * 1.618 + xDm * 0.013 + yDm * 0.0071);
    const isPalm = seed > 0.88;
    if (isPalm) {
      palms.push(x, y, 0, 1.15 + frac(i * 3.3) * 0.5, seed, 7 + frac(i * 5.1) * 4.5, 1);
    } else {
      round.push(x, y, 0, 2.7 + frac(i * 1.7) * 1.9, seed, 2.2 + frac(i * 2.3) * 1.4, 0);
    }
  });
  return { round: new Float32Array(round), palms: new Float32Array(palms), roundCount: round.length / 7, palmCount: palms.length / 7 };
}

/** Oiseaux : centre (x,y), rayon, altitude, vitesse angulaire, phase, taille. */
export function buildBirds(count, radiusM) {
  const a = [];
  for (let i = 0; i < count; i++) {
    const r1 = frac(i * 7.31);
    const r2 = frac(i * 3.17 + 5);
    const flockAng = frac(Math.floor(i / 7) * 9.1) * Math.PI * 2;
    const flockR = 120 + frac(Math.floor(i / 7) * 4.7) * 500;
    const cx = Math.cos(flockAng) * flockR * 0.6;
    const cy = Math.sin(flockAng) * flockR * 0.6;
    const orbit = 80 + (Math.floor(i / 7) % 4) * 45 + r2 * 18;
    const speed = (0.06 + 0.03 * frac(Math.floor(i / 7) * 2.2)) * (i % 2 ? 1 : 1);
    a.push(cx, cy, Math.min(orbit, radiusM * 0.3), 42 + frac(Math.floor(i / 7) * 5.9) * 40 + r1 * 8, speed, (Math.floor(i / 7) * 1.1) + r1 * 0.35, 2.4 + r2 * 0.8, 0);
  }
  return new Float32Array(a);
}

// Largeurs de chaussée (m) par classe : 0 autoroute, 1 primaire, 2 secondaire, 3 tertiaire, 4 résidentielle, 5 zone de rencontre,
// 6 service, 7 piétonne, 8 sentier
const ROAD_WIDTH = [14, 12, 10, 8.5, 6.4, 5, 3.8, 6, 2];
const SIDEWALK_M = 1.7;

/**
 * Rubans de chaussée : trottoirs d'abord (plus larges), puis asphalte par-dessus. Un sommet = x, y, z + (u, v, type, largeur).
 * type : 0 asphalte, 1 trottoir, 2 voie piétonne, 3 sentier.
 */
export function buildRoadMesh(roads) {
  const pos = [];
  const att = [];
  const idx = [];
  const addRibbon = (pts, half, z, type, width, uOffset) => {
    const n = pts.length;
    const normals = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      normals.push([-dy, dx]);
    }
    // joints en onglet : on borne l'allongement pour éviter les pointes aux angles aigus
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i - 1];
      const c = pts[i];
      const q = pts[i + 1];
      const d1 = [c[0] - p[0], c[1] - p[1]];
      const d2 = [q[0] - c[0], q[1] - c[1]];
      const l1 = Math.hypot(...d1) || 1;
      const l2 = Math.hypot(...d2) || 1;
      const n1 = [-d1[1] / l1, d1[0] / l1];
      const n2 = [-d2[1] / l2, d2[0] / l2];
      let mx = n1[0] + n2[0];
      let my = n1[1] + n2[1];
      const ml = Math.hypot(mx, my) || 1;
      mx /= ml;
      my /= ml;
      const k = Math.min(1.8, 1 / Math.max(0.55, mx * n1[0] + my * n1[1]));
      normals[i] = [mx * k, my * k];
    }
    const base = pos.length / 3;
    let total = 0;
    for (let i = 1; i < n; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    // type et longueur totale dans le même flottant : type + 4 × longueur (le shader en tire les passages piétons aux extrémités)
    const packed = type + 4 * Math.round(total);
    let u = uOffset;
    for (let i = 0; i < n; i++) {
      if (i > 0) u += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const [nx, ny] = normals[i];
      pos.push(pts[i][0] + nx * half, pts[i][1] + ny * half, z, pts[i][0] - nx * half, pts[i][1] - ny * half, z);
      att.push(u, 1, packed, width, u, -1, packed, width);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  };
  const lines = roads.map((r) => {
    const pts = [];
    for (let i = 0; i < r.r.length; i += 2) pts.push([r.r[i] / 10, r.r[i + 1] / 10]);
    return { k: r.k, pts };
  });
  // trottoirs sous les chaussées carrossables
  for (const l of lines) if (l.k >= 1 && l.k <= 5 && l.pts.length > 1) addRibbon(l.pts, ROAD_WIDTH[l.k] / 2 + SIDEWALK_M, 0.03, 1, ROAD_WIDTH[l.k], 0);
  for (const l of lines) {
    if (l.pts.length < 2) continue;
    const w = ROAD_WIDTH[l.k];
    const type = l.k === 7 ? 2 : l.k === 8 ? 3 : 0;
    addRibbon(l.pts, w / 2, 0.05, type, w, 0);
  }
  return { pos: new Float32Array(pos), att: new Float32Array(att), idx: new Uint32Array(idx) };
}
