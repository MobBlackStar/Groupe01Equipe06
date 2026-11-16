# Guide de Configuration Firebase — CampusSave

Ce guide détaille les étapes d'initialisation du projet Firebase pour le projet CampusSave (ESSECT 2026).

---

## 1. Création du Projet sur la Console Firebase

1. Rendez-vous sur [console.firebase.google.com](https://console.firebase.google.com/).
2. Créez un nouveau projet nommé `campussave-essect`.
3. Désactivez Google Analytics pour simplifier le projet universitaire.
4. Activez **Firebase Authentication** :
   - Mode de connexion : **E-mail / Mot de passe**.
5. Activez **Cloud Firestore** :
   - Région impérative : **`europe-west1`** (Belgique, plus faible latence vers Tunis).
   - Démarrez en mode test ou production (les règles `firestore.rules` s'appliqueront).

---

## 2. Déploiement des Règles et Index

Assurez-vous d'avoir installé la CLI Firebase :
```bash
npm install -g firebase-tools
firebase login
```

Copiez le fichier de projet :
```bash
cp .firebaserc.example .firebaserc
# Modifiez l'identifiant du projet dans .firebaserc avec votre véritable project ID
```

Déployez les règles de sécurité et les index composites :
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 3. Clé de Compte de Service (Backend Node.js)

1. Dans la Console Firebase > Paramètres du projet > **Comptes de service**.
2. Cliquez sur **Générer une nouvelle clé privée** (télécharge un fichier JSON).
3. **ATTENTION :** Ne commitez JAMAIS ce fichier JSON.
4. Pour le backend, encodez le JSON en base64 :
   - **Linux / macOS / Git Bash :** `base64 -w 0 serviceAccountKey.json`
   - **PowerShell :** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))`
5. Collez cette chaîne dans la variable `FIREBASE_SERVICE_ACCOUNT_BASE64` de votre fichier `.env` du backend.

---

## 4. Démarrage des Émulateurs Locaux

Pour tester sans consommer les quotas Firebase :
```bash
firebase emulators:start
```
- Authentification : `http://localhost:9099`
- Firestore : `http://localhost:8080`
- Interface visuelle (Emulator UI) : `http://localhost:4001`
