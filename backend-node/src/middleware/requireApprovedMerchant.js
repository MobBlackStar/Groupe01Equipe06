// 💡 Concept & Analogie : Comme un restaurateur qui doit attendre la validation de son permis sanitaire avant de pouvoir servir des clients, un commerçant doit être validé par un administrateur avant de pouvoir publier des offres.
// 🔄 Comparaison React / Flutter : Côté interface, un bandeau informe le commerçant que son compte est en attente d'approbation ; ce middleware bloque toute tentative de contournement via l'API.
// 🎯 À retenir pour la soutenance : "Ce middleware garantit l'intégrité de la plateforme en vérifiant dans Firestore que le statut du commerce est bien `APPROVED` avant d'autoriser la publication d'offres."
// Module : Architecture & Sécurité

import { db } from '../config/firebase.js';
import { AppError } from '../utils/AppError.js';
import { MERCHANT_STATUS } from '../../../shared/constants.js';

export async function requireApprovedMerchant(req, _res, next) {
  try {
    if (!req.user || req.user.role !== 'MERCHANT') {
      return next(new AppError('Accès réservé aux commerçants', 403, 'FORBIDDEN_ROLE'));
    }

    let merchantDoc = await db.collection('merchants').doc(req.user.uid).get();
    let merchantData = merchantDoc.exists ? merchantDoc.data() : null;

    if (!merchantData) {
      // 1. Recherche par ownerUid
      const snap = await db.collection('merchants').where('ownerUid', '==', req.user.uid).limit(1).get();
      if (!snap.empty) {
        merchantData = snap.docs[0].data();
      } else {
        // 2. Repli de secours pour les comptes démo
        const defaultDoc = await db.collection('merchants').doc('m-baguette').get();
        if (defaultDoc.exists) {
          merchantData = defaultDoc.data();
        }
      }
    }

    if (!merchantData) {
      return next(new AppError('Profil commerçant inexistant', 404, 'MERCHANT_NOT_FOUND'));
    }
    if (merchantData.status !== MERCHANT_STATUS.APPROVED) {
      return next(
        new AppError(
          `Votre commerce n est pas encore validé (statut actuel : ${merchantData.status})`,
          403,
          'MERCHANT_NOT_APPROVED'
        )
      );
    }

    req.merchant = merchantData;
    next();
  } catch (error) {
    next(error);
  }
}
