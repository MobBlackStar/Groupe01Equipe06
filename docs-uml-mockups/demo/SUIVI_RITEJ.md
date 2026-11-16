# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day7-dashboards-impact`  

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
| **Jour 8** | **Tests d'Intégration, Accessibilité & Gel** | ⏳ *À venir* | Ritej | Tests responsive, audit d'accessibilité WCAG, revue d'ergonomie |
| **Jour 9** | **Rapport Académique & Vidéo de Démonstration** | ⏳ *À venir* | Ritej | Chapitres I, II, VI du rapport, tournage des séquences UI |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

### Jour 7 — 22 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day7-dashboards-impact`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(dashboards-impact): add student, merchant, and admin analytics dashboards, public campus impact page, filiere leaderboard, and order rating dialog`
* **Bibliothèque de Graphiques Recharts (`web-react/src/components/charts/`) :**
  - `KpiCard.jsx` : Tuile KPI modulaire aux accents néon (`#CCFF00`, `#FF5500`, `#00E5FF`, `#A855F7`), badges d'évolution et reflets Dark Obsidian.
  - `LineChartCard.jsx` : Courbe chronologique vectorielle Recharts (`AreaChart` + dégradé SVG semi-transparent) avec infobulle sombre personnalisée.
  - `BarChartCard.jsx` : Diagramme en barres avec coins arrondis (`radius={[6, 6, 0, 0]}`) et cellules colorées dynamiques.
  - `index.js` : Export barrel propre des composants graphiques.
* **Les 3 Tableaux de Bord par Rôle Web React :**
  - `web-react/src/features/dashboards/StudentDashboard.jsx` (`/app/dashboard`) : Vue cockpit étudiant avec 5 tuiles KPI (repas, dinars épargnés, kg sauvés, CO₂ évité, EcoPoints), bascule Dinars / CO₂, historique 14 jours, et tableau des dernières commandes avec notation 1-clic.
  - `web-react/src/features/merchant/MerchantDashboard.jsx` (`/merchant/dashboard`) : Superviseur commerçant avec sélecteur de plage `7 jours | 30 jours`, recettes journalières en barres Recharts, taux de non-présentation et podium du Top 3 des offres sauvées.
  - `web-react/src/features/admin/AdminDashboard.jsx` (`/admin/dashboard`) : Console d'administration universitaire centralisant le Volume d'Affaires total (GMV), la modération des boutiques partenaires en attente (`storesPending`), et la répartition des membres.
* **Vitrine d'Impact Public & Challenge Inter-Filières (`web-react/src/features/impact/`) :**
  - `EquivalenceTiles.jsx` : Traduction rigoureuse des données d'impact selon les standards officiels : recharges complètes de smartphones (US EPA, 8,22 g CO₂), kilomètres en voiture thermique évités (US EPA, 244 g CO₂ / km), et ratio universel FAO 2013 (2,5 kg CO₂e / kg nourriture).
  - `FiliereLeaderboard.jsx` : Challenge en direct des 5 promotions de l'ESSECT (`3A E-Business`, `Finance`, `Marketing`, `Gestion`, `Comptabilité`) avec médailles 🥇🥈🥉, barres de progression animées et surbrillance de la filière de l'étudiant.
  - `ImpactDashboardPage.jsx` : Page vitrine publique accessible à l'adresse `/impact` sans authentification préalable pour l'ouverture de la soutenance devant le jury.
* **Système d'Évaluation 1 à 5 Étoiles :**
  - `web-react/src/features/orders/RatingDialog.jsx` : Boîte de dialogue avec sélection d'étoiles interactives dorées (`#FFD700`), appréciation contextuelle, zone de commentaire (280 car.) et appel API `POST /api/v1/orders/:id/rating`.
  - Intégration sur `MyOrdersPage.jsx` et `StudentDashboard.jsx`.
