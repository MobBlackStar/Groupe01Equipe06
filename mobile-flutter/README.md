# Application Mobile Flutter 3 & Dart — CampusSave 📱

> **Application Mobile Native Multiplateforme (Android & iOS)** pour les étudiants et commerçants partenaires de l'ESSECT Montfleury.  
> Développé par **Ritej Bejaoui** (Lead UI/UX & Frontend) en synergie avec **Fedi Touati** (Backend).

---

## 🎯 Rôles Pris en Charge
- **Étudiant (`StudentShell`) :** Navigation tactile à 5 onglets : Explorer (`ExploreScreen`), Radar 3D (`RadarScreen`), Mes Commandes (`MyOrdersScreen`), Carte de Fidélité (`LoyaltyCardScreen`), Mon Dashboard (`StudentDashboardScreen`).
- **Commerçant (`MerchantShell`) :** Navigation tactile à 5 onglets : Statistiques (`MerchantDashboardScreen`), Gestion des Offres (`MerchantOffersScreen`), Scanner QR Caméra (`ScannerScreen`), Commandes de Retrait (`MerchantOrdersScreen`), Ma Boutique (`MerchantStoreScreen`).
- *(L'espace Administrateur est réservé à l'application Web haute résolution conformément au cahier des charges).*

---

## 🚀 Démarrage & Exécution

### 1. Prérequis
- Flutter SDK >= 3.22.x (`flutter doctor`)
- Un smartphone Android configuré en mode débogage USB, un émulateur Android Studio, ou Chrome pour le test Web.

### 2. Installation des Dépendances
```bash
flutter pub get
```

### 3. Exécution avec `--dart-define`
```bash
# Sur navigateur Chrome
flutter run -d chrome

# Sur émulateur Android (l'API pointe sur 10.0.2.2:5000)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1

# Sur smartphone physique (remplacer par l'IP locale de votre machine)
flutter run --dart-define=API_BASE_URL=http://192.168.1.50:5000/api/v1
```

---

## 📂 Architecture des Dossiers

```text
lib/
├── app/                  # Routeur déclaratif GoRouter (router.dart)
├── core/                 # Thème sombre Dark Obsidian & constantes
├── features/             # Écrans fonctionnels par rôle
│   ├── auth/             # LoginScreen, RegisterScreen, ProfileScreen
│   ├── checkout/         # CheckoutScreen, PaymentWebViewScreen
│   ├── dashboards/       # StudentDashboardScreen, MerchantDashboardScreen
│   ├── explore/          # ExploreScreen, OfferDetailScreen
│   ├── impact/           # ImpactScreen (Podium des 5 filières ESSECT)
│   ├── loyalty/          # LoyaltyCardScreen (Grille 5 tampons & coupons)
│   ├── merchant/         # MerchantOffersScreen, ScannerScreen, Orders
│   ├── orders/           # MyOrdersScreen (Commandes étudiant)
│   ├── radar/            # RadarScreen (flutter_map & géolocalisation)
│   ├── surprise/         # UnboxingOverlay (Animation haptique native)
│   └── ticket/           # TicketScreen, BoardingPass (HMAC QR 30s)
├── services/             # AuthService, ApiService (Dio), FcmService
└── widgets/              # KpiTile, CountdownChip, LivePriceText, RarityBadge
```
