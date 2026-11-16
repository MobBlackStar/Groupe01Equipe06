# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day5-checkout-living-ticket`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | 🟢 **100% Terminé** | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web (11 composants) & Mobile Flutter, 6 maquettes Hi-Fi |
| **Jour 3** | **Gestion Commerces, Offres IA & Console Admin** | 🟢 **100% Terminé** | Ritej | Onboarding commerçant géolocalisé, formulaire d'offres IA + Smart Decay SVG, catalogue commerçant, console validation admin, 3 écrans Flutter, banc de test IA (11/11 tests passés) |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Ritej | `BrowsePage`, recherche avec debounce (300 ms), panneau filtres, `PriceTicker` & `OfferCard`, `OfferDetailPage` avec impact éco et gestion 409, 6 composants/écrans Flutter |
| **Jour 5** | **Paiement Konnect & Living Ticket QR** | 🟢 **100% Terminé** | Ritej | `CheckoutPage` (compte à rebours 10 min, prix verrouillé, récompenses fidélité), `PaymentReturnPage` (états Konnect), `BoardingPass` & `LivingTicketPage` (QR tournant 30s + code 6 chiffres), `MyOrdersPage`, `MerchantOrdersPage`, 5 écrans Flutter |
| **Jour 6** | **Fonctionnalités Clés : Panier Mystère & Fidélité** | ⏳ *À venir* | Ritej | Animation unboxing Framer Motion, carte de fidélité EcoPoints |
| **Jour 7** | **Tableaux de Bord, Impact Éco & Notifications** | ⏳ *À venir* | Ritej | Dashboards Étudiant / Commerçant / Admin, page publique `/impact` |
| **Jour 8** | **Tests d'Intégration, Accessibilité & Gel** | ⏳ *À venir* | Ritej | Tests responsive, audit d'accessibilité WCAG, revue d'ergonomie |
| **Jour 9** | **Rapport Académique & Vidéo de Démonstration** | ⏳ *À venir* | Ritej | Chapitres I, II, VI du rapport, tournage des séquences UI |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

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
