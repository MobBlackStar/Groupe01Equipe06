// 💡 Concept & Analogie : Service utilisateur centralisant la consultation, la mise à jour des coordonnées et la gestion des jetons push FCM.
// 🔄 Comparaison React / Flutter : Alimente `ProfilePage` sous React et `ProfileScreen` sous Flutter via la même route `/users/me`.
// 🎯 À retenir pour la soutenance : "Ce service protège les données sensibles en interdisant formellement la modification du rôle ou du solde d'EcoPoints par l'utilisateur."
// Module : Logique Métier Backend

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES } from '../../../../shared/constants.js';
import { env } from '../../config/env.js';
import { demoTokensAllowed, getOrProvisionDemoUser, findDemoMerchant, DEMO_MERCHANT_UID } from '../../utils/demoAccounts.js';
import { resolveMerchantId } from '../../utils/merchantResolver.js';

export const usersService = {
  /**
   * Récupère le profil complet de l'utilisateur connecté, avec les informations du commerce s'il est commerçant.
   * Auto-provisionne les comptes démo reconnus pour éviter tout 404 lors des démonstrations.
   */
  async getMe(uid) {
    if (!uid) {
      throw new AppError('Identifiant utilisateur manquant', 400, 'INVALID_UID');
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let user = null;

    if (userDoc.exists) {
      user = userDoc.data();
    } else {
      // Si l'utilisateur n'existe pas en Firestore, vérifier s'il s'agit d'un compte de démo autorisé
      const isDemoAllowed = demoTokensAllowed({ NODE_ENV: env.NODE_ENV, ALLOW_DEMO_TOKENS: env.ALLOW_DEMO_TOKENS });
      if (isDemoAllowed) {
        user = await getOrProvisionDemoUser(uid);
      }
      if (!user) {
        throw new AppError('Profil utilisateur introuvable', 404, 'USER_NOT_FOUND');
      }
    }

    let merchant = null;

    if (user.role === ROLES.MERCHANT) {
      // 1. Recherche directe par id
      const merchantDoc = await db.collection('merchants').doc(uid).get();
      if (merchantDoc.exists) {
        merchant = merchantDoc.data();
      } else {
        // 2. Recherche par ownerUid
        const ownedSnap = await db.collection('merchants').where('ownerUid', '==', uid).limit(1).get();
        if (!ownedSnap.empty) {
          merchant = ownedSnap.docs[0].data();
        } else {
          // 3. Résolution via resolveMerchantId / findDemoMerchant pour les comptes démo
          const resolvedId = await resolveMerchantId(uid);
          if (resolvedId) {
            const resolvedDoc = await db.collection('merchants').doc(resolvedId).get();
            if (resolvedDoc.exists) {
              merchant = resolvedDoc.data();
            }
          }
          if (!merchant && (uid === DEMO_MERCHANT_UID || uid === 'merchant-demo-uid')) {
            merchant = await findDemoMerchant();
          }
        }
      }
    }

    return {
      user,
      ...(merchant ? { merchant } : {}),
    };
  },

  /**
   * Met à jour les informations modifiables du profil utilisateur (nom, téléphone, avatar, filière, préférences).
   * Verrouille strictement les champs de sécurité (role, uid, ecoPoints, status, etc.).
   */
  async updateMe(uid, updates) {
    if (!uid) {
      throw new AppError('Identifiant utilisateur manquant', 400, 'INVALID_UID');
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('Profil utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    // Filtrage strict : protection contre l'altération de champs privilégiés
    const sanitizedUpdates = { ...updates };
    const protectedFields = [
      'uid',
      'email',
      'role',
      'status',
      'ecoPoints',
      'badges',
      'totalMoneySavedMillimes',
      'totalCo2SavedGrams',
      'totalMealsRescued',
      'disabled',
      'createdAt',
      'fcmTokens',
    ];

    for (const field of protectedFields) {
      delete sanitizedUpdates[field];
    }

    sanitizedUpdates.updatedAt = new Date();

    await userRef.update(sanitizedUpdates);
    const updatedDoc = await userRef.get();

    return { user: updatedDoc.data() };
  },

  /**
   * Ajoute un jeton FCM pour les notifications push ciblées.
   */
  async addFcmToken(uid, token) {
    if (!uid || !token) {
      throw new AppError('Jeton FCM ou identifiant manquant', 400, 'INVALID_TOKEN');
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('Profil utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      updatedAt: new Date(),
    });
  },

  /**
   * Retire un jeton FCM lors de la déconnexion de l'appareil.
   */
  async removeFcmToken(uid, token) {
    if (!uid || !token) {
      throw new AppError('Jeton FCM ou identifiant manquant', 400, 'INVALID_TOKEN');
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('Profil utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
      updatedAt: new Date(),
    });
  },
};
