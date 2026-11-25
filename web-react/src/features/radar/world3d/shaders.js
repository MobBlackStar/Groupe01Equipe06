// 💡 Concept & Analogie : Comme un peintre en décor qui ne pose pas de photos mais dessine chaque fenêtre, volet et feuille avec des règles de calcul, ces shaders fabriquent la ville à la volée sur la carte graphique.
// 🔄 Comparaison React / Flutter : Équivalent des « fragment shaders » Flutter (FragmentProgram) : un petit programme exécuté pour chaque pixel ; ici en GLSL ES 3.0 (WebGL2), sans aucune image ni modèle 3D.
// 🎯 À retenir pour la soutenance : "Aucune texture : les façades (fenêtres, volets verts, auvents rayés), le feuillage et le ciel sont calculés. Même graine => même rendu, donc la carte est stable d'un chargement à l'autre."

/** Bibliothèque commune : bruit, brume, étalonnage. */
const COMMON = /* glsl */ `
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float vnoise3(vec3 p){ return mix(vnoise(p.xy + p.z * 7.13), vnoise(p.yz * 1.17 + p.x * 3.71 + 11.), .5); }

// Brume : épaisseur de l'air selon la distance, un peu plus dense près du sol
vec3 applyFog(vec3 col, vec3 pos, vec3 cam, vec3 fogCol, float den){
  float d = length(pos - cam);
  float h = max(pos.z, 0.);
  float f = 1. - exp(-pow(d * den, 1.6) * (1.15 - .35 * smoothstep(0., 60., h)));
  return mix(col, fogCol, clamp(f, 0., .96));
}

// Étalonnage doux : épaule filmique qui garde la crème lumineuse et les rouges Griddle saturés
vec3 tone(vec3 c){
  vec3 g = pow(max(c, vec3(0.)), vec3(1. / 2.2));              // la carte attend du sRGB
  vec3 hi = .90 + .10 * (1. - exp(-(g - .90) / .10));          // épaule douce : les hautes lumières ne brûlent pas
  g = mix(g, hi, step(.90, g));
  float l = dot(g, vec3(.299, .587, .114));
  return mix(vec3(l), g, 1.10);                                // un soupçon de saturation (rouge/moutarde Griddle)
}
`;

/** Lecture de la carte d'ombres (sampler à comparaison : le matériel filtre 2x2 par lecture ; on en fait 4 décalées). */
const SHADOW_GLSL = /* glsl */ `
uniform highp sampler2DShadow uShadow;
uniform mat4 uLightVP;
uniform float uShadowOn, uShadowRes;
float shadowFactor(vec3 p, vec3 n){
  if (uShadowOn < .5) return 1.;
  vec4 q = uLightVP * vec4(p + n * .35, 1.);                 // la position est décalée le long de la normale : pas d'acné
  float edge = max(abs(q.x), abs(q.y));
  vec3 s = q.xyz * .5 + .5;
  if (edge >= 1. || s.z >= 1. || s.z <= 0.) return 1.;       // hors de la carte : éclairé
  float px = 1. / uShadowRes;
  float z = s.z - .0006;
  float sum = texture(uShadow, vec3(s.xy + vec2(-.75, -.75) * px, z))
            + texture(uShadow, vec3(s.xy + vec2( .75, -.75) * px, z))
            + texture(uShadow, vec3(s.xy + vec2(-.75,  .75) * px, z))
            + texture(uShadow, vec3(s.xy + vec2( .75,  .75) * px, z));
  return mix(sum * .25, 1., smoothstep(.80, 1., edge));       // fondu sur les 20 % du bord : aucune couture visible
}`;

/** Passe d'ombre : profondeur seule, aucun calcul de pixel. */
export const SHADOW_FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 o;
void main(){ o = vec4(0.); }`;

// ---------------------------------------------------------------------------------------------
// Bâtiments : murs + toits (la façade est dessinée par le fragment shader)
// ---------------------------------------------------------------------------------------------

export const BUILDING_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
in vec3 aPos;
in vec4 aMisc;   // s (distance le long du mur), graine, catégorie, hauteur
in vec4 aNrm;    // normale (octets normalisés), w = 1 pour un toit
out vec3 vPos; out vec3 vN; out vec4 vMisc; out float vRoof;
void main(){
  vPos = aPos; vN = normalize(aNrm.xyz); vMisc = aMisc; vRoof = aNrm.w;
  gl_Position = uMVP * vec4(aPos, 1.);
}`;

export const BUILDING_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
uniform vec3 uCam, uSun, uSunCol, uAmb, uGround, uFogCol;
uniform float uFogDen, uNight, uTime;
${SHADOW_GLSL}
in vec3 vPos; in vec3 vN; in vec4 vMisc; in float vRoof;
out vec4 outColor;

