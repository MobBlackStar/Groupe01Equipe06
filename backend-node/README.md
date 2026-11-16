# Backend Node.js — CampusSave API REST 🚀

> API REST transactionnelle sécurisée pour le projet universitaire CampusSave (ESSECT 2026).

---

## 🏛️ Architecture & Principes Directeurs

1. **Autorité Unique des Mutations :**
   Les applications Web (React) et Mobile (Flutter) ne possèdent aucun droit d'écriture directe dans Firestore. Toutes les créations d'offres, réservations, paiements et validations de tickets transitent impérativement par cette API REST qui utilise le SDK Firebase Admin.
2. **Transactions Atomiques Firestore :**
   Les opérations sensibles (décrémentation de stock, validation de paiement, consommation de ticket) sont encapsulées dans des transactions Firestore pour éliminer tout risque de course critique (*race condition*).
3. **Validation Stricte Zod :**
   Chaque route valide scrupuleusement les paramètres d'URL, les requêtes (*query*) et les corps (*body*) via des schémas Zod.
4. **Horloge Serveur Fédératrice :**
   Le serveur injecte un en-tête `serverTime` dans chaque réponse afin de corriger les dérives d'horloge des clients et synchroniser les comptes à rebours d'enchères.

---

## 📁 Organisation Modulaire (`src/`)

```
src/
├── config/             # Variables d'environnement validées par Zod, instance Firebase Admin, CORS
├── middleware/         # Authentification, contrôle des rôles, validation Zod, limitation de débit
├── modules/            # Découpage modulaire par domaine métier :
│   ├── auth/           # Enregistrement de profil et attribution des rôles
│   ├── users/          # Gestion des profils et jetons push FCM
│   ├── merchants/      # Inscription, validation et consultation des commerces
│   ├── offers/         # CRUD des offres, mots-clés de recherche, calcul de rareté
│   ├── orders/         # Réservations transactionnelles, annulations et historiques
│   ├── payments/       # Intégration Konnect Sandbox et webhooks idempotents
│   ├── tickets/        # Cryptographie HMAC SHA-256 et validation des scans
│   ├── loyalty/        # Attribution des EcoPoints et gestion des récompenses
│   ├── impact/         # Calculs d'équivalences écologiques (CO2, repas sauvés)
│   ├── radar/          # Données cartographiques de proximité autour de l'ESSECT
│   ├── dashboards/     # Statistiques agrégées étudiants, commerçants et administration
│   ├── ai/             # Assistant de saisie d'offres avec modèle LLM et repli local
│   ├── uploads/        # Téléversement d'images sécurisé vers Cloudinary
│   ├── notifications/  # Envoi des notifications push ciblées via FCM
│   └── admin/          # Modération et gestion globale de la plateforme
├── jobs/               # Tâches d'arrière-plan (nettoyage des réservations et offres expirées)
├── utils/              # Gestionnaire d'erreurs, codes de commande, logs structurés
├── app.js              # Configuration de l'application Express
├── routes.js           # Enregistrement centralisé des routes préfixées par /api/v1
└── server.js           # Point d'entrée HTTP et démarrage du serveur
```

---

## 🛠️ Démarrage Local

```bash
# 1. Installation des dépendances
npm install

# 2. Configuration des variables d'environnement
cp .env.example .env
# Remplir les valeurs dans le fichier .env

# 3. Démarrage en mode développement (avec rechargement automatique)
npm run dev

# 4. Vérification de l'état de santé
curl http://localhost:4000/api/v1/health
```

---

## 🎲 Données de Démo pour la Soutenance (`seed` & `reset-demo`)

Pour garantir une soutenance fluide et 100% reproductible devant le jury de l'ESSECT, deux scripts d'automatisation des données sont disponibles :

### 1. `npm run seed`
Initialise la base Firestore avec un jeu complet de données cohérentes :
- **6 Commerces partenaires** autour de Montfleury (5 validés `APPROVED`, 1 en attente `PENDING` pour la démo de validation admin).
- **20 Paniers anti-gaspillage** variés : prix fixes, enchères hollandaises dégressives en direct, et 3 paniers surprise (`COMMON`, `RARE`, `LEGENDARY`) avec contenu secret masqué côté client.
- **8 Comptes étudiants** répartis sur les 5 filières de l'ESSECT (avec un compte de démo Yassine à 90 EcoPoints, à 10 points du palier de fidélité).
- **1 Compte Administrateur** (`admin@campussave.tn`).
- **14 Jours d'historique** d'impact écologique et de commandes passées pour alimenter immédiatement les graphiques de tableaux de bord.

```bash
npm run seed
```

### 2. `npm run reset-demo`
Réinitialise les réservations, paiements et tickets créés pendant un test pour repartir d'un état propre sans supprimer les comptes et commerces de base :

```bash
npm run reset-demo
```

---

## 🌐 Tunneling pour la Soutenance (Mobile Flutter & Webhooks Konnect)

Pendant la présentation devant le jury, l'application mobile Flutter sur smartphone physique et les webhooks de paiement Konnect Sandbox ont besoin d'accéder au backend local. Deux solutions éprouvées :

### Option A : Cloudflare Tunnel (Recommandé — gratuit et sans limite de temps)
```bash
# Installation rapide via winget ou npm
cloudflared tunnel --url http://localhost:4000
```
Copier l'URL HTTPS générée (ex: `https://votre-tunnel.trycloudflare.com`) et renseigner :
- Dans le `.env` backend : `BASE_URL=https://votre-tunnel.trycloudflare.com`
- Dans la configuration mobile Flutter : `baseUrl = 'https://votre-tunnel.trycloudflare.com/api/v1'`

### Option B : ngrok
```bash
ngrok http 4000
```
Reporter l'URL HTTPS fournie par ngrok dans vos variables d'environnement.

---

## 🚀 Déploiement en Production

### 1. Déploiement sur Render (PaaS Node.js)
1. Créer un nouveau **Web Service** sur [render.com](https://render.com).
2. Connecter le dépôt GitHub `campussave`.
3. Configurer le service :
   - **Root Directory :** `backend-node`
   - **Environment :** `Node`
   - **Build Command :** `npm install`
   - **Start Command :** `npm start`
4. Ajouter les variables d'environnement dans l'onglet **Environment** (copier celles de `.env.example`).
5. Téléverser la clé de service Firebase en variable `FIREBASE_SERVICE_ACCOUNT_KEY` (chaîne JSON) ou via Secret File.

### 2. Déploiement sur Google Cloud Run (Conteneur Serverless)
1. Construire l'image Docker :
   ```bash
   gcloud builds submit --tag gcr.io/campussave/backend-api
   ```
2. Déployer le service avec autoscaling :
   ```bash
   gcloud run deploy campussave-backend \
     --image gcr.io/campussave/backend-api \
     --platform managed \
     --region europe-west1 \
     --allow-unauthenticated
   ```

---

## 🧪 Tests Automatisés

Le backend intègre une suite de tests unitaires et d'intégration couvrant la validation Zod, la cryptographie HMAC des tickets, la tarification hollandaise dégressive et la cohérence du jeu de données :

```bash
npm test
```

