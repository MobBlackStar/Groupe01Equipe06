# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day8-day9-polish-report-docs`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | 🟢 **100% Terminé** | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web (11 composants) & Mobile Flutter, 6 maquettes Hi-Fi |
| **Jour 3** | **Gestion Commerces, Offres IA & Console Admin** | 🟢 **100% Terminé** | Ritej | Onboarding commerçant géolocalisé, formulaire d'offres IA + Smart Decay SVG, catalogue commerçant, console validation admin, 3 écrans Flutter, banc de test IA (11/11 tests passés) |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Ritej | `BrowsePage`, recherche avec debounce (300 ms), panneau filtres, `PriceTicker` & `OfferCard`, `OfferDetailPage` avec impact éco et gestion 409, 6 composants/écrans Flutter |
| **Jour 5** | **Paiement Konnect & Living Ticket QR** | 🟢 **100% Terminé** | Ritej | `CheckoutPage` (compte à rebours 10 min, prix verrouillé, récompenses fidélité), `PaymentReturnPage` (états Konnect), `BoardingPass` & `LivingTicketPage` (QR tournant 30s + code 6 chiffres), `MyOrdersPage`, `MerchantOrdersPage`, 5 écrans Flutter |
| **Jour 6** | **Fonctionnalités Clés : Panier Mystère & Fidélité** | 🟢 **100% Terminé** | Ritej | `MysteryBoxCard` (3 raretés), animation unboxing 5 étapes Framer Motion, carte fidélité éco-digitale (5 tampons, 4 paliers végétaux, portefeuille coupons), 2 modules Flutter natifs |
| **Jour 7** | **Tableaux de Bord, Impact Éco & Notifications** | 🟢 **100% Terminé** | Ritej | 3 Dashboards par rôle (`Student`, `Merchant` 7d/30d, `Admin`), page publique `/impact`, tuiles EPA/FAO, `FiliereLeaderboard` (5 filières), modale notation 1-5 étoiles, 3 écrans Flutter |
| **Jour 8** | **Layouts Responsifs, Dictionnaire d'Erreurs & Galeries D1** | 🟢 **100% Terminé** | Ritej | Navigation unifiée Web/Flutter (360/768/1440px), switcher de rôle 1-clic demo, dictionnaire erreurs FR (§6), 4 planches SVG finales haute résolution |
| **Jour 9** | **Rapport Académique ESSECT, READMEs & Kit Soutenance** | 🟢 **100% Terminé** | Ritej | Rapport académique 6 chapitres aux normes ESSECT, 3 READMEs officiels (Root, Web, Mobile), script de démo 7 min et 25 questions/réponses jury |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

### Jours 8 & 9 — 23 & 24 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day8-day9-polish-report-docs`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `docs(release): add unified responsive layouts, french error messages, official readmes, full academic report, and defense kit`
* **Navigation Unifiée & Layouts Responsifs (`web-react/src/components/layout/`) :**
  - `Navbar.jsx` : Barre de navigation universelle avec logo néon, menus adaptatifs selon le rôle, lien direct `/impact` pour le public, badge de profil étudiant avec solde EcoPoints, et sélecteur interactif de rôle 1-clic (`[Étudiant 🎓 | Commerçant 🏪 | Admin 🛡️]`) exécutant `loginDemo(role)` en 1 seconde devant le jury.
  - `Footer.jsx` : Pied de page universitaire officiel avec mentions ESSECT Montfleury, citation FAO 2013 sur l'impact carbone, crédits d'équipe et liens institutionnels.
  - `StudentLayout.jsx` : Layout étudiant unifié combinant Navbar, `<Outlet />`, Footer et barre de navigation mobile tactile (`BottomNavigation` fixe en bas pour `360px` - `768px`) à 5 onglets (Explorer, Radar 3D, Commandes, Fidélité, Dashboard).
  - `MerchantLayout.jsx` : Layout commerçant avec barre mobile à 5 onglets (Stats, Offres, + Publier, Scanner, Retraits).
  - `AdminLayout.jsx` : Layout console d'administration épuré.
  - `index.js` : Export barrel propre de la suite de navigation.
  - `AppRouter.jsx` : Structuration de l'arbre de routage sous `<StudentLayout>`, `<MerchantLayout>`, et `<AdminLayout>`, garantissant 0 rupture d'ergonomie et 0 débordement horizontal (`overflow-x: hidden`).
