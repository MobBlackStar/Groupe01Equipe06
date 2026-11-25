// Module : Tests Unicité Email & Téléphone + Réinscription après suppression Admin
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { db } = await import('../src/config/firebase.js');
const { ROLES, FILIERES } = await import('../../shared/constants.js');

describe('Unicité Email/Téléphone & Réinscription post-suppression', () => {
  test('POST /auth/check-availability, 409 EMAIL/PHONE_ALREADY_IN_USE, PATCH /users/me 409, et réinscription après DELETE /admin/users/:uid', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      const { port } = server.address();
      const baseUrl = `http://127.0.0.1:${port}/api/v1`;

      const uid1 = 'uniq-user-1';
      const uid2 = 'uniq-user-2';
      const email1 = 'UniqTest@Essect.U-Tunis.Tn';
      const phone1Local = '55 123 456';
      const phone1Normalized = '+21655123456';

      // 1. Vérification disponibilité initiale (disponible)
      const availBefore = await fetch(`${baseUrl}/auth/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email1, phone: phone1Local }),
      });
      assert.equal(availBefore.status, 200);
      const availBeforeJson = await availBefore.json();
      assert.equal(availBeforeJson.available, true);
      assert.equal(availBeforeJson.emailTaken, false);
      assert.equal(availBeforeJson.phoneTaken, false);

      // 2. Création du premier profil (normalisation email lowercase + +216)
      const reg1 = await fetch(`${baseUrl}/auth/register-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:${uid1}:STUDENT:${email1}`,
        },
        body: JSON.stringify({
          role: ROLES.STUDENT,
          displayName: 'Sarra Mansouri',
          phone: phone1Local,
          filiereId: FILIERES.EBUSINESS_3A,
        }),
      });
      assert.equal(reg1.status, 201);
      const reg1Body = await reg1.json();
      assert.equal(reg1Body.user.email, email1.toLowerCase());
      assert.equal(reg1Body.user.phone, phone1Normalized);

      // 3. Vérification disponibilité après création -> emailTaken + phoneTaken = true
      const availAfter = await fetch(`${baseUrl}/auth/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email1.toUpperCase(), phone: phone1Normalized }),
      });
      assert.equal(availAfter.status, 200);
      const availAfterJson = await availAfter.json();
      assert.equal(availAfterJson.available, false);
      assert.equal(availAfterJson.emailTaken, true);
      assert.equal(availAfterJson.phoneTaken, true);

      // 4. Tentative création d'un 2ème compte avec le même email -> 409 EMAIL_ALREADY_IN_USE
      const dupEmailRes = await fetch(`${baseUrl}/auth/register-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:${uid2}:STUDENT:${email1.toLowerCase()}`,
        },
        body: JSON.stringify({
          role: ROLES.STUDENT,
          displayName: 'Autre Étudiant',
          phone: '+21622111222',
          filiereId: FILIERES.FINANCE,
        }),
      });
      assert.equal(dupEmailRes.status, 409);
      const dupEmailJson = await dupEmailRes.json();
      assert.equal(dupEmailJson.error.code, 'EMAIL_ALREADY_IN_USE');

      // 5. Tentative création du 2ème compte avec email différent mais téléphone identique -> 409 PHONE_ALREADY_IN_USE
      const dupPhoneRes = await fetch(`${baseUrl}/auth/register-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:${uid2}:STUDENT:autre.uniq@essect.u-tunis.tn`,
        },
        body: JSON.stringify({
          role: ROLES.STUDENT,
          displayName: 'Autre Étudiant',
          phone: '55123456',
          filiereId: FILIERES.FINANCE,
        }),
      });
      assert.equal(dupPhoneRes.status, 409);
      const dupPhoneJson = await dupPhoneRes.json();
      assert.equal(dupPhoneJson.error.code, 'PHONE_ALREADY_IN_USE');

      // 6. Création du 2ème compte avec téléphone libre -> 201, puis tentative PATCH /users/me vers phone1 -> 409
      const reg2 = await fetch(`${baseUrl}/auth/register-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:${uid2}:STUDENT:autre.uniq@essect.u-tunis.tn`,
        },
        body: JSON.stringify({
          role: ROLES.STUDENT,
          displayName: 'Autre Étudiant',
          phone: '+21622333444',
          filiereId: FILIERES.FINANCE,
        }),
      });
      assert.equal(reg2.status, 201);

      const patchDupPhone = await fetch(`${baseUrl}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:${uid2}:STUDENT:autre.uniq@essect.u-tunis.tn`,
        },
        body: JSON.stringify({ phone: '+21655123456' }),
      });
      assert.equal(patchDupPhone.status, 409);
      const patchDupJson = await patchDupPhone.json();
      assert.equal(patchDupJson.error.code, 'PHONE_ALREADY_IN_USE');

      // 7. Suppression définitive de uid1 par Admin -> libère email & téléphone pour réinscription (201)
      await db.collection('users').doc('admin-test').set({ uid: 'admin-test', role: ROLES.ADMIN });
      const delRes = await fetch(`${baseUrl}/admin/users/${uid1}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer test-token:admin-test:ADMIN:admin@campussave.tn',
        },
      });
      assert.equal(delRes.status, 200);

      const reReg = await fetch(`${baseUrl}/auth/register-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-token:uniq-user-reborn:STUDENT:${email1}`,
        },
        body: JSON.stringify({
          role: ROLES.STUDENT,
          displayName: 'Sarra Réinscrite',
          phone: phone1Normalized,
          filiereId: FILIERES.EBUSINESS_3A,
        }),
      });
      assert.equal(reReg.status, 201);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
