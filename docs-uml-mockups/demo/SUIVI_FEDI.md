# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day5-living-ticket-scan`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | 🟢 **100% Terminé** | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, `GET/PATCH /users/me`, règles Firestore, `createAdmin.js`, endpoints clients, mocks 6 commerces, `LoginPage.jsx` & `login_screen.dart` (boutons 1-clic démo) |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | 🟢 **100% Terminé** | Fedi | API commerces, modération admin, upload Cloudinary, CRUD offres, IA générative & fallback tunisien, sélecteurs de carte Web/Mobile |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Fedi | Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente |
| **Jour 5** | **Living Ticket HMAC, Scan Atomique & Scanners** | 🟢 **100% Terminé** | Fedi | Cryptographie cross-runtime 30s HMAC-SHA256, transaction atomique de retrait, Living Ticket tournant Web/Flutter, scanners commerçants caméra et code manuel, WebView Konnect |
| **Jour 6** | **Fonctionnalités Bonus : Radar 3D, Mystery Box & Fidélité** | ⏳ *À venir* | Fedi | API radar géospatial, MapLibre 3D WebGL, déblocage récompenses |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | ⏳ *À venir* | Fedi | Agrégations statistiques, calculs d'empreinte carbone et notifications push |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 5 — 20 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day5-living-ticket-scan`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(tickets): add 30s rotating hmac qr, atomic pickup scan engine, and merchant scanners`
* **Cryptographie du Living Ticket & Parité Tripartite (`ticket.crypto.js`, `ticketCrypto.js`, `ticket_crypto.dart`) :**
  - Algorithme de rotation temporelle cadencé par fenêtre de 30 secondes : `window = floor(nowMs / 30000)`.
  - Signature cryptographique HMAC-SHA256 avec clé dérivée à la volée (`deriveTicketKey`), jamais stockée en base de données (règle de sécurité stricte).
  - Production d'un tag compact de 16 octets en base64url sans padding et d'un code de secours à 6 chiffres via les 4 premiers octets Big-Endian modulo $10^6$.
  - Comparaison en temps constant `crypto.timingSafeEqual` pour immuniser le système contre les attaques par canal auxiliaire (timing attacks).
  - Validation exhaustive sur **5 vecteurs de test officiels** (`shared/test-vectors/ticket.json`) avec concordance stricte entre Node.js, WebCrypto (`crypto.subtle`) et Dart (`package:crypto`).
* **Endpoints Sécurisés du Cycle de Retrait (`backend-node/src/modules/tickets/`, `orders/`) :**
  - `GET /api/v1/orders/:id/ticket` : délivrance de la clé temporaire au seul étudiant propriétaire (`studentId == uid`) avec en-tête `Cache-Control: no-store`.
  - `POST /api/v1/tickets/scan` et `POST /api/v1/tickets/redeem-code` : protégés par `authenticate`, `requireRole(MERCHANT)`, `requireApprovedMerchant` et `scanLimiter` (20 requêtes/min).
* **Cœur Transactionnel Atomique de Retrait (Diagramme de Séquence 08) :**
  - Transaction Firestore `runTransaction` garantissant l'ordonnancement strict (toutes les lectures avant les écritures).
  - Contrôle d'usage unique (statut `PAID` requis), appartenance à l'établissement du commerçant, et tolérance d'horloge de $\pm 1$ fenêtre temporelle (30 secondes).
  - Règle de persistance des échecs : si le ticket est expiré ou invalide, la transaction commite `pickup.failedAttempts += 1` sans annuler les autres vérifications. Verrouillage automatique au bout de 5 tentatives infructueuses (code 423 `TICKET_LOCKED`).
  - Validation réussie : passage de la commande à `COMPLETED`, attribution des EcoPoints (20 points par portion + bonus panier surprise + bonus 1re commande), déblocage automatique des récompenses franchies (bons -20% tous les 100 points, panier offert tous les 300 points), révélation du contenu secret de la Mystery Box, incrémentations atomiques des statistiques commerçant, impact campus global et classement de la filière ESSECT.
  - Expédition asynchrone post-commit des notifications push FCM `ORDER_COMPLETED` et `REWARD_UNLOCKED`.
* **Composants Graphiques & Scanners Commerçants (Web & Mobile) :**
  - `web-react/src/features/ticket/RotatingQr.jsx` : QR code SVG rotatif haute définition avec anneau de compte à rebours 30s animé, pastille LIVE, et code de secours formaté.
  - `web-react/src/features/merchant/MerchantScanPage.jsx` : scanner webcam intégré (`html5-qrcode`), onglet de saisie de secours à 6 chiffres, et fiche détaillée de remise avec contenu révélé.
  - `mobile-flutter/lib/features/ticket/rotating_qr.dart` : widget Flutter avec Timer cadencé, `qr_flutter`, anneau de progression circulaire néon et code de secours.
  - `mobile-flutter/lib/features/merchant/scanner_screen.dart` : scanner caméra natif haute vitesse (`mobile_scanner`), contrôle du flash/torche, retour haptique instantané, et boîte modale de validation.
  - `mobile-flutter/lib/features/checkout/payment_webview_screen.dart` : WebView isolée pour la passerelle Konnect interceptant les redirections de paiement pour vérification immédiate.
