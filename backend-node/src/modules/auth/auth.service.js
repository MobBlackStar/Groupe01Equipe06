// 💡 Concept & Analogie : Service métier d'authentification interagissant avec Firebase Auth et Firestore.
// 🔄 Comparaison React / Flutter : Permet d'attribuer les Custom Claims de rôle (STUDENT, MERCHANT) de façon sécurisée.
// 🎯 À retenir pour la soutenance : "Ce service écrit le document utilisateur dans Firestore et assigne le rôle dans le token Firebase via l'Admin SDK."
// Module : Architecture Backend

import { db, auth } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES, USER_STATUS } from '../../../../shared/constants.js';

export const authService = {
  /**
   * Enregistre le profil initial d'un utilisateur après son premier login Firebase.
   * Assigne le rôle (STUDENT ou MERCHANT), crée le document Firestore et applique le Custom Claim.
   */
  async registerProfile(currentUser, body) {
    if (!currentUser || !currentUser.uid) {
      throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
    }

    const { role, displayName, phone, filiereId } = body;

    // Règle de sécurité : Interdiction absolue d'attribuer le rôle ADMIN via l'API publique
    if (role === ROLES.ADMIN || role === 'ADMIN') {
      throw new AppError('Attribution du rôle administrateur strictement interdite', 403, 'FORBIDDEN_ROLE');
    }

    if (![ROLES.STUDENT, ROLES.MERCHANT].includes(role)) {
      throw new AppError('Rôle invalide. Choisissez STUDENT ou MERCHANT', 422, 'INVALID_ROLE');
    }

    const userRef = db.collection('users').doc(currentUser.uid);
    const existingSnap = await userRef.get();

    if (existingSnap.exists) {
      throw new AppError('Un profil utilisateur existe déjà pour ce compte', 409, 'PROFILE_EXISTS');
    }

    const now = new Date();
    const userData = {
      uid: currentUser.uid,
      email: currentUser.email || `${currentUser.uid}@campussave.essect.tn`,
      role,
      displayName,
      phone: phone || null,
      filiereId: role === ROLES.STUDENT ? (filiereId || null) : null,
      avatarUrl: null,
      ecoPoints: 0,
      badges: [],
      totalMoneySavedMillimes: 0,
      totalCo2SavedGrams: 0,
      totalMealsRescued: 0,
      notificationPrefs: {
        email: true,
        push: true,
        dailyDigest: true,
      },
      fcmTokens: [],
      status: USER_STATUS.ACTIVE,
      disabled: false,
      createdAt: now,
      updatedAt: now,
    };

    // Écriture du document utilisateur dans Firestore
    await userRef.set(userData);

    // Attribution du Custom Claim dans Firebase Auth
    try {
      await auth.setCustomUserClaims(currentUser.uid, { role });
    } catch (err) {
      // Tolérance en environnement de test isolé sans émulateur Auth
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return { user: userData };
  },
};
