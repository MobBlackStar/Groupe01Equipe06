import { isEmbedded } from '../../../lib/embed.js';
// 💡 Concept & Analogie : Comme un théâtre de marionnettes monté DANS la carte : MapLibre dessine le sol, les routes et les textes, et ce calque ajoute, sur la même scène, les immeubles, les arbres, les oiseaux et les balises, avec sa propre lumière.
// 🔄 Comparaison React / Flutter : Un « CustomLayer » MapLibre est l'équivalent d'un `CustomPainter` : on reçoit le contexte graphique (WebGL2) et la matrice de la caméra, et on dessine à la main.
// 🎯 À retenir pour la soutenance : "Zéro bibliothèque 3D : WebGL2 brut, une dizaine de dessins par image, animation limitée à 30 images/s et coupée quand l'onglet est masqué."

import { mapSun } from '../sun.js';
import { paletteFor, lightDirection } from './timeOfDay.js';
import { MAP_CONFIG } from '../mapStyle.js';
import {
  BUILDING_VS, BUILDING_FS, TREE_VS, TREE_FS, PROP_VS, PROP_FS, BIRD_VS, BIRD_FS, BEACON_VS, BEACON_FS, ROAD_VS, ROAD_FS,
  SHADOW_FS, GROUND_VS, GROUND_FS,
} from './shaders.js';
import { buildBuildingMesh, buildRoadMesh, prism, icosphere, palm, bird, column, quad, buildTreeInstances, buildBirds } from './geometry.js';

const M_LAT = 111320;
export const WORLD3D_LAYER_ID = 'world3d';

function compile(gl, type, src, name) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`[world3d] shader ${name} : ${log}`);
  }
  return sh;
}

function program(gl, vs, fs, name, attribs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, `${name}.vs`));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, `${name}.fs`));
  Object.entries(attribs).forEach(([n, loc]) => gl.bindAttribLocation(p, loc, n));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`[world3d] link ${name} : ${gl.getProgramInfoLog(p)}`);
  const uniforms = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(p, i);
    uniforms[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u: uniforms };
}

