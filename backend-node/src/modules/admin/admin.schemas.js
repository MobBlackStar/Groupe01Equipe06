// 💡 Concept & Analogie : Schémas Zod pour la modération administrateur exigeant un motif dès qu'une action punitive est engagée.
// 🔄 Comparaison React / Flutter : Valide les actions du panneau d'administration React (`AdminMerchantsPage`).
// 🎯 À retenir pour la soutenance : "Tout refus ou suspension exige obligatoirement un motif explicite consigné dans l'audit trail."
// Module : Administration & Modération

import { z } from 'zod';
import { MERCHANT_STATUS, USER_STATUS } from '../../../../shared/constants.js';

export const updateMerchantStatusSchema = z.object({
  status: z.enum([
    MERCHANT_STATUS.APPROVED,
    MERCHANT_STATUS.REJECTED,
    MERCHANT_STATUS.SUSPENDED,
    MERCHANT_STATUS.PENDING,
  ]),
  statusReason: z.string().optional(),
}).refine(
  (data) => {
    if ([MERCHANT_STATUS.REJECTED, MERCHANT_STATUS.SUSPENDED].includes(data.status)) {
      return !!data.statusReason && data.statusReason.trim().length >= 3;
    }
    return true;
  },
  {
    message: 'Un motif d au moins 3 caractères est obligatoire pour refuser ou suspendre un commerce',
    path: ['statusReason'],
  }
);

export const updateUserStatusSchema = z.object({
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]),
  statusReason: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === USER_STATUS.SUSPENDED) {
      return !!data.statusReason && data.statusReason.trim().length >= 3;
    }
    return true;
  },
  {
    message: 'Un motif d au moins 3 caractères est obligatoire pour suspendre un utilisateur',
    path: ['statusReason'],
  }
);
