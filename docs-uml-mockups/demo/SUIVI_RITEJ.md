# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day4-explore-catalogue`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | 🟢 **100% Terminé** | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web (11 composants) & Mobile Flutter, 6 maquettes Hi-Fi |
| **Jour 3** | **Gestion Commerces, Offres IA & Console Admin** | 🟢 **100% Terminé** | Ritej | Onboarding commerçant géolocalisé, formulaire d'offres IA + Smart Decay SVG, catalogue commerçant, console validation admin, 3 écrans Flutter, banc de test IA (11/11 tests passés) |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Ritej | `BrowsePage`, recherche avec debounce (300 ms), panneau filtres, `PriceTicker` & `OfferCard`, `OfferDetailPage` avec impact éco et gestion 409, 6 composants/écrans Flutter |
| **Jour 5** | **Paiement Konnect & Living Ticket QR** | ⏳ *À venir* | Ritej | Checkout, page retour Konnect, `LivingTicket` avec QR code rotatif et timer |
| **Jour 6** | **Fonctionnalités Clés : Panier Mystère & Fidélité** | ⏳ *À venir* | Ritej | Animation unboxing Framer Motion, carte de fidélité EcoPoints |
| **Jour 7** | **Tableaux de Bord, Impact Éco & Notifications** | ⏳ *À venir* | Ritej | Dashboards Étudiant / Commerçant / Admin, page publique `/impact` |
| **Jour 8** | **Tests d'Intégration, Accessibilité & Gel** | ⏳ *À venir* | Ritej | Tests responsive, audit d'accessibilité WCAG, revue d'ergonomie |
| **Jour 9** | **Rapport Académique & Vidéo de Démonstration** | ⏳ *À venir* | Ritej | Chapitres I, II, VI du rapport, tournage des séquences UI |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

### Jour 4 — 19 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day4-explore-catalogue`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(explore-ui): add student offer catalogue, debounced search, live smart decay ticker, and offer detail screens`
* **Composants d'Offres Web React (`web-react/src/components/offers/`) :**
  - `PriceTicker.jsx` : Ticker dynamique recalculant le prix à la seconde via `computeUnitPrice` et l'affichant en millimes (`formatTND`), avec prix initial barré, badge pourcentage et pastille animée *Smart Decay en direct*.
  - `CountdownChip.jsx` : Puce d'urgence tricolore (`#CCFF00` > 60 min, `#FF5500` 20-60 min, `#FF1744` clignotant < 20 min).
  - `RarityBadge.jsx` : Badge distinctif pour les paniers mystères (`COMMON` argenté, `RARE` bleu cyan, `LEGENDARY` doré).
  - `OfferCard.jsx` : Carte d'offre complète avec visuel, nom du commerce, distance et temps de marche depuis l'ESSECT (`calculateWalkingMinutes`), stock restant et bouton d'action.
  - `index.js` : Export modulaire unifié des composants d'offres.
