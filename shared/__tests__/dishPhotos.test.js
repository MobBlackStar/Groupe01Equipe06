import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISH_PHOTO_TAGS,
  DISH_PHOTO_URLS,
  resolveDishPhoto,
  resolveDishPhotoTag,
} from '../dishPhotos.js';

describe('Catalogue photos culinaires partagés (14 tags ESSECT)', () => {
  test('Toutes les 14 clés photoTag existent avec URL HTTPS valide', () => {
    assert.equal(DISH_PHOTO_TAGS.length, 14);
    for (const tag of DISH_PHOTO_TAGS) {
      assert.ok(DISH_PHOTO_URLS[tag]?.startsWith('https://images.unsplash.com/'), `Missing URL for ${tag}`);
    }
  });

  test('resolveDishPhoto associe chaque spécialité tunisienne et campus au bon visuel', () => {
    assert.equal(resolveDishPhoto({ rawNote: '3 burgers double smash' }), DISH_PHOTO_URLS.burger);
    assert.equal(resolveDishPhoto({ title: 'Makloub Escalope Panné' }), DISH_PHOTO_URLS.makloub);
    assert.equal(resolveDishPhoto({ title: 'Chapati Mahdia Spécial' }), DISH_PHOTO_URLS.chapati);
    assert.equal(resolveDishPhoto({ title: 'Baguette Farcie Thon Fromage' }), DISH_PHOTO_URLS.baguette);
    assert.equal(resolveDishPhoto({ title: 'Pizza 4 Saisons' }), DISH_PHOTO_URLS.pizza);
    assert.equal(resolveDishPhoto({ rawNote: '2 tacos poulet gratinés' }), DISH_PHOTO_URLS.tacos);
    assert.equal(resolveDishPhoto({ title: 'Barquette Frites Cheddar' }), DISH_PHOTO_URLS.frites);
    assert.equal(resolveDishPhoto({ title: 'Duo Brik à l’œuf & Thon' }), DISH_PHOTO_URLS.brik);
    assert.equal(resolveDishPhoto({ title: 'Salade César Fraîche' }), DISH_PHOTO_URLS.salade);
    assert.equal(resolveDishPhoto({ title: 'Ojja Merguez Royale' }), DISH_PHOTO_URLS.plat_chaud);
    assert.equal(resolveDishPhoto({ title: 'Croissants Pur Beurre' }), DISH_PHOTO_URLS.croissant);
    assert.equal(resolveDishPhoto({ title: 'Assortiment Baklava & Pâtisserie' }), DISH_PHOTO_URLS.patisserie);
    assert.equal(resolveDishPhoto({ title: 'Citronnade Maison Fraîche' }), DISH_PHOTO_URLS.boisson);
    assert.equal(resolveDishPhoto({ photoTag: 'surprise', category: 'MIXTE', isSurpriseBasket: true }), DISH_PHOTO_URLS.surprise);
    assert.equal(resolveDishPhotoTag({ rawNote: '2 chapatis fromage harissa' }), 'chapati');
  });
});
