// 💡 Concept & Analogie : Contrôle de gestion et audit des profils utilisateurs par l'administration centrale.
// 🔄 Comparaison React / Flutter : Valide les endpoints PATCH et DELETE /api/v1/admin/users/:uid appelés par AdminUsersPage.
// 🎯 À retenir pour la soutenance : "Toute modification ou suppression d'utilisateur est consignée dans admin_audit et les comptes administrateurs sont protégés contre l'auto-suppression et l'altération."

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = '';

const { db } = await import('../src/config/firebase.js');
const { adminService } = await import('../src/modules/admin/admin.service.js');
const { updateUserDataSchema } = await import('../src/modules/admin/admin.schemas.js');
const { ROLES, FILIERES } = await import('../../shared/constants.js');

describe('Gestion Administrateur des Utilisateurs (Modifier & Supprimer)', () => {
  const adminUid = 'admin-test-operator';

  test('Validation Zod de updateUserDataSchema', () => {
    // Cas valides
    const valid = updateUserDataSchema.parse({
      displayName: 'Yassine Trabelsi',
      phone: '+21698123456',
      filiereId: FILIERES.EBUSINESS_3A,
      role: ROLES.STUDENT,
    });
    assert.equal(valid.displayName, 'Yassine Trabelsi');
    assert.equal(valid.role, ROLES.STUDENT);

    // Nom trop court (< 2 caractères)
    assert.throws(() => {
      updateUserDataSchema.parse({ displayName: 'A' });
    });

    // Rôle invalide
    assert.throws(() => {
      updateUserDataSchema.parse({ role: 'SUPERUSER' });
    });
  });

  test('adminService.updateUser modifie le nom, téléphone, filière et rôle', async () => {
    const targetUid = 'user-to-edit-01';
    await db.collection('users').doc(targetUid).set({
      uid: targetUid,
      email: 'etudiant.edit@essect.u-tunis.tn',
      displayName: 'Ancien Nom',
      phone: '+21698000000',
      role: ROLES.STUDENT,
      filiereId: FILIERES.FINANCE,
      status: 'ACTIVE',
    });

    const result = await adminService.updateUser(
      targetUid,
      {
        displayName: 'Nouveau Nom Étudiant',
        phone: '+21698111222',
        filiereId: FILIERES.EBUSINESS_3A,
        role: ROLES.STUDENT,
      },
      adminUid
    );

    assert.equal(result.user.displayName, 'Nouveau Nom Étudiant');
    assert.equal(result.user.phone, '+21698111222');
    assert.equal(result.user.filiereId, FILIERES.EBUSINESS_3A);

    const doc = await db.collection('users').doc(targetUid).get();
    assert.equal(doc.data().displayName, 'Nouveau Nom Étudiant');
  });

  test('adminService.updateUser refuse la modification de soi-même (403 FORBIDDEN)', async () => {
    await db.collection('users').doc(adminUid).set({
      uid: adminUid,
      email: 'admin.operator@campussave.tn',
      displayName: 'Admin Operator',
      role: ROLES.ADMIN,
    });

    await assert.rejects(
      () => adminService.updateUser(adminUid, { displayName: 'Hacked Name' }, adminUid),
      (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
    );
  });

  test('adminService.updateUser refuse la modification du compte admin@campussave.tn (403 FORBIDDEN)', async () => {
    const mainAdminUid = 'admin-root-main';
    await db.collection('users').doc(mainAdminUid).set({
      uid: mainAdminUid,
      email: 'admin@campussave.tn',
      displayName: 'CampusSave Root Admin',
      role: ROLES.ADMIN,
    });

    await assert.rejects(
      () => adminService.updateUser(mainAdminUid, { role: ROLES.STUDENT }, adminUid),
      (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
    );
  });

  test('adminService.deleteUser supprime un utilisateur régulier et inscrit un audit', async () => {
    const targetUid = 'user-to-delete-01';
    await db.collection('users').doc(targetUid).set({
      uid: targetUid,
      email: 'delete.me@essect.u-tunis.tn',
      displayName: 'À Supprimer',
      role: ROLES.STUDENT,
    });

    const res = await adminService.deleteUser(targetUid, adminUid);
    assert.equal(res.ok, true);
    assert.equal(res.deletedUid, targetUid);

    const doc = await db.collection('users').doc(targetUid).get();
    assert.equal(doc.exists, false);

    const auditSnap = await db.collection('admin_audit')
      .where('action', '==', 'DELETE_USER')
      .where('targetId', '==', targetUid)
      .get();
    assert.equal(auditSnap.empty, false);
  });

  test('adminService.deleteUser refuse la suppression de soi-même (403 FORBIDDEN)', async () => {
    await assert.rejects(
      () => adminService.deleteUser(adminUid, adminUid),
      (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
    );
  });

  test('adminService.deleteUser refuse la suppression de admin@campussave.tn (403 FORBIDDEN)', async () => {
    const mainAdminUid = 'admin-root-protected';
    await db.collection('users').doc(mainAdminUid).set({
      uid: mainAdminUid,
      email: 'admin@campussave.tn',
      displayName: 'Protected Admin',
      role: ROLES.ADMIN,
    });

    await assert.rejects(
      () => adminService.deleteUser(mainAdminUid, adminUid),
      (err) => err.statusCode === 403 && err.code === 'FORBIDDEN'
    );
  });
});
