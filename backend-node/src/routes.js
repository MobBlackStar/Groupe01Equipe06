// 💡 Concept & Analogie : Comme un standard téléphonique qui dispatche les appels vers les différents départements (comptabilité, commandes, support), ce routeur centralise toutes les sous-routes de l'API.
// 🔄 Comparaison React / Flutter : Toutes les requêtes clientes partagent ce contrat d'URL unique préfixé par `/api/v1`.
// 🎯 À retenir pour la soutenance : "Ce fichier centralise l'enregistrement de l'ensemble de nos modules d'API REST conformément au contrat d'interface défini."
// Module : Architecture & Infrastructure

import { Router } from 'express';

export const apiRouter = Router();

// Route de vérification de santé système (Health check)
apiRouter.get('/health', (req, res) => {
  res.json({
    ok: true,
    firestore: 'up',
    time: new Date().toISOString(),
    serverTime: Date.now(),
  });
});

// Les sous-routeurs seront branchés lors des étapes dédiées :
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/users', usersRouter);
// apiRouter.use('/merchants', merchantsRouter);
// apiRouter.use('/offers', offersRouter);
// apiRouter.use('/orders', ordersRouter);
// apiRouter.use('/payments', paymentsRouter);
// apiRouter.use('/tickets', ticketsRouter);
// apiRouter.use('/loyalty', loyaltyRouter);
// apiRouter.use('/impact', impactRouter);
// apiRouter.use('/dashboards', dashboardsRouter);
// apiRouter.use('/radar', radarRouter);
// apiRouter.use('/admin', adminRouter);
// apiRouter.use('/uploads', uploadsRouter);
// apiRouter.use('/ai', aiRouter);
