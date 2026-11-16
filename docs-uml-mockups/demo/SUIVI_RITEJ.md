# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day3-merchants-offers`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | 🟢 **100% Terminé** | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web (11 composants) & Mobile Flutter, 6 maquettes Hi-Fi |
| **Jour 3** | **Gestion Commerces, Offres IA & Console Admin** | 🟢 **100% Terminé** | Ritej | Onboarding commerçant géolocalisé, formulaire d'offres IA + Smart Decay SVG, catalogue commerçant, console validation admin, 3 écrans Flutter, banc de test IA (11/11 tests passés) |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | ⏳ *À venir* | Ritej | `BrowsePage`, recherche avec debounce, filtres avancés, `OfferDetailPage` |
| **Jour 5** | **Paiement Konnect & Living Ticket QR** | ⏳ *À venir* | Ritej | Checkout, page retour Konnect, `LivingTicket` avec QR code rotatif et timer |
| **Jour 6** | **Fonctionnalités Clés : Panier Mystère & Fidélité** | ⏳ *À venir* | Ritej | Animation unboxing Framer Motion, carte de fidélité EcoPoints |
| **Jour 7** | **Tableaux de Bord, Impact Éco & Notifications** | ⏳ *À venir* | Ritej | Dashboards Étudiant / Commerçant / Admin, page publique `/impact` |
| **Jour 8** | **Tests d'Intégration, Accessibilité & Gel** | ⏳ *À venir* | Ritej | Tests responsive, audit d'accessibilité WCAG, revue d'ergonomie |
| **Jour 9** | **Rapport Académique & Vidéo de Démonstration** | ⏳ *À venir* | Ritej | Chapitres I, II, VI du rapport, tournage des séquences UI |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

### Jour 3 — 18 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day3-merchants-offers`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(merchant-ui): add merchant onboarding, ai offer form with smart decay curve, and admin validation console`
* **Espace Commerçant Web React (`web-react/src/features/merchant/`) :**
  - `PendingApprovalBanner.jsx` : Bandeau dynamique de statut d'agrément (`PENDING` orange clignotant, `REJECTED` rouge avec motif, `APPROVED` vert électrique débloquant la publication).
  - `MerchantOnboardingPage.jsx` : Formulaire d'agrément avec sélecteur cartographique de Montfleury autour de l'ESSECT (`36.7871, 10.1748`), calcul Haversine temps réel et validation stricte du rayon piéton (≤ 3000 m).
  - `MerchantStorePage.jsx` : Vue récapitulative du commerce, coordonnées, badge d'approbation et raccourcis vers le catalogue et les formulaires.
  - `AiAutoFillBox.jsx` : Assistant IA intelligent transformant du jargon de cuisine ("4 makloub, fermeture 17h") en offre complète avec parseur de secours déterministe hors-ligne.
  - `SmartDecayToggle.jsx` : Sélecteur de tarification (`FIXED` vs `DUTCH_AUCTION`) avec tracé dynamique en SVG de la courbe de décote (prix plancher, paliers de 100 millimes).
  - `PhotoDropzone.jsx` : Zone de téléversement photo par glisser-déposer (≤ 5 Mo) avec presets illustrés tunisiens (Makloub, Chapati, Baguette farcie, Pâtisseries).
  - `OfferFormPage.jsx` : Formulaire complet orchestrant l'IA, le calcul de rareté de panier surprise (`computeRarity`), la validation Zod et la publication.
  - `MerchantOffersPage.jsx` : Catalogue interactif des offres avec badges d'état, barre de stock dynamique et modale de confirmation pour désactivation/suppression.
* **Espace Administrateur Web React (`web-react/src/features/admin/`) :**
  - `AdminMerchantsPage.jsx` : Console d'agrément des commerçants avec onglets par statut, badge de distance piétonne de l'ESSECT, tiroir de détails complets et modale d'approbation/rejet exigeant un motif formel.
  - `AdminUsersPage.jsx` : Table de gestion des utilisateurs avec filtrage par rôle (`ALL`, `STUDENT`, `MERCHANT`, `ADMIN`), recherche par nom/email et bascule sécurisée d'activation/suspension.
