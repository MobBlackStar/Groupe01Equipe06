# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati (`number2.fedi@gmail.com`)  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  
> **Branche de travail actuelle :** `feat/fedi-day6-holoradar-3d-loyalty`  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | 🟢 **100% Terminé** | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, `GET/PATCH /users/me`, règles Firestore, `createAdmin.js`, endpoints clients, mocks 6 commerces, `LoginPage.jsx` & `login_screen.dart` (boutons 1-clic démo) |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | 🟢 **100% Terminé** | Fedi | API commerces, modération admin, upload Cloudinary, CRUD offres, IA générative & fallback tunisien, sélecteurs de carte Web/Mobile |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | 🟢 **100% Terminé** | Fedi | Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente |
| **Jour 5** | **Living Ticket HMAC, Scan Atomique & Scanners** | 🟢 **100% Terminé** | Fedi | Cryptographie cross-runtime 30s HMAC-SHA256, transaction atomique de retrait, Living Ticket tournant Web/Flutter, scanners commerçants caméra et code manuel, WebView Konnect |
| **Jour 6** | **Fonctionnalités Bonus : Radar 3D, Mystery Box & Fidélité** | 🟢 **100% Terminé** | Fedi | API radar géospatial, MapLibre 3D WebGL, Flutter RadarScreen, tri distance catalogue et profil fidélité |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | ⏳ *À venir* | Fedi | Agrégations statistiques, calculs d'empreinte carbone et notifications push |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 📝 2. Journal des Livrables Réalisés par Fedi

### Jour 6 — 21 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day6-holoradar-3d-loyalty`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(radar): add 3d webgl montfleury holo-radar, geospatial radar api, and loyalty endpoint`
* **API Radar Géospatial & Estimation Piétonne (`backend-node/src/modules/radar/`) :**
  - Endpoint public `GET /api/v1/radar?radiusM=1500` validé avec schéma Zod (`radiusM` de 100 à 5000 m, défaut 1500 m).
  - Coordonnées de référence ESSECT Montfleury : `36.7871, 10.1748`.
  - Calcul de la distance Haversine exacte et filtrage strict des commerces approuvés (`APPROVED`) dans le rayon.
  - Estimation du temps de marche urbain avec coefficient de détour piéton de 1.3 à vitesse moyenne de 5 km/h.
  - Calcul dynamique en direct du prix remisé (Smart Decay) et code couleur d'urgence pour chaque panier actif :
    - Vert Lime électrique (`#CCFF00`) : plus de 60 minutes restantes.
    - Orange vif (`#FF5500`) : entre 20 et 60 minutes restantes (fermeture proche).
    - Rouge impulsion critique (`#FF1744`) : moins de 20 minutes restantes (déstockage éclair).
* **Moteur de Fidélité & Récompenses Éco-Responsables (`backend-node/src/modules/loyalty/`) :**
  - Endpoint sécurisé `GET /api/v1/loyalty/me` protégé par `authenticate` et `requireRole(STUDENT)`.
  - Calcul des rangs éco-étudiants : Graine (0-99 pts), Pousse (100-299 pts), Arbre (300-599 pts), Forêt (600+ pts).
  - Calcul des tampons actifs (0 à 4 sur carte de 5 tampons), prochain palier de récompense, et liste des bons débloqués (`AVAILABLE`, `LOCKED`, `USED`).
* **Tri par Distance dans le Catalogue d'Offres (`backend-node/src/modules/offers/`) :**
  - Paramètre de requête `?sort=distance` dans `GET /api/v1/offers` ordonnant les résultats par `merchantSnapshot.distanceFromEssectM` croissant.
* **Montfleury Holo-Radar 3D WebGL (`web-react/src/features/radar/`) :**
  - `HoloRadarPage.jsx` : page immersive 3D montée sur `/app/radar`.
  - `mapStyle.js` : configuration MapLibre GL avec projection inclinée (`pitch: 60`, `bearing: -20`) et couche d'extrusion 3D polygonale des bâtiments de Montfleury (`fill-extrusion-height`).
  - `beaconLayer.js` : pilier holographique central ESSECT (hauteur 45 m, néon lime `#CCFF00`), prismes hexagonaux 3D pour chaque boutique dont la hauteur est proportionnelle au nombre de paniers disponibles et la couleur reflète l'urgence.
  - `walkingPath.js` : tracé dynamique en tirets animés reliant l'ESSECT au commerce sélectionné.
  - `cameraFx.js` : travelling cinématique en drone plongeant (`droneSwoopToMerchant`) à zoom 17.8 et pitch 70° lors du clic sur un repère.
  - Panneau latéral rétractable avec détails du commerce, temps de marche, et liste des offres avec bouton de réservation immédiate.
  - Mode de repli en liste 2D épurée pour les machines à ressources graphiques modestes.
