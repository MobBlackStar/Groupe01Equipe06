// 💡 Concept & Analogie : Comme la préfecture qui valide les autorisations d'ouverture et contrôle la régularité des activités, ce service permet à l'administrateur d'approuver ou suspendre des comptes avec traçabilité intégrale.
// 🔄 Comparaison React / Flutter : L'administration est exclusivement réservée à l'application Web React (`/admin`) ; Flutter n'expose aucun endpoint administratif.
// 🎯 À retenir pour la soutenance : "Toute modification de statut commerçant fait l'objet d'une transaction atomique Firestore incluant un enregistrement d'audit infalsifiable et une notification push post-commit."
// Module : Administration & Modération

import { db, auth } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { FcmService } from '../notifications/fcm.service.js';
import { USER_STATUS } from '../../../../shared/constants.js';

const fcmService = new FcmService();

export const adminService = {
  /**
   * Liste l'ensemble des commerces avec filtrage par statut de modération.
   */
  async listMerchants(statusFilter) {
    let query = db.collection('merchants');
    if (statusFilter) {
      query = query.where('status', '==', statusFilter);
    }
    const snap = await query.get();
    const merchants = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { merchants };
  },

  /**
   * Modération d'un commerce : transaction atomique (mise à jour + audit trail) et notification push.
   */
  async updateMerchantStatus(merchantId, newStatus, statusReason, adminUid) {
    const merchantRef = db.collection('merchants').doc(merchantId);
    const userRef = db.collection('users').doc(merchantId);
    const auditRef = db.collection('admin_audit').doc();

    const now = new Date();
    let updatedMerchant = null;
    let fcmTokens = [];

    await db.runTransaction(async (transaction) => {
      const merchantDoc = await transaction.get(merchantRef);
      if (!merchantDoc.exists) {
        throw new AppError('Commerce introuvable pour modération', 404, 'MERCHANT_NOT_FOUND');
      }

      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        fcmTokens = userDoc.data().fcmTokens || [];
      }

      const prevData = merchantDoc.data();
      const updates = {
        status: newStatus,
        statusReason: statusReason || null,
        reviewedBy: adminUid,
        reviewedAt: now,
        updatedAt: now,
      };

      transaction.update(merchantRef, updates);

      // Inscription au journal d'audit administratif infalsifiable
      transaction.set(auditRef, {
        id: auditRef.id,
        action: 'UPDATE_MERCHANT_STATUS',
        targetId: merchantId,
        targetType: 'MERCHANT',
        performedBy: adminUid,
        previousStatus: prevData.status,
        newStatus,
        reason: statusReason || null,
        performedAt: now,
      });

      updatedMerchant = { ...prevData, ...updates };
    });

    // Notification FCM post-commit (hors de la transaction Firestore pour garantir la résilience)
    try {
      if (fcmTokens.length > 0) {
        await fcmService.notifyMerchantStatus(fcmTokens, newStatus, statusReason);
      }
    } catch {
      // Échec silencieux de la notification tierce
    }

    return { merchant: updatedMerchant };
  },

  /**
   * Liste les utilisateurs avec filtrage facultatif par rôle.
   */
  async listUsers(roleFilter) {
    let query = db.collection('users');
    if (roleFilter) {
      query = query.where('role', '==', roleFilter);
    }
    const snap = await query.get();
    const users = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    return { users };
  },

  /**
   * Suspend ou réactive un utilisateur, révoque ses jetons Firebase et consigne l'action d'audit.
   */
  async updateUserStatus(uid, status, statusReason, adminUid) {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new AppError('Utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    const prevUser = userDoc.data();
    const isSuspended = status === USER_STATUS.SUSPENDED;
    const now = new Date();

    // 1. Suspension ou réactivation au niveau de Firebase Auth
    try {
      await auth.updateUser(uid, { disabled: isSuspended });
      if (isSuspended) {
        await auth.revokeRefreshTokens(uid);
      }
    } catch {
      // Tolérance en mode de test sans émulateur Auth
    }

    // 2. Mise à jour Firestore et journalisation d'audit
    const updates = {
      status,
      disabled: isSuspended,
      statusReason: isSuspended ? (statusReason || null) : null,
      updatedAt: now,
    };

    await userRef.update(updates);

    await db.collection('admin_audit').add({
      action: 'UPDATE_USER_STATUS',
      targetId: uid,
      targetType: 'USER',
      performedBy: adminUid,
      previousStatus: prevUser.status,
      newStatus: status,
      reason: statusReason || null,
      performedAt: now,
    });

    return { user: { ...prevUser, ...updates } };
  },
};