* **Écrans Mobiles Flutter (`mobile-flutter/lib/features/merchant/`) :**
  - `merchant_onboarding_screen.dart` : Formulaire d'onboarding mobile avec calcul Haversine natif, presets de Montfleury et validation ≤ 3000 m.
  - `pending_approval_screen.dart` : Écran mobile de statut d'agrément en attente avec bascule de test pour la soutenance.
  - `merchant_store_screen.dart` : Tableau de bord mobile du commerçant avec métriques clés (repas sauvés, CO₂ évité), état de validation et actions rapides.
* **Banc de Test & Robustesse Backend (`backend-node/tests/ai.fallbackParser.test.js`) :**
  - 11 tests unitaires validés à 100% avec `node --test` sans régression :
    1. Makloub escalope avec fermeture à 17h
    2. Chapati traditionnel Montfleury
    3. Baguette Farcie avec fermeture à 18h30
    4. Viennoiserie matinale (Croissants pur beurre)
    5. Pains au chocolat croustillants
    6. Plat chaud traditionnel (Ojja merguez)
    7. Plat réconfortant (Lablabi chaud)
    8. Fast food tunisien (Kafteji)
    9. Pizza avec fermeture tardive à 21h45
    10. Panier surprise multi-articles (Chapati + Briks + Boisson)
    11. Gestion rigoureuse des erreurs (chaînes vides, entrées nulles)
* **Contrôle Qualité & Build :**
  - `npm run build` exécuté avec succès dans `web-react` (0 erreurs TypeScript / JSX).

---

### Jour 2 — 17 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day2-identity-ui`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `feat(auth-ui): add design system ui kit, register and profile screens, and hifi mockups`
* **Design System UI Kit React (`web-react/src/components/ui/`) :**
  - 11 composants réutilisables basés sur la charte Dark Obsidian (`#0D0F12`), Surface (`#161920`), Electric Lime (`#CCFF00`), Urgent Amber (`#FF5500`), et Crimson (`#FF1744`) :
    `Button.jsx`, `Input.jsx`, `Select.jsx`, `Card.jsx`, `Badge.jsx`, `Modal.jsx`, `Spinner.jsx`, `EmptyState.jsx`, `Stepper.jsx`, `Tabs.jsx`, `Toast.jsx`.
* **Écrans d'Authentification & Profils Web React (`web-react/src/features/auth/`) :**
  - `auth.schemas.js` : Schémas Zod stricts pour rôle `STUDENT | MERCHANT`, téléphone tunisien (`+216[2-9]...`), filières ESSECT et mot de passe sécurisé.
  - `RegisterPage.jsx` : Sélecteur de rôle par cartes interactives, sélecteur de filière ESSECT et redirection contextuelle.
  - `ProfilePage.jsx` : Badge de rôle, jauge EcoPoints, palier de fidélité et gestion du profil.
* **Composants & Écrans Mobile Flutter (`mobile-flutter/lib/`) :**
  - Widgets atomiques : `widgets/app_button.dart`, `widgets/app_text_field.dart`.
  - Logique & Validation : `features/auth/validators.dart`.
  - Écrans complets : `features/auth/register_screen.dart`, `features/auth/profile_screen.dart`.
* **Maquettes Haute Fidélité (`docs-uml-mockups/mockups/hifi/`) :**
  - 6 maquettes SVG haute fidélité (`01-hifi-explore-catalogue.svg` à `06-hifi-admin-merchant-validation.svg`) + `README.md`.

---

### Jour 1 — 16 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day1-onboarding`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `docs(mockups): add low-fi wireframes, merchant seed data, and progress log`
* **Configuration & Initialisation :**
  - Configuration de l'identité Git (`user.name "Ritej Bejaoui"` / `user.email "donyesbejaoui27@gmail.com"`).
  - Installation et validation des dépendances `shared`, `backend-node` et `web-react`.
  - Validation du serveur de développement React Vite sur `http://localhost:5173`.
