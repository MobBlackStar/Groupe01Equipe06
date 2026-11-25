<div align="center">

  <img src="web-react/public/assets/brand/mascot-sticker-256.png" alt="CampusSave Mascot" width="120" />
  <br />
  <img src="web-react/public/assets/brand/logo-full-512.png" alt="CampusSave Logo" width="320" />

  <h3>Zero-Waste Food Rescue &amp; Student Solidarity Platform for ESSECT Montfleury</h3>

  <p>
    <a href="https://campussave-rouge.vercel.app"><img src="https://img.shields.io/badge/Web_App-Vercel_Live-FFD000?style=for-the-badge&logo=vercel&logoColor=111111" alt="Web Live" /></a>
    <a href="https://campussave.onrender.com/api/v1/health"><img src="https://img.shields.io/badge/REST_API-Render_Cloud-DA0711?style=for-the-badge&logo=render&logoColor=FFFFFF" alt="API Live" /></a>
    <a href="https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk"><img src="https://img.shields.io/badge/Android-Download_APK-3DDC84?style=for-the-badge&logo=android&logoColor=111111" alt="Android APK" /></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-20%2B_Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 20+" />
    <img src="https://img.shields.io/badge/React-18.3_Vite-61DAFB?style=flat-square&logo=react&logoColor=111111" alt="React 18" />
    <img src="https://img.shields.io/badge/Flutter-3_Dart-02569B?style=flat-square&logo=flutter&logoColor=white" alt="Flutter 3" />
    <img src="https://img.shields.io/badge/Firebase-Firestore_%26_FCM-FFCA28?style=flat-square&logo=firebase&logoColor=111111" alt="Firebase" />
    <img src="https://img.shields.io/badge/MapLibre_GL-3D_Holo--Radar-396CB9?style=flat-square&logo=webgl&logoColor=white" alt="MapLibre GL" />
    <img src="https://img.shields.io/badge/Google_Gemini-AI_Publisher-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Konnect-Sandbox_Payments-0F172A?style=flat-square" alt="Konnect" />
  </p>

</div>

---

## Academic Submission Profile

| Field | Details |
| :--- | :--- |
| **Institution** | **ESSECT Montfleury** — Université de Tunis (École Supérieure des Sciences Économiques et Commerciales de Tunis) |
| **Program** | Bachelor in Business Computing / E-Business (3rd Year) — Academic Year **2026–2027** |
| **Project Type** | Integrative Capstone Project (*Projet Pédagogique Intégrateur*) — Web Integration &amp; Mobile Development |
| **Team Repository** | **Groupe01Equipe06** (`MobBlackStar/Groupe01Equipe06`) |
| **Student Authors** | **Fedi TOUATI** (`number2.fedi@gmail.com`) &amp; **Ritej BEJAOUI** (`donyesbejaoui27@gmail.com`) |
| **Academic Supervisors** | **Prof. Afef SLAMA** &amp; **Prof. Hanene CHAMAKHI** |

---

## Live Production Deployments &amp; Deliverables

