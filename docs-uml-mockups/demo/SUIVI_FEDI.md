# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day3-merchants-offers-ai`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | 🟢 **100% Terminé** | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, `GET/PATCH /users/me`, règles Firestore, `createAdmin.js`, endpoints clients, mocks 6 commerces, `LoginPage.jsx` & `login_screen.dart` (boutons 1-clic démo) |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | 🟢 **100% Terminé** | Fedi | API commerces, modération admin, upload Cloudinary, CRUD offres, IA générative & fallback tunisien, sélecteurs de carte Web/Mobile |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | ⏳ *À venir* | Fedi | Algorithme de recherche, réservation avec verrouillage 10 min, sweeper d'expiration |
| **Jour 5** | **Paiement Konnect & Ticket Dynamique HMAC** | ⏳ *À venir* | Fedi | Intégration Konnect webhook, génération et vérification QR HMAC-SHA256 |
| **Jour 6** | **Fonctionnalités Bonus : Radar, Surprise & Fidélité** | ⏳ *À venir* | Fedi | API radar géospatial, algorithme d'ouverture de boîte surprise, points fidélité |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | ⏳ *À venir* | Fedi | Agrégations statistiques, calculs d'empreinte carbone et notifications push |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 3 — 18 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day3-merchants-offers-ai`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(backend): add merchants, admin moderation, offers crud, ai autofill, and map pin pickers`
* **Moteur de Calcul Partagé & Vecteurs de Test (`campussave/shared/`) :**
  - `shared/pricing.js` : Calcul précis des prix dégressifs (Smart Decay / enchère hollandaise) avec prise en charge complète des arrondis par pas (100 millimes), du palier plancher, du mode `FIXED`, et garde-fou sur `decayStart >= pickupEnd`.
  - `shared/rarity.js` : Moteur de rareté déterministe pour paniers surprise (Gold, Silver, Bronze) basé sur le ratio d'économie et la valeur marchande.
  - `shared/test-vectors/pricing.json` : Porté à **25 vecteurs de test exhaustifs** validant tous les cas limites (avant le début, à la moitié, à 1 min de la fin, après la clôture, arrondis et modes fixes).
  - Validation Jest : 26 tests passés avec succès.
* **Module Commerces (`backend-node/src/modules/merchants/`) :**
  - Schémas Zod : `merchants.schemas.js` (validation stricte du nom, catégorie, téléphone tunisien, adresse et coordonnées GPS).
  - Contrôle d'éligibilité géographique : Calcul Haversine obligatoire par rapport au centre ESSECT Montfleury (`36.7871, 10.1748`). Rejet automatique `422 TOO_FAR` si distance > 3000 m.
  - Indexation géospatiale : Génération automatique du `geohash` 9 caractères via `geofire-common` et conservation de `distanceFromEssectM`.
  - Endpoints sécurisés : `POST /merchants` (statut initial `PENDING`), `GET/PATCH /merchants/me`, `GET /merchants/:id`, `GET /merchants/me/offers`, `GET /merchants/me/orders`.
  - Middleware de protection : `requireApprovedMerchant.js` bloquant la publication tant que le compte n'est pas validé par l'administration.
* **Module Modération Administrateur (`backend-node/src/modules/admin/`) :**
  - Listing filtré des commerces par statut : `GET /api/v1/admin/merchants?status=PENDING`.
  - Décision d'approbation / rejet atomique : `PATCH /api/v1/admin/merchants/:id/status`.
    * Transaction Firestore atomique mettant à jour le statut du commerce.
    * Enregistrement systématique dans la collection d'audit `admin_audit` avec l'identité de l'administrateur, le timestamp et la raison.
    * Motif obligatoire (>= 3 caractères) pour les statuts `REJECTED` ou `SUSPENDED`.
    * Déclenchement post-commit d'une notification push FCM vers les tokens du commerçant (`fcm.service.js`).
  - Gestion des utilisateurs : `GET /api/v1/admin/users?role=` et `PATCH /api/v1/admin/users/:id/status` (suspension, désactivation de compte Firebase Auth et révocation immédiate des refresh tokens).
* **Module Upload Sécurisé d'Images (`backend-node/src/modules/uploads/`) :**
  - Route : `POST /api/v1/uploads/image`.
  - Stockage en mémoire via Multer (`memoryStorage`), contrôle strict de la taille (max 5 Mo) et des types MIME autorisés (JPEG, PNG, WEBP).
  - Téléversement direct en flux vers Cloudinary (`campus_save/offers/`) avec repli gracieux en mode développement local vers une URL d'image factice si les clés API sont absentes.
