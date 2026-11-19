// 💡 Concept & Analogie : Comme un jeu de cartes-test pour le lecteur d'adresses GPS, ces vecteurs prouvent que les coordonnées collées depuis Google Maps sont comprises et que la règle des 3 km est bien appliquée.
// 🔄 Comparaison React / Flutter : Les mêmes fonctions servent à l'éditeur de spots du site ; ces tests garantissent leur comportement indépendamment de l'interface.
// 🎯 À retenir pour la soutenance : "Chaque format de coordonnées (texte, lien @, lien !3d!4d, ?q=) a son vecteur de test ; une valeur hors bornes ou illisible renvoie null, jamais une position inventée."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseCoordinates, assessSpot, snapToRoads } from '../spot.js';
import { BUSINESS_RULES } from '../constants.js';

describe('parseCoordinates — formats Google Maps et texte brut', () => {
  test('« lat, lng » (copie du clic droit Google Maps)', () => {
    assert.deepEqual(parseCoordinates('36.7875, 10.1758'), { lat: 36.7875, lng: 10.1758 });
    assert.deepEqual(parseCoordinates('  36.7875,10.1758  '), { lat: 36.7875, lng: 10.1758 });
  });

  test('« lat lng » séparés par une espace et « lat; lng »', () => {
    assert.deepEqual(parseCoordinates('36.7875 10.1758'), { lat: 36.7875, lng: 10.1758 });
    assert.deepEqual(parseCoordinates('36.7875; 10.1758'), { lat: 36.7875, lng: 10.1758 });
  });

  test('lien Google Maps avec @lat,lng,zoom', () => {
    const url = 'https://www.google.com/maps/place/ESSECT/@36.78702,10.17513,17z/data=!3m1!4b1';
    assert.deepEqual(parseCoordinates(url), { lat: 36.78702, lng: 10.17513 });
  });

  test('lien « place » : !3d/!4d (le lieu exact) prime sur @ (la vue de la carte)', () => {
    const url = 'https://www.google.com/maps/place/Resto/@36.80,10.20,15z/data=!4m6!3m5!8m2!3d36.7875!4d10.1758';
    assert.deepEqual(parseCoordinates(url), { lat: 36.7875, lng: 10.1758 });
  });

  test('lien avec ?q=lat,lng (et encodage %2C)', () => {
    assert.deepEqual(parseCoordinates('https://www.google.com/maps?q=36.7875,10.1758'), { lat: 36.7875, lng: 10.1758 });
    assert.deepEqual(parseCoordinates('https://maps.google.com/?q=36.7875%2C10.1758'), { lat: 36.7875, lng: 10.1758 });
  });

  test('coordonnées négatives (hémisphère sud / ouest)', () => {
    assert.deepEqual(parseCoordinates('-33.8688, 151.2093'), { lat: -33.8688, lng: 151.2093 });
  });

  test('illisible, incomplet ou hors bornes : null (jamais une position inventée)', () => {
    assert.equal(parseCoordinates('bonjour'), null);
    assert.equal(parseCoordinates('36.7875'), null);
    assert.equal(parseCoordinates('95, 10'), null, 'latitude > 90');
    assert.equal(parseCoordinates('36, 200'), null, 'longitude > 180');
    assert.equal(parseCoordinates(''), null);
    assert.equal(parseCoordinates(null), null);
  });
});

describe('assessSpot — règle des 3 km', () => {
  test('la constante de la règle est 3000 m (non affaiblie)', () => {
    assert.equal(BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS, 3000);
  });

  test('un spot de Montfleury est éligible, avec distance et minutes à pied', () => {
    const a = assessSpot(36.7885, 10.1762);
    assert.equal(a.withinRadius, true);
    assert.ok(a.distanceM > 100 && a.distanceM < 400);
    assert.ok(a.walkingMinutes >= 1 && a.walkingMinutes <= 10);
    assert.equal(a.overByM, 0);
  });

  test('La Marsa est refusée et l\'excès est chiffré', () => {
    const a = assessSpot(36.878, 10.3245);
    assert.equal(a.withinRadius, false);
    assert.ok(a.overByM > 10000);
    assert.equal(a.maxM, 3000);
  });
});

describe('snapToRoads — porte sur la rue', () => {
  const origin = [10.1748, 36.7871];
  // une rue est-ouest à 0 m (nord) de x = -100 m à +100 m ; coordonnées en décimètres
  const roads = [{ k: 4, r: [-1000, 0, 1000, 0] }];
  const mLng = 111320 * Math.cos((origin[1] * Math.PI) / 180);

  test('accroche un point à la rue la plus proche et donne la distance', () => {
    const p = { lat: origin[1] + 20 / 111320, lng: origin[0] + 30 / mLng }; // 20 m au nord, 30 m à l'est
    const s = snapToRoads(p, roads, origin);
    assert.ok(s, 'une rue doit être trouvée');
    assert.ok(Math.abs(s.distM - 20) <= 1, `distance ${s.distM}`);
    assert.ok(Math.abs((s.lng - origin[0]) * mLng - 30) < 0.5, 'même abscisse que le point');
    assert.ok(Math.abs((s.lat - origin[1]) * 111320) < 0.5, 'sur l\'axe de la rue');
  });

  test('au bout d\'une rue, le point est ramené à l\'extrémité', () => {
    const p = { lat: origin[1], lng: origin[0] + 150 / mLng };
    const s = snapToRoads(p, roads, origin);
    assert.ok(Math.abs((s.lng - origin[0]) * mLng - 100) < 0.5);
  });

  test('aucune voie à proximité : null', () => {
    const p = { lat: origin[1] + 600 / 111320, lng: origin[0] };
    assert.equal(snapToRoads(p, roads, origin, 250), null);
    assert.equal(snapToRoads(p, [], origin), null);
  });
});
