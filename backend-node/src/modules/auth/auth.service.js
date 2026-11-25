// 💡 Concept & Analogie : Service métier d'authentification interagissant avec Firebase Auth et Firestore.
// 🔄 Comparaison React / Flutter : Permet d'attribuer les Custom Claims de rôle (STUDENT, MERCHANT) et de garantir l'unicité email/téléphone.
// 🎯 À retenir pour la soutenance : "Ce service valide l'unicité stricte de l'e-mail et du téléphone tunisien avant de créer le profil Firestore et d'appliquer le rôle."
// Module : Architecture Backend

import { db, auth } from '../../config/firebase.js';
import { AppError } from '../../utils/AppError.js';
import { ROLES, USER_STATUS } from '../../../../shared/constants.js';

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function normalizeTunisianPhone(phone) {
  if (phone === null || phone === undefined) return null;
  let compact = String(phone).replace(/[\s\-().]/g, '').trim();
  if (!compact || compact === '+' || compact === '+216' || compact === '216') return null;
  if (compact.startsWith('00216')) {
    compact = `+216${compact.slice(5)}`;
  } else if (/^216[2-9]\d{7}$/.test(compact)) {
    compact = `+${compact}`;
  } else if (/^[2-9]\d{7}$/.test(compact)) {
    compact = `+216${compact}`;
  }
  return compact;
}

export async function checkUserUniqueness({ email, phone, excludeUid = null }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizeTunisianPhone(phone);

  let emailTaken = false;
  let phoneTaken = false;

  if (normalizedEmail) {
    const emailSnap = await db.collection('users').where('email', '==', normalizedEmail).get();
    emailTaken = emailSnap.docs.some((d) => d.id !== excludeUid);
  }

  if (normalizedPhone) {
    const phoneSnap = await db.collection('users').where('phone', '==', normalizedPhone).get();
    phoneTaken = phoneSnap.docs.some((d) => d.id !== excludeUid);
  }

  return {
    available: !emailTaken && !phoneTaken,
    emailTaken,
    phoneTaken,
    normalizedEmail,
    normalizedPhone,
  };
}

export const authService = {
  async checkAvailability({ email, phone }) {
    const res = await checkUserUniqueness({ email, phone });
    return {
      available: res.available,
      emailTaken: res.emailTaken,
      phoneTaken: res.phoneTaken,
    };
  },

  /**
   * Enregistre le profil initial d'un utilisateur après son premier login Firebase.
   * Vérifie l'unicité email/téléphone, assigne le rôle et applique le Custom Claim.
   */
  async registerProfile(currentUser, body) {
    if (!currentUser || !currentUser.uid) {
      throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
    }

    const { role, displayName, phone, filiereId } = body;

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

    const normalizedEmail = normalizeEmail(
      currentUser.email || `${currentUser.uid}@campussave.essect.tn`
    );
    const normalizedPhone = normalizeTunisianPhone(phone);

    const uniqueness = await checkUserUniqueness({
      email: normalizedEmail,
      phone: normalizedPhone,
      excludeUid: currentUser.uid,
    });

    if (uniqueness.emailTaken) {
      throw new AppError(
        'Cette adresse email est déjà associée à un compte existant.',
        409,
        'EMAIL_ALREADY_IN_USE'
      );
    }
    if (uniqueness.phoneTaken) {
      throw new AppError(
        'Ce numéro de téléphone est déjà associé à un autre compte.',
        409,
        'PHONE_ALREADY_IN_USE'
      );
    }

    const now = new Date();
    const userData = {
      uid: currentUser.uid,
      email: normalizedEmail,
      role,
      displayName: displayName.trim(),
      phone: normalizedPhone,
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

    await userRef.set(userData);

    try {
      await auth.setCustomUserClaims(currentUser.uid, { role });
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        throw err;
      }
    }

    return { user: userData };
  },
};