* **Module Offres & Paniers Anti-Gaspillage (`backend-node/src/modules/offers/`) :**
  - Schémas Zod : `offers.schemas.js` validant les types `FIXED` et `DUTCH`, les quantités (1 à 50), les créneaux de retrait sur la même journée tunisienne (`getTunisDayKey`), et la durée maximale de fenêtre (<= 6h).
  - Mots-clés de recherche : Indexation automatique multi-termes via `keywords.js` (nom, description, nom du commerce, catégorie) pour les recherches partielles insensibles à la casse.
  - Découplage de sécurité pour les paniers surprise : Écriture atomique du document public `offers/{id}` sans révéler le contenu secret, et stockage du contenu dans la sous-collection protégée `offers/{id}/private/contents`.
  - Règles de modification stricte : Interdiction de modifier le prix ou de réduire la quantité sous le stock déjà commandé dès lors que `hasOrders == true` (renvoi `409 OFFER_LOCKED`).
  - Suppression douce : Suppression logique (`status: CANCELLED`) si des commandes existent déjà, suppression physique sinon avec décrémentation atomique de `activeOfferCount`.
* **Module IA Générative & Parseur de Secours Tunisien (`backend-node/src/modules/ai/`) :**
  - Route : `POST /api/v1/ai/offer-autofill`.
  - Protection par limiteur de débit dédié : `aiLimiter` (10 requêtes / minute / IP) et restriction de rôle commerçant (`requireRole('MERCHANT')`).
  - Intégration Claude 3.5 Sonnet : Prompt expert en gastronomie tunisienne, structuration JSON Zod, et `AbortController` avec timeout strict de 8 secondes.
  - Parseur de secours déterministe (`fallbackParser.js`) : Actif si `AI_PROVIDER=none`, en cas de dépassement de quota ou de coupure réseau. Reconnaît instantanément le lexique tunisien (makloub, ojja, lablabi, chapati, brik, fricassé, etc.) et extrait prix, quantité, heure de retrait et catégorie avec un taux de réussite de 100%.
* **Composants Reutilisables Sélecteur de Carte (Web & Mobile) :**
  - Web React : `web-react/src/components/map/MapPinPicker.jsx` (Centrage par défaut sur l'ESSECT Montfleury, calcul Haversine interactif en temps réel, badge d'éligibilité 3 km, cercles concentriques 1/2/3 km, raccourcis vers les repères clés de Montfleury).
  - Mobile Flutter : `mobile-flutter/lib/widgets/map_pin_picker.dart` (Visualisation radar CustomPainter centrée sur l'ESSECT, interaction tactile, pastille de validation du rayon de 3 km, chips de repères de Montfleury).
* **Validation & Tests Automatisés :**
  - Création de `backend-node/tests/merchants.offers.test.js` couvrant l'ensemble des règles métier (géolocalisation, rejet > 3km, modération admin, contraintes d'offre, mots-clés, extraction IA).
  - Résultats `npm test` dans `backend-node/` : **59/59 tests passés avec succès**.
  - Build Web `npm run build` : **144 modules compilés avec 0 erreur**.
  - Analyse Flutter `flutter analyze` : **0 erreur**.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour l'Interface |
| :--- | :--- | :---: | :--- |
| **Sélecteur Carte Web** | `web-react/src/components/map/MapPinPicker.jsx` | 🟢 **Prêt à l'emploi** | À intégrer directement dans `MerchantOnboardingPage.jsx` via `<MapPinPicker onChange={({ lat, lng, distanceM, isWithinRadius }) => ...} />`. |
| **Sélecteur Carte Flutter** | `mobile-flutter/lib/widgets/map_pin_picker.dart` | 🟢 **Prêt à l'emploi** | À intégrer directement dans `MerchantOnboardingScreen.dart` via `MapPinPicker(onLocationChanged: (lat, lng, dist, valid) => ...)`. |
| **API Commerçant** | `backend-node/src/modules/merchants/` | 🟢 **Opérationnel** | `POST /merchants` pour l'onboarding, `GET/PATCH /merchants/me` pour la gestion de boutique. |
| **API Modération Admin** | `backend-node/src/modules/admin/` | 🟢 **Opérationnel** | `GET /admin/merchants?status=PENDING` et `PATCH /admin/merchants/:id/status` avec `{ status: 'APPROVED' | 'REJECTED', statusReason?: '...' }`. |
| **API Upload Image** | `backend-node/src/modules/uploads/` | 🟢 **Opérationnel** | `POST /uploads/image` via `FormData` avec le champ `'file'`. Renvoie `{ url: 'https://...' }`. |
| **API Publication Offres** | `backend-node/src/modules/offers/` | 🟢 **Opérationnel** | `POST /offers` pour créer des offres `FIXED` ou `DUTCH` avec calculs automatiques des créneaux. |
| **API Génération IA** | `backend-node/src/modules/ai/` | 🟢 **Opérationnel** | `POST /ai/offer-autofill` avec `{ text: "4 makloub escalope + 3 brik, fermeture 17h" }` pour pré-remplir le formulaire en 1 clic. |