* **Composants & Écrans Mobiles Flutter Équivalents (`mobile-flutter/lib/`) :**
  - `widgets/kpi_tile.dart` : Tuile KPI mobile au design Dark Obsidian avec 5 teintes d'accentuation.
  - `features/dashboards/student_dashboard_screen.dart` : Écran mobile avec `fl_chart` `LineChart`, bascule métrique TND/CO₂ et dialogue natif de notation 1-5 étoiles.
  - `features/dashboards/merchant_dashboard_screen.dart` : Dashboard commerçant mobile avec `fl_chart` `BarChart` et bascule 7j/30j.
  - `features/impact/impact_screen.dart` : Écran mobile d'impact écologique avec podium des filières ESSECT.
  - Câblage des routes dans `router.dart`.
* **Contrôle Qualité :**
  - `npm run build` dans `web-react` : **2724 modules compilés avec 0 erreur**.
  - `npm test` dans `backend-node` : **91/91 tests passés avec succès**.

### Jour 6 — 21 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day6-loyalty-mystery-box`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(loyalty-surprise): add digital eco-loyalty card, 5-stamp grid, reward wallet, mystery box cards, and unboxing reveal animation`
* **Panier Surprise & Animation d'Ouverture Web React (`web-react/src/`) :**
  - `components/offers/MysteryBoxCard.jsx` : Carte dédiée aux paniers surprise avec boîte scellée, contours luminescents selon le tier de rareté (`COMMUN` #94A3B8, `RARE` #00E5FF, `LÉGENDAIRE` #FFD700), aperçu du commerçant, compteur de prix live (`PriceTicker`) et bouton d'action.
  - `features/surprise/UnboxingReveal.jsx` : Expérience d'ouverture unboxing immersive en 5 séquences Framer Motion (secousse de boîte, explosion de particules lumineuses aux couleurs de rareté, jaillissement des articles secrets avec badges alimentaires, attribution des EcoPoints et annonce de palier débloqué). Respect de `prefers-reduced-motion` pour l'accessibilité.
  - Intégration dans `BrowsePage.jsx`, `LivingTicketPage.jsx` et `MyOrdersPage.jsx` avec bouton de démonstration 1-clic pour le jury.
* **Carte de Fidélité Éco-Digitale Web React (`web-react/src/features/loyalty/`) :**
  - `StampGrid.jsx` : Grille dynamique de 5 tampons éco-responsables (`Math.floor((ecoPoints % 100) / 20)` sur 5) avec indicateur visuel de repas sauvés et cadeau animé au 5ème tampon.
  - `RewardWallet.jsx` : Portefeuille de coupons débloqués (`-20%` aux paliers 100, 200, 400, 500 pts et `Panier 100% Offert` aux paliers 300, 600 pts) avec états (`AVAILABLE`, `LOCKED`, `USED`), copie de code et redirection directe vers le panier.
  - `LoyaltyCardPage.jsx` : Pass virtuel style Apple Wallet avec gradient métallique holographique, badge de grade végétal dynamique (`GRAINE` ➔ `POUSSE` ➔ `ARBRE` ➔ `FORÊT`), jauge de progression vers le prochain palier, intégration du `StampGrid`, du `RewardWallet`, et banc de simulation interactif (+20 pts / +60 pts) pour la soutenance.
  - Câblage de la route `/app/loyalty` dans `AppRouter.jsx`.
* **Composants & Écrans Mobiles Flutter Équivalents (`mobile-flutter/lib/`) :**
  - `features/surprise/unboxing_overlay.dart` : Animation d'ouverture native Flutter avec `AnimationController`, `Transform.rotate` (secousse), `ScaleTransition` (effet burst), retour haptique `HapticFeedback.heavyImpact()`, et cascade d'articles.
  - `features/loyalty/loyalty_card_screen.dart` : Écran mobile complet de fidélité avec carte végétale holographique, grille de 5 tampons, progression vers prochain palier, liste des récompenses actives et panneau de simulation.
* **Contrôle Qualité :**
  - `npm run build` dans `web-react` : **2110 modules compilés avec 0 erreur**.
  - `npm test` dans `backend-node` : **85/85 tests passés avec succès**.

### Jour 5 — 20 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day5-checkout-living-ticket`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(orders-ui): add checkout countdown, konnect return states, living ticket boarding pass, and order management screens`
* **Checkout & Passerelle Konnect Web React (`web-react/src/features/checkout/`) :**
  - `CheckoutPage.jsx` : Récapitulatif de réservation avec prix unitaire verrouillé (`lockedUnitPriceMillimes`), compte à rebours interactif de 10 minutes (`reservationExpiresAt`), sélecteur de récompense EcoPoints (-20% ou Panier 100% Offert), bouton de paiement Konnect et bouton d'annulation libérant le stock.
  - `PaymentReturnPage.jsx` : Gestion des 3 états de retour Konnect (`VERIFYING` avec sablier, `SUCCESS` avec accès direct au Living Ticket, `FAILED` avec compteur de tentatives et bouton de relance).
* **Living Ticket Boarding Pass Web React (`web-react/src/features/ticket/`) :**
  - `BoardingPass.jsx` : Carte d'embarquement style Apple Wallet avec encoches perforées latérales, reflet holographique animé CSS, en-tête de vol `ESSECT ➔ Montfleury`, badge `LIVE` avec horloge temps réel, QR Code rotatif toutes les 30 secondes (`qrcode.react` + HMAC-SHA256), barre de progression de 30s, et code de secours à 6 chiffres.
  - `LivingTicketPage.jsx` : Page dédiée intégrant le Boarding Pass et les consignes de retrait au comptoir.
* **Gestion des Commandes Étudiant & Commerçant Web React (`web-react/src/features/`) :**
  - `features/orders/OrderRow.jsx` : Ligne de commande avec badge de statut et actions contextuelles (Finaliser le paiement si réservé, Ouvrir Living Ticket si payé).
  - `features/orders/MyOrdersPage.jsx` : Portefeuille de commandes étudiant classées en 3 onglets (`En cours`, `Terminées`, `Annulées / Expirées`).
  - `features/merchant/MerchantOrdersPage.jsx` : Vue commerçant des retraits de la journée groupés par statut (`Payées — À remettre`, `Réservées`, `Terminées`) avec lien rapide vers le scanner QR.
  - Câblage de toutes les routes dans `AppRouter.jsx`.
* **Écrans Mobiles Flutter Équivalents (`mobile-flutter/lib/`) :**
  - `features/checkout/checkout_screen.dart` : Écran de paiement mobile avec décompte de 10 minutes et application des récompenses.
  - `features/ticket/boarding_pass.dart` : Billet mobile à encoches perforées (`TicketClipper`), QR rotatif 30s (`qr_flutter`), horloge `LIVE` et code à 6 chiffres.
  - `features/ticket/ticket_screen.dart` : Écran plein format du Living Ticket avec consignes.
  - `features/orders/my_orders_screen.dart` : Gestion des commandes étudiant avec `DefaultTabController`.
  - `features/merchant/merchant_orders_screen.dart` : Supervision des retraits commerçant avec bouton scanner flottant.
* **Contrôle Qualité :**
  - `npm run build` dans `web-react` : **177 modules compilés avec 0 erreur**.
  - `npm test` dans `backend-node` : **77/77 tests passés avec succès**.

---

### Jour 4 — 19 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day4-explore-catalogue`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(explore-ui): add student offer catalogue, debounced search, live smart decay ticker, and offer detail screens`
* **Composants d'Offres & Catalogue :**
  - `PriceTicker.jsx`, `CountdownChip.jsx`, `RarityBadge.jsx`, `OfferCard.jsx`.
  - `SearchBar.jsx` (debounce 300 ms), `FilterPanel.jsx`, `BrowsePage.jsx`, `OfferDetailPage.jsx`.
  - 6 composants et écrans Flutter (`live_price_text.dart`, `explore_screen.dart`, etc.).

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