| Surface | Live Endpoint / Artifact | Purpose |
| :--- | :--- | :--- |
| **Web Application (React 18)** | [campussave-rouge.vercel.app](https://campussave-rouge.vercel.app) | Full omnichannel web app for Students, Merchants, and ESSECT Admin |
| **REST API (Node.js 20)** | [campussave.onrender.com/api/v1/health](https://campussave.onrender.com/api/v1/health) | Transactional engine, Konnect verification, AI, HMAC tickets, and cron sweepers |
| **Android Native APK** | [CampusSave.apk (Latest Release)](https://github.com/MobBlackStar/campussave-releases/releases/latest/download/CampusSave.apk) | Signed Flutter 3 mobile client with QR scanner, WebView checkout &amp; FCM alerts |
| **OpenAPI 3.0 Contract** | [`docs-uml-mockups/api/openapi.yaml`](docs-uml-mockups/api/openapi.yaml) | Complete REST specification across all 14 domain modules |
| **Project Reports** | [`CampusSave_Rapport.pdf`](docs-uml-mockups/report/CampusSave_Rapport.pdf) · [`HTML Report`](docs-uml-mockups/report/CampusSave_Rapport_ESSECT_2026.html) · [`Markdown`](docs-uml-mockups/report/RAPPORT_PROJET_CAMPUSSAVE.md) | Formal academic engineering report |
| **Defense Playbook** | [`DEMO_SCRIPT.md`](docs-uml-mockups/demo/DEMO_SCRIPT.md) · [`DEFENSE_QA.md`](docs-uml-mockups/demo/DEFENSE_QA.md) | 7-minute jury walkthrough &amp; technical Q&amp;A preparation |

---

## Table of Contents

1. [Campus Vision &amp; Griddle Identity](#1-campus-vision--griddle-identity)
2. [Core Innovations (Beyond Standard CRUD)](#2-core-innovations-beyond-standard-crud)
3. [Cahier des Charges Traceability Matrix (M1–M8 &amp; B1–B4)](#3-cahier-des-charges-traceability-matrix-m1m8--b1b4)
4. [CQRS-Lite Architecture, Monorepo &amp; UML Modeling](#4-cqrs-lite-architecture-monorepo--uml-modeling)
5. [Local Installation &amp; Quickstart Guide](#5-local-installation--quickstart-guide)
6. [Environment Configuration](#6-environment-configuration)
7. [Automated Verification Ledger](#7-automated-verification-ledger)
8. [Jury Demo Accounts &amp; 7-Minute Defense Flow](#8-jury-demo-accounts--7-minute-defense-flow)
9. [Team Contributions &amp; Engineering Ownership](#9-team-contributions--engineering-ownership)

---

## 1. Campus Vision &amp; Griddle Identity

Around the **ESSECT Montfleury** campus (`36.7871° N, 10.1748° E`), neighboring bakeries, fast-food counters, cafeterias, and patisseries discard fresh unsold portions every evening, while university students struggle to afford balanced meals on a tight budget.

**CampusSave** solves both sides through a synchronized **Web (React 18) + Mobile (Flutter 3) + Node.js/Firestore** ecosystem constrained strictly to a **3 km Haversine perimeter** around ESSECT:

- **Zero-Waste Economics:** Unsold food is listed with a **Smart Decay** reverse Dutch auction or fixed discount, dropping prices progressively until pickup closes.
- **Anti-Fraud Fulfillment:** Reservations lock stock atomically for 10 minutes, settle via **Konnect Network Sandbox**, and issue a **30-second rotating HMAC-SHA256 Living Ticket**.
- **Warm Editorial "Griddle" UI System:** Instead of sterile generic templates, the platform adopts a cohesive warm diner/editorial palette across Web, Mobile, and transactional email receipts:
  - `#FAF3E6` **Butcher-Paper Cream** (primary canvas &amp; 3D ground plane)
  - `#E2D8C5` **Warm Sand** (extruded 3D neighborhood geometry &amp; surfaces)
  - `#FFD000` **Mustard Gold** (primary CTAs, loyalty progression &amp; `> 60 min` radar indicators)
  - `#FF8A00` **Saffron Amber** (active urgency `20–60 min` indicators)
  - `#DA0711` **Griddle Red** (ESSECT campus beacon, walking routes &amp; `< 20 min` expiry alerts)

---

## 2. Core Innovations (Beyond Standard CRUD)

### 1. Montfleury 3D Holo-Radar WebGL (`B1`)
- Built on **MapLibre GL** (`pitch: 62°`, `bearing: -22°`, `zoom: 16.2`) using pre-compiled open neighborhood geometry in [`worldData.json`](web-react/src/features/radar/world/worldData.json): **11,216 extruded buildings**, **9,193 procedural canopy trees**, and **88 green zones** centered on ESSECT Montfleury.
- Renders real **OpenStreetMap pedestrian street paths** (never straight-line cuts through buildings), animated drone camera swoops, and time-of-day atmospheric lighting.
- Mobile parity delivered via `flutter_map` interactive polylines and store distance cards.

### 2. Smart Decay Reverse Dutch Auction (`M3`)
- Zero database write amplification per tick: price decay is computed identically on **Backend Node.js**, **Web React**, and **Mobile Flutter** using shared integer-millime arithmetic ([`shared/pricing.js`](shared/pricing.js)):

```text
progress     = (nowMs - decayStartMs) / (pickupEndMs - decayStartMs)
rawPrice     = startPriceMillimes - (startPriceMillimes - floorPriceMillimes) * progress
unitPrice    = clamp(floor(rawPrice / stepMillimes) * stepMillimes, floorPriceMillimes, startPriceMillimes)
```

- Rounds cleanly in **100-millime (`0.100 TND`) steps** and guarantees server-authoritative pricing inside Firestore transactions at checkout.

### 3. Rotating 30s HMAC Living Ticket &amp; Halftone Mascot QR (`M7`)
- Dynamic QR payloads regenerate every **30 seconds** (`QR_WINDOW_SECONDS=30`) using `HMAC-SHA256` signed with `QR_SECRET`, neutralizing screenshot sharing.
- Includes a **6-digit manual fallback code** for camera-free or offline counter validation, plus an **Atomic Counter Scan** marking the order `COMPLETED` across connected clients.
- Website APK distribution uses a bespoke **Halftone Mascot QR renderer** preserving strict Level-H error correction, 4-module quiet zones, and solid finder/timing patterns verified by automated `jsQR` optical blur tests.

### 4. Magic Offer Publisher AI + Tunisian Dialect Parser (`B4`)
- Merchants describe leftovers in natural text (including Tunisian Darija phrases such as *"3andi 4 baguettes farcies escalope..."*).
- [`ai.service.js`](backend-node/src/modules/ai) extracts structured titles, categories, prices, quantities, and 14-dish photography mappings via **Google Gemini** (`gemini-3-flash-preview`), backed by a deterministic offline Tunisian dialect fallback parser.
- Paired with interactive **SpotEditor** crop/focus positioning and persistent local/Cloudinary image uploads.

### 5. Surprise Bag Gacha &amp; 5-Stage Unboxing (`B3`)
- Surplus mystery baskets ship with 3 probabilistic rarity tiers (`COMMUN`, `RARE`, `LEGENDAIRE`) in [`shared/rarity.js`](shared/rarity.js) and trigger a choreographed reveal upon counter pickup verification.

### 6. Eco-Loyalty Card, Inter-Track Leaderboard &amp; Port-443 Receipts (`B2` &amp; `M6`)
- **5-Stamp Eco Card:** `+20 EcoPoints` per rescued meal across 4 botanical ranks (`GRAINE` → `POUSSE` → `ARBRE` → `FORET`), automatically unlocking `-20%` discount coupons at `100 pts` and free basket vouchers at `300 pts`.
- **Inter-Track Challenge (`/impact`):** Live leaderboard tracking saved meals, TND savings, and CO₂ equivalents across 5 ESSECT tracks (`EBUSINESS_3A`, `FINANCE`, `MARKETING`, `GESTION`, `COMPTABILITE`).
- **Render Port-443 Zero-Hang Email Receipts:** Non-blocking HTTPS webhook / Brevo / SMTP pipeline delivering multipart Griddle HTML + plain-text purchase receipts with an **inline CID mascot emblem** and zero spam-triggering external preview links.

---

## 3. Cahier des Charges Traceability Matrix (M1–M8 &amp; B1–B4)

### Mandatory Requirements (`M1` – `M8`)

| Code | Requirement | Backend (`backend-node` &amp; `shared`) | Web (`web-react`) | Mobile (`mobile-flutter`) |
| :---: | :--- | :--- | :--- | :--- |
| **M1** | Authentication &amp; RBAC (`STUDENT`, `MERCHANT`, `ADMIN`) | `auth.routes.js`, Firebase JWT + `requireRole` middleware, unique email/phone validation | `LoginPage.jsx`, `RegisterPage.jsx`, `AuthContext.jsx` | `login_screen.dart`, `register_screen.dart` |
| **M2** | Merchant Onboarding, Admin Moderation &amp; ≤ 3 km Fence | `merchants.routes.js`, `admin.routes.js`, `shared/geo.js` Haversine check | `MerchantOnboardingPage.jsx`, `AdminMerchantsPage.jsx` | `merchant_onboarding_screen.dart` |
| **M3** | Offer Publishing (Fixed &amp; Smart Decay Dutch Auction) | `offers.routes.js`, Zod window validation (`≤ 6h`), `shared/pricing.js` | `OfferFormPage.jsx`, `SmartDecayToggle.jsx`, `SpotEditor` | `offer_form_screen.dart` |
| **M4** | Catalog, Multi-Filter Search &amp; Mono-Merchant Bag | `offers` query engine, Firestore composite indexes, `shared/dishPhotos.js` | `BrowsePage.jsx`, `SearchBar.jsx` | `explore_screen.dart`, mono-merchant `Sac` |
| **M5** | 10-Min Reservation Hold &amp; Atomic Stock Concurrency | `orders.routes.js`, Firestore `runTransaction` stock decrement + 20-buyer stress test | `CheckoutPage.jsx` (live 10-min countdown) | `checkout_screen.dart` |
| **M6** | Konnect Electronic Payment + Sandbox Resilience &amp; Receipts | `payments.routes.js`, `konnect.service.js` dual-path verify, `email.service.js` | `PaymentReturnPage.jsx` (natural verify flow) | `payment_webview_screen.dart` |
| **M7** | Rotating 30s HMAC Living Ticket &amp; Counter QR Scan | `tickets.routes.js`, cross-runtime `HMAC-SHA256` vector tests | `LivingTicketPage.jsx`, `MerchantScanPage.jsx` | `ticket_screen.dart`, `scanner_screen.dart` |
| **M8** | Role Dashboards &amp; Impact Analytics | `dashboards.routes.js`, `impact.routes.js`, `count()` aggregations | `StudentDashboard`, `MerchantDashboard`, `AdminDashboard`, `/impact` | `student_dashboard_screen.dart`, `merchant_dashboard_screen.dart` |

### Bonus Features (`B1` – `B4`)

| Code | Innovation | Primary Artifacts |
| :---: | :--- | :--- |
| **B1** | **Montfleury 3D Holo-Radar WebGL** | `HoloRadarPage.jsx`, `worldLayer.js`, `worldData.json`, `walkingPath.js`, `RadarScreen` |
| **B2** | **Eco-Digital Loyalty Card &amp; Inter-Track Ranking** | `loyalty.routes.js`, `shared/loyalty.js`, `LoyaltyCardPage.jsx`, `StampGrid.jsx`, `RewardWallet.jsx` |
| **B3** | **Surprise Basket Gacha &amp; Unboxing Reveal** | `shared/rarity.js`, `MysteryBoxCard.jsx`, `UnboxingReveal.jsx`, `unboxing_overlay.dart` |
| **B4** | **Gemini AI Magic Publisher &amp; Tunisian Parser** | `ai.routes.js`, `AiAutoFillBox.jsx`, Tunisian Darija fallback parser |

---

## 4. CQRS-Lite Architecture, Monorepo &amp; UML Modeling

CampusSave enforces a **CQRS-Lite 3-Tier Architecture**:
- **Real-Time Client Reads:** Web React and Flutter subscribe to public catalog updates while Firestore rules restrict sensitive mutations.
- **Centralized Transactional Writes:** All state transitions flow through **53 REST endpoints** (`52` handlers across `14` domain routers in [`backend-node/src/routes.js`](backend-node/src/routes.js) + `/api/v1/health`) protected by `Helmet`, `CORS`, rate limiting, compression, and Zod schemas.
- **Atomic Integrity &amp; Background Sweepers:** Order stock reservation, payment confirmation, and QR pickup run inside Firestore `runTransaction` blocks, kept clean by **4 autonomous background jobs** (`reservationSweeper.js`, `noShowSweeper.js`, `offerExpirySweeper.js`, `demoAutoResetSweeper.js`).

```text
campussave/
├── shared/                      # Single-source domain truth (ES modules + JSON test vectors)
│   ├── pricing.js               # Smart Decay linear-step calculator & urgency colors
│   ├── geo.js                   # ESSECT Montfleury 3 km Haversine distance calculator
│   ├── loyalty.js / impact.js   # EcoPoints tiers, FAO/EPA CO2 & TND conversion metrics
│   ├── dishPhotos.js / spot.js  # 14-dish photography mapper & image crop focal framing
│   └── test-vectors/            # Shared JS <-> Dart cross-runtime cryptographic vectors
├── firebase/                    # Firestore rules, composite indexes & setup guide
├── backend-node/                # Node.js 20 + Express API (Port 4000, 14 modules, 4 jobs)
│   ├── src/modules/             # auth, users, merchants, admin, offers, ai, orders, payments, tickets, radar, loyalty, dashboards, impact, uploads, notifications
│   ├── src/jobs/                # reservation, noShow, offerExpiry & demoAutoReset sweepers
│   └── tests/                   # 49 automated unit & integration test suites
├── web-react/                   # React 18 + Vite + Tailwind + MapLibre GL 3D + Recharts
│   └── tests/                   # Halftone Mascot QR jsQR optical decoding verification
├── mobile-flutter/              # Flutter 3 + Provider + GoRouter + Dio + FCM + MobileScanner
│   ├── lib/                     # Screens, services, shared crypto parity & Griddle theme
│   └── test/                    # Unit, widget & optional live E2E integration tests
└── docs-uml-mockups/            # OpenAPI YAML, 13 UML diagrams, academic reports & demo scripts
```

### Verified UML Design Diagrams ([`docs-uml-mockups/uml/svg/`](docs-uml-mockups/uml/svg))

| Category | Diagrams |
| :--- | :--- |
| **Use Cases** | [`01-uc-global.svg`](docs-uml-mockups/uml/svg/01-uc-global.svg) · [`02-uc-etudiant.svg`](docs-uml-mockups/uml/svg/02-uc-etudiant.svg) · [`03-uc-commercant.svg`](docs-uml-mockups/uml/svg/03-uc-commercant.svg) · [`04-uc-administrateur.svg`](docs-uml-mockups/uml/svg/04-uc-administrateur.svg) |
| **Domain Classes** | [`05-classes.svg`](docs-uml-mockups/uml/svg/05-classes.svg) · [`05a-classes-utilisateurs.svg`](docs-uml-mockups/uml/svg/05a-classes-utilisateurs.svg) · [`05b-classes-commerces-offres.svg`](docs-uml-mockups/uml/svg/05b-classes-commerces-offres.svg) · [`05c-classes-commandes.svg`](docs-uml-mockups/uml/svg/05c-classes-commandes.svg) |
| **Sequences &amp; Lifecycle** | [`06-seq-authentification-validation.svg`](docs-uml-mockups/uml/svg/06-seq-authentification-validation.svg) · [`07-seq-reservation-paiement-qr.svg`](docs-uml-mockups/uml/svg/07-seq-reservation-paiement-qr.svg) · [`08-seq-retrait-recompenses.svg`](docs-uml-mockups/uml/svg/08-seq-retrait-recompenses.svg) · [`09-etats-commande.svg`](docs-uml-mockups/uml/svg/09-etats-commande.svg) |
| **Cloud Deployment** | [`10-deploiement.svg`](docs-uml-mockups/uml/svg/10-deploiement.svg) |

---

## 5. Local Installation &amp; Quickstart Guide

### Prerequisites
- **Node.js** `&gt;= 20.x` &amp; `npm`
- **Flutter SDK** `&gt;= 3.22` (for Android / Mobile Web)
- **Git**

### 1. Clone &amp; Install Dependencies

```bash
git clone https://github.com/MobBlackStar/Groupe01Equipe06.git
cd Groupe01Equipe06

# 1. Shared Domain Package
cd shared && npm install && cd ..

# 2. Backend Node.js API (Port 4000)
cd backend-node && cp .env.example .env && npm install && cd ..

# 3. Web React Client (Port 5173)
cd web-react && cp .env.example .env && npm install && cd ..

# 4. Mobile Flutter Client (Port 5174 / Android USB)
cd mobile-flutter && flutter pub get && cd ..
```

### 2. Run Locally (Separate Terminals)

```bash
# Terminal 1 — Backend API (http://localhost:4000/api/v1/health)
cd backend-node && npm run dev

# Terminal 2 — Web React App (http://localhost:5173)
cd web-react && npm run dev

# Terminal 3 — Mobile Flutter App (Android device or Edge/Chrome)
cd mobile-flutter && flutter run -d chrome --web-port=5174
```

> **Windows 1-Click Workspace Launchers:** The parent workspace includes `start-campussave.bat` (auto-clears ports `4000` &amp; `5173` and launches Backend + Web) and `start-mobile.bat` (auto-detects USB Android via `adb`, falling back to LAN Wi-Fi Flutter Web on port `5174`).

---

## 6. Environment Configuration

No real credentials, `.env` files, or Firebase `google-services.json` keys are tracked in Git. All variable contracts are documented in `.env.example`.

### Backend API ([`backend-node/.env.example`](backend-node/.env.example))

| Variable | Role | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV`, `PORT`, `ALLOW_DEMO_TOKENS` | Runtime mode, HTTP listen port, jury demo tokens toggle | `development`, `4000`, `true` |
| `PUBLIC_BASE_URL`, `WEB_APP_URL`, `CORS_ORIGINS` | Public API URL, frontend origin, allowed CORS list | `http://localhost:4000`, `http://localhost:5173` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase Admin SDK project &amp; Base64-encoded service account | Project ID + Base64 JSON |
| `KONNECT_API_BASE`, `KONNECT_API_KEY`, `KONNECT_RECEIVER_WALLET_ID`, `KONNECT_PAYMENT_LIFESPAN_MIN` | Konnect Network v2 Sandbox payment gateway &amp; 10-min TTL | `https://api.sandbox.konnect.network/api/v2`, `10` |
| `QR_SECRET`, `QR_WINDOW_SECONDS`, `RESERVATION_HOLD_MINUTES` | 64-hex HMAC secret for Living Tickets, rotation cadence, hold TTL | `30`, `10` |
| `AI_PROVIDER`, `AI_MODEL`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_TIMEOUT_MS` | Magic Offer Publisher LLM configuration &amp; fallback timeout | `gemini`, `gemini-3-flash-preview`, `12000` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional CDN image hosting alongside `/uploads` local storage | — |
| `MAIL_WEBHOOK_URL`, `MAIL_WEBHOOK_SECRET`, `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | Port-443 Apps Script HTTPS bridge, Brevo API, and SMTP receipt fallback | `smtp.gmail.com`, `587`, `CampusSave ESSECT` |

### Web Frontend ([`web-react/.env.example`](web-react/.env.example))

| Variable | Role | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST base URL | `http://localhost:4000/api/v1` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY` | Firebase Web SDK &amp; FCM Web Push configuration | Firebase Console keys |
| `VITE_MAP_STYLE_URL` | Vector basemap style URL for Montfleury 3D Holo-Radar | `https://tiles.openfreemap.org/styles/positron` |
| `VITE_USE_MOCKS` | Toggle offline mock fallback mode | `false` |

---

## 7. Automated Verification Ledger

Every workspace package maintains an automated test suite verified prior to final release:

| Package | Command | Verified Coverage |
| :--- | :--- | :--- |
| **`shared/`** | `npm test` (`node --test __tests__/*.test.js`) | **43 / 43 passing** — Smart Decay pricing, Montfleury Haversine fence, EcoPoints loyalty, impact &amp; rarity |
| **`backend-node/`** | `npm test` (`node --test tests/*.test.js`) | **185 / 185 passing** across **49 suites** — RBAC, Konnect dual-verify, 20-buyer concurrency race, HMAC Living Ticket, AI parser, Port-443 mail receipts |
| **`web-react/`** | `npm test` + `npm run build` | **4 / 4 passing** `jsQR` optical Halftone QR tests (sharp + 3×3 blur tolerance) &amp; clean Vite production bundle |
| **`mobile-flutter/`** | `flutter analyze` &amp; `flutter test` | **0 analyzer issues** · **23 / 23 unit &amp; widget tests passing** (+ 2 optional E2E integration tests gated by `CAMPUSSAVE_E2E_BASE`) |

---

## 8. Jury Demo Accounts &amp; 7-Minute Defense Flow

For seamless jury evaluation, both the Web app and Android APK provide a **1-Click Role Switcher** plus standard login credentials:

| Role | Email | Password | Seeded Profile Highlights |
| :--- | :--- | :--- | :--- |
| **Student** | `etudiant@essect.u-tunis.tn` | `CampusSave2026!` | **Yassine Trabelsi** (`EBUSINESS_3A`), `90` EcoPoints (`GRAINE`, 1 order crosses `100 pts`), `-20%` welcome coupon |
| **Merchant** | `commercant@baguette.tn` | `CampusSave2026!` | **Munchies &amp; Baguette Ali Trad** (`merchant-baguette-baguette`), flagship Montfleury partner |
| **ESSECT Admin** | `admin@campussave.tn` | `CampusSave2026!` | **Direction ESSECT**, partner approval queue, deletion, analytics &amp; peak 20-offer demo reset |

### 7-Minute Defense Climax Sequence ([`DEMO_SCRIPT.md`](docs-uml-mockups/demo/DEMO_SCRIPT.md))
1. **`00:00 – 01:00` Impact Hook (Web):** Open `/impact` on Griddle Cream UI showing ESSECT cumulative meals rescued and the 5-track leaderboard.
2. **`01:00 – 02:00` Architecture Pitch:** Present the CQRS-Lite monorepo, shared JS/Dart business core, and centralized atomic transactions.
3. **`02:00 – 03:15` Merchant AI Publishing (Web):** Switch to *Munchies &amp; Baguette*, use **Magic Publisher AI** on a Darija snippet, preview the Smart Decay curve &amp; publish live.
4. **`03:15 – 04:30` 3D Holo-Radar &amp; Mobile Reserve (Phone + Web):** Locate the fresh offer on **Montfleury 3D Holo-Radar**, reserve on Mobile, and watch Web stock drop live without reload.
5. **`04:30 – 05:30` Konnect Checkout &amp; Living Ticket (Phone):** Apply `-20%` loyalty voucher, complete Konnect Sandbox checkout, receive the Port-443 inline-mascot receipt email, and show the 30s rotating HMAC QR.
6. **`05:30 – 06:15` Counter Scan &amp; Unboxing Climax (Dual-Screen):** Merchant scans Student QR; order completes atomically, triggering the Unboxing reveal &amp; pushing Student across `100` EcoPoints.
7. **`06:15 – 07:00` Admin Governance &amp; Closing (Web):** Show consolidated GMV metrics and partner controls in `/admin`.

---

## 9. Team Contributions &amp; Engineering Ownership

| Domain | **Fedi TOUATI** | **Ritej BEJAOUI** |
| :--- | :--- | :--- |
| **Architecture &amp; Cloud** | Node.js 20 API (`14` modules, `4` sweepers), Firestore schema &amp; security rules, Render/CI &amp; APK builds | Wireframes, Figma Hi-Fi prototypes, Griddle Design System &amp; responsive layouts |
| **Core Algorithms &amp; AI** | Smart Decay engine, Konnect Sandbox dual-verify, `HMAC-SHA256` 30s tickets, Gemini AI + Darija parser, Port-443 CID email receipts | Gamified Loyalty Card, 5-stage Gacha Unboxing animation, star rating modal &amp; mono-merchant Bag (`Sac`) |
| **Frontend &amp; Geospatial** | Montfleury **3D Holo-Radar WebGL** (`MapLibre GL`, `11,216` buildings), `SpotEditor`, disk photo uploads, Halftone Mascot QR | React 18 UI kit (`12+` screens), Recharts analytics, public `/impact` challenge, Flutter 3 screens &amp; Mascot FCM polish |
| **Testing &amp; Documentation** | `185` backend tests, `43` shared tests, `jsQR` optical tests, OpenAPI YAML &amp; technical architecture chapters | Flutter widget tests, UX verification, functional specification &amp; user-journey report chapters |

---

<div align="center">
  <sub>Built at <strong>ESSECT Montfleury</strong> — Université de Tunis • Groupe01Equipe06 (2026–2027)</sub>
</div>
