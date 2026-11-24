# CampusSave 🥗🌱 — Plateforme Anti-Gaspillage & Solidarité Étudiante

> **Projet Pédagogique Intégrateur** — Université de Tunis • **ESSECT Montfleury**  
> **Licence Business Computing / E-Business (3ème Année)** — Année Universitaire 2026-2027  
> **Auteurs du Projet :**  
> • **Ritej Bejaoui** (`donyesbejaoui27@gmail.com`) — Lead UI/UX, Développeuse Frontend (React 18 / Tailwind CSS & Flutter 3 / Dart)  
> • **Fedi Touati** (`number2.fedi@gmail.com`) — Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  

---

## 📖 Sommaire
1. [🌟 Présentation & Problématique](#-présentation--problématique)
2. [🎯 Matrice de Traçabilité du Cahier des Charges (M1-M8, B1-B4)](#-matrice-de-traçabilité-du-cahier-des-charges)
3. [💡 Les 6 Mécaniques Intelligentes de CampusSave](#-les-6-mécaniques-intelligentes-de-campussave)
4. [🏗️ Architecture Technique & Modélisation UML](#-architecture-technique--modélisation-uml)
5. [📁 Structure du Monorepo](#-structure-du-monorepo)
6. [🚀 Guide d'Installation & d'Exécution Pas-à-Pas](#-guide-dinstallation--dexécution-pas-à-pas)
7. [🔐 Configuration des Variables d'Environnement](#-configuration-des-variables-denvironnement)
8. [🎭 Comptes de Démonstration (Jury ESSECT)](#-comptes-de-démonstration-jury-essect)
9. [🤝 Répartition Détaillée des Travaux du Binôme](#-répartition-détaillée-des-travaux-du-binôme)

---

## 🌟 Présentation & Problématique

Chaque jour aux abords du campus universitaire de l'**ESSECT Montfleury**, des dizaines de cafétérias, boulangeries et restaurants jettent des repas préparés invendus, tandis que les étudiants peinent à trouver des options de restauration saines et abordables.

**CampusSave** est une plateforme omnicanale (Web React.js & Mobile Flutter) interconnectée à une API Node.js / Express et une base de données cloud Firebase. Elle permet de :
- Valoriser les surplus alimentaires des commerces de proximité dans un rayon strict de **3 km autour de l'ESSECT**.
- Vendre ces repas à prix cassés via un algorithme d'**enchère dégressive inversée (Smart Decay)**.
- Sécuriser les retraits physiques au comptoir via un **Living Ticket cryptographique HMAC rotatif toutes les 30 secondes**.
- Fédérer le campus à travers une **carte de fidélité éco-digitale** et un **challenge inter-filières certifié FAO/EPA**.

---

## 🎯 Matrice de Traçabilité du Cahier des Charges

### 1. Fonctionnalités Obligatoires (M1 à M8 — 100% Réalisées)
| Code | Exigence Fonctionnelle | Statut | Réalisation Web (Ritej) | Réalisation Mobile (Ritej) | Backend & Sécurité (Fedi) |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **M1** | Authentification & Rôles Étudiant / Commerçant | 🟢 | `LoginPage.jsx`, `RegisterPage.jsx` | `login_screen.dart`, `register_screen.dart` | Middleware `requireRole`, Claims JWT, Zod Auth |
| **M2** | Gestion Commerce & Validation Admin | 🟢 | `MerchantOnboardingPage.jsx`, `AdminMerchantsPage.jsx` | `merchant_onboarding_screen.dart` | Modération admin, calcul Haversine ESSECT $\le$ 3km |
| **M3** | Publication des Offres (Fixe & Dégressif) | 🟢 | `OfferFormPage.jsx`, `SmartDecayToggle.jsx` | `offer_form_screen.dart` | `POST /offers`, validation Zod des créneaux $\le$ 6h |
| **M4** | Catalogue, Recherche & Filtres | 🟢 | `BrowsePage.jsx`, `SearchBar.jsx` (debounce) | `explore_screen.dart` | Recherche multi-critères, index composites |
| **M5** | Réservation 10-Min & Concurrence Atomique | 🟢 | `CheckoutPage.jsx` (compte à rebours 10 min) | `checkout_screen.dart` | Transaction Firestore `runTransaction`, banc 20 acheteurs |
| **M6** | Paiement Électronique Sandbox Konnect | 🟢 | `PaymentReturnPage.jsx` (états Konnect) | `payment_webview_screen.dart` | `POST /payments/konnect/init` & dual-path verify |
| **M7** | Living Ticket QR & Retrait au Comptoir | 🟢 | `LivingTicketPage.jsx`, `MerchantScanPage.jsx` | `ticket_screen.dart`, `scanner_screen.dart` | HMAC-SHA256 30s cross-runtime, scan atomique |
| **M8** | Tableaux de Bord par Rôle & Analytics | 🟢 | `StudentDashboard`, `MerchantDashboard`, `AdminDashboard` | `student_dashboard_screen`, `merchant_dashboard_screen` | Agrégations `count()`, séries chronologiques 7d/30d |

### 2. Fonctionnalités Bonus (B1 à B4 — 100% Réalisées)
| Code | Innovation Proposée | Statut | Composants Clés Livrés |
| :---: | :--- | :---: | :--- |
| **B1** | **Montfleury Holo-Radar 3D WebGL** | 🟢 | `HoloRadarPage.jsx` (MapLibre 3D, bâtiments extrudés, prisme hexagonal), `RadarScreen` Flutter |
| **B2** | **Carte de Fidélité Éco-Digitale (5 Tampons)** | 🟢 | `LoyaltyCardPage.jsx`, `StampGrid.jsx`, `RewardWallet.jsx`, 4 paliers végétaux (Graine ➔ Forêt) |
| **B3** | **Panier Surprise Gacha & Animation Unboxing** | 🟢 | `MysteryBoxCard.jsx` (3 raretés), `UnboxingReveal.jsx` (Framer Motion 5 séquences), `unboxing_overlay.dart` |
| **B4** | **Magic Offer Publisher IA + Parseur Tunisien** | 🟢 | `AiAutoFillBox.jsx`, `aiService.autofillOffer` (Gemini API + fallback dialecte tunisien `fallbackParser`) |

---

## 💡 Les 6 Mécaniques Intelligentes de CampusSave

1. **Smart Decay (Enchère Dégressive Temporelle) :**
   - Formule mathématique pure sans aucune écriture en base de données :
     $$P(t) = P_{plancher} + (P_{depart} - P_{plancher}) \times \left(1 - \frac{t - t_{start}}{t_{end} - t_{start}}\right)^\gamma$$
   - Calculé à la volée par `@shared/pricing.js` à la milliseconde près.

2. **Holo-Radar 3D WebGL :**
   - Rendu vectoriel immersif de Montfleury avec extrusion des bâtiments universitaires, pilier néon lime de l'ESSECT (45m) et codes couleurs d'urgence (Vert $>60$ min, Orange $20-60$ min, Rouge $<20$ min).

3. **Panier Surprise & Rareté Gacha :**
   - Paniers mystères catégorisés selon 3 niveaux de rareté : Commun (`#94A3B8`), Rare (`#00E5FF`), et Légendaire (`#FFD700`).

4. **Carte de Fidélité & Défi Inter-Filières :**
   - Grille de 5 tampons (1 tampon = 20 EcoPoints = 1 repas sauvé). Bons `-20%` tous les 100 points et paniers gratuits tous les 300 points.
   - Classement en direct des 5 promotions de l'ESSECT sur la page `/impact`.

5. **Éditeur Magique IA & Parseur Tunisien :**
   - Extraction automatique des prix, quantités et catégories à partir d'une note vocale ou d'un texte brut en dialecte tunisien (*"Makloub escalope", "Chapati", "Baguette farcie"*).

6. **Living Ticket Cryptographique HMAC-SHA256 (30s) :**
   - QR code tournant inviolable empêchant les captures d'écran, accompagné d'un code manuel à 6 chiffres pour les terminaux hors-ligne.

---

## 🏗️ Architecture Technique & Modélisation UML

Le projet s'appuie sur une architecture 3-tiers à haute intégrité :
- **Client Web :** React 18 / Tailwind CSS / Recharts / MapLibre GL.
- **Client Mobile :** Flutter 3 / Dart / fl_chart / flutter_map.
- **Moteur Transactionnel :** Node.js 20 / Express / Firebase Admin SDK.
- **Base de Données Cloud :** Google Cloud Firestore avec règles de sécurité granulaires par rôle.

### Diagrammes de Conception UML (Disponibles dans `docs-uml-mockups/uml/svg/`) :
- `01-uc-global.svg` — Cas d'utilisation global des 3 acteurs.
- `05a-class-domain.svg` — Diagramme de classes du domaine partagé.
- `06-seq-reservation-konnect.svg` — Séquence complète de réservation et paiement.
- `07-seq-living-ticket-hmac.svg` — Séquence cryptographique du Living Ticket rotatif.
- `09-state-order-lifecycle.svg` — Machine à états finis des commandes.
- `10-deployment-production.svg` — Architecture de déploiement cloud Render / Vercel / Firebase.

---

## 🌐 Liens de Déploiement Officiels & Production

- **Application Web (Vercel Production) :** [https://campussave-rouge.vercel.app](https://campussave-rouge.vercel.app)
- **API REST Backend (Render Cloud) :** [https://campussave.onrender.com/api/v1](https://campussave.onrender.com/api/v1)
- **Téléchargement APK Android (GitHub Releases) :** [CampusSave.apk (Release v1.0.0)](https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk)
- **Rapport de Synthèse Académique :** `docs-uml-mockups/report/CampusSave_Rapport.pdf` (31 pages)

---

## 📁 Structure du Monorepo

```text
campussave/
├── shared/                   # Moteur métier partagé (prix, fidélité, distance, monnaie, rareté)
│   ├── pricing.js            # Algorithme Smart Decay
│   ├── loyalty.js            # Algorithme des 5 tampons et paliers
│   ├── impact.js             # Facteurs officiels FAO et US EPA
│   └── test-vectors/         # 41 tests automatisés cross-runtime (100% passing)
├── firebase/                 # Configuration Cloud
│   ├── firestore.rules       # Règles de sécurité granulaires par rôle
│   └── firestore.indexes.json# Index composites de requêtes
├── backend-node/             # API REST Express & Services
│   ├── src/modules/          # Modules (auth, merchants, offers, orders, radar, dashboards)
│   ├── src/jobs/             # Tâche d'arrière-plan noShowSweeper
│   └── tests/                # 146 tests automatisés (100% passing)
├── web-react/                # Application Web React 18 & Vite
│   ├── src/components/       # UI Kit Griddle Street Food, charts Recharts, layouts
│   ├── src/features/         # Écrans Étudiant, Commerçant, Admin, Impact
│   └── src/lib/              # Client Axios, endpoints, dictionnaire d'erreurs
├── mobile-flutter/           # Application Mobile Flutter 3 & Dart
│   ├── lib/features/         # Écrans mobiles équivalents (explore, radar, loyalty, dashboards)
│   ├── lib/widgets/          # Composants mobiles réutilisables (KpiTile, CountdownChip)
│   └── test/                 # 21 tests unitaires & widgets (100% passing)
└── docs-uml-mockups/         # Dossier académique complet
    ├── uml/svg/              # 12 diagrammes UML haute résolution
    ├── mockups/final-screens/# Planches graphiques vectorielles des écrans finaux
    ├── report/               # Rapport académique complet ESSECT (Markdown & PDF 31 pages)
    └── demo/                 # Script de soutenance (7 min) et fiches Q&A jury
```

---

## 🚀 Guide d'Installation & d'Exécution Pas-à-Pas

### Prérequis Système
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Flutter SDK** >= 3.22.x
- **Git**

### 1. Cloner le Dépôt
```bash
git clone https://github.com/MobBlackStar/campussave.git
cd campussave
```

### 2. Démarrer le Backend Node.js
```bash
cd backend-node
cp .env.example .env
npm install
npm test            # Exécute la suite complète des 146 tests backend
npm run dev         # Démarre l'API sur http://localhost:5000
```

### 3. Démarrer l'Application Web React
Dans un second terminal :
```bash
cd web-react
cp .env.example .env
npm install
npm run build       # Vérifie la compilation de production
npm run dev         # Démarre l'application sur http://localhost:5173
```

### 4. Démarrer l'Application Mobile Flutter
Dans un troisième terminal :
```bash
cd mobile-flutter
flutter pub get
flutter run -d chrome    # Ou sur émulateur Android / appareil physique
```

---

## 🔐 Configuration des Variables d'Environnement

*Conformément aux directives de sécurité académiques (§9), **aucun secret ni identifiant privé n'est versionné**. Les fichiers `.env.example` fournissent la nomenclature exacte des clés requises :*

### Variables Backend (`backend-node/.env.example`) :
| Variable | Description & Rôle |
| :--- | :--- |
| `PORT` | Port d'écoute du serveur HTTP (défaut : `5000`) |
| `NODE_ENV` | Environnement d'exécution (`development` / `production` / `test`) |
| `FIREBASE_PROJECT_ID` | Identifiant du projet Google Firebase |
| `FIREBASE_CLIENT_EMAIL`| Adresse de service du SDK Admin Firebase |
| `FIREBASE_PRIVATE_KEY` | Clé privée RSA du compte de service Firebase |
| `HMAC_TICKET_SECRET` | Clé secrète cryptographique pour signer les QR codes |
| `KONNECT_API_KEY` | Clé API publique du bac à sable Konnect Network |
| `KONNECT_WALLET_ID` | Identifiant du portefeuille marchand Konnect |
| `GEMINI_API_KEY` | Clé de l'API Google Gemini pour le Magic Publisher |

### Variables Web (`web-react/.env.example`) :
| Variable | Description & Rôle |
| :--- | :--- |
| `VITE_API_URL` | URL de base de l'API REST (`http://localhost:5000/api/v1`) |
| `VITE_FIREBASE_API_KEY`| Clé API client Firebase Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Identifiant du projet Firebase |

---

## 🎭 Comptes de Démonstration (Jury ESSECT)

*La plateforme intègre un **commutateur de rôle 1-clic** directement dans la barre de navigation pour naviguer instantanément entre les profils :*

| Rôle | Identifiant (Email) | Mot de passe | Description du Profil Démo |
| :--- | :--- | :--- | :--- |
| **🎓 Étudiant** | `etudiant.essect@univ-tunis.tn` | `Essect2026!` | Ritej Bejaoui, 3A E-Business, 280 EcoPoints, Palier Pousse |
| **🏪 Commerçant** | `contact@baguette-baguette.tn` | `Merchant2026!` | Gérant Baguette & Baguette Montfleury (180m campus) |
| **🛡️ Administrateur**| `admin.campus@essect.u-tunis.tn` | `AdminEssect2026!` | Direction ESSECT, modérateur des commerces |

---

## 🤝 Répartition Détaillée des Travaux du Binôme

| Domaine d'Expertise | Ritej Bejaoui (Partenaire B) | Fedi Touati (Partenaire A) |
| :--- | :--- | :--- |
| **Architecture & Données** | Conception wireframes Low-Fi & maquettes Hi-Fi Figma | Schéma NoSQL Firestore, index et règles de sécurité |
| **Frontend Web React** | Design System Dark Obsidian, UI Kit, 12 pages React | Intégration MapLibre GL 3D, SDK Firebase client |
| **Application Mobile** | 10 écrans Flutter, animations, thèmes responsive | Initialisation GoRouter, Provider, intégration Dio |
| **Algorithmes Métier** | Gamification fidélité, modale notation 1-5 étoiles | Enchère Smart Decay, Living Ticket HMAC-SHA256 |
| **Data Visualisation** | Recharts (Area/Bar/Kpi), vitrine publique `/impact` | Endpoints d'agrégation `count()`, séries temporelles |
| **Intelligence Artificielle**| Formulaire IA interactif, badges d'aliments | Intégration Gemini API, parseur de secours tunisien |
| **Rapport & Soutenance** | Chapitres 1, 2, 6 du rapport, planches finales D1 | Chapitres 3, 4, 5, 7 du rapport, OpenAPI Swagger |
