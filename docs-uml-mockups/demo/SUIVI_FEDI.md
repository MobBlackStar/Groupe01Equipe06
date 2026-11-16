# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day7-dashboards-impact-fcm`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | 🟢 **100% Terminé** | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, `GET/PATCH /users/me`, règles Firestore, `createAdmin.js`, endpoints clients, mocks 6 commerces, `LoginPage.jsx` & `login_screen.dart` (boutons 1-clic démo) |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | 🟢 **100% Terminé** | Fedi | API commerces, modération admin, upload Cloudinary, CRUD offres, IA générative & fallback tunisien, sélecteurs de carte Web/Mobile |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Fedi | Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente |
| **Jour 5** | **Living Ticket HMAC, Scan Atomique & Scanners** | 🟢 **100% Terminé** | Fedi | Cryptographie cross-runtime 30s HMAC-SHA256, transaction atomique de retrait, Living Ticket tournant Web/Flutter, scanners commerçants caméra et code manuel, WebView Konnect |
| **Jour 6** | **Fonctionnalités Bonus : Radar 3D, Mystery Box & Fidélité** | 🟢 **100% Terminé** | Fedi | API radar géospatial, MapLibre 3D WebGL, Flutter RadarScreen, tri distance catalogue et profil fidélité |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | 🟢 **100% Terminé** | Fedi | APIs tableaux de bord par rôle (étudiant, commerçant, admin), impact campus & filières, évaluation des commandes, robot no-show et notifications FCM end-to-end |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 7 — 22 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day7-dashboards-impact-fcm`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(dashboards-impact): add role analytics endpoints, campus impact and filiere rankings, order ratings, and fcm notifications`
* **APIs Tableaux de Bord par Rôle (`backend-node/src/modules/dashboards/`) :**
  - `GET /api/v1/dashboards/student` (rôle `STUDENT`) : consolidation des indicateurs personnels (`ordersCompleted`, `totalSpentMillimes`, `totalSavedMillimes`, `foodSavedGrams`, `co2SavedGrams`, `noShows`), synthèse fidélité (`ecoPoints`, `loyaltyTier`, `nextRewardAt`, `totalMealsRescued`), équivalences écologiques converties (smartphones chargés, km voiture évités), historique des 10 dernières commandes et ventilation des économies hebdomadaires et mensuelles.
  - `GET /api/v1/dashboards/merchant?range=7d|30d` (rôle `MERCHANT`) : indicateurs de performance (`offersPublished`, `ordersPaid`, `ordersCompleted`, `noShows`, `revenueMillimes`, `foodSavedGrams`, `mealsRescued`), note moyenne et nombre d'avis (`ratingAvg`, `ratingCount`), calcul du taux de no-show (`(noShows / (ordersCompleted + noShows)) * 100`), série temporelle journalière sur 7 ou 30 jours, et palmarès des 5 offres les plus vendues (`quantitySold`).
  - `GET /api/v1/dashboards/admin` (rôle `ADMIN`) : requêtes d'agrégation natives `count()` Firestore (avec repli mémoire) pour dénombrer les utilisateurs par rôle (`STUDENT`, `MERCHANT`, `ADMIN`), les commerces par statut (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`), les commandes par étape (`RESERVED`, `PAID`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW`), et le volume d'affaires global.