* **Écran Radar Mobile Flutter (`mobile-flutter/lib/features/radar/radar_screen.dart`) :**
  - Composant cartographique haute performance propulsé par `flutter_map` avec tuiles sombres CartoDB Dark Matter.
  - Repère central pulsant ESSECT Montfleury (`#CCFF00`) avec icône académique.
  - Balises de commerces avec anneau néon d'urgence (`#CCFF00`, `#FF5500`, `#FF1744`) et pastille de stock.
  - Tracé piéton direct en polyline lors de la sélection d'un commerce.
  - Barre de filtres par rayon (500m, 1km, 1.5km, 2km, 3km) actualisant instantanément l'API.
  - Fiche modale coulissante (Bottom Sheet) affichant le commerce, la distance, le temps piéton et les paniers disponibles avec formatage monétaire `Money.formatTND`.
  - Enregistrement des routes `/radar` et `/student/radar` dans le routeur GoRouter.
* **Banc de Tests & Validation :**
  - `backend-node/tests/radar.loyalty.test.js` : validation des distances Haversine, estimation du temps de marche, couleurs d'urgence, 4 paliers de fidélité, tampons et tri par distance.
  - Total tests backend : **91/91 tests passés avec succès** (0 échec).
  - Total tests Flutter : **4/4 suites passées avec succès**, `flutter analyze` : zéro avertissement.
  - Build Web React : validé avec succès (`vite build` en 10.33s).

---

### Jour 5 — 20 Novembre 2026
* **Branche & Traçabilité Git :**
  - Branche : `feat/fedi-day5-living-ticket-scan`
  - Auteur : `Fedi Touati <number2.fedi@gmail.com>`
  - Message de commit : `feat(tickets): add 30s rotating hmac qr, atomic pickup scan engine, and merchant scanners`
* **Cryptographie du Living Ticket & Parité Tripartite (`ticket.crypto.js`, `ticketCrypto.js`, `ticket_crypto.dart`) :**
  - Algorithme de rotation temporelle cadencé par fenêtre de 30 secondes : `window = floor(nowMs / 30000)`.
  - Signature cryptographique HMAC-SHA256 avec clé dérivée à la volée (`deriveTicketKey`), jamais stockée en base de données.
  - Production d'un tag compact de 16 octets en base64url sans padding et d'un code de secours à 6 chiffres via les 4 premiers octets Big-Endian modulo $10^6$.
  - Comparaison en temps constant `crypto.timingSafeEqual` pour immuniser le système contre les attaques par canal auxiliaire.
  - Validation exhaustive sur **5 vecteurs de test officiels** (`shared/test-vectors/ticket.json`) avec concordance stricte entre Node.js, WebCrypto et Dart.
* **Endpoints Sécurisés du Cycle de Retrait (`backend-node/src/modules/tickets/`, `orders/`) :**
  - `GET /api/v1/orders/:id/ticket` : délivrance de la clé temporaire au seul étudiant propriétaire (`studentId == uid`).
  - `POST /api/v1/tickets/scan` et `POST /api/v1/tickets/redeem-code` : protégés par `authenticate`, `requireRole(MERCHANT)`, `requireApprovedMerchant` et `scanLimiter` (20 requêtes/min).
* **Cœur Transactionnel Atomique de Retrait :**
  - Transaction Firestore `runTransaction` garantissant l'ordonnancement strict (lectures avant écritures).
  - Contrôle d'usage unique (statut `PAID` requis), appartenance à l'établissement du commerçant, et tolérance d'horloge de $\pm 1$ fenêtre temporelle (30 secondes).
  - Règle de persistance des échecs : si le ticket est expiré ou invalide, commit de `pickup.failedAttempts += 1` sans annuler les autres vérifications. Verrouillage automatique au bout de 5 tentatives infructueuses (code 423 `TICKET_LOCKED`).
  - Validation réussie : passage de la commande à `COMPLETED`, attribution des EcoPoints, déblocage automatique des récompenses franchies, révélation du contenu secret de la Mystery Box, incrémentations statistiques.
* **Composants Graphiques & Scanners Commerçants (Web & Mobile) :**
  - `web-react/src/features/ticket/RotatingQr.jsx` : QR code SVG rotatif haute définition avec anneau de compte à rebours 30s animé et pastille LIVE.
  - `web-react/src/features/merchant/MerchantScanPage.jsx` : scanner webcam intégré (`html5-qrcode`) et onglet de saisie de secours à 6 chiffres.
  - `mobile-flutter/lib/features/ticket/rotating_qr.dart` : widget Flutter avec Timer cadencé, `qr_flutter`, et anneau de progression circulaire néon.
  - `mobile-flutter/lib/features/merchant/scanner_screen.dart` : scanner caméra natif haute vitesse (`mobile_scanner`), contrôle du flash et retour haptique.
  - `mobile-flutter/lib/features/checkout/payment_webview_screen.dart` : WebView isolée pour la passerelle Konnect.
* **Écouteurs Réactifs Temps Réel (Web & Mobile) :**
  - `web-react/src/hooks/useOrder.js`, `useMyOrders.js`, `useMerchantOrders.js`.
  - `mobile-flutter/lib/services/firestore_streams.dart` (`order`, `myOrders`, `merchantOrders`, `merchant`).

