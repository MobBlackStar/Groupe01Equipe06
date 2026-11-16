// 💡 Concept & Analogie : Service utilisateur centralisant la consultation, la mise à jour des coordonnées et la gestion des jetons push FCM.
// 🔄 Comparaison React / Flutter : Alimente `ProfilePage` sous React et `ProfileScreen` sous Flutter via la même route `/users/me`.
// 🎯 À retenir pour la soutenance : "Ce service protège les données sensibles en interdisant formellement la modification du rôle ou du solde d'EcoPoints par l'utilisateur."
// Module : Logique Métier Backend

import admin from 'firebase-admin';
import { db } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES } from '../../../../shared/constants.js';

export const usersService = {
  /**
   * Récupère le profil complet de l'utilisateur connecté, avec les informations du commerce s'il est commerçant.
   */
  async getMe(uid) {
    if (!uid) {
      throw new AppError('Identifiant utilisateur manquant', 400, 'INVALID_UID');
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('Profil utilisateur introuvable', 404, 'USER_NOT_FOUND');
    }

    const user = userDoc.data();
    let merchant = null;

    if (user.role === ROLES.MERCHANT) {
      const merchantDoc = await db.collection('merchants').doc(uid).get();
      if (merchantDoc.exists) {
        merchant = merchantDoc.data();
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