// Rayures sans moiré : quand la période devient plus fine qu'un pixel, on fond vers la moyenne (anti-crénelage par dérivées)
float stripeAA(float x, float period){
  float w = fwidth(x) / period;
  float v = step(.5, fract(x / period));
  return mix(v, .5, smoothstep(.22, .7, w));
}
// Palettes Griddle : crème, sable, terre cuite, biscuit
vec3 plaster(float k, float seed){
  vec3 a, b;
  if (k < .5)       { a = vec3(1.0, .96, .88);  b = vec3(.96, .86, .70); }   // habitat : chaux et sable
  else if (k < 1.5) { a = vec3(.96, .80, .68);  b = vec3(.90, .66, .54); }   // institutions : terre cuite
  else if (k < 2.5) { a = vec3(.93, .90, .84);  b = vec3(.86, .82, .74); }   // annexes
  else              { a = vec3(.97, .90, .76);  b = vec3(.88, .78, .60); }   // autres
  return mix(a, b, seed);
}

void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(uCam - vPos);
  float seed = vMisc.y, kind = vMisc.z, h = vMisc.w;
  vec3 albedo; float glass = 0.; float emis = 0.; float ao = 1.;

  bool landmark = kind > 3.5;
  if (vRoof > .5 && landmark) {
    // ESSECT vu du ciel : toit rayé rouge Griddle / crème, comme un auvent géant, avec un liseré moutarde
    float st = stripeAA(vPos.x * .71 + vPos.y * .71, 4.2);
    albedo = mix(vec3(.84, .12, .10), vec3(.98, .94, .86), st);
    float n = vnoise(vPos.xy * 2.1);
    albedo *= .94 + .1 * n;
    emis = .10 * uNight;
    ao = 1.;
  } else if (vRoof > .5) {
    // Toit-terrasse : gravillon, auvents d'étanchéité, rebord clair
    float n = vnoise(vPos.xy * 1.3) * .6 + vnoise(vPos.xy * 5.1) * .4;
    float rk = hash11(seed * 17.);
    vec3 tar = mix(vec3(.80, .77, .71), vec3(.90, .87, .80), hash11(seed * 91.));      // dalle béton claire
    if (rk > .93) tar = mix(vec3(.50, .52, .55), vec3(.60, .62, .64), n);              // étanchéité grise
    else if (rk > .84) tar = mix(vec3(.78, .38, .24), vec3(.86, .50, .32), n);         // quelques toits en tuiles
    albedo = tar * (.90 + .16 * n);
    // joints de dalle, très fins (fondus au loin)
    float joint = min(stripeAA(vPos.x, 3.2), stripeAA(vPos.y, 3.2)) ;
    albedo *= .96 + .06 * joint;
    ao = .95;
  } else {
    float s = vMisc.x, t = vPos.z;
    float floorH = kind < 1.5 && kind > .5 ? 3.7 : 3.15;
    float cw = (kind < 1.5 && kind > .5 ? 3.3 : 2.7) + .7 * hash11(seed * 53.);
    float fi = floor(t / floorH), ci = floor(s / cw);
    vec2 f = vec2(fract(s / cw), fract(t / floorH));
    float cellSeed = hash21(vec2(ci + seed * 211., fi + seed * 37.));
    albedo = plaster(kind, seed);
    // Trainées de pluie et patine : donnent de l'âge sans texture
    float stain = vnoise(vec2(s * 1.7, t * .22) + seed * 9.);
    albedo *= .90 + .14 * stain;

    float topBand = smoothstep(h - 1.05, h - .55, t);       // corniche sombre puis liseré clair
    albedo = mix(albedo, albedo * .86, smoothstep(h - 1.5, h - 1.0, t));
    albedo = mix(albedo, albedo * 1.12, smoothstep(h - .5, h - .3, t));

    bool top = t > h - 1.0;
    if (fi < .5 && !top) {
      // Rez-de-chaussée : vitrine, auvent rayé ou porte
      bool shop = hash11(seed * 77.) > .42;
      if (shop) {
        float awn = smoothstep(.60, .64, f.y) * (1. - smoothstep(.80, .84, f.y));
        float stripe = stripeAA(s, .55);
        vec3 a1 = hash11(seed * 13.) > .5 ? vec3(.855, .027, .067) : vec3(1., .816, 0.); // rouge ou moutarde Griddle
        vec3 awning = mix(vec3(.98, .95, .88), a1, stripe);
        albedo = mix(albedo, awning, awn);
        float inVit = step(.08, f.x) * step(f.x, .92) * step(.08, f.y) * step(f.y, .56);
        if (inVit > .5) { glass = 1.; albedo = vec3(.10, .13, .16); emis = .6 * (.35 + uNight); }
        // bandeau d'enseigne
        float sign = step(.86, f.y) * step(f.y, .985);
        albedo = mix(albedo, albedo * .75 + vec3(.1, .02, .0), sign * .6);
      } else {
        float door = step(.30, f.x) * step(f.x, .70) * step(.0, f.y) * step(f.y, .72);
        albedo = mix(albedo, mix(vec3(.12, .30, .18), vec3(.07, .07, .08), step(.5, hash11(seed * 5.))), door);
        float win = step(.12, f.x) * step(f.x, .24) * step(.26, f.y) * step(f.y, .66);
        if (win * step(.5, hash21(vec2(ci, seed))) > .5) { glass = 1.; albedo = vec3(.12, .16, .20); }
      }
      // plinthe
      albedo *= mix(.78, 1., smoothstep(0., .5, t));
    } else if (!top) {
      // Étages : fenêtres, volets et balcons
      vec2 q = (f - vec2(.5, .56)) / vec2(.27, .24);
      float inWin = step(abs(q.x), 1.) * step(abs(q.y), 1.);
      float frame = step(abs(q.x), 1.18) * step(abs(q.y), 1.14);
      float sill = step(abs(q.x), 1.3) * step(.0, -q.y - .98) * step(-q.y - 1.18, .0);
      float variant = hash11(cellSeed * 91. + seed);
      float balcony = step(.78, hash11(seed * 7. + fi)) ;                 // un étage sur ~5 a un balcon filant
      albedo = mix(albedo, albedo * 1.14, frame * (1. - inWin));           // chambranle clair
      albedo = mix(albedo, albedo * .72, sill);
      if (inWin > .5) {
        if (variant < .26) {
          // volets persiennés (vert Griddle ou ardoise)
          vec3 sh = hash11(seed * 3.) > .45 ? vec3(.12, .42, .22) : vec3(.20, .26, .34);
          float slat = .78 + .22 * stripeAA(t, floorH / 22.);
          albedo = sh * slat;
        } else if (variant < .34) {
          albedo = vec3(.95, .93, .88) * (.85 + .15 * vnoise(vec2(s * 4., t * 2.))); // rideau tiré
          emis = .35 * uNight;
        } else {
          glass = 1.;
          float lit = step(1. - (.12 + .75 * uNight), hash21(vec2(ci * 1.7, fi * 3.1) + seed * 19.));
          emis = lit; // fenêtre allumée (chaude), seulement quand il fait sombre
          albedo = mix(vec3(.10, .14, .19), vec3(.95, .72, .38), lit);
        }
      }
      if (balcony > .5) {
        float slab = step(f.y, .075);
        float rail = step(.075, f.y) * step(f.y, .30) * stripeAA(s, .22) * .6;
        albedo = mix(albedo, albedo * .8, slab);
        albedo = mix(albedo, vec3(.10, .10, .11), rail * step(.04, abs(q.x) - .0));
      }
    }
    // Détail fondu avec la distance : quand une fenêtre fait moins d'un pixel, on tend vers la couleur moyenne du mur
    // (sinon la grille de fenêtres scintille en « poussière » au lieu de se lire comme une façade)
    float px = max(fwidth(s) / cw, fwidth(t) / floorH);
    float fade = smoothstep(.14, .5, px);
    albedo = mix(albedo, plaster(kind, seed) * .80, fade);
    glass *= 1. - fade;
    emis *= 1. - fade;
    if (landmark) {
      // ESSECT : pierre crème, pilastres rouges, grandes baies, bandeau moutarde lumineux en couronne
      float bay = 3.6, fl = 4.0;
      vec2 g = vec2(fract(s / bay), fract(t / fl));
      albedo = vec3(.97, .93, .84) * (.94 + .08 * stain);
      float pil = 1. - step(.16, g.x);
      albedo = mix(albedo, vec3(.80, .15, .11), pil);
      float crownBand = smoothstep(h - 1.7, h - 1.55, t) * (1. - smoothstep(h - .45, h - .35, t));
      glass = 0.; emis = 0.;
      if (pil < .5 && crownBand < .5 && t < h - 1.7) {
        float win = step(.26, g.x) * step(g.x, .92) * step(.16, g.y) * step(g.y, .84);
        if (win > .5) {
          glass = 1.;
          albedo = vec3(.09, .12, .16);
          emis = .18 + .95 * uNight;                       // salles de cours éclairées le soir
        }
      }
      albedo = mix(albedo, vec3(1., .80, 0.), crownBand);
      emis = max(emis, crownBand * (.25 + 1.1 * uNight));
      albedo *= mix(.62, 1., smoothstep(0., 3.5, t));      // pied du bâtiment assombri (contact avec le sol)
    }
    // Ambiance : le pied des murs est assombri par le sol et la rue
    ao = mix(.58, 1., smoothstep(0., 4.5, t)) * mix(.82, 1., smoothstep(0., 22., h));
  }

  albedo = pow(albedo, vec3(2.2)); // les teintes sont écrites en sRGB, la lumière se calcule en linéaire
  // --- lumière : soleil chaud, ombre froide (complémentaires), rebond du sol
  float ndl = max(dot(N, uSun), 0.);
  float wrap = max((dot(N, uSun) + .25) / 1.25, 0.);
  float sh = shadowFactor(vPos, N);
  vec3 sunL = uSunCol * mix(ndl, wrap, .35) * sh;
  vec3 skyL = mix(uGround, uAmb, N.z * .5 + .5) * ao;
  vec3 col = albedo * (sunL + skyL);
  if (glass > .5) {
    vec3 R = reflect(-V, N);
    float fres = pow(1. - max(dot(N, V), 0.), 3.);
    vec3 sky = mix(vec3(.55, .66, .78), vec3(.85, .80, .70), clamp(R.z * .5 + .3, 0., 1.));
    float spec = pow(max(dot(R, uSun), 0.), 70.);
    col = mix(col, sky * .75, .22 + .5 * fres) + uSunCol * spec * 1.4;
  }
  col += emis * vec3(1., .66, .32) * (.55 + uNight * 1.1);

  col = applyFog(col, vPos, uCam, uFogCol, uFogDen);
  col = tone(col);
  // dither léger contre les bandes dans la brume
  col += (hash21(gl_FragCoord.xy) - .5) / 255.;
  outColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------