* **Impact Campus & Classement des Filières (`backend-node/src/modules/impact/`) :**
  - `GET /api/v1/impact/global?days=14` (public) : compteurs globaux de la plateforme, équivalences écologiques certifiées (ratio FAO 2.5 g CO2 / g aliment sauvé, facteurs EPA 10 g / charge smartphone et 244 g / km voiture), et série chronologique sur 14 jours.
  - `GET /api/v1/impact/filieres` (public) : classement des 5 filières de l'ESSECT Montfleury (`EBUSINESS_3A`, `FINANCE`, `MARKETING`, `GESTION`, `COMPTABILITE`) ordonnées par CO2 évité décroissant et total d'EcoPoints.
  - Hook React réactif [useCampusImpact.js](file:///c:/wamp64/www/CampusSave-Workspace/campussave/web-react/src/hooks/useCampusImpact.js) avec synchronisation et données de secours complètes.
* **Évaluation des Commandes (`POST /api/v1/orders/:id/rating`) :**
  - Endpoint réservé à l'étudiant propriétaire de la commande avec vérification stricte du statut `COMPLETED`.
  - Contrôle d'évaluation unique (`409 ALREADY_RATED` si déjà notée).
  - Validation du payload Zod `{ stars: int 1..5, comment?: string <= 280 }`.
  - Transaction Firestore atomique mettant à jour la commande et recalculant instantanément la note moyenne et le nombre d'avis du commerce (`ratingSum`, `ratingCount`, `ratingAvg`).
* **Robot Superviseur des Non-Présentations (`backend-node/src/jobs/noShowSweeper.js`) :**
  - Tâche d'arrière-plan cadencée toutes les 5 minutes (`.unref()`, garde d'exécution anti-chevauchement).
  - Détection et rappel : expédie la notification push FCM `PICKUP_REMINDER` aux étudiants dont le créneau expire dans moins de 30 minutes (marquage `reminderSent: true` pour envoi unique).
  - Clôture automatique : bascule les commandes payées non réclamées 30 minutes après la fin du créneau vers le statut `NO_SHOW`, et incrémente atomiquement les statistiques de non-présentation de l'étudiant et du commerçant.
