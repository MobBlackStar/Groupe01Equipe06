# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day9-report-openapi-final`  

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
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | 🟢 **100% Terminé** | Fedi | Jeu de démo officiel 20 offres et 6 commerces (`seed.js`), réinitialisation instantanée (`resetDemo.js`), configuration SPA Vercel, audit de sécurité Firestore/Express, intégration routes de bout en bout et zéro warning Flutter |
| **Jour 9** | **Rapport Technique & Spécification OpenAPI** | 🟢 **100% Terminé** | Fedi | Chapitres techniques III, IV, V, VII dans `CHAPITRES_TECHNIQUES_3_4_5_7.md`, spécification OpenAPI 3.0 exhaustive (`openapi.yaml`), scan d'hygiène Git (0 secret, 0 fuite) |
| **Jour 10** | **Guide d'Architecture & Répétition Soutenance** | 🟢 **100% Terminé** | Fedi | Mémo d'architecture et de soutenance Feynman (`MEMO_ARCHITECTURE_SOUTENANCE.md`), validation des 137 tests du banc d'essai |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 9 & 10 — 24 & 25 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day9-report-openapi-final`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `docs(report-api): add technical report chapters, complete openapi 3.0 spec, and defense architecture guide`
* **Rédaction Académique des Chapitres Techniques du Rapport (`docs-uml-mockups/report/CHAPITRES_TECHNIQUES_3_4_5_7.md`) :**
  - **Chapitre III (Architecture & Choix Technologiques) :** Justification de l'architecture 3-tiers découplée, pattern CQRS-lite (écritures via API Node.js sécurisée / lectures réactives Firestore `onSnapshot`), domaine mathématique partagé `/shared`, et diagramme de déploiement physique.
  - **Chapitre IV (Conception Détaillée & Schéma NoSQL) :** Modélisation orientée objet par domaines (utilisateurs, offres, commandes), machine à états finis du cycle de vie des commandes (Diagramme UML 09), diagrammes de séquence de référence (Paiement Konnect 07 et Scan QR 08), schéma NoSQL dénormalisé et règles de sécurité par rôle.
  - **Chapitre V (Réalisation, Algorithmes & Sécurité) :** Arithmétique monétaire entière en millimes (0 bug flottant), moteur de tarification dynamique dégressive Smart Decay (0 écriture BDD jusqu'au scellage), isolation transactionnelle sous concurrence extrême (test 20 acheteurs simultanés), double canal idempotent Konnect, cryptographie du Living Ticket 30s HMAC-SHA256 avec tolérance d'horloge et `timingSafeEqual`, parseur culinaire tunisien déterministe de secours (10 scénarios) et radar 3D WebGL MapLibre.
  - **Chapitre VII (Validation, Limites & Perspectives) :** Bilan consolidé des tests (137 tests à 100% de réussite), limites objectives actuelles et axes d'industrialisation (moteur de recherche dédié, passage à l'échelle multi-campus).
* **Spécification Complète OpenAPI 3.0.3 (`docs-uml-mockups/api/openapi.yaml`) :**
  - Couverture intégrale des 30 routes d'API sous le préfixe `/api/v1` (`health`, `auth`, `users`, `merchants`, `offers`, `ai`, `uploads`, `orders`, `payments`, `tickets`, `loyalty`, `radar`, `dashboards`, `impact`, `admin`).
  - Schémas de requêtes et de réponses typés Zod, codes d'erreur normalisés (400, 401, 403, 404, 409, 422, 423), sécurité Bearer JWT Firebase Auth et exemples réalistes contextualisés à Montfleury.
* **Mémo d'Architecture & Guide de Soutenance (`docs-uml-mockups/demo/MEMO_ARCHITECTURE_SOUTENANCE.md`) :**
  - Guide de survie pédagogique Feynman détaillant les commandes de démarrage, le timing oral sur 15 minutes, les 5 fichiers clés à ouvrir dans VS Code (`pricing.js`, `orders.service.js`, `payments.service.js`, `tickets.service.js`, `HoloRadarPage.jsx`) avec explications ligne par ligne, et les réponses aux 5 questions pièges potentielles du jury.
* **Audit Final d'Hygiène Git & Sécurité :**
  - `git ls-files` : **Zéro secret**, zéro clé privée, zéro fichier `.env` ou service account JSON tracé (uniquement des modèles `.example`).
  - Zéro jeton ou étiquette méta non conforme dans les fichiers livrés.
* **Banc de Tests Consolidé :**
  - Total tests backend : **107/107 tests passés avec succès** (12 suites, 0 échec).
  - Total tests shared : **26/26 tests passés avec succès** (0 échec).
  - Total tests Flutter : **4/4 suites passées avec succès**.
  - Analyse Flutter globale : **`No issues found!`** (0 warning, 0 lint).
  - Compilation Web React : validée avec succès sous Vite 5.

---

### Jour 8 — 23 Novembre 2026
* Jeu de données officiel 20 offres et 6 commerces (`seed.js`), réinitialisation instantanée (`resetDemo.js`), configuration SPA Vercel, audit de sécurité Firestore/Express, intégration routes de bout en bout et zéro warning Flutter.

