// 💡 Concept & Analogie : Le contrôle des fonctions promises par le cahier des charges mais qui n'étaient qu'à moitié branchées : profil, fiche boutique, contenu des paniers surprise.
// 🔄 Comparaison React / Flutter : Garantit côté serveur ce que les écrans de profil et de boutique (web et mobile) envoient.
// 🎯 À retenir pour la soutenance : "Les horaires et le logo sont conservés, la boutique du compte démo est modifiable, un avatar prédéfini est accepté, et le contenu d'un panier surprise est stocké article par article."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// GARDE-FOU : base en mémoire uniquement
process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { isFirebaseConfigured } = await import('../src/config/firebase.js');
const { merchantsService } = await import('../src/modules/merchants/merchants.service.js');
const { usersService } = await import('../src/modules/users/users.service.js');
const { updateMerchantSchema, createMerchantSchema } = await import('../src/modules/merchants/merchants.schemas.js');
const { updateProfileSchema } = await import('../src/modules/users/users.schemas.js');
const { normalizeSurpriseItems } = await import('../src/modules/offers/offers.service.js');

describe('Écarts cahier des charges corrigés', { skip: isFirebaseConfigured ? 'refus de toucher une base réelle' : false }, () => {
  test('les schémas conservent les horaires et le logo de la boutique', () => {
    const parsed = updateMerchantSchema.parse({ openingHours: '07:30 - 22:00', logoUrl: 'https://example.com/logo.png' });
    assert.equal(parsed.openingHours, '07:30 - 22:00');
    assert.equal(parsed.logoUrl, 'https://example.com/logo.png');
    const created = createMerchantSchema.parse({
      name: 'Chez Test',
      type: 'CAFETERIA',
      phone: '+21671390111',
      address: { street: 'Rue test 1' },
      location: { lat: 36.7885, lng: 10.1762 },
      openingHours: '08:00 - 20:00',
    });
    assert.equal(created.openingHours, '08:00 - 20:00');
  });

  test('le compte commerçant démo modifie sa vraie boutique (et non un document merchants/m-baguette inexistant)', async () => {
    const { merchant } = await merchantsService.updateMe('m-baguette', { description: 'Sandwichs du jour', openingHours: '07:00 - 23:00' });
    assert.equal(merchant.id, 'merchant-baguette-baguette');
    assert.equal(merchant.openingHours, '07:00 - 23:00');
    assert.equal(merchant.status, 'APPROVED', 'le statut d\'agrément reste protégé');
  });

  test('profil : avatar prédéfini accepté, valeur inconnue refusée, préférences fusionnées', async () => {
    assert.equal(updateProfileSchema.parse({ avatarUrl: 'preset:croissant' }).avatarUrl, 'preset:croissant');
    assert.equal(updateProfileSchema.safeParse({ avatarUrl: 'preset:inconnu' }).success, false);
    assert.equal(updateProfileSchema.parse({ avatarUrl: 'https://example.com/a.png' }).avatarUrl, 'https://example.com/a.png');

    await usersService.updateMe('student-yassine', { notificationPrefs: { email: false } });
    const { user } = await usersService.updateMe('student-yassine', { notificationPrefs: { push: false } });
    assert.deepEqual(user.notificationPrefs, { email: false, push: false });
  });

  test('profil : un compte démo non encore créé est provisionné au lieu de répondre 404', async () => {
    const { user } = await usersService.updateMe('admin-uid', { displayName: 'Direction ESSECT' });
    assert.equal(user.displayName, 'Direction ESSECT');
  });

  test('contenu d un panier surprise : texte libre -> articles {name, quantity}', () => {
    assert.deepEqual(normalizeSurpriseItems('2x Croissants + 1x Pain au chocolat, Jus d orange'), [
      { name: 'Croissants', quantity: 2 },
      { name: 'Pain au chocolat', quantity: 1 },
      { name: 'Jus d orange', quantity: 1 },
    ]);
    assert.deepEqual(normalizeSurpriseItems([{ name: 'Brik', qty: 3 }, '  ', 'Salade']), [
      { name: 'Brik', qty: 3, quantity: 3 },
      { name: 'Salade', quantity: 1 },
    ]);
    assert.deepEqual(normalizeSurpriseItems(undefined), []);
  });
});
