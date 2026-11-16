# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day2-identity-ui`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | 🟢 **100% Terminé** | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web (11 composants) & Mobile Flutter, 6 maquettes Hi-Fi |
| **Jour 3** | **Gestion Commerces & Publication d'Offres** | ⏳ *À venir* | Ritej | `OfferFormPage` (enchère dégressive & panier surprise), onboarding commerçant |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | ⏳ *À venir* | Ritej | `BrowsePage`, recherche avec debounce, filtres avancés, `OfferDetailPage` |
| **Jour 5** | **Paiement Konnect & Living Ticket QR** | ⏳ *À venir* | Ritej | Checkout, page retour Konnect, `LivingTicket` avec QR code rotatif et timer |
| **Jour 6** | **Fonctionnalités Clés : Panier Mystère & Fidélité** | ⏳ *À venir* | Ritej | Animation unboxing Framer Motion, carte de fidélité EcoPoints |
| **Jour 7** | **Tableaux de Bord, Impact Éco & Notifications** | ⏳ *À venir* | Ritej | Dashboards Étudiant / Commerçant / Admin, page publique `/impact` |
| **Jour 8** | **Tests d'Intégration, Accessibilité & Gel** | ⏳ *À venir* | Ritej | Tests responsive, audit d'accessibilité WCAG, revue d'ergonomie |
| **Jour 9** | **Rapport Académique & Vidéo de Démonstration** | ⏳ *À venir* | Ritej | Chapitres I, II, VI du rapport, tournage des séquences UI |
| **Jour 10** | **Kit de Soutenance & Répétition Orale** | ⏳ *À venir* | Ritej | Support de présentation, fiches Q&A soutenance, filage complet |

---

## 📝 2. Journal des Livrables Réalisés par Ritej

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
  - Espace Étudiant : `docs-uml-mockups/mockups/lowfi/01-student-wireframes.svg` (Catalogue, filtres, Holo-Radar 3D, détail d'offre Smart Decay, checkout, living ticket, déballage panier surprise, carte fidélité).
  - Espace Commerçant : `docs-uml-mockups/mockups/lowfi/02-merchant-wireframes.svg` (Onboarding géolocalisé, formulaire de publication avec IA et enchère dégressive, gestion catalogue, scanner QR).
  - Espace Administrateur : `docs-uml-mockups/mockups/lowfi/03-admin-wireframes.svg` (Supervision globale, modale d'approbation/rejet des commerces, gestion des utilisateurs).
  - Index pédagogique : `docs-uml-mockups/mockups/lowfi/README.md`.

---

## 🤝 3. Points de Synchronisation & Handoff pour Fedi

| Livrable Partagé | Emplacement | Statut pour Fedi | Route API Backend Correspondante (§6) |
| :--- | :--- | :---: | :--- |
| **Inscription & Rôle** | `web-react/src/features/auth/RegisterPage.jsx` | 🟢 **Prêt pour le branchement** | `POST /api/v1/auth/register-profile` (création profil + custom claims) |
| **Gestion Profil** | `web-react/src/features/auth/ProfilePage.jsx` | 🟢 **Prêt pour le branchement** | `GET /api/v1/users/me` et `PATCH /api/v1/users/me` |
| **Catalogue & Filtres** | `docs-uml-mockups/mockups/hifi/01-hifi-explore-catalogue.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/offers` (avec recherche, filtres et pagination) |
| **Moteur de Commande** | `docs-uml-mockups/mockups/hifi/03-hifi-checkout-payment.svg` | 🟢 **Prêt pour le branchement** | `POST /api/v1/orders` (réservation 10 min et redirection Konnect) |
| **Living Ticket** | `docs-uml-mockups/mockups/hifi/04-hifi-living-ticket-boarding-pass.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/orders/:id/ticket` (données ticket et clé de dérivation) |
| **Scanner Retrait QR** | `docs-uml-mockups/mockups/hifi/05-hifi-qr-scanner-validation.svg` | 🟢 **Prêt pour le branchement** | `POST /api/v1/tickets/scan` (vérification HMAC et clôture atomique) |
| **Supervision Admin** | `docs-uml-mockups/mockups/hifi/06-hifi-admin-merchant-validation.svg` | 🟢 **Prêt pour le branchement** | `GET /api/v1/dashboards/admin` et `PATCH /api/v1/admin/merchants/:id/status` |
| **Jeu de données Commerces** | `backend-node/scripts/seed-data/merchants.json` | 🟢 **Prêt pour le seeding** | `backend-node/scripts/seed.js` |
