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
# Développement sur la même machine (Chrome / bureau) : l'API par défaut est http://localhost:4000/api/v1
flutter run -d chrome

# Émulateur Android (l'émulateur voit la machine hôte sous 10.0.2.2)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1

# Application connectée aux services HÉBERGÉS (aucune adresse du réseau local)
#   API_BASE_URL : le backend Node.js hébergé  |  WEB_APP_URL : le site web hébergé (ex. GitHub Pages),
#   utilisé pour afficher le radar 3D WebGL dans la WebView (vide = carte 2D native uniquement)
flutter run --dart-define=API_BASE_URL=https://<hote-du-backend>/api/v1 --dart-define=WEB_APP_URL=https://<utilisateur>.github.io/<depot>

# APK de production
flutter build apk --release --dart-define=API_BASE_URL=https://<hote-du-backend>/api/v1 --dart-define=WEB_APP_URL=https://<utilisateur>.github.io/<depot>
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