/** Produit de deux matrices 4x4 colonne-majeure, en double précision. */
function mul(a, b) {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

/** Position de la caméra dans le repère local : le point où x, y et w de l'espace écran s'annulent tous les trois. */
function cameraPosition(m) {
  const A = [
    [m[0], m[4], m[8], -m[12]],
    [m[1], m[5], m[9], -m[13]],
    [m[3], m[7], m[11], -m[15]],
  ];
  const det3 = (a, b, c, d, e, f, g, h, i) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const D = det3(A[0][0], A[0][1], A[0][2], A[1][0], A[1][1], A[1][2], A[2][0], A[2][1], A[2][2]);
  if (Math.abs(D) < 1e-30) return [0, 0, 100];
  const x = det3(A[0][3], A[0][1], A[0][2], A[1][3], A[1][1], A[1][2], A[2][3], A[2][1], A[2][2]) / D;
  const y = det3(A[0][0], A[0][3], A[0][2], A[1][0], A[1][3], A[1][2], A[2][0], A[2][3], A[2][2]) / D;
  const z = det3(A[0][0], A[0][1], A[0][3], A[1][0], A[1][1], A[1][3], A[2][0], A[2][1], A[2][3]) / D;
  return [x, y, z];
}

function buf(gl, target, data, usage = gl.STATIC_DRAW) {
  const b = gl.createBuffer();
  gl.bindBuffer(target, b);
  gl.bufferData(target, data, usage);
  return b;
}

/**
 * Crée le calque personnalisé MapLibre du monde 3D.
 * @param {object} maplibregl - module maplibre-gl (pour MercatorCoordinate)
 * @param {object} data - monde pré-calculé (décimètres autour de l'ESSECT)
 */
export function createWorld3DLayer(maplibregl, data) {
  const state = {
    ok: false,
    map: null,
    gl: null,
    timer: 0,
    sun: mapSun(),
    pal: null,
    night: 0,
    shadowsOn: !isMobileOrEmbed,
    shadowDirty: true,
    shadowCenter: null,
    shadowHalf: 0,
    shadowL: null,
    lightVP: new Float32Array(16),
    shadowRedraws: 0,
    beaconCount: 0,
    pendingBeacons: null,
    stats: {},
  };
  state.pal = paletteFor(state.sun.altitudeDeg);
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4) || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const isMobileOrEmbed = isEmbedded() || (typeof window !== 'undefined' && (window.innerWidth < 768 || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024)));
  const cullDistanceM = isMobileOrEmbed ? 650 : undefined;

  const origin = MAP_CONFIG.ESSECT_COORDS;
  const merc = maplibregl.MercatorCoordinate.fromLngLat(origin, 0);
  const mScale = merc.meterInMercatorCoordinateUnits();
  const kLng = Math.cos((origin[1] * Math.PI) / 180) * M_LAT;
  const toLocal = (lng, lat) => [(lng - origin[0]) * kLng, (lat - origin[1]) * M_LAT];

  const G = {}; // ressources GPU
  // MapLibre garde en cache l'état GL (buffer lié, programme...). Toute modification faite hors de son appel `render`
  // doit lui être signalée, sinon ses propres calques (piliers, routes) se dessinent avec un état périmé.
  const markDirty = () => {
    try {
      state.map.painter.context.setDirty();
    } catch {
      /* API interne indisponible : sans effet */
    }
  };

  const layer = {
    id: WORLD3D_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      try {
        const t0 = performance.now();
        state.map = map;
        state.gl = gl;
        if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) throw new Error('WebGL2 requis');

        G.bld = program(gl, BUILDING_VS, BUILDING_FS, 'building', { aPos: 0, aMisc: 1, aNrm: 2 });
        G.tree = program(gl, TREE_VS, TREE_FS, 'tree', { aPos: 0, aNrm: 1, aAux: 2, iPos: 3, iPar: 4 });
        G.prop = program(gl, PROP_VS, PROP_FS, 'prop', { aPos: 0, aNrm: 1, iA: 3, iB: 4 });
        G.bird = program(gl, BIRD_VS, BIRD_FS, 'bird', { aPos: 0, iA: 3, iB: 4 });
        G.beacon = program(gl, BEACON_VS, BEACON_FS, 'beacon', { aPos: 0, iPos: 3, iCol: 4 });
        G.road = program(gl, ROAD_VS, ROAD_FS, 'road', { aPos: 0, aRd: 1 });
        G.ground = program(gl, GROUND_VS, GROUND_FS, 'ground', { aPos: 0 });
        // passes d'ombre : mêmes sommets que le rendu, mais aucun calcul de couleur
        G.shBld = program(gl, BUILDING_VS, SHADOW_FS, 'shadowBuilding', { aPos: 0, aMisc: 1, aNrm: 2 });
        G.shTree = program(gl, TREE_VS, SHADOW_FS, 'shadowTree', { aPos: 0, aNrm: 1, aAux: 2, iPos: 3, iPar: 4 });
        G.shProp = program(gl, PROP_VS, SHADOW_FS, 'shadowProp', { aPos: 0, aNrm: 1, iA: 3, iB: 4 });

        // carte d'ombres : texture de profondeur à comparaison matérielle (filtrage 2x2 gratuit), 2048² (1024² sur mobile)
        G.shRes = lowEnd ? 1024 : 2048;
        G.shTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, G.shTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, G.shRes, G.shRes, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
        G.shFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, G.shFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, G.shTex, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer d ombre incomplet');
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // quad du sol (multiplicatif)
        G.groundVAO = gl.createVertexArray();
        gl.bindVertexArray(G.groundVAO);
        buf(gl, gl.ARRAY_BUFFER, quad().pos);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        // --- chaussées et trottoirs
        const rm = buildRoadMesh(data.roads || []);
        G.roadVAO = gl.createVertexArray();
        gl.bindVertexArray(G.roadVAO);
        buf(gl, gl.ARRAY_BUFFER, rm.pos);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        buf(gl, gl.ARRAY_BUFFER, rm.att);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        buf(gl, gl.ELEMENT_ARRAY_BUFFER, rm.idx);
        G.roadCount = rm.idx.length;

        // --- immeubles
        const bm = buildBuildingMesh(data.buildings, cullDistanceM);
        G.bldVAO = gl.createVertexArray();
        gl.bindVertexArray(G.bldVAO);
        buf(gl, gl.ARRAY_BUFFER, bm.pos);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        buf(gl, gl.ARRAY_BUFFER, bm.misc);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        buf(gl, gl.ARRAY_BUFFER, bm.nrm);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.BYTE, true, 0, 0);
        G.bldIdx = buf(gl, gl.ELEMENT_ARRAY_BUFFER, bm.idx);
        G.bldCount = bm.idx.length;

        // --- maillage + instances générique
        const meshVAO = (mesh, instBuf, instAttrs, stride) => {
          const vao = gl.createVertexArray();
          gl.bindVertexArray(vao);
          buf(gl, gl.ARRAY_BUFFER, mesh.pos);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
          if (mesh.nrm) {
            buf(gl, gl.ARRAY_BUFFER, mesh.nrm);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
          }
          if (mesh.aux) {
            buf(gl, gl.ARRAY_BUFFER, mesh.aux);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
          }
          if (mesh.idx) buf(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
          gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
          instAttrs.forEach(([loc, size, offset]) => {
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4);
            gl.vertexAttribDivisor(loc, 1);
          });
          return { vao, count: mesh.idx ? mesh.idx.length : mesh.count };
        };

        // --- arbres
        const trees = buildTreeInstances(data.trees, cullDistanceM);
        const keep = lowEnd ? 0.55 : 1;
        G.treeInst = buf(gl, gl.ARRAY_BUFFER, trees.round);
        G.palmInst = buf(gl, gl.ARRAY_BUFFER, trees.palms);
        G.roundCount = Math.floor(trees.roundCount * keep);
        G.palmCount = Math.floor(trees.palmCount * keep);
        const treeAttrs = [[3, 3, 0], [4, 4, 3]];
        G.canopy = meshVAO(icosphere(), G.treeInst, treeAttrs, 7);
        G.trunk = meshVAO(prism(6), G.treeInst, treeAttrs, 7);
        G.palm = meshVAO(palm(), G.palmInst, treeAttrs, 7);

        // --- accessoires de toit
        const tanks = [];
        const boxes = [];
        bm.props.forEach((p) => (p.shape === 'tank' ? tanks : boxes).push(p.x, p.y, p.z, p.rot, p.sx, p.sy, p.sz, p.color));
        G.tankInst = buf(gl, gl.ARRAY_BUFFER, new Float32Array(tanks));
        G.boxInst = buf(gl, gl.ARRAY_BUFFER, new Float32Array(boxes));
        G.tankCount = tanks.length / 8;
        G.boxCount = boxes.length / 8;
        const propAttrs = [[3, 4, 0], [4, 4, 4]];
        G.tank = meshVAO(prism(10), G.tankInst, propAttrs, 8);
        G.box = meshVAO(prism(4, Math.PI / 4), G.boxInst, propAttrs, 8);

        // --- oiseaux
        const birds = buildBirds(lowEnd ? 14 : 42, data.radiusM || 1800);
        G.birdInst = buf(gl, gl.ARRAY_BUFFER, birds);
        G.birdCount = birds.length / 8;
        G.birdMesh = meshVAO(bird(), G.birdInst, propAttrs, 8);

        // --- balises (instances écrites par setBeacons)
        G.beaconInst = gl.createBuffer();
        const beaconAttrs = [[3, 3, 0], [4, 4, 3]];
        G.column = meshVAO(column(), G.beaconInst, beaconAttrs, 7);
        G.ring = meshVAO(quad(), G.beaconInst, beaconAttrs, 7);

        gl.bindVertexArray(null);
        state.ok = true;
        state.stats = {
          buildings: data.buildings.length,
          triangles: Math.round(bm.idx.length / 3),
          trees: G.roundCount + G.palmCount,
          rooftopProps: G.tankCount + G.boxCount,
          birds: G.birdCount,
          lowEnd,
          buildMs: Math.round(performance.now() - t0),
        };
      } catch (e) {
        console.warn('[Radar] Calque 3D WebGL2 indisponible, retour aux volumes simples de la carte :', e);
        state.ok = false;
      }
      try {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      } catch {
        /* contexte perdu */
      }
      markDirty();
    },

    render(gl, matrix) {
      try {
        draw(gl, matrix);
      } catch (e) {
        // une exception ici interromprait le dessin de TOUS les calques suivants (routes, piliers, textes) : on l'isole
        if (!state.failedOnce) console.warn('[Radar] Erreur de rendu du calque 3D :', e);
        state.failedOnce = true;
        try {
          gl.bindVertexArray(null);
          gl.disable(gl.BLEND);
          gl.depthMask(true);
        } catch {
          /* contexte perdu */
        }
      }
    },
  };

  function draw(gl, matrix) {
      if (!state.ok || !state.map) return;
      const map = state.map;
      if (state.pendingBeacons) {
        // les données des balises sont envoyées ICI (dans le rendu), jamais depuis un gestionnaire d'événement
        gl.bindBuffer(gl.ARRAY_BUFFER, G.beaconInst);
        gl.bufferData(gl.ARRAY_BUFFER, state.pendingBeacons, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        state.beaconCount = state.pendingBeacons.length / 7;
        state.pendingBeacons = null;
      }
      if (map.getZoom() < 14.2) return;
      if (import.meta.env.DEV && globalThis.__w3dSkip && globalThis.__w3dSkip.all) return;

      // matrice locale (mètres : est, nord, haut) -> écran, en double précision
      const L = new Float64Array([mScale, 0, 0, 0, 0, -mScale, 0, 0, 0, 0, mScale, 0, merc.x, merc.y, merc.z, 1]);
      const mvp = mul(matrix, L);
      const mvp32 = new Float32Array(mvp);
      const cam = cameraPosition(mvp);

      const pal = state.pal;
      const sunDir = lightDirection(state.sun); // soleil, ou lune la nuit : c'est elle qui projette les ombres
      const night = Math.max(state.night, pal.night);
      const time = (performance.now() / 1000) % 3600;
      const skipQA = (import.meta.env.DEV && globalThis.__w3dSkip) || {};
      const shadowsActive = state.shadowsOn && !skipQA.shadows;

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);

      const setCommon = (P) => {
        const u = P.u;
        if (u.uMVP) gl.uniformMatrix4fv(u.uMVP, false, mvp32);
        if (u.uCam) gl.uniform3f(u.uCam, cam[0], cam[1], cam[2]);
        if (u.uSun) gl.uniform3f(u.uSun, sunDir[0], sunDir[1], sunDir[2]);
        // soleil chaud, ombre froide (couleurs complémentaires), rebond chaud du sol
        if (u.uSunCol) gl.uniform3f(u.uSunCol, pal.sun[0], pal.sun[1], pal.sun[2]);
        if (u.uAmb) gl.uniform3f(u.uAmb, pal.amb[0], pal.amb[1], pal.amb[2]);
        if (u.uGround) gl.uniform3f(u.uGround, pal.ground[0], pal.ground[1], pal.ground[2]);
        if (u.uFogCol) gl.uniform3f(u.uFogCol, pal.fog[0], pal.fog[1], pal.fog[2]); // le jour : crème #FAF3E6 en linéaire
        if (u.uFogDen) gl.uniform1f(u.uFogDen, 0.00062);
        if (u.uNight) gl.uniform1f(u.uNight, night);
        if (u.uTime) gl.uniform1f(u.uTime, time);
        if (u.uShadow) {
          gl.uniform1i(u.uShadow, 5);
          gl.uniformMatrix4fv(u.uLightVP, false, state.lightVP);
          gl.uniform1f(u.uShadowRes, G.shRes);
          gl.uniform1f(u.uShadowOn, shadowsActive ? 1 : 0);
        }
      };

      // carte d'ombres : mise à jour seulement si besoin (le centre a bougé, le soleil a tourné, le zoom a changé)
      if (shadowsActive) updateShadow(gl, map, sunDir);
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, G.shTex);
      gl.activeTexture(gl.TEXTURE0);

      const skip = (import.meta.env.DEV && globalThis.__w3dSkip) || {}; // hook QA : désactiver une passe pour isoler un défaut

      // 0. chaussées : à plat, sous tout le reste, sans écrire la profondeur (les tracés de la carte restent visibles par-dessus)
      if (G.roadCount && !skip.roads) {
        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(G.road.p);
        setCommon(G.road);
        gl.bindVertexArray(G.roadVAO);
        gl.drawElements(gl.TRIANGLES, G.roadCount, gl.UNSIGNED_INT, 0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
      }

      // 0b. sol multiplicatif : ombres portées sur le fond de carte + teinte de l'heure
      if (!skip.ground) {
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.DST_COLOR, gl.ZERO);
        gl.useProgram(G.ground.p);
        setCommon(G.ground);
        gl.uniform1f(G.ground.u.uGroundHalf, 2300);
        gl.uniform3f(G.ground.u.uTint, pal.tint[0], pal.tint[1], pal.tint[2]);
        const cold = 1 - night * 0.5; // l'ombre est froide le jour, presque neutre la nuit (tout est déjà sombre)
        gl.uniform3f(G.ground.u.uShadowTint, 0.60 + 0.28 * (1 - cold), 0.66 + 0.22 * (1 - cold), 0.82 + 0.10 * (1 - cold));
        gl.bindVertexArray(G.groundVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
      }

      // 1. immeubles : un seul dessin
      gl.useProgram(G.bld.p);
      setCommon(G.bld);
      gl.bindVertexArray(G.bldVAO);
      if (!skip.buildings) gl.drawElements(gl.TRIANGLES, G.bldCount, gl.UNSIGNED_INT, 0);

      // 2. accessoires de toit
      gl.useProgram(G.prop.p);
      setCommon(G.prop);
      if (G.tankCount) {
        gl.bindVertexArray(G.tank.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, G.tank.count, gl.UNSIGNED_SHORT, 0, G.tankCount);
      }
      if (G.boxCount) {
        gl.bindVertexArray(G.box.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, G.box.count, gl.UNSIGNED_SHORT, 0, G.boxCount);
      }

      // 3. végétation
      gl.useProgram(G.tree.p);
      setCommon(G.tree);
      if (G.roundCount && !skip.trees) {
        gl.uniform1i(G.tree.u.uPart, 1);
        gl.bindVertexArray(G.trunk.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, G.trunk.count, gl.UNSIGNED_SHORT, 0, G.roundCount);
        gl.uniform1i(G.tree.u.uPart, 0);
        gl.bindVertexArray(G.canopy.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, G.canopy.count, gl.UNSIGNED_SHORT, 0, G.roundCount);
      }
      if (G.palmCount) {
        gl.uniform1i(G.tree.u.uPart, 2);
        gl.bindVertexArray(G.palm.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, G.palm.count, gl.UNSIGNED_SHORT, 0, G.palmCount);
      }

      // 4. oiseaux
      gl.useProgram(G.bird.p);
      setCommon(G.bird);
      gl.bindVertexArray(G.birdMesh.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, G.birdMesh.count, G.birdCount);

      // 5. balises : lumière additive, sans écrire la profondeur
      if (state.beaconCount && !skip.beacons) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.useProgram(G.beacon.p);
        setCommon(G.beacon);
        gl.bindVertexArray(G.column.vao);
        gl.uniform1i(G.beacon.u.uPart, 2); // halo large d'abord (derrière), puis le noyau
        gl.drawElementsInstanced(gl.TRIANGLES, G.column.count, gl.UNSIGNED_SHORT, 0, state.beaconCount);
        gl.uniform1i(G.beacon.u.uPart, 0);
        gl.drawElementsInstanced(gl.TRIANGLES, G.column.count, gl.UNSIGNED_SHORT, 0, state.beaconCount);
        gl.uniform1i(G.beacon.u.uPart, 1);
        gl.bindVertexArray(G.ring.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, G.ring.count, state.beaconCount);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
      gl.bindVertexArray(null);
      if (import.meta.env.DEV) globalThis.__w3dDiag = { err: gl.getError(), depthRange: Array.from(gl.getParameter(gl.DEPTH_RANGE)), program: !!gl.getParameter(gl.CURRENT_PROGRAM), fb: !!gl.getParameter(gl.FRAMEBUFFER_BINDING) };

      // animation : ~30 images/s, jamais en arrière-plan, jamais si l'utilisateur demande moins de mouvement
      if (!reduceMotion && !state.timer) {
        state.timer = setTimeout(() => {
          state.timer = 0;
          if (!document.hidden && state.map) state.map.triggerRepaint();
        }, 32);
      }
  }

  /**
   * Carte d'ombres qui suit la caméra (technique de webgpu-lighting-atmosphere) : boîte orthographique le long de la lumière,
   * centrée sur le milieu de l'écran, recalée sur la grille des texels (aucun scintillement), redessinée UNIQUEMENT si le centre
   * a bougé de plus de 22 % de la demi-largeur, si le zoom change de palier, si la lumière tourne de plus de 0,2° ou si les
   * données changent. Au repos : 0 ms.
   */
  function updateShadow(gl, map, L) {
    const zoom = map.getZoom();
    const half = Math.round(Math.max(70, Math.min(420, 80 * 2 ** (17.8 - zoom))) / 10) * 10; // m, par paliers
    const c = map.getCenter();
    const [cx, cy] = toLocal(c.lng, c.lat);
    const moved = state.shadowCenter ? Math.hypot(cx - state.shadowCenter[0], cy - state.shadowCenter[1]) : Infinity;
    const turned = state.shadowL ? Math.acos(Math.min(1, L[0] * state.shadowL[0] + L[1] * state.shadowL[1] + L[2] * state.shadowL[2])) : Infinity;
    if (!state.shadowDirty && half === state.shadowHalf && moved < 0.22 * half && turned < 0.0035) return;

    // base de la lumière : r (droite), u (haut), s (vers la lumière), r × u = s
    const up0 = Math.abs(L[2]) > 0.95 ? [0, 1, 0] : [0, 0, 1];
    let r = [up0[1] * L[2] - up0[2] * L[1], up0[2] * L[0] - up0[0] * L[2], up0[0] * L[1] - up0[1] * L[0]];
    const rl = Math.hypot(...r);
    r = r.map((v) => v / rl);
    const u = [L[1] * r[2] - L[2] * r[1], L[2] * r[0] - L[0] * r[2], L[0] * r[1] - L[1] * r[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

    // recalage sur la grille des texels, dans le repère de la lumière
    const texel = (2 * half) / G.shRes;
    const c3 = [cx, cy, 0];
    const dr = Math.round(dot(r, c3) / texel) * texel - dot(r, c3);
    const du = Math.round(dot(u, c3) / texel) * texel - dot(u, c3);
    const cs = [cx + r[0] * dr + u[0] * du, cy + r[1] * dr + u[1] * du, r[2] * dr + u[2] * du];

    const D = 450; // demi-profondeur de la boîte (m)
    const m = state.lightVP;
    m[0] = r[0] / half; m[1] = u[0] / half; m[2] = -L[0] / D; m[3] = 0;
    m[4] = r[1] / half; m[5] = u[1] / half; m[6] = -L[1] / D; m[7] = 0;
    m[8] = r[2] / half; m[9] = u[2] / half; m[10] = -L[2] / D; m[11] = 0;
    m[12] = -dot(r, cs) / half; m[13] = -dot(u, cs) / half; m[14] = dot(L, cs) / D; m[15] = 1;

    // --- passe de profondeur
    const prevFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevVP = gl.getParameter(gl.VIEWPORT);
    const prevDR = gl.getParameter(gl.DEPTH_RANGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.shFBO);
    gl.viewport(0, 0, G.shRes, G.shRes);
    gl.depthRange(0, 1); // la profondeur stockée doit correspondre à `s.z` lu par le shader
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.colorMask(false, false, false, false);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2, 4);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(G.shBld.p);
    gl.uniformMatrix4fv(G.shBld.u.uMVP, false, m);
    gl.bindVertexArray(G.bldVAO);
    gl.drawElements(gl.TRIANGLES, G.bldCount, gl.UNSIGNED_INT, 0);

    gl.useProgram(G.shProp.p);
    gl.uniformMatrix4fv(G.shProp.u.uMVP, false, m);
    if (G.tankCount) {
      gl.bindVertexArray(G.tank.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, G.tank.count, gl.UNSIGNED_SHORT, 0, G.tankCount);
    }
    if (G.boxCount) {
      gl.bindVertexArray(G.box.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, G.box.count, gl.UNSIGNED_SHORT, 0, G.boxCount);
    }

    gl.useProgram(G.shTree.p);
    gl.uniformMatrix4fv(G.shTree.u.uMVP, false, m);
    gl.uniform1f(G.shTree.u.uTime, 0); // ombre de feuillage figée : pas de balancement dans la carte mise en cache
    if (G.roundCount) {
      gl.uniform1i(G.shTree.u.uPart, 1);
      gl.bindVertexArray(G.trunk.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, G.trunk.count, gl.UNSIGNED_SHORT, 0, G.roundCount);
      gl.uniform1i(G.shTree.u.uPart, 0);
      gl.bindVertexArray(G.canopy.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, G.canopy.count, gl.UNSIGNED_SHORT, 0, G.roundCount);
    }
    if (G.palmCount) {
      gl.uniform1i(G.shTree.u.uPart, 2);
      gl.bindVertexArray(G.palm.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, G.palm.count, gl.UNSIGNED_SHORT, 0, G.palmCount);
    }

    gl.bindVertexArray(null);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.depthRange(prevDR[0], prevDR[1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFB);
    gl.viewport(prevVP[0], prevVP[1], prevVP[2], prevVP[3]);

    state.shadowCenter = [cx, cy];
    state.shadowHalf = half;
    state.shadowL = L;
    state.shadowDirty = false;
    state.shadowRedraws += 1;
  }

  layer.onRemove = function onRemove() {
    clearTimeout(state.timer);
    state.timer = 0;
    state.ok = false;
  };

  return {
    layer,
    get ok() {
      return state.ok;
    },
    stats: () => ({ ...state.stats, beacons: state.beaconCount, sun: state.sun, night: Math.max(state.night, state.pal.night), shadowRes: G.shRes, shadowRedraws: state.shadowRedraws, shadowHalfWidthM: state.shadowHalf }),
    /** Balises : [{ lng, lat, color: '#RRGGBB' }] */
    setBeacons(list) {
      if (!state.ok) return;
      const arr = new Float32Array(list.length * 7);
      list.forEach((b, i) => {
        const [x, y] = toLocal(b.lng, b.lat);
        const hex = (b.color || '#DA0711').replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const bl = parseInt(hex.slice(4, 6), 16) / 255;
        arr.set([x, y, b.height || 85, r, g, bl, (i * 0.37) % 1], i * 7);
      });
      state.pendingBeacons = arr;
      state.map?.triggerRepaint();
    },
    /** Soleil et ambiance (QA / futur sélecteur d'heure) : azimut (° depuis le nord), hauteur (°), nuit 0..1 */
    setSun(azimuthDeg, altitudeDeg, real = true) {
      state.sun = { azimuthDeg, altitudeDeg, real };
      state.pal = paletteFor(altitudeDeg);
      state.shadowDirty = true;
      state.map?.triggerRepaint();
      return state.pal;
    },
    palette: () => state.pal,
    /** Active / coupe les ombres portées (QA, ou repli si un appareil peine). */
    setShadows(on) {
      state.shadowsOn = Boolean(on);
      state.map?.triggerRepaint();
    },
    setNight(v) {
      state.night = v;
      state.map?.triggerRepaint();
    },
  };
}