* **Catalogue & Exploration Web React (`web-react/src/features/explore/`) :**
  - `SearchBar.jsx` : Barre de recherche avec **debounce matériel de 300 ms** et bouton d'effacement rapide.
  - `FilterPanel.jsx` : Panneau interactif avec puces de catégories défilables, curseur de budget max, bascule paniers surprise et sélecteur de tri (proximité, prix, urgence).
  - `BrowsePage.jsx` : Page principale d'exploration connectée à l'API avec fallback résilient sur 6 commerces réels de Montfleury, états de chargement (Spinner), état vide (`EmptyState`) et compteur d'offres en ligne.
  - `OfferDetailPage.jsx` : Page de détail complète intégrant le créneau horaire de retrait, la barre de progression de l'enchère dégressive, le calcul de l'impact écologique (grammes d'aliments sauvés, CO₂ évité selon la FAO et équivalence en smartphones rechargés), le sélecteur de portions et le bouton de réservation avec gestion élégante de l'erreur `409 OFFER_SOLD_OUT`.
  - Intégration dans `AppRouter.jsx` des routes `/app`, `/app/explore`, `/app/offers/:id` et `/app/checkout/:orderId`.
* **Composants & Écrans Mobile Flutter (`mobile-flutter/lib/`) :**
  - Widgets atomiques : `live_price_text.dart`, `countdown_chip.dart`, `rarity_badge.dart`, `offer_card.dart`.
  - Espace Commerçant : `ai_autofill_card.dart`, `offer_form_screen.dart`, `merchant_offers_screen.dart`.
  - Espace Étudiant : `explore_screen.dart`, `filter_bottom_sheet.dart`, `offer_detail_screen.dart`.
* **Contrôle Qualité & Tests :**
  - `npm run build` dans `web-react` validé : **168 modules compilés avec 0 erreur**.
  - `npm test` dans `backend-node` : **68/68 tests passés avec succès**.

---

### Jour 3 — 18 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day3-merchants-offers`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(merchant-ui): add merchant onboarding, ai offer form with smart decay curve, and admin validation console`
* **Espace Commerçant Web React (`web-react/src/features/merchant/`) :**
  - `PendingApprovalBanner.jsx`, `MerchantOnboardingPage.jsx`, `MerchantStorePage.jsx`, `AiAutoFillBox.jsx`, `SmartDecayToggle.jsx`, `PhotoDropzone.jsx`, `OfferFormPage.jsx`, `MerchantOffersPage.jsx`.
* **Espace Administrateur Web React (`web-react/src/features/admin/`) :**
  - `AdminMerchantsPage.jsx`, `AdminUsersPage.jsx`.
* **Écrans Mobiles Flutter (`mobile-flutter/lib/features/merchant/`) :**
  - `merchant_onboarding_screen.dart`, `pending_approval_screen.dart`, `merchant_store_screen.dart`.
* **Banc de Test & Robustesse Backend (`backend-node/tests/ai.fallbackParser.test.js`) :**
  - 11 tests unitaires validés à 100% avec `node --test` sans régression.

---

### Jour 2 — 17 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day2-identity-ui`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(auth-ui): add design system ui kit, register and profile screens, and hifi mockups`
* **Design System UI Kit React (`web-react/src/components/ui/`) :**
  - 11 composants réutilisables basés sur la charte Dark Obsidian.
* **Écrans d'Authentification & Profils Web React (`web-react/src/features/auth/`) :**
  - `auth.schemas.js`, `RegisterPage.jsx`, `ProfilePage.jsx`.
* **Composants & Écrans Mobile Flutter (`mobile-flutter/lib/`) :**
  - `widgets/app_button.dart`, `widgets/app_text_field.dart`, `features/auth/validators.dart`, `features/auth/register_screen.dart`, `features/auth/profile_screen.dart`.
* **Maquettes Haute Fidélité (`docs-uml-mockups/mockups/hifi/`) :**
  - 6 maquettes SVG haute fidélité (`01` à `06`) + `README.md`.

---

### Jour 1 — 16 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day1-onboarding`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `docs(mockups): add low-fi wireframes, merchant seed data, and progress log`
* **Configuration & Données d'initialisation :**
  - Configuration de l'identité Git (`user.name "Ritej Bejaoui"` / `user.email "donyesbejaoui27@gmail.com"`).
  - Enrichissement de `merchants.json` avec 6 commerces réels de Montfleury (24 articles).
  - Wireframes basse fidélité complets (`01-student`, `02-merchant`, `03-admin`).

---

## 🤝 3. Points de Synchronisation & Handoff pour Fedi

| Livrable Partagé | Emplacement | Statut pour Fedi | Route API Backend Correspondante (§6) |
| :--- | :--- | :---: | :--- |
| **Catalogue & Recherche** | `web-react/src/features/explore/BrowsePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers` (avec filtres search, category, maxPrice, surpriseOnly, sortBy) |
| **Fiche Détail d'Offre** | `web-react/src/features/explore/OfferDetailPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers/:id` et `POST /api/v1/orders` (verrouillage 10 min) |
| **Exploration Mobile** | `mobile-flutter/lib/features/explore/explore_screen.dart` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers` |
| **Fiche Détail Mobile** | `mobile-flutter/lib/features/explore/offer_detail_screen.dart` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers/:id` et `POST /api/v1/orders` |
| **Formulaire Offre Mobile** | `mobile-flutter/lib/features/merchant/offer_form_screen.dart` | 🟢 **Prêt pour le branchement** | `POST /api/v1/offers` |
| **Catalogue Commerçant Mobile**| `mobile-flutter/lib/features/merchant/merchant_offers_screen.dart` | 🟢 **Prêt pour le branchement** | `GET /api/v1/merchants/me/offers` |
| **Création Commerce** | `web-react/src/features/merchant/MerchantOnboardingPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/merchants` |
| **Publication d'Offre Web** | `web-react/src/features/merchant/OfferFormPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/offers` |
| **Modération Commerces** | `web-react/src/features/admin/AdminMerchantsPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/admin/merchants` et `PATCH /api/v1/admin/merchants/:id/status` |
| **Inscription & Rôle** | `web-react/src/features/auth/RegisterPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/auth/register-profile` |
| **Gestion Profil** | `web-react/src/features/auth/ProfilePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/users/me` et `PATCH /api/v1/users/me` |