// Végétation : canopées bruitées, troncs, palmiers (instanciés, balancés par le vent)
// ---------------------------------------------------------------------------------------------

export const TREE_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
uniform float uTime;
uniform int uPart;            // 0 canopée, 1 tronc, 2 palmier
in vec3 aPos;                 // sommet unitaire
in vec3 aNrm;
in float aAux;                // palmier : 0 tronc / 1 palme (paramètre le long de la palme dans aNrm.z non utilisé)
in vec3 iPos;                 // x, y (m) ; z = niveau du sol
in vec4 iPar;                 // échelle (rayon), graine, hauteur de tronc, variante
out vec3 vPos; out vec3 vN; out vec4 vPar; out vec3 vLocal; out float vAux;
${COMMON}
void main(){
  float r = iPar.x, seed = iPar.y, trunkH = iPar.z;
  vec3 p; vec3 n = aNrm;
  float sway = sin(uTime * 1.25 + seed * 6.283 + iPos.x * .07) * .5 + sin(uTime * 2.1 + seed * 11. + iPos.y * .09) * .25;
  if (uPart == 0) {
    // canopée : sphère bosselée, plus haute que large, un peu écrasée dessous
    float nz = vnoise3(aPos * 1.9 + seed * 17.);
    float lump = .78 + .5 * nz;
    vec3 q = aPos * lump;
    q.z = q.z * (aPos.z < 0. ? .55 : 1.) ;
    p = vec3(q.x * r * 1.02, q.y * r * 1.02, q.z * r * 1.15 + trunkH + r * .85);
    p.xy += vec2(sway * .16, sway * .10) * (p.z - trunkH) * .12; // le haut penche, pas le pied
    n = normalize(aNrm + (nz - .5) * .6);
  } else if (uPart == 1) {
    float taper = mix(1., .6, aPos.z);
    p = vec3(aPos.x * .20 * taper * (1. + r * .04), aPos.y * .20 * taper * (1. + r * .04), aPos.z * (trunkH + r * .6));
    p.xy += vec2(sway * .05, sway * .03) * aPos.z * aPos.z;
  } else {
    // palmier : tronc légèrement courbé + palmes qui retombent ; aAux = 0 tronc, 1 palme
    float H = iPar.z + r * 2.2;
    p = aPos * vec3(r * .9, r * .9, H);
    float bend = aPos.z * aPos.z;
    p.xy += vec2(sin(seed * 6.28), cos(seed * 6.28)) * bend * 1.1;
    float tip = aAux > .5 ? smoothstep(.0, 1., length(aPos.xy) * 2.5) : 0.;
    p.xy += vec2(sway, sway * .6) * (aAux > .5 ? .22 + tip * .5 : bend * .15);
  }
  vec3 world = p + vec3(iPos.xy, iPos.z);
  vPos = world; vN = n; vPar = iPar; vLocal = aPos; vAux = aAux;
  gl_Position = uMVP * vec4(world, 1.);
}`;

export const TREE_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
uniform vec3 uCam, uSun, uSunCol, uAmb, uGround, uFogCol;
uniform float uFogDen, uNight, uTime;
uniform int uPart;
${SHADOW_GLSL}
in vec3 vPos; in vec3 vN; in vec4 vPar; in vec3 vLocal; in float vAux;
out vec4 outColor;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(uCam - vPos);
  float seed = vPar.y;
  vec3 albedo; float trans = 0.;
  if (uPart == 1) {
    albedo = vec3(.36, .27, .19) * (.8 + .4 * vnoise(vPos.xy * 9.));
  } else {
    // feuillage : 4 verts de la palette Griddle (olive, feuille, vert tendre, jaune-vert)
    float pick = hash11(seed * 31.);
    vec3 base = pick < .25 ? vec3(.30, .44, .20) : pick < .55 ? vec3(.38, .53, .22) : pick < .82 ? vec3(.48, .60, .26) : vec3(.58, .64, .30);
    if (uPart == 2) base = mix(base, vec3(.30, .50, .24), .5);
    // grain de feuilles : paillettes claires/sombres
    float speck = vnoise3(vPos * 3.2 + seed * 5.) * .6 + vnoise3(vPos * 8.3) * .4;
    albedo = base * (.72 + .55 * speck);
    // orangers / fleurs : quelques arbres piquetés d'orange
    if (uPart == 0 && hash11(seed * 7.) > .88) {
      float d = step(.82, vnoise3(vPos * 5.1 + seed));
      albedo = mix(albedo, vec3(1., .55, .08), d);
    }
    // haut éclairé, dessous sombre
    float up = clamp(vLocal.z * .5 + .55, 0., 1.);
    if (uPart == 0) albedo *= mix(.62, 1.05, up);
    trans = pow(max(dot(-V, uSun), 0.), 3.5) * .35; // rétro-éclairage : bord jaune-vert translucide
  }
  albedo = pow(albedo, vec3(2.2));
  float ndl = max(dot(N, uSun), 0.);
  float wrap = max((dot(N, uSun) + .45) / 1.45, 0.);
  float sh = shadowFactor(vPos, N);
  vec3 sunL = uSunCol * wrap * sh;
  vec3 skyL = mix(uGround, uAmb, N.z * .5 + .5);
  vec3 col = albedo * (sunL + skyL) + albedo * vec3(.75, .9, .25) * trans * uSunCol * sh;
  col = applyFog(col, vPos, uCam, uFogCol, uFogDen);
  col = tone(col);
  col += (hash21(gl_FragCoord.xy + 3.) - .5) / 255.;
  outColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------
// Accessoires de toit (réservoirs, cages d'escalier), instanciés
// ---------------------------------------------------------------------------------------------

export const PROP_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
in vec3 aPos; in vec3 aNrm;
in vec4 iA;  // x, y, z (base), rotation
in vec4 iB;  // rayon/largeur x, y, hauteur, couleur
out vec3 vPos; out vec3 vN; out float vCol;
void main(){
  float c = cos(iA.w), s = sin(iA.w);
  vec3 q = vec3(aPos.x * iB.x, aPos.y * iB.y, aPos.z * iB.z);
  vec3 w = vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z) + iA.xyz;
  vN = vec3(aNrm.x * c - aNrm.y * s, aNrm.x * s + aNrm.y * c, aNrm.z);
  vPos = w; vCol = iB.w;
  gl_Position = uMVP * vec4(w, 1.);
}`;

