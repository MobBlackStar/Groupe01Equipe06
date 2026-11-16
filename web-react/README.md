# CampusSave Web — Application React 18 & Tailwind CSS

> **Front-end Web Client** pour étudiants, commerçants et administration de l'ESSECT Montfleury.  
> Développé par **Ritej Bejaoui** (Lead UI/UX & Frontend).

---

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances
```bash
npm install
```

### 2. Configuration d'Environnement
```bash
cp .env.example .env
```
Assurez-vous que `VITE_API_URL` pointe vers l'API Node.js (`http://localhost:5000/api/v1`).

### 3. Lancement du Serveur de Développement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:5173`.

### 4. Compilation de Production
```bash
npm run build
```

---

## 🎨 Design System : Dark Obsidian & Electric Lime
- **Arrière-plan principal :** `#0D0F12`
- **Surfaces & Cartes :** `#161920`
- **Accentuation Primaire :** `#CCFF00` (Electric Lime)
- **Urgence & Alertes :** `#FF5500` (Urgent Amber)
- **Rareté Mystère :** `#FFAA00` (Gold) & `#00E5FF` (Cyan)

---

## 📂 Architecture des Dossiers

```text
src/
├── components/       # UI Kit, Recharts graphiques, Layouts unifiés
│   ├── charts/       # KpiCard, LineChartCard, BarChartCard
│   ├── layout/       # Navbar, Footer, StudentLayout, MerchantLayout, AdminLayout
│   ├── offers/       # OfferCard, MysteryBoxCard, PriceTicker
│   └── ui/           # Button, Input, Modal, Badge, Spinner, EmptyState
├── context/          # AuthContext (Firebase Auth + session démo locale)
├── features/         # Écrans fonctionnels par rôle
│   ├── admin/        # AdminDashboard, AdminMerchants, AdminUsers
│   ├── auth/         # LoginPage, RegisterPage, ProfilePage
│   ├── checkout/     # CheckoutPage (10 min), PaymentReturnPage (Konnect)
│   ├── dashboards/   # StudentDashboard (KPIs, Recharts, notations)
│   ├── explore/      # BrowsePage (filtres, debounce, catalogue)
│   ├── impact/       # ImpactDashboardPage (EPA/FAO, leaderboard filières)
│   ├── loyalty/      # LoyaltyCardPage (Pass virtuel, 5 tampons, coupons)
│   ├── merchant/     # MerchantDashboard, OfferForm, Scan, Orders, Store
│   ├── orders/       # MyOrdersPage, OrderRow, RatingDialog
│   ├── radar/        # HoloRadarPage (MapLibre 3D WebGL)
│   ├── surprise/     # UnboxingReveal (Framer Motion)
│   └── ticket/       # LivingTicketPage, BoardingPass (HMAC QR 30s)
├── lib/              # Axios apiClient, endpoints, dictionnaire d'erreurs
└── routes/           # AppRouter, ProtectedRoute, RoleRoute
```