* **Dictionnaire Centralisé des Erreurs en Français (`web-react/src/lib/errorMessages.js`) :**
  - Traduction élégante et pédagogique de tous les codes d'erreur de la spécification §6 (`OFFER_SOLD_OUT`, `OFFER_EXPIRED`, `REWARD_UNAVAILABLE`, `TOO_FAR`, `OFFER_LOCKED`, `INVALID_SIGNATURE`, `WRONG_MERCHANT`, `ALREADY_USED`, `NOT_PAID`, `TICKET_EXPIRED`, `PICKUP_WINDOW_CLOSED`, `TICKET_LOCKED`, `MERCHANT_NOT_APPROVED`, `PROFILE_EXISTS`, etc.).
  - Fonction helper `getErrorMessage(code, fallback)` exportée pour tout le frontend.
* **Navigation Mobile Flutter Équivalente (`mobile-flutter/lib/app/router.dart`) :**
  - Remplacement des stubs par des `StatefulWidget` complets : `StudentShell` (5 onglets : `ExploreScreen`, `RadarScreen`, `MyOrdersScreen`, `LoyaltyCardScreen`, `StudentDashboardScreen`) et `MerchantShell` (5 onglets : `MerchantDashboardScreen`, `MerchantOffersScreen`, `ScannerScreen`, `MerchantOrdersScreen`, `MerchantStoreScreen`).
  - `BottomNavigationBar` sombre `#161920`, icônes `LucideIcons` adaptées et gestion de navigation fluide sans débordement `RenderFlex`.