export const PROP_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
uniform vec3 uCam, uSun, uSunCol, uAmb, uGround, uFogCol;
uniform float uFogDen;
${SHADOW_GLSL}
in vec3 vPos; in vec3 vN; in float vCol;
out vec4 outColor;
void main(){
  vec3 N = normalize(vN);
  vec3 albedo = vCol < .5 ? vec3(.86, .84, .80) : vCol < 1.5 ? vec3(.18, .30, .52) : vec3(.88, .52, .34);
  albedo = pow(albedo, vec3(2.2));
  vec3 col = albedo * (uSunCol * max(dot(N, uSun), 0.) * shadowFactor(vPos, N) + mix(uGround, uAmb, N.z * .5 + .5));
  col = applyFog(col, vPos, uCam, uFogCol, uFogDen);
  col = tone(col);
  outColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------
// Oiseaux : V qui bat des ailes, trajectoire calculée sur le GPU
// ---------------------------------------------------------------------------------------------

export const BIRD_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
uniform float uTime;
in vec3 aPos;
in vec4 iA;  // centre x, y, rayon, altitude
in vec4 iB;  // vitesse, phase, taille, -
out vec3 vPos; out float vShade;
void main(){
  float a = uTime * iB.x + iB.y;
  vec2 c = iA.xy + vec2(cos(a), sin(a)) * iA.z;
  vec2 dir = vec2(-sin(a), cos(a));                    // tangente (sens anti-horaire)
  float z = iA.w + sin(uTime * .6 + iB.y * 3.) * 4.;
  float flap = sin(uTime * 7. + iB.y * 9.) * .55;
  vec3 q = aPos * iB.z;
  q.z += abs(aPos.x) * flap * iB.z * 1.1;               // les bouts d'ailes montent et descendent
  vec3 w = vec3(c + vec2(dir.x * q.y + dir.y * q.x, dir.y * q.y - dir.x * q.x), z + q.z);
  vPos = w; vShade = .55 + .35 * flap;
  gl_Position = uMVP * vec4(w, 1.);
}`;

export const BIRD_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
uniform vec3 uCam, uFogCol;
uniform float uFogDen;
in vec3 vPos; in float vShade;
out vec4 outColor;
void main(){
  vec3 col = vec3(.16, .15, .16) * vShade + vec3(.05);
  col = applyFog(col, vPos, uCam, uFogCol, uFogDen * 1.4);
  outColor = vec4(tone(col), 1.);
}`;

// ---------------------------------------------------------------------------------------------
// Balises des commerces : colonne de lumière + anneau pulsé au sol (additif)
// ---------------------------------------------------------------------------------------------

export const BEACON_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
uniform float uTime;
uniform int uPart;      // 0 colonne, 1 anneau au sol, 2 halo, 3 anneau flottant
uniform float uSel, uHover, uSweep, uRingK, uWalk;
uniform vec3 uCam;
in vec3 aPos;           // colonne : rayon unitaire, z 0..1 ; anneau : quad -1..1
in vec3 iPos;           // x, y, hauteur de colonne
in vec4 iCol;           // rgb + phase
out vec3 vPos; out vec3 vLocal; out vec4 vCol; out float vH; out float vSel; out float vPing;
void main(){
  float id = float(gl_InstanceID);
  float sel = max(id == uSel ? 1. : 0., id == uHover ? .6 : 0.);
  // « ping » : la balise s'illumine quand le balayage radar passe sur elle (intensité exp(-k * temps écoulé))
  float ang = atan(iPos.x, iPos.y);
  float lag = mod(uSweep - ang, 6.28318);
  float ping = id < .5 ? 0. : exp(-lag * 1.6);
  vec3 w;
  // taille plancher à l'écran : vue de loin, la colonne garde ~3 px de large (la lueur reste lisible)
  float far = max(1., length(uCam.xy - iPos.xy) / 700.);
  float grow = (1. + .55 * sel) * far * mix(1., .3, uWalk);
  if (uPart == 0 || uPart == 2) {
    float pulse = 1. + .07 * sin(uTime * 2.2 + iCol.w * 6.) + .25 * ping;
    float rad = uPart == 0 ? 2.8 : 8.5;   // noyau lumineux + halo large
    w = vec3(iPos.xy + aPos.xy * rad * pulse * grow, aPos.z * iPos.z * (1. + .15 * sel));
  } else if (uPart == 1) {
    w = vec3(iPos.xy + aPos.xy * 15. * grow, .25);
  } else {
    // deux anneaux horizontaux qui flottent et respirent le long de la colonne
    float bob = sin(uTime * 1.7 + iCol.w * 6.283 + uRingK * 2.4) * 3.5;
    float z = iPos.z * (uRingK < .5 ? .62 : .36) + bob;
    float r = (uRingK < .5 ? 9.5 : 7.) * grow * (1. + .18 * ping);
    w = vec3(iPos.xy + aPos.xy * r, z);
  }
  vPos = w; vLocal = aPos; vCol = iCol; vH = iPos.z; vSel = sel; vPing = ping;
  gl_Position = uMVP * vec4(w, 1.);
}`;

export const BEACON_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform float uTime;
uniform int uPart;
uniform float uNight;
in vec3 vPos; in vec3 vLocal; in vec4 vCol; in float vH; in float vSel; in float vPing;
out vec4 outColor;
void main(){
  // Mélange alpha pré-multiplié : la lumière colorée reste lisible sur le fond crème (l'additif y disparaît)
  vec3 hot = mix(vCol.rgb, vec3(1., .97, .86), .35);   // cœur plus clair que la teinte : la lumière « brûle » au centre
  float boost = 1. + .6 * vSel + .7 * vPing;
  if (uPart == 0) {
    float g = 1. - vLocal.z;
    float a = (pow(g, 1.1) * .62 + pow(g, 5.) * .30) * (.82 + .18 * sin(uTime * 3. + vCol.w * 6. - vLocal.z * 9.));
    a = clamp(a * boost, 0., 1.);
    vec3 c = mix(vCol.rgb, hot, pow(g, 4.));
    outColor = vec4(c * a, a);
  } else if (uPart == 2) {
    float g = 1. - vLocal.z;
    float a = pow(g, 1.8) * (.22 + .12 * uNight) * boost;
    outColor = vec4(vCol.rgb * a, a);
  } else if (uPart == 1) {
    float r = length(vLocal.xy);
    float t = fract(uTime * .38 + vCol.w);
    float ring = smoothstep(.12, .0, abs(r - t)) * (1. - t);
    float core = smoothstep(.30, .0, r) * .75;
    float pingRing = smoothstep(.10, .0, abs(r - .55 - .4 * (1. - vPing))) * vPing; // onde du balayage
    float selRing = vSel * smoothstep(.06, .0, abs(r - .92)) * (.7 + .3 * sin(uTime * 6.));
    float a = clamp(ring * .95 + core + pingRing + selRing, 0., 1.) * step(r, 1.);
    outColor = vec4(mix(vCol.rgb, hot, core) * a, a);
  } else {
    // anneau flottant : bande nette + tirets qui tournent (lecture « radar »)
    float r = length(vLocal.xy);
    float band = smoothstep(.09, .0, abs(r - .86));
    float ang = atan(vLocal.y, vLocal.x);
    float dash = step(.35, fract(ang * 1.9099 + uTime * .5 * (vCol.w > .5 ? 1. : -1.)));
    float glow = smoothstep(.45, .0, abs(r - .86)) * .22;
    float a = clamp((band * (.55 + .45 * dash) + glow) * (.75 + .25 * vSel) * boost, 0., 1.) * step(r, 1.);
    outColor = vec4(mix(vCol.rgb, hot, band * .4) * a, a);
  }
}`;

// ---------------------------------------------------------------------------------------------
// Chaussées et trottoirs : rubans à plat, dessinés SOUS tout le reste (sans écrire la profondeur)
// ---------------------------------------------------------------------------------------------

export const ROAD_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
in vec3 aPos;
in vec4 aRd;   // u (m le long de la voie), v (-1..1 en travers), type, largeur
out vec3 vPos; out vec4 vRd;
void main(){
  vPos = aPos; vRd = aRd;
  gl_Position = uMVP * vec4(aPos, 1.);
}`;

export const ROAD_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${COMMON}
uniform vec3 uCam, uSun, uSunCol, uAmb, uGround, uFogCol;
uniform float uFogDen;
in vec3 vPos; in vec4 vRd;
out vec4 outColor;
float stripeAA(float x, float period){
  float w = fwidth(x) / period;
  float v = step(.5, fract(x / period));
  return mix(v, .5, smoothstep(.22, .7, w));
}
void main(){
  float u = vRd.x, v = vRd.y, width = vRd.w;
  float tz = floor(vRd.z + .5);                 // valeur constante par voie : on arrondit la dérive d'interpolation
  float type = mod(tz, 4.), roadLen = floor(tz / 4.);
  vec3 albedo;
  // grain fin fondu dès qu'il devient plus petit qu'un pixel (sinon « neige » scintillante en vue rasante)
  float pxw = fwidth(vPos.x) + fwidth(vPos.y);
  float g1 = mix(vnoise(vPos.xy * 2.3), .5, smoothstep(.25, .9, pxw));
  float g2 = mix(vnoise(vPos.xy * 9.), .5, smoothstep(.06, .22, pxw));
  float grain = g1 * .6 + g2 * .4;
  if (type < .5) {
    // asphalte chaud et sombre (la rue se lit contre le sol clair), rapiéçages, bordure blanche
    albedo = mix(vec3(.33, .32, .31), vec3(.40, .38, .36), grain);
    albedo *= .92 + .14 * vnoise(vPos.xy * .35);
    float kerb = smoothstep(.86, .92, abs(v));
    albedo = mix(albedo, vec3(.93, .90, .84), kerb);
    if (width >= 6.5) {
      float dash = stripeAA(u, 7.) * (1. - smoothstep(.03, .06, abs(v)));
      albedo = mix(albedo, vec3(.98, .96, .88), dash * .9);                     // axe pointillé
    }
    // passages piétons aux deux bouts de la voie (les carrefours) : bandes blanches de 0,5 m
    float endD = min(u, roadLen - u);
    float zebraZone = (1. - smoothstep(4.2, 4.6, endD)) * step(1.4, endD) * step(abs(v), .84) * step(4.5, width) * step(14., roadLen);
    float bars = step(.5, fract(v * width * .5 / 1.0));
    albedo = mix(albedo, vec3(.97, .95, .90), zebraZone * bars * .92);
  } else if (type < 1.5) {
    float joint = min(stripeAA(u, 1.1), stripeAA(v * (width * .5 + 1.7), 1.1));
    albedo = vec3(.80, .74, .64) * (.92 + .10 * joint) * (.94 + .1 * grain);    // trottoir dallé
    float curb = smoothstep(.80, .86, abs(v)) * (1. - smoothstep(.93, .97, abs(v)));
    albedo = mix(albedo, vec3(.95, .92, .86), curb * .8);                        // arête du trottoir
  } else if (type < 2.5) {
    float joint = min(stripeAA(u, 1.4), stripeAA(v * width * .5, 1.4));
    albedo = mix(vec3(.84, .77, .66), vec3(.78, .70, .58), grain) * (.95 + .06 * joint); // place piétonne
  } else {
    albedo = mix(vec3(.74, .64, .48), vec3(.66, .56, .42), grain);              // sentier de terre
  }
  albedo = pow(albedo, vec3(2.2));
  vec3 col = albedo * (uSunCol * max(uSun.z, 0.) * .85 + mix(uGround, uAmb, .85));
  col = applyFog(col, vPos, uCam, uFogCol, uFogDen);
  col = tone(col);
  col += (hash21(gl_FragCoord.xy + 5.) - .5) / 255.;
  outColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------
// Balayage radar : disque au sol autour de l'ESSECT, secteur qui tourne avec une traîne, anneaux de distance tous les 500 m
// (mélange pré-multiplié : rouge lisible sur le crème le jour, lueur la nuit)
// ---------------------------------------------------------------------------------------------

export const SWEEP_VS = /* glsl */ `#version 300 es
precision highp float;
uniform mat4 uMVP;
uniform float uRadius;
in vec3 aPos;
out vec2 vXY;
void main(){
  vXY = aPos.xy * uRadius;
  gl_Position = uMVP * vec4(vXY, .45, 1.);
}`;

export const SWEEP_FS = /* glsl */ `#version 300 es
precision highp float;
uniform float uRadius, uSweep, uNight, uTime;
in vec2 vXY;
out vec4 o;
void main(){
  float d = length(vXY);
  if (d > uRadius) discard;
  float ang = atan(vXY.x, vXY.y);
  float lag = mod(uSweep - ang, 6.28318);
  float trail = exp(-lag * 2.6) * smoothstep(0., .02, lag + .02);
  float edge = smoothstep(.035, 0., lag) ;
  float px = fwidth(d);
  float rings = 0.;
  float step500 = 500.;
  float rr = abs(fract(d / step500 + .5) - .5) * step500;
  rings = (1. - smoothstep(px * .8, px * 2.2, rr)) * step(80., d);
  float rim = 1. - smoothstep(px, px * 3., abs(d - uRadius));
  float fadeIn = smoothstep(40., 160., d) * (1. - smoothstep(uRadius * .9, uRadius, d) * .5);
  float a = (trail * .20 + edge * .40) * fadeIn + rings * .22 + rim * .55;
  a *= mix(1., 1.6, uNight);
  vec3 c = mix(vec3(.855, .027, .067), vec3(1., .62, .30), uNight * .6);
  a = clamp(a, 0., .85);
  o = vec4(c * a, a);
}`;

// ---------------------------------------------------------------------------------------------
// Sol : un grand quad MULTIPLICATIF. Il assombrit le fond de carte (et nos chaussées) là où l'ombre tombe, et teinte tout le
// sol selon l'heure (rose à l'aube, bleu la nuit). Il ne dessine rien d'opaque : là où il n'y a pas d'ombre, il vaut 1.
// ---------------------------------------------------------------------------------------------

export const GROUND_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform mat4 uMVP;
uniform float uGroundHalf;
in vec3 aPos;
out vec3 vPos;
void main(){
  vPos = vec3(aPos.xy * uGroundHalf, .03);
  gl_Position = uMVP * vec4(vPos, 1.);
}`;

export const GROUND_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${SHADOW_GLSL}
${COMMON}
uniform vec3 uTint, uShadowTint;
in vec3 vPos;
out vec4 outColor;
void main(){
  float f = shadowFactor(vPos, vec3(0., 0., 1.));
  // terre battue et dallages : grandes taches douces + grain fin, fondus avec la distance (aucun moiré)
  float big = vnoise(vPos.xy * .018) * .6 + vnoise(vPos.xy * .07) * .4;
  float fine = vnoise(vPos.xy * .9);
  float px = fwidth(vPos.x) + fwidth(vPos.y);
  fine = mix(fine, .5, smoothstep(.25, .9, px));
  vec3 soil = mix(vec3(.90, .85, .76), vec3(.97, .93, .86), big) * (.96 + .06 * fine);
  outColor = vec4(uTint * soil * mix(uShadowTint, vec3(1.), f), 1.);
}`;

// Ombre de contact au pied des immeubles (multiplicative) : le bâtiment « pèse » sur le sol
export const SKIRT_VS = /* glsl */ `#version 300 es
precision highp float;
uniform mat4 uMVP;
in vec3 aPos;
in float aFade;
out float vFade;
void main(){
  vFade = aFade;
  gl_Position = uMVP * vec4(aPos, 1.);
}`;

export const SKIRT_FS = /* glsl */ `#version 300 es
precision highp float;
uniform float uNight;
in float vFade;
out vec4 o;
void main(){
  float k = mix(.58, 1., smoothstep(0., 1., vFade));
  k = mix(k, 1., uNight * .55);
  o = vec4(vec3(k), 1.);
}`;
