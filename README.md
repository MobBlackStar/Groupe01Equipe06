# CampusSave 🥗🌱

> **Plateforme intelligente de lutte contre le gaspillage alimentaire en milieu universitaire**  
> Projet pédagogique intégrateur — ESSECT (École Supérieure des Sciences Économiques et Commerciales de Tunis)  
> 3ème année E-Business (Business Computing) — Année Universitaire 2026-2027

---

## 🌟 Présentation du Projet

**CampusSave** est une solution numérique éco-responsable conçue pour réduire le gaspillage alimentaire autour du campus universitaire de l'ESSECT (Montfleury, Tunis). 

Elle connecte les étudiants aux commerces de proximité (restaurants, cafétérias, boulangeries) en leur permettant de racheter les invendus du jour à prix réduits, sous la forme d'offres individuelles ou de paniers surprises.

### 👥 Acteurs du Système
1. **Étudiant :** Découvre les commerces sur un radar interactif, consulte les offres aux enchères dégressives, réserve, paie en ligne et retire sa commande grâce à un ticket QR code sécurisé.
2. **Commerçant :** Crée son établissement, publie ses invendus avec pré-remplissage intelligent, gère ses stocks et valide les retraits en scannant les tickets étudiants.
3. **Administrateur :** Valide les commerces candidats, supervise la plateforme et suit les indicateurs d'impact écologique global.

---

## 🏗️ Architecture Technique & Technologies

Le projet repose sur une architecture monorepo moderne, articulée autour de 3 piliers interconnectés par une base de données unique et une API REST commune :

| Composant | Technologie | Rôle & Particularités |
|---|---|---|
| **Application Web** | React 18, Vite, Tailwind CSS | Interface responsive étudiants, commerçants et administration complète |
| **Application Mobile** | Flutter 3, Dart, Provider, GoRouter | Application native étudiants et commerçants (Android) |
| **Backend & API** | Node.js 20, Express, Zod | Moteur transactionnel, horloge serveur, calculs d'impact |
| **Base de Données & Auth** | Firebase (Auth + Firestore + FCM) | Synchronisation temps réel, rôles personnalisés (Claims) |
| **Passerelle de Paiement** | Konnect Sandbox | Paiement électronique sécurisé en dinars tunisiens (TND) |
| **Domaine Partagé** | JavaScript ES Modules (`/shared`) | Algorithmes métier, calculs de prix et conversions monétaires |

---

## 📁 Structure du Dépôt

```
campussave/
├── shared/               # Logique métier partagée (prix, fidélité, distance, monnaie)
├── firebase/             # Règles Firestore, index composites et configuration
├── backend-node/         # API REST Express & SDK Admin Firebase
├── web-react/            # Application Web React.js
├── mobile-flutter/       # Application Mobile Flutter
└── docs-uml-mockups/     # Livrables : diagrammes UML, maquettes Figma, rapport et démo
```

---

## 🚀 Installation & Démarrage Rapide

### Prérequis
- **Node.js** >= 20.x
- **Flutter SDK** >= 3.x
- **Firebase CLI** (`npm install -g firebase-tools`)
- Un navigateur web moderne et/ou un émulateur Android

### 1. Module Partagé
```bash
cd shared
npm install
npm test
```

### 2. Backend Node.js
```bash
cd ../backend-node
cp .env.example .env
npm install
npm run dev
```

### 3. Application Web React
```bash
cd ../web-react
cp .env.example .env
npm install
npm run dev
```

### 4. Application Mobile Flutter
```bash
cd ../mobile-flutter
flutter pub get
flutter run
```

---

## 👥 Équipe de Développement (Binôme ESSECT)

- **Fedi Touati** — Architecture, Backend Node/Express, Transactions Firestore, Paiement Konnect, QR Cryptographique & Radar 3D WebGL
- **Ritej Bejaoui** — Interfaces Web (React.js) & Mobile (Flutter), Expérience Utilisateur, Carte de Fidélité Éco-Digitale, Tableaux de bord & Impact

---

## 📄 Licence
Projet réalisé dans le cadre académique de l'ESSECT — 2026.