---

### Jour 7 — 22 Novembre 2026
* APIs tableaux de bord par rôle (étudiant, commerçant, admin), impact campus & filières, évaluation des commandes, robot no-show et notifications FCM end-to-end.

---

### Jour 6 — 21 Novembre 2026
* API radar géospatial, MapLibre 3D WebGL, Flutter RadarScreen, tri distance catalogue et profil fidélité.

---

### Jour 5 — 20 Novembre 2026
* Cryptographie cross-runtime 30s HMAC-SHA256, transaction atomique de retrait, Living Ticket tournant Web/Flutter, scanners commerçants caméra et code manuel, WebView Konnect.

---

### Jour 4 — 19 Novembre 2026
* Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente.

---

### Jour 3 — 18 Novembre 2026
* Moteur de calcul partagé `pricing.js` et `rarity.js` (25 vecteurs).
* Module commerces, modération admin, upload Cloudinary, CRUD offres, IA générative et sélecteurs de carte.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour le Rapport & la Démo |
| :--- | :--- | :---: | :--- |
| **Chapitres Techniques Rapport** | `docs-uml-mockups/report/CHAPITRES_TECHNIQUES_3_4_5_7.md` | 🟢 **Disponible** | Contient les chapitres III, IV, V et VII complets en style académique prêt pour assemblage final. |
| **Spécification OpenAPI 3.0** | `docs-uml-mockups/api/openapi.yaml` | 🟢 **Opérationnel** | Documente l'intégralité des 30 routes d'API pour le jury et la documentation Swagger. |
| **Mémo d'Architecture Soutenance** | `docs-uml-mockups/demo/MEMO_ARCHITECTURE_SOUTENANCE.md` | 🟢 **Disponible** | Guide de répétition avec les 5 fichiers de code à montrer et les réponses aux questions du jury. |
| **Script de Seed Officiel** | `backend-node/scripts/seed.js` (`npm run seed`) | 🟢 **Opérationnel** | Initialise 6 commerces (1 pending), 20 offres (3 surprise boxes), 8 étudiants (Yassine à 90 pts), admin et 14 jours d'historique. |
| **Script de Reset Démo** | `backend-node/scripts/resetDemo.js` (`npm run reset-demo`) | 🟢 **Opérationnel** | Nettoie les commandes/paiements de test et réinjecte le seed propre en 3 secondes avant la soutenance. |
| **Config Déploiement Vercel** | `web-react/vercel.json` | 🟢 **Opérationnel** | Configure la réécriture universelle des routes SPA (`/* -> /index.html`) pour un hébergement zéro défaut. |
| **Guide Déploiement & Tunneling** | `backend-node/README.md` | 🟢 **Opérationnel** | Documentation détaillée pour exposer l'API via Cloudflare Tunnel / ngrok et déployer sur Render / Cloud Run. |
| **API Dashboard Étudiant** | `GET /api/v1/dashboards/student` | 🟢 **Opérationnel** | Fournit `{ stats, loyalty, equivalences, savingsBreakdown, recentOrders }` pour `StudentDashboard.jsx`. |
| **API Dashboard Commerçant** | `GET /api/v1/dashboards/merchant?range=7d` | 🟢 **Opérationnel** | Supporte `?range=7d` et `?range=30d` ; renvoie `{ stats, dailySeries, topOffers }`. |
| **API Dashboard Admin** | `GET /api/v1/dashboards/admin` | 🟢 **Opérationnel** | Renvoie `{ usersByRole, merchantsByStatus, ordersByStatus, platformRevenueMillimes, globalImpact }`. |
| **API Impact Global** | `GET /api/v1/impact/global?days=14` | 🟢 **Opérationnel** | Totaux du campus, équivalences réelles et série chronologique pour `ImpactDashboardPage.jsx` (`/impact`). |
| **API Classement Filières** | `GET /api/v1/impact/filieres` | 🟢 **Opérationnel** | Classement des 5 filières ESSECT pour le tableau des scores (`FiliereLeaderboard`). |
| **Montfleury Holo-Radar 3D (Web)** | `web-react/src/features/radar/HoloRadarPage.jsx` | 🟢 **Opérationnel** | Route `/app/radar` accessible directement pour les étudiants ; vue 3D WebGL inclinée. |
| **Écran Radar Mobile (Flutter)** | `mobile-flutter/lib/features/radar/radar_screen.dart` | 🟢 **Opérationnel** | Route `/radar` et `/student/radar` avec carte CartoDB Dark Matter et bottom sheet commerces. |
| **Composant RotatingQr (Web)** | `web-react/src/features/ticket/RotatingQr.jsx` | 🟢 **Prêt à l'emploi** | Intégré dans `LivingTicketPage.jsx`. |
| **Widget RotatingQr (Mobile)** | `mobile-flutter/lib/features/ticket/rotating_qr.dart` | 🟢 **Prêt à l'emploi** | Intégré dans `ticket_screen.dart`. |