* **Galerie des Écrans Finaux (Livrable D1) (`docs-uml-mockups/mockups/final-screens/`) :**
  - `01-final-web-student-journey.svg` : Planche vectorielle haute définition (Catalogue & PriceTicker, Holo-Radar 3D, Checkout décompte 10 min, Living Ticket Boarding Pass QR rotatif 30s).
  - `02-final-web-merchant-ai-radar.svg` : Planche vectorielle haute définition (Onboarding commerçant avec MapPicker $\le$ 3 km, Magic Offer Publisher IA, aperçu courbe Smart Decay, scanner QR caméra et code 6 chiffres).
  - `03-final-mobile-flutter-screens.svg` : Planche vectorielle haute définition (Shells 5 onglets Étudiant & Commerçant, Holo-Radar mobile, Mystery Box unboxing haptique, carte fidélité éco).
  - `04-final-dashboards-impact-loyalty.svg` : Planche vectorielle haute définition (Dashboard Étudiant, Dashboard Commerçant 7j/30j, Dashboard Admin, Vitrine publique d'impact avec tuiles EPA/FAO, podium 5 filières ESSECT).
  - `README.md` : Index exhaustif et rapport de conformité ergonomique (360/768/1440px).
* **READMEs Officiels de Documentation (Livrable G4) :**
  - `campussave/README.md` : Guide maître du monorepo avec matrice de traçabilité complète des exigences M1-M8 et B1-B4, 6 mécaniques intelligentes, architecture monorepo, guide d'installation étape par étape, tableau des variables d'environnement (zéro secret), identifiants de démonstration et répartition rigoureuse du travail binôme.
  - `campussave/web-react/README.md` : Guide complet React 18, palette Dark Obsidian, commandes npm et arborescence.
  - `campussave/mobile-flutter/README.md` : Guide d'exécution Flutter, commandes `--dart-define` pour émulateur et appareil physique sur port 5000, et arborescence.
* **Rapport Académique ESSECT & Kit de Soutenance :**
  - `docs-uml-mockups/report/RAPPORT_PROJET_CAMPUSSAVE.md` : Rapport de projet complet de 6 chapitres aux normes académiques ESSECT, prêt pour conversion PDF (page de garde officielle, résumés français et anglais, analyse du besoin, architecture 3-tiers temps réel, modélisation UML & NoSQL, algorithmes intelligents et cryptographie, réalisation Web & Mobile, stratégie de test et bibliographie officielle).
  - `docs-uml-mockups/demo/DEMO_SCRIPT.md` : Scénario minuté de soutenance de 7 minutes exactement, équitablement réparti entre Ritej et Fedi (3 min 30 s chacun), démontrant la synchronisation temps réel React Web ↔ Flutter Mobile.
  - `docs-uml-mockups/demo/DEFENSE_QA.md` : Guide de préparation à la soutenance comprenant 25 questions/réponses pointues du jury réparties en 5 catégories (Architecture, Sécurité, Modèle Métier, Frontend/UI, Scénarios d'urgence).
* **Contrôle Qualité :**
  - `npm run build` dans `web-react` : **2730 modules compilés avec 0 erreur**.
  - `npm test` dans `backend-node` : **101/101 tests passés avec 0 échec (durée ~2.9s)**.

---

### Jour 7 — 22 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day7-dashboards-impact`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(dashboards-impact): add student, merchant, and admin analytics dashboards, public campus impact page, filiere leaderboard, and order rating dialog`
* **Bibliothèque de Graphiques Recharts (`web-react/src/components/charts/`) :**
  - `KpiCard.jsx`, `LineChartCard.jsx`, `BarChartCard.jsx`, `index.js`.
* **Les 3 Tableaux de Bord par Rôle Web React :**
  - `web-react/src/features/dashboards/StudentDashboard.jsx` (`/app/dashboard`).
  - `web-react/src/features/merchant/MerchantDashboard.jsx` (`/merchant/dashboard`).
  - `web-react/src/features/admin/AdminDashboard.jsx` (`/admin/dashboard`).
* **Vitrine d'Impact Public & Challenge Inter-Filières (`web-react/src/features/impact/`) :**
  - `EquivalenceTiles.jsx`, `FiliereLeaderboard.jsx`, `ImpactDashboardPage.jsx` (`/impact`).
* **Système d'Évaluation 1 à 5 Étoiles :**
  - `web-react/src/features/orders/RatingDialog.jsx`.
* **Composants & Écrans Mobiles Flutter Équivalents (`mobile-flutter/lib/`) :**
  - `widgets/kpi_tile.dart`, `student_dashboard_screen.dart`, `merchant_dashboard_screen.dart`, `impact_screen.dart`.

---

### Jour 6 — 21 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day6-loyalty-mystery-box`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(loyalty-surprise): add digital eco-loyalty card, 5-stamp grid, reward wallet, mystery box cards, and unboxing reveal animation`

---

### Jour 5 — 20 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day5-checkout-living-ticket`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(orders-ui): add checkout countdown, konnect return states, living ticket boarding pass, and order management screens`

---

### Jour 4 — 19 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day4-explore-catalogue`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(explore-ui): add student offer catalogue, debounced search, live smart decay ticker, and offer detail screens`

---

### Jour 3 — 18 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day3-merchants-offers`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(merchant-ui): add merchant onboarding, ai offer form with smart decay curve, and admin validation console`

---

### Jour 2 — 17 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day2-identity-ui`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(auth-ui): add design system ui kit, register and profile screens, and hifi mockups`

---

### Jour 1 — 16 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day1-onboarding`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `docs(mockups): add low-fi wireframes, merchant seed data, and progress log`

---

## 🤝 3. Points de Synchronisation & Handoff pour Fedi

| Livrable Partagé | Emplacement | Statut pour Fedi | Route API Backend Correspondante (§6) |
| :--- | :--- | :---: | :--- |
| **Layouts & Navigation** | `web-react/src/components/layout/` | 🟢 **100% Fonctionnel & Responsive** | `/app/*`, `/merchant/*`, `/admin/*`, `/impact` |
| **Dictionnaire Erreurs FR** | `web-react/src/lib/errorMessages.js` | 🟢 **100% Aligné sur §6** | Tous les codes d'erreur backend (400, 401, 403, 404, 409, 423) |
| **Navigation Flutter** | `mobile-flutter/lib/app/router.dart` | 🟢 **100% Fonctionnel** | Shells 5 onglets Étudiant & Commerçant |
| **Galerie Écrans Finaux D1** | `docs-uml-mockups/mockups/final-screens/` | 🟢 **4 Planches SVG HD Prêtes** | Revue ergonomique 360/768/1440px |
| **README Monorepo G4** | `campussave/README.md` | 🟢 **Documentation Maître Prête** | Matrice M1-M8 / B1-B4, env, démo, binôme |
| **Rapport Académique ESSECT** | `docs-uml-mockups/report/RAPPORT_PROJET_CAMPUSSAVE.md` | 🟢 **6 Chapitres Rédigés** | Document académique prêt pour conversion PDF |
| **Script Soutenance (7 min)** | `docs-uml-mockups/demo/DEMO_SCRIPT.md` | 🟢 **Filage Équilibré A / B Prêt** | Répétitions binôme minute par minute |
| **Guide Questions Jury** | `docs-uml-mockups/demo/DEFENSE_QA.md` | 🟢 **25 Q&A Stratégiques Prêtes** | Préparation orale aux questions pièges |
| **Checkout & Réservation** | `web-react/src/features/checkout/CheckoutPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/payments/konnect/init` et `POST /api/v1/orders/:id/cancel` |
| **Confirmation Konnect** | `web-react/src/features/checkout/PaymentReturnPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/payments/konnect/verify` |
| **Living Ticket QR** | `web-react/src/features/ticket/LivingTicketPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/orders/:id/ticket` |
| **Commandes Étudiant** | `web-react/src/features/orders/MyOrdersPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/orders/my-orders` |
| **Retraits Commerçant** | `web-react/src/features/merchant/MerchantOrdersPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/merchants/me/orders` |
| **Checkout Mobile** | `mobile-flutter/lib/features/checkout/checkout_screen.dart` | 🟢 **Prêt pour le branchement** | `POST /api/v1/payments/konnect/init` |
| **Living Ticket Mobile** | `mobile-flutter/lib/features/ticket/ticket_screen.dart` | 🟢 **Prêt pour le branchement** | `GET /api/v1/orders/:id/ticket` |
| **Catalogue & Recherche** | `web-react/src/features/explore/BrowsePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers` |
| **Fiche Détail d'Offre** | `web-react/src/features/explore/OfferDetailPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers/:id` et `POST /api/v1/orders` |
| **Paniers Surprise & Unboxing** | `web-react/src/features/surprise/UnboxingReveal.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/tickets/scan` (déclenchement à la validation) |
| **Carte de Fidélité Éco** | `web-react/src/features/loyalty/LoyaltyCardPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/loyalty/me` et `POST /api/v1/orders` (application des coupons) |
| **Unboxing Mobile** | `mobile-flutter/lib/features/surprise/unboxing_overlay.dart` | 🟢 **Prêt pour le branchement** | Déclenchement automatique sur écran ticket |
| **Fidélité Mobile** | `mobile-flutter/lib/features/loyalty/loyalty_card_screen.dart` | 🟢 **Prêt pour le branchement** | `GET /api/v1/loyalty/me` |
| **Dashboard Étudiant** | `web-react/src/features/dashboards/StudentDashboard.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/student` |
| **Dashboard Commerçant** | `web-react/src/features/merchant/MerchantDashboard.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/merchant?range=7d\|30d` |
| **Dashboard Admin** | `web-react/src/features/admin/AdminDashboard.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/admin` |
| **Impact Public & Filières** | `web-react/src/features/impact/ImpactDashboardPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/impact/global` et `GET /api/v1/impact/filieres` |
| **Évaluation Commandes** | `web-react/src/features/orders/RatingDialog.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/orders/:id/rating` |
| **Dashboards & Impact Mobile** | `mobile-flutter/lib/features/dashboards/` & `impact/` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/*` et `GET /api/v1/impact/*` |
