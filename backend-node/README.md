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
