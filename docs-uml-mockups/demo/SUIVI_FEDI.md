# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day4-search-orders-konnect`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | 🟢 **100% Terminé** | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, `GET/PATCH /users/me`, règles Firestore, `createAdmin.js`, endpoints clients, mocks 6 commerces, `LoginPage.jsx` & `login_screen.dart` (boutons 1-clic démo) |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | 🟢 **100% Terminé** | Fedi | API commerces, modération admin, upload Cloudinary, CRUD offres, IA générative & fallback tunisien, sélecteurs de carte Web/Mobile |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Fedi | Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente |
| **Jour 5** | **Paiement Konnect & Ticket Dynamique HMAC** | ⏳ *À venir* | Fedi | Intégration Konnect webhook, génération et vérification QR HMAC-SHA256 |
| **Jour 6** | **Fonctionnalités Bonus : Radar, Surprise & Fidélité** | ⏳ *À venir* | Fedi | API radar géospatial, algorithme d'ouverture de boîte surprise, points fidélité |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | ⏳ *À venir* | Fedi | Agrégations statistiques, calculs d'empreinte carbone et notifications push |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 4 — 19 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day4-search-orders-konnect`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(orders): add offer search, live price hooks, atomic reservation engine, and konnect payments`
* **Recherche Multi-Critères & Calcul Prix en Direct (`backend-node/src/modules/offers/`) :**
  - `GET /api/v1/offers` : catalogue public avec pagination par curseur, filtres `q` (recherche textuelle multi-mots-clés normalisée et insensible aux accents), `category`, `merchantId`, `minPrice`, `maxPrice`, `surprise`, et tri par prix, clôture ou distance.
  - Exclusion automatique des offres expirées (`pickupEndAt <= now`) et épuisées (`quantityAvailable <= 0`).
  - Calcul à la volée du `currentPriceMillimes` (Smart Decay) et de l'indicateur d'urgence pour chaque offre.
  - `GET /api/v1/offers/:id` : consultation détaillée avec prix en direct et calcul d'urgence.
* **Hooks Temps Réel & Horloge Compensée Web React (`web-react/src/`) :**
  - `lib/serverClock.js` : compensation de la dérive client/serveur via `updateServerOffset(serverTime)` et exposition de `serverNow()`.
  - `hooks/useLivePrice.js` : recalcul à la seconde du prix dégressif Smart Decay, pourcentage d'économie et niveau d'urgence.
  - `hooks/useActiveOffers.js` : écouteur temps réel Firestore (`onSnapshot`) avec bascule transparente vers les mocks si hors ligne.
* **Mobile Flutter & 25 Vecteurs Dart (`mobile-flutter/`) :**
  - `lib/core/domain/pricing.dart` : parité arithmétique 100% avec JavaScript (`computeFromMap`, `computeUnitPrice`, `computeMinutesLeft`, `computeUrgencyColor`).
  - `test/pricing_vectors_test.dart` : validation des **25 vecteurs de test officiels** sous Flutter (`flutter test` 100% vert).
  - `lib/widgets/live_price_text.dart` : widget réutilisable avec ticker 1s calé sur `ServerClock.serverNowMs`.
* **Moteur de Réservation Atomique & Sweepers (`backend-node/src/modules/orders/`, `jobs/`) :**
  - `POST /api/v1/orders` : transaction Firestore atomique (`runTransaction`), décrémentation sécurisée du stock, génération du code Crockford Base32 `CS-XXXXX`, verrouillage du prix unitaire, blocage 10 minutes (`reservationExpiresAt`) et verrouillage de récompense étudiante.
  - `POST /api/v1/orders/:id/cancel` : annulation volontaire avec restitution immédiate du stock et déverrouillage de récompense.
  - `jobs/reservationSweeper.js` et `jobs/offerExpirySweeper.js` : robots en arrière-plan non bloquants (`.unref()`) libérant les réservations non payées après 10 minutes et clôturant les offres expirées.
* **Monétique Konnect & Idempotence Stricte (`backend-node/src/modules/payments/`) :**
  - `POST /api/v1/payments/konnect/init` : support des commandes gratuites réglées par récompense (`REWARD`) et passerelle Konnect Sandbox.
  - `GET /api/v1/payments/konnect/webhook` et `POST /api/v1/payments/konnect/verify` : réconciliation à double canal.
  - `confirmPayment(orderId, source)` : transaction atomique strictement idempotente générant le nonce cryptographique du ticket, incrémentant les statistiques commerçant, consignant `CONFIRMED` ou `ALREADY_CONFIRMED`, et déclenchant les notifications push FCM post-commit.