* **Données d'initialisation des commerces réels :**
  - Fichier : `backend-node/scripts/seed-data/merchants.json`.
  - 6 commerces réels de Montfleury situés dans un rayon piéton de 120 m à 620 m de l'ESSECT (Baguette & Baguette, Cafétéria L'Étoile du Savoir, Pâtisserie Masmoudi, Le Dôme, Pizzeria Bella Napoli, Fast Food Le Phare).
  - 24 articles types tunisiens conformes aux catégories `OFFER_CATEGORIES`, poids en grammes réels et prix stricts en millimes entiers.
* **Wireframes Basse Fidélité :**
  - Espace Étudiant : `docs-uml-mockups/mockups/lowfi/01-student-wireframes.svg`.
  - Espace Commerçant : `docs-uml-mockups/mockups/lowfi/02-merchant-wireframes.svg`.
  - Espace Administrateur : `docs-uml-mockups/mockups/lowfi/03-admin-wireframes.svg`.
  - Index pédagogique : `docs-uml-mockups/mockups/lowfi/README.md`.

---

## 🤝 3. Points de Synchronisation & Handoff pour Fedi

| Livrable Partagé | Emplacement | Statut pour Fedi | Route API Backend Correspondante (§6) |
| :--- | :--- | :---: | :--- |
| **Création Commerce** | `web-react/src/features/merchant/MerchantOnboardingPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/merchants` (création boutique en statut `PENDING`) |
| **Consultation Boutique** | `web-react/src/features/merchant/MerchantStorePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/merchants/my-store` |
| **Publication d'Offre** | `web-react/src/features/merchant/OfferFormPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/offers` (création offre avec Smart Decay ou Surprise) |
| **Assistant Remplissage IA** | `web-react/src/features/merchant/AiAutoFillBox.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/ai/offer-autofill` (avec fallback local côté client) |
| **Catalogue Commerçant** | `web-react/src/features/merchant/MerchantOffersPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers/my-offers` et `DELETE /api/v1/offers/:id` |
| **Modération Commerces** | `web-react/src/features/admin/AdminMerchantsPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/admin/merchants` et `PATCH /api/v1/admin/merchants/:id/status` |
| **Gestion Utilisateurs** | `web-react/src/features/admin/AdminUsersPage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/admin/users` et `PATCH /api/v1/admin/users/:id/status` |
| **Inscription & Rôle** | `web-react/src/features/auth/RegisterPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/auth/register-profile` (création profil + custom claims) |
| **Gestion Profil** | `web-react/src/features/auth/ProfilePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/users/me` et `PATCH /api/v1/users/me` |
| **Catalogue & Filtres** | `docs-uml-mockups/mockups/hifi/01-hifi-explore-catalogue.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers` (avec recherche, filtres et pagination) |
| **Moteur de Commande** | `docs-uml-mockups/mockups/hifi/03-hifi-checkout-payment.svg` | 🟢 **Prêt pour le branchement** | `POST /api/v1/orders` (réservation 10 min et redirection Konnect) |
| **Living Ticket** | `docs-uml-mockups/mockups/hifi/04-hifi-living-ticket-boarding-pass.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/orders/:id/ticket` (données ticket et clé de dérivation) |
| **Scanner Retrait QR** | `docs-uml-mockups/mockups/hifi/05-hifi-qr-scanner-validation.svg` | 🟢 **Prêt pour le branchement** | `POST /api/v1/tickets/scan` (vérification HMAC et clôture atomique) |
| **Supervision Admin** | `docs-uml-mockups/mockups/hifi/06-hifi-admin-merchant-validation.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/admin` |
| **Jeu de données Commerces** | `backend-node/scripts/seed-data/merchants.json` | 🟢 **Prêt pour le seeding** | `backend-node/scripts/seed.js` |