* **Service de Notifications Push FCM End-to-End (`backend-node/src/modules/notifications/fcm.service.js`) :**
  - Implémentation complète des 7 événements de notification :
    1. `MERCHANT_STATUS` ➔ Commerçant (approbation / suspension).
    2. `ORDER_PAID` ➔ Commerçant (commande payée prête à préparer).
    3. `TICKET_READY` ➔ Étudiant (Living Ticket prêt avec QR dynamique).
    4. `PICKUP_REMINDER` ➔ Étudiant (rappel avant expiration du créneau).
    5. `ORDER_COMPLETED` ➔ Étudiant (sauvetage réussi, EcoPoints crédités).
    6. `REWARD_UNLOCKED` ➔ Étudiant (déblocage d'un bon de réduction).
    7. `NEW_OFFER` ➔ Topic `new-offers` (nouveaux paniers surprise, bridé à max 1 envoi par heure par boutique).
  - Mécanisme d'élagage automatique des jetons obsolètes (*Dead Token Pruning*) retirant de Firestore les jetons `registration-token-not-registered`.
  - Service Worker Web [firebase-messaging-sw.js](file:///c:/wamp64/www/CampusSave-Workspace/campussave/web-react/public/firebase-messaging-sw.js) avec routage contextuel au clic.
  - Service Flutter [fcm_service.dart](file:///c:/wamp64/www/CampusSave-Workspace/campussave/mobile-flutter/lib/services/fcm_service.dart) avec écouteur d'arrière-plan `@pragma('vm:entry-point')` et souscription au topic `new-offers`.
* **Banc de Tests & Validation Technique :**
  - [dashboards.impact.rating.test.js](file:///c:/wamp64/www/CampusSave-Workspace/campussave/backend-node/tests/dashboards.impact.rating.test.js) : 10 tests unitaires validant l'impact écologique, les tableaux de bord étudiant/commerçant/admin, le classement des filières, l'évaluation des commandes et le robot superviseur.
  - Total tests backend : **101/101 tests passés avec succès** (0 échec).
  - Total tests shared : **26/26 tests passés avec succès** (0 échec).
  - Total tests Flutter : **4/4 suites passées avec succès**, analyse Dart sur les fichiers modifiés avec **zéro avertissement**.
  - Compilation Web React : validée avec succès (`vite build` en 10.88s).

---

### Jour 6 — 21 Novembre 2026
* API radar géospatial, MapLibre 3D WebGL, Flutter RadarScreen, tri distance catalogue et profil fidélité.

---

### Jour 5 — 20 Novembre 2026
* Cryptographie Living Ticket 30s HMAC-SHA256, transaction atomique de retrait, Living Ticket tournant Web/Flutter, scanners commerçants caméra et code manuel, WebView Konnect.

---

### Jour 4 — 19 Novembre 2026
* Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente.

---

### Jour 3 — 18 Novembre 2026
* Moteur de calcul partagé `pricing.js` et `rarity.js` (25 vecteurs).
* Module commerces, modération admin, upload Cloudinary, CRUD offres, IA générative et sélecteurs de carte.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour l'Interface |
| :--- | :--- | :---: | :--- |
| **API Dashboard Étudiant** | `GET /api/v1/dashboards/student` | 🟢 **Opérationnel** | Fournit `{ stats, loyalty, equivalences, savingsBreakdown, recentOrders }` pour alimenter `StudentDashboard.jsx` et `student_dashboard_screen.dart`. |
| **API Dashboard Commerçant** | `GET /api/v1/dashboards/merchant?range=7d` | 🟢 **Opérationnel** | Supporte `?range=7d` et `?range=30d` ; renvoie `{ stats, dailySeries, topOffers }` pour les graphiques de ventes et no-show. |
| **API Dashboard Admin** | `GET /api/v1/dashboards/admin` | 🟢 **Opérationnel** | Renvoie `{ usersByRole, merchantsByStatus, ordersByStatus, platformRevenueMillimes, globalImpact }` pour `AdminDashboard.jsx`. |
| **API Impact Global** | `GET /api/v1/impact/global?days=14` | 🟢 **Opérationnel** | Endpoint public renvoyant les totaux du campus, les équivalences réelles et la série chronologique pour `ImpactDashboardPage.jsx` (`/impact`). |
| **API Classement Filières** | `GET /api/v1/impact/filieres` | 🟢 **Opérationnel** | Endpoint public listant les 5 filières ESSECT triées par impact écologique pour le tableau des scores (`FiliereLeaderboard`). |
| **Hook useCampusImpact** | `web-react/src/hooks/useCampusImpact.js` | 🟢 **Prêt à l'emploi** | `const { globalImpact, equivalences, dailySeries, filieres, loading, refresh } = useCampusImpact(14);`. |
| **API Évaluation Commande** | `POST /api/v1/orders/:id/rating` | 🟢 **Opérationnel** | Prend `{ stars, comment }` et met à jour instantanément la note moyenne du commerce pour `RatingDialog.jsx`. |
| **Robot No-Show & Rappels** | `backend-node/src/jobs/noShowSweeper.js` | 🟢 **Opérationnel** | Tourne en tâche de fond (.unref()) pour envoyer le rappel push H-30min et clôturer en NO_SHOW. |
| **Service Notifications FCM** | `backend-node/src/modules/notifications/fcm.service.js` | 🟢 **Opérationnel** | Gère les 7 événements de notification, le topic `new-offers` et l'élagage des jetons morts. |
| **Montfleury Holo-Radar 3D (Web)** | `web-react/src/features/radar/HoloRadarPage.jsx` | 🟢 **Opérationnel** | Route `/app/radar` accessible directement pour les étudiants ; vue 3D WebGL inclinée avec travelling drone. |
| **Écran Radar Mobile (Flutter)** | `mobile-flutter/lib/features/radar/radar_screen.dart` | 🟢 **Opérationnel** | Route `/radar` et `/student/radar` avec carte CartoDB Dark Matter, chips de rayon et bottom sheet commerces. |
| **Composant RotatingQr (Web)** | `web-react/src/features/ticket/RotatingQr.jsx` | 🟢 **Prêt à l'emploi** | Intégré dans `LivingTicketPage.jsx`. |
| **Widget RotatingQr (Mobile)** | `mobile-flutter/lib/features/ticket/rotating_qr.dart` | 🟢 **Prêt à l'emploi** | Intégré dans `ticket_screen.dart`. |