* **Écouteurs Réactifs Temps Réel (Web & Mobile) :**
  - `web-react/src/hooks/useOrder.js`, `useMyOrders.js`, `useMerchantOrders.js` avec repli gracieux automatique.
  - `mobile-flutter/lib/services/firestore_streams.dart` (`order`, `myOrders`, `merchantOrders`, `merchant`).
* **Banc de Tests Unitaires :**
  - `tests/ticket.crypto.test.js` : 5 tests validant les vecteurs, la tolérance $\pm 1$ fenêtre, le rejet des altérations et la saisie manuelle.
  - `tests/tickets.scan.test.js` : 6 tests complets sur la machine d'état de retrait, re-scan 409, commerçant tiers 403, persistance de failedAttempts et verrouillage 423.
  - Total tests backend : **85/85 tests passés avec succès**.
  - Total tests Flutter : **100% au vert** (`flutter analyze` sans avertissement, `flutter test` réussi).

---

### Jour 4 — 19 Novembre 2026
* **Recherche Multi-Critères & Calcul Prix en Direct (`backend-node/src/modules/offers/`) :**
  - `GET /api/v1/offers` avec pagination par curseur, filtres `q`, `category`, `merchantId`, `minPrice`, `maxPrice`, `surprise`, tri par prix, clôture ou distance.
  - Calcul à la volée du `currentPriceMillimes` (Smart Decay) et indicateur d'urgence.
* **Hooks Temps Réel & Horloge Compensée Web React (`web-react/src/`) :**
  - `lib/serverClock.js`, `hooks/useLivePrice.js`, `hooks/useActiveOffers.js`.
* **Mobile Flutter & 25 Vecteurs Dart (`mobile-flutter/`) :**
  - `lib/core/domain/pricing.dart` et `test/pricing_vectors_test.dart` (25 vecteurs validés).
* **Moteur de Réservation Atomique & Sweepers (`backend-node/src/modules/orders/`, `jobs/`) :**
  - `POST /api/v1/orders` avec blocage 10 minutes, `POST /orders/:id/cancel`, `reservationSweeper.js`, `offerExpirySweeper.js`.
* **Monétique Konnect & Idempotence Stricte (`backend-node/src/modules/payments/`) :**
  - `POST /payments/konnect/init`, `confirmPayment` strictement idempotente.
* **Banc de Tests Concurrence :**
  - `tests/reservation.concurrency.test.js` (20 requêtes simultanées sur 5 portions).

---

### Jour 3 — 18 Novembre 2026
* Moteur de calcul partagé `pricing.js` et `rarity.js` (25 vecteurs).
* Module commerces, modération admin, upload Cloudinary, CRUD offres, IA générative et sélecteurs de carte.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour l'Interface |
| :--- | :--- | :---: | :--- |
| **Composant RotatingQr (Web)** | `web-react/src/features/ticket/RotatingQr.jsx` | 🟢 **Prêt à l'emploi** | À intégrer directement dans `LivingTicketPage.jsx` via `<RotatingQr ticketKey={ticketKey} orderId={order.orderId} orderCode={order.orderCode} />`. |
| **Widget RotatingQr (Mobile)** | `mobile-flutter/lib/features/ticket/rotating_qr.dart` | 🟢 **Prêt à l'emploi** | À intégrer dans `ticket_screen.dart` via `RotatingQr(ticketKeyHex: ticketKey, orderId: orderId, orderCode: orderCode)`. |
| **Scanner Commerçant (Web)** | `web-react/src/features/merchant/MerchantScanPage.jsx` | 🟢 **Opérationnel** | Route `/merchant/scan` accessible depuis la barre latérale commerçant. |
| **Scanner Commerçant (Mobile)** | `mobile-flutter/lib/features/merchant/scanner_screen.dart` | 🟢 **Opérationnel** | Écran avec caméra, torche et retour haptique pour la validation au comptoir. |
| **WebView Konnect (Mobile)** | `mobile-flutter/lib/features/checkout/payment_webview_screen.dart` | 🟢 **Prêt à l'emploi** | Ouvrir via `Navigator.push(...)` après réception de l'URL `payUrl` depuis `POST /payments/konnect/init`. |
| **Hook useOrder** | `web-react/src/hooks/useOrder.js` | 🟢 **Prêt à l'emploi** | `const { order, loading } = useOrder(orderId);` pour surveiller en direct le passage au statut `COMPLETED`. |
| **Hook useMyOrders** | `web-react/src/hooks/useMyOrders.js` | 🟢 **Prêt à l'emploi** | Pour alimenter les onglets de `MyOrdersPage.jsx`. |
| **Hook useMerchantOrders** | `web-react/src/hooks/useMerchantOrders.js` | 🟢 **Prêt à l'emploi** | Pour afficher les commandes entrantes en direct sur `MerchantOrdersPage.jsx`. |
| **Flux Firestore Streams Mobile** | `mobile-flutter/lib/services/firestore_streams.dart` | 🟢 **Prêt à l'emploi** | `FirestoreStreams.order(orderId)`, `myOrders(studentId)`, `merchantOrders(merchantId)`. |
| **API Ticket Cryptographique** | `GET /api/v1/orders/:id/ticket` | 🟢 **Opérationnel** | Renvoie `{ ticketKey, windowSeconds, orderCode, serverTime }`. |
| **API Scan QR & Code Manuel** | `POST /api/v1/tickets/scan` et `/tickets/redeem-code` | 🟢 **Opérationnel** | Traite le retrait physique, incrémente les EcoPoints et dévoile le contenu secret. |
