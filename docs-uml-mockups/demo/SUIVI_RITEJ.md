# CampusSave — Journal de Suivi & Handoff de Ritej Bejaoui (Partenaire B)

> **Étudiante :** Ritej Bejaoui (`donyesbejaoui27@gmail.com`)  
> **Rôle :** Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> **Binôme :** Fedi Touati (Lead Backend & Sécurité)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/ritej-day1-onboarding`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable B | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Wireframes Low-Fi** | 🟢 **100% Terminé** | Ritej | Wireframes SVG complets (3 acteurs), seed data enrichi 6 commerces Montfleury, journal de bord |
| **Jour 2** | **Authentification, Profils & Design System** | ⏳ *À venir* | Ritej | `RegisterPage`, `ProfilePage`, UI Kit Web & Mobile, maquettes Hi-Fi Figma |
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

### Jour 1 — 16 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/ritej-day1-onboarding`
  - Auteure : `Ritej Bejaoui <donyesbejaoui27@gmail.com>`
  - Message de commit : `docs(mockups): add low-fi wireframes, merchant seed data, and progress log`
* **Configuration & Initialisation :**
  - Configuration de l'identité Git (`user.name "Ritej Bejaoui"` / `user.email "donyesbejaoui27@gmail.com"`).
  - Création de la branche de travail dédiée : `feat/ritej-day1-onboarding`.
  - Installation et validation des dépendances `shared`, `backend-node` et `web-react`.
  - Lancement et validation du serveur de développement React Vite sur le port `5173`.
* **Données d'initialisation des commerces réels (`T-D1-B-05`) :**
  - Fichier : `backend-node/scripts/seed-data/merchants.json`.
  - 6 commerces réels de Montfleury situés dans un rayon piéton de 120 m à 620 m de l'ESSECT (Baguette & Baguette, Cafétéria L'Étoile du Savoir, Pâtisserie Masmoudi, Le Dôme, Pizzeria Bella Napoli, Fast Food Le Phare).
  - 24 articles types tunisiens conformes aux catégories `OFFER_CATEGORIES`, poids en grammes réels et prix stricts en millimes entiers.
* **Wireframes Basse Fidélité (`T-D1-B-04`) :**
  - Espace Étudiant : `docs-uml-mockups/mockups/lowfi/01-student-wireframes.svg` (Catalogue, filtres, Holo-Radar 3D, détail d'offre Smart Decay, checkout, living ticket, déballage panier surprise, carte fidélité).
  - Espace Commerçant : `docs-uml-mockups/mockups/lowfi/02-merchant-wireframes.svg` (Onboarding géolocalisé, formulaire de publication avec IA et enchère dégressive, gestion catalogue, scanner QR).
  - Espace Administrateur : `docs-uml-mockups/mockups/lowfi/03-admin-wireframes.svg` (Supervision globale, modale d'approbation/rejet des commerces, gestion des utilisateurs).
  - Index pédagogique : `docs-uml-mockups/mockups/lowfi/README.md`.

---

## 🤝 3. Points de Synchronisation & Handoff pour Fedi

| Livrable Partagé | Emplacement | Statut pour Fedi | Utilisation dans le Backend |
| :--- | :--- | :---: | :--- |
| **Jeu de données Commerces & Menus** | `backend-node/scripts/seed-data/merchants.json` | 🟢 **Prêt pour le seeding** | À importer dans `backend-node/scripts/seed.js` pour initialiser Firestore avec les 6 commerces et 24 articles. |
| **Constantes & Catégories Partagées** | `shared/constants.js` | 🟢 **Synchronisé** | Catégories `OFFER_CATEGORIES` et types `MERCHANT_TYPES` rigoureusement alignés. |
| **Spécification des Écrans Étudiant** | `docs-uml-mockups/mockups/lowfi/01-student-wireframes.svg` | 🟢 **Disponible** | Sert de référence pour les endpoints d'exploration (`GET /offers`), réservation (`POST /orders/reserve`) et ticket (`GET /tickets/:id`). |
| **Spécification des Écrans Commerçant** | `docs-uml-mockups/mockups/lowfi/02-merchant-wireframes.svg` | 🟢 **Disponible** | Sert de référence pour la création de commerce (`POST /merchants`), publication (`POST /offers`) et validation QR (`POST /orders/validate-pickup`). |
| **Spécification des Écrans Admin** | `docs-uml-mockups/mockups/lowfi/03-admin-wireframes.svg` | 🟢 **Disponible** | Sert de référence pour `PATCH /admin/merchants/:id/status` et `GET /admin/stats`. |

---

## 📌 Prochaine Étape (Jour 2)
1. Création de la page d'inscription `RegisterPage` avec sélection de rôle et filière ESSECT.
2. Création de la page de consultation et modification de profil `ProfilePage`.
3. Élaboration du kit de composants graphiques UI (boutons, cartes, inputs, badges aux couleurs de la charte).
4. Maquettes Figma haute fidélité correspondantes.