---

### Jour 4 — 19 Novembre 2026
* Recherche multi-critères, hooks prix direct Web/Mobile, transaction atomique de réservation, test concurrence 20 acheteurs, paiement Konnect & confirmation idempotente.

---

### Jour 3 — 18 Novembre 2026
* Moteur de calcul partagé `pricing.js` et `rarity.js` (25 vecteurs).
* Module commerces, modération admin, upload Cloudinary, CRUD offres, IA générative et sélecteurs de carte.

---

## 🤝 3. Points de Synchronisation & Handoff pour Ritej (Frontend)

| Livrable Partagé | Emplacement | Statut pour Ritej | Utilisation Recommandée pour l'Interface |
| :--- | :--- | :---: | :--- |
| **Montfleury Holo-Radar 3D (Web)** | `web-react/src/features/radar/HoloRadarPage.jsx` | 🟢 **Opérationnel** | Route `/app/radar` accessible directement pour les étudiants ; vue 3D WebGL inclinée avec travelling drone. |
| **Écran Radar Mobile (Flutter)** | `mobile-flutter/lib/features/radar/radar_screen.dart` | 🟢 **Opérationnel** | Route `/radar` et `/student/radar` avec carte CartoDB Dark Matter, chips de rayon et bottom sheet commerces. |
| **API Radar Géospatial** | `GET /api/v1/radar?radiusM=1500` | 🟢 **Opérationnel** | Retourne `{ home, radiusM, totalMerchants, merchants: [{ tradeName, location, walkingMinutes, urgency, beaconUrgencyColor, activeOffers }] }`. |
| **API Programme de Fidélité** | `GET /api/v1/loyalty/me` | 🟢 **Opérationnel** | Retourne `{ ecoPoints, loyaltyTier, nextRewardAt, stamps, unlockedRewards, stats }` pour brancher `LoyaltyCardPage.jsx` et `loyalty_card_screen.dart`. |
| **Tri par Distance Catalogue** | `GET /api/v1/offers?sort=distance` | 🟢 **Opérationnel** | Permet de trier les paniers du plus proche au plus éloigné de l'ESSECT dans `BrowsePage.jsx`. |
| **Composant RotatingQr (Web)** | `web-react/src/features/ticket/RotatingQr.jsx` | 🟢 **Prêt à l'emploi** | Intégré dans `LivingTicketPage.jsx` via `<RotatingQr ticketKey={ticketKey} orderId={order.orderId} orderCode={order.orderCode} />`. |
| **Widget RotatingQr (Mobile)** | `mobile-flutter/lib/features/ticket/rotating_qr.dart` | 🟢 **Prêt à l'emploi** | Intégré dans `ticket_screen.dart` via `RotatingQr(ticketKeyHex: ticketKey, orderId: orderId, orderCode: orderCode)`. |
| **Scanner Commerçant (Web)** | `web-react/src/features/merchant/MerchantScanPage.jsx` | 🟢 **Opérationnel** | Route `/merchant/scan` accessible depuis la barre latérale commerçant. |
| **Scanner Commerçant (Mobile)** | `mobile-flutter/lib/features/merchant/scanner_screen.dart` | 🟢 **Opérationnel** | Écran avec caméra, torche et retour haptique pour la validation au comptoir. |
| **WebView Konnect (Mobile)** | `mobile-flutter/lib/features/checkout/payment_webview_screen.dart` | 🟢 **Prêt à l'emploi** | Ouvrir via `Navigator.push(...)` après réception de l'URL `payUrl` depuis `POST /payments/konnect/init`. |
| **Hook useOrder** | `web-react/src/hooks/useOrder.js` | 🟢 **Prêt à l'emploi** | `const { order, loading } = useOrder(orderId);` pour surveiller en direct le passage au statut `COMPLETED`. |
| **Hook useMyOrders** | `web-react/src/hooks/useMyOrders.js` | 🟢 **Prêt à l'emploi** | Pour alimenter les onglets de `MyOrdersPage.jsx`. |
| **Hook useMerchantOrders** | `web-react/src/hooks/useMerchantOrders.js` | 🟢 **Prêt à l'emploi** | Pour afficher les commandes entrantes en direct sur `MerchantOrdersPage.jsx`. |
| **Flux Firestore Streams Mobile** | `mobile-flutter/lib/services/firestore_streams.dart` | 🟢 **Prêt à l'emploi** | `FirestoreStreams.order(orderId)`, `myOrders(studentId)`, `merchantOrders(merchantId)`. |
| **API Ticket Cryptographique** | `GET /api/v1/orders/:id/ticket` | 🟢 **Opérationnel** | Renvoie `{ ticketKey, windowSeconds, orderCode, serverTime }`. |
| **API Scan QR & Code Manuel** | `POST /api/v1/tickets/scan` et `/tickets/redeem-code` | 🟢 **Opérationnel** | Traite le retrait physique, incrémente les EcoPoints et dévoile le contenu secret. |
