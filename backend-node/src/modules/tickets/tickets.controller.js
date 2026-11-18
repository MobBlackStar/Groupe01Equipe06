// 💡 Concept & Analogie : Contrôleur gérant les scans de tickets et les saisies manuelles transmises par les commerçants.
// 🔄 Comparaison React / Flutter : Point de terminaison appelé par `MerchantScanPage.jsx` sous React et `scanner_screen.dart` sous Flutter.
// 🎯 À retenir pour la soutenance : "Ce contrôleur injecte le merchantId vérifié par le token Firebase et transmet la demande au service transactionnel."
// Module : Cryptographie & Retrait de Commandes

import { ticketsService } from './tickets.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const ticketsController = {
  scanTicket: asyncHandler(async (req, res) => {
    const result = await ticketsService.scanTicket(req.merchant?.id || req.user.uid, req.body.qrPayload);
    res.json(result);
  }),

  redeemCode: asyncHandler(async (req, res) => {
    const result = await ticketsService.redeemCode(
      req.merchant?.id || req.user.uid,
      req.body.orderCode,
      req.body.code6
    );
    res.json(result);
  }),
};
