// 💡 Concept & Analogie : Comme un standard téléphonique qui dispatche les appels vers les différents départements (comptabilité, commandes, support), ce routeur centralise toutes les sous-routes de l'API.
// 🔄 Comparaison React / Flutter : Toutes les requêtes clientes partagent ce contrat d'URL unique préfixé par `/api/v1`.
// 🎯 À retenir pour la soutenance : "Ce fichier centralise l'enregistrement de l'ensemble de nos modules d'API REST conformément au contrat d'interface défini."
// Module : Architecture & Infrastructure

import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { merchantsRouter } from './modules/merchants/merchants.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { offersRouter } from './modules/offers/offers.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { radarRouter } from './modules/radar/radar.routes.js';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes.js';
import { dashboardsRouter } from './modules/dashboards/dashboards.routes.js';
import { impactRouter } from './modules/impact/impact.routes.js';
import { getEmailProviderStatus } from './modules/notifications/email.service.js';

export const apiRouter = Router();

// Route de vérification de santé système (Health check)
apiRouter.get('/health', (req, res) => {
  res.json({
    ok: true,
    firestore: 'up',
    mailProvider: getEmailProviderStatus().activeProvider,
    time: new Date().toISOString(),
    serverTime: Date.now(),
  });
});

// Authentification et Profils Utilisateurs (Jour 2)
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);

// Commerces, Administration, Médias, Offres et IA (Jour 3)
apiRouter.use('/merchants', merchantsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/offers', offersRouter);
apiRouter.use('/ai', aiRouter);

// Commandes, Réservations et Paiements Konnect (Jour 4)
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/payments', paymentsRouter);

// Retrait de commandes & Living Ticket (Jour 5)
apiRouter.use('/tickets', ticketsRouter);

// Radar Géospatial & Programme de Fidélité (Jour 6)
apiRouter.use('/radar', radarRouter);
apiRouter.use('/loyalty', loyaltyRouter);

// Tableaux de Bord & Impact Écologique (Jour 7)
apiRouter.use('/dashboards', dashboardsRouter);
apiRouter.use('/impact', impactRouter);
