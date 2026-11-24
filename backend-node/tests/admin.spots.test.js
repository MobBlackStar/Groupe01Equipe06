// 💡 Concept & Analogie : Comme l'inspecteur qui vérifie qu'on ne peut pas ouvrir un stand en dehors du périmètre autorisé, ces tests prouvent que l'ajout, le déplacement et le retrait d'un spot respectent toujours le rayon de 3 km autour de l'ESSECT.
// 🔄 Comparaison React / Flutter : Garantit côté serveur ce que l'éditeur de spots du site (SpotEditor) affiche déjà : badge vert dans 3 km, rouge au-delà ; le serveur est l'arbitre final.
// 🎯 À retenir pour la soutenance : "La règle des 3 km vit dans une constante unique (BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS) ; l'API répond 422 TOO_FAR hors rayon, que l'auteur soit un commerçant ou un administrateur."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// GARDE-FOU : ces tests écrivent dans la base. On force la base EN MÉMOIRE avant tout chargement de module
// (dotenv n'écrase pas une variable déjà définie) pour qu'ils ne touchent JAMAIS une base Firebase réelle.
process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { isFirebaseConfigured, db } = await import('../src/config/firebase.js');
const { adminService } = await import('../src/modules/admin/admin.service.js');
const { createSpotSchema, updateSpotLocationSchema, deleteSpotQuerySchema, updateMerchantDataSchema } = await import('../src/modules/admin/admin.schemas.js');
const { BUSINESS_RULES, MERCHANT_STATUS } = await import('../../shared/constants.js');

const IN_RADIUS = { lat: 36.7885, lng: 10.1762 }; // Baguette & Baguette Montfleury (~210 m)
const IN_RADIUS_2 = { lat: 36.7852, lng: 10.1788 }; // Avenue de Madrid (~620 m)
const LA_MARSA = { lat: 36.878, lng: 10.3245 }; // ~15 km : hors rayon

const validBody = (location) => ({
  name: 'Spot de démonstration',
  type: 'RESTAURANT',
  phone: '+21671390111',
  address: { street: 'Avenue Habib Bourguiba' },
  location,
});

