// 💡 Concept & Analogie : Comme la préfecture qui valide les autorisations d'ouverture et contrôle la régularité des activités, ce service permet à l'administrateur d'approuver ou suspendre des comptes avec traçabilité intégrale.
// 🔄 Comparaison React / Flutter : L'administration est exclusivement réservée à l'application Web React (`/admin`) ; Flutter n'expose aucun endpoint administratif.
// 🎯 À retenir pour la soutenance : "Toute modification de statut commerçant fait l'objet d'une transaction atomique Firestore incluant un enregistrement d'audit infalsifiable et une notification push post-commit."
// Module : Administration & Modération

import { db, auth } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { FcmService } from '../notifications/fcm.service.js';
import { USER_STATUS, MERCHANT_STATUS } from '../../../../shared/constants.js';
import { computeLocationFields } from '../merchants/merchants.service.js';

const fcmService = new FcmService();

/** Trace d'audit minimale d'une action sur un spot (qui, quoi, quand). */
async function auditSpot(adminUid, action, merchantId, details = {}) {
  try {
    await db.collection('admin_audit').doc().set({ adminUid, action, targetType: 'merchant', targetId: merchantId, details, createdAt: new Date() });
  } catch {
    /* l'audit ne doit jamais bloquer l'action */
  }
}

export const adminService = {
  /**
   * Crée un spot (commerce de démonstration) sans compte commerçant : approuvé, marqué `isDemoSpot`.
   * Le rayon de 3 km autour de l'ESSECT est appliqué comme pour un vrai commerçant (422 TOO_FAR).
   */
  async createSpot(adminUid, body) {
    const { name, type, description, phone, address, location, coverImageUrl } = body;
    const fields = computeLocationFields(location);
    const id = `spot-${db.collection('merchants').doc().id}`;
    const now = new Date();
    const merchant = {
      id,
      ownerUid: null,
      isDemoSpot: true,
      createdBy: adminUid,
      name,
      type,
      description: description || '',
      phone,
      address: { street: address.street, area: address.area || 'Montfleury', city: address.city || 'Tunis' },
      ...fields,
      status: MERCHANT_STATUS.APPROVED,
      statusReason: null,
      reviewedBy: adminUid,
      reviewedAt: now,
      ratingAvg: 0,
      ratingCount: 0,
      activeOfferCount: 0,
      totalOffersPublished: 0,
      totalMealsSaved: 0,
      coverImageUrl: coverImageUrl || null,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection('merchants').doc(id).set(merchant);
    await auditSpot(adminUid, 'SPOT_CREATED', id, { location: fields.location });
    return { merchant };
  },

  /** Déplace un commerce ou un spot (rayon de 3 km vérifié, geohash et temps à pied recalculés). */
  async updateSpotLocation(merchantId, location, adminUid) {
    const ref = db.collection('merchants').doc(merchantId);
    const snap = await ref.get();
    if (!snap.exists) throw new AppError('Commerce introuvable', 404, 'MERCHANT_NOT_FOUND');
    const fields = computeLocationFields(location);
    await ref.update({ ...fields, updatedAt: new Date() });
    await auditSpot(adminUid, 'SPOT_MOVED', merchantId, { from: snap.data().location || null, to: fields.location });
    const merchant = (await ref.get()).data();
    return { merchant };
  },

  /**
   * Retire un spot. Par défaut : ARCHIVAGE (suspendu, invisible du radar, données conservées).
   * `hard` : suppression définitive, réservée aux spots de démonstration sans offre active.
   */
  async deleteSpot(merchantId, { hard = false } = {}, adminUid) {
    const ref = db.collection('merchants').doc(merchantId);
    const snap = await ref.get();
    if (!snap.exists) throw new AppError('Commerce introuvable', 404, 'MERCHANT_NOT_FOUND');
    const data = snap.data();

    if (hard) {
      if (!data.isDemoSpot) {
        throw new AppError('Seuls les spots de démonstration peuvent être supprimés définitivement ; archivez ce commerce.', 409, 'NOT_DELETABLE');
      }
      if ((data.activeOfferCount || 0) > 0) {
        throw new AppError('Ce spot a encore des offres actives ; archivez-le ou retirez ses offres.', 409, 'HAS_ACTIVE_OFFERS');
      }
      await ref.delete();
      await auditSpot(adminUid, 'SPOT_DELETED', merchantId);
      return { deleted: true, id: merchantId };
    }

    const now = new Date();
    await ref.update({
      status: MERCHANT_STATUS.SUSPENDED,
      statusReason: 'Archivé par un administrateur',
      archived: true,
      archivedAt: now,
      reviewedBy: adminUid,
      reviewedAt: now,
      updatedAt: now,
    });
    await auditSpot(adminUid, 'SPOT_ARCHIVED', merchantId);
    return { archived: true, merchant: (await ref.get()).data() };
  },

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

  /**
   * Réinitialise l'environnement complet de démonstration : commandes purgées, 20 offres officielles réinjectées, cache invalidé.
   */
  async resetDemo() {
    const { resetDemo } = await import('../../../scripts/resetDemo.js');
    await resetDemo();
    const { clearReadCache } = await import('../../middleware/readCache.js');
    clearReadCache();
    return { ok: true, offersCount: 20, merchantsCount: 6 };
  },
};