* **Banc de Tests de Concurrence & Idempotence :**
  - `tests/reservation.concurrency.test.js` : 20 requêtes simultanées sur un stock de 5 -> **exactement 5 succès, 15 rejets 409 OFFER_SOLD_OUT, stock final à 0 garanti**.
  - `tests/payments.idempotency.test.js` : validation de la non-duplication des compteurs en cas de double confirmation simultanée.
  - `tests/orders.search.test.js` : validation des schémas Zod et de l'alphabet Crockford.
  - Total tests backend : **77/77 tests passés avec succès**.

---

### Jour 3 — 18 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day3-merchants-offers-ai`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(backend): add merchants, admin moderation, offers crud, ai autofill, and map pin pickers`
* **Moteur de Calcul Partagé & Vecteurs de Test (`campussave/shared/`) :**
  - `shared/pricing.js` : Calcul précis des prix dégressifs (Smart Decay / enchère hollandaise) avec arrondis par pas (100 millimes).
  - `shared/rarity.js` : Moteur de rareté déterministe pour paniers surprise (Gold, Silver, Bronze).
  - `shared/test-vectors/pricing.json` : Porté à 25 vecteurs de test exhaustifs.
* **Module Commerces (`backend-node/src/modules/merchants/`) :**
  - Rayon Haversine <= 3000 m de l'ESSECT, geohash 9 caractères, endpoints commerces et middleware `requireApprovedMerchant`.
* **Module Modération Administrateur (`backend-node/src/modules/admin/`) :**
  - Validation et rejet avec motif obligatoire, collection `admin_audit`, notification FCM.
* **Module Upload Sécurisé d'Images (`backend-node/src/modules/uploads/`) :**
  - Multer 5 Mo max vers Cloudinary.
* **Module Offres & Paniers Anti-Gaspillage (`backend-node/src/modules/offers/`) :**
  - Mots-clés de recherche, découplage contenu secret paniers surprise, règle 409 OFFER_LOCKED.
* **Module IA Générative & Parseur de Secours Tunisien (`backend-node/src/modules/ai/`) :**
  - Claude 3.5 Sonnet avec timeout 8s et parseur tunisien déterministe 100% hors-ligne.
* **Composants Reutilisables Sélecteur de Carte (Web & Mobile) :**
  - `web-react/src/components/map/MapPinPicker.jsx` et `mobile-flutter/lib/widgets/map_pin_picker.dart`.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour l'Interface |
| :--- | :--- | :---: | :--- |
| **Hook useLivePrice** | `web-react/src/hooks/useLivePrice.js` | 🟢 **Prêt à l'emploi** | `const { currentPriceMillimes, formattedPrice, discountPercent, urgency } = useLivePrice(offer);` dans `OfferCard.jsx` et `OfferDetailPage.jsx`. |
| **Hook useActiveOffers** | `web-react/src/hooks/useActiveOffers.js` | 🟢 **Prêt à l'emploi** | `const { offers, loading, error } = useActiveOffers();` dans `BrowsePage.jsx`. |
| **Widget LivePriceText** | `mobile-flutter/lib/widgets/live_price_text.dart` | 🟢 **Prêt à l'emploi** | À intégrer dans `offer_card.dart` et `offer_detail_screen.dart` via `LivePriceText(...)`. |
| **Flux Firestore Streams** | `mobile-flutter/lib/services/firestore_streams.dart` | 🟢 **Prêt à l'emploi** | `FirestoreStreams.activeOffers()` pour alimenter les listes réactives Flutter. |
| **API Recherche Offres** | `GET /api/v1/offers` | 🟢 **Opérationnel** | Paramètres supportés : `?q=&category=&merchantId=&minPrice=&maxPrice=&surprise=&sort=price\|ending\|distance`. |
| **API Réservation Commande** | `POST /api/v1/orders` | 🟢 **Opérationnel** | Corps : `{ offerId, quantity, rewardId? }`. Renvoie `{ order }` avec code `CS-XXXXX` et validité 10 min. |
| **API Annulation Réservation** | `POST /api/v1/orders/:id/cancel` | 🟢 **Opérationnel** | Annule la réservation et restitue immédiatement le stock et la récompense. |
| **API Paiement Konnect** | `POST /api/v1/payments/konnect/init` | 🟢 **Opérationnel** | Corps : `{ orderId }`. Renvoie `{ payUrl, paymentRef }` ou `{ paidWithReward: true, order }`. |
| **API Vérification Retour** | `POST /api/v1/payments/konnect/verify` | 🟢 **Opérationnel** | Corps : `{ orderId, paymentRef? }`. Appelée par la page retour pour confirmer la transaction. |