describe('Spots administrateur — ajout, déplacement, archivage (rayon 3 km)', { skip: isFirebaseConfigured ? 'refus de toucher une base réelle' : false }, () => {
  test('la règle des 3 km est la constante partagée (non affaiblie)', () => {
    assert.equal(BUSINESS_RULES.MAX_MERCHANT_DISTANCE_METERS, 3000);
  });

  test('crée un spot dans le rayon : approuvé, marqué démo, distance et minutes à pied calculées', async () => {
    const { merchant } = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    assert.match(merchant.id, /^spot-/);
    assert.equal(merchant.isDemoSpot, true);
    assert.equal(merchant.ownerUid, null);
    assert.equal(merchant.status, MERCHANT_STATUS.APPROVED);
    assert.ok(merchant.distanceFromEssectM > 100 && merchant.distanceFromEssectM < 400, `distance ${merchant.distanceFromEssectM}`);
    assert.ok(Number.isInteger(merchant.walkingMinutes) && merchant.walkingMinutes >= 1);
    assert.equal(typeof merchant.location.geohash, 'string');
    const stored = await db.collection('merchants').doc(merchant.id).get();
    assert.equal(stored.exists, true);
  });

  test('refuse un spot hors rayon (422 TOO_FAR) sans rien enregistrer', async () => {
    const before = (await db.collection('merchants').get()).size;
    await assert.rejects(
      () => adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(LA_MARSA))),
      (err) => err.statusCode === 422 && err.code === 'TOO_FAR'
    );
    const after = (await db.collection('merchants').get()).size;
    assert.equal(after, before);
  });

  test('déplace un spot (recalcule distance et geohash) et refuse un déplacement hors rayon', async () => {
    const { merchant } = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    const moved = await adminService.updateSpotLocation(merchant.id, updateSpotLocationSchema.parse({ location: IN_RADIUS_2 }).location, 'admin-uid');
    assert.notEqual(moved.merchant.location.geohash, merchant.location.geohash);
    assert.ok(moved.merchant.distanceFromEssectM > merchant.distanceFromEssectM);

    await assert.rejects(
      () => adminService.updateSpotLocation(merchant.id, LA_MARSA, 'admin-uid'),
      (err) => err.statusCode === 422 && err.code === 'TOO_FAR'
    );
    const still = (await db.collection('merchants').doc(merchant.id).get()).data();
    assert.equal(still.location.lat, IN_RADIUS_2.lat, 'la position ne change pas après un refus');

    await assert.rejects(
      () => adminService.updateSpotLocation('spot-inconnu', IN_RADIUS, 'admin-uid'),
      (err) => err.statusCode === 404 && err.code === 'MERCHANT_NOT_FOUND'
    );
  });

  test('modifie les informations du commerce (nom, type, téléphone, adresse)', async () => {
    const { merchant } = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    const updated = await adminService.updateMerchantData(
      merchant.id,
      updateMerchantDataSchema.parse({
        name: 'Nouveau Nom Spot',
        phone: '+21698765432',
        type: 'FAST_FOOD',
        address: { street: 'Rue de la Paix Montfleury' },
      }),
      'admin-uid'
    );
    assert.equal(updated.merchant.name, 'Nouveau Nom Spot');
    assert.equal(updated.merchant.phone, '+21698765432');
    assert.equal(updated.merchant.type, 'FAST_FOOD');
    assert.equal(updated.merchant.address.street, 'Rue de la Paix Montfleury');
  });

  test('archive par défaut (suspendu, données conservées)', async () => {
    const { merchant } = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    const res = await adminService.deleteSpot(merchant.id, {}, 'admin-uid');
    assert.equal(res.archived, true);
    const stored = (await db.collection('merchants').doc(merchant.id).get()).data();
    assert.equal(stored.status, MERCHANT_STATUS.SUSPENDED);
    assert.equal(stored.archived, true);
  });

  test('suppression définitive : permise pour un spot de démo sans offre active, refusée sinon', async () => {
    const { merchant } = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    const res = await adminService.deleteSpot(merchant.id, { hard: true }, 'admin-uid');
    assert.equal(res.deleted, true);
    assert.equal((await db.collection('merchants').doc(merchant.id).get()).exists, false);

    // un vrai commerce (non démo) ne peut jamais être supprimé définitivement
    await db.collection('merchants').doc('merchant-reel').set({ id: 'merchant-reel', name: 'Vrai commerce', activeOfferCount: 0, status: MERCHANT_STATUS.APPROVED });
    await assert.rejects(
      () => adminService.deleteSpot('merchant-reel', { hard: true }, 'admin-uid'),
      (err) => err.statusCode === 409 && err.code === 'NOT_DELETABLE'
    );

    // un spot de démo qui a encore des offres actives non plus
    const busy = await adminService.createSpot('admin-uid', createSpotSchema.parse(validBody(IN_RADIUS)));
    await db.collection('merchants').doc(busy.merchant.id).update({ activeOfferCount: 2 });
    await assert.rejects(
      () => adminService.deleteSpot(busy.merchant.id, { hard: true }, 'admin-uid'),
      (err) => err.statusCode === 409 && err.code === 'HAS_ACTIVE_OFFERS'
    );
  });

  test('les schémas Zod rejettent les données invalides', () => {
    assert.throws(() => createSpotSchema.parse({ ...validBody(IN_RADIUS), phone: '123' }));
    assert.throws(() => createSpotSchema.parse({ ...validBody(IN_RADIUS), location: { lat: 'x', lng: 1 } }));
    assert.throws(() => updateSpotLocationSchema.parse({ location: { lat: 120, lng: 10 } }));
    assert.equal(deleteSpotQuerySchema.parse({}).hard, 'false');
    assert.throws(() => deleteSpotQuerySchema.parse({ hard: 'peut-etre' }));
  });
});
