# Application Mobile Flutter — CampusSave 📱

> Application mobile native Android & iOS pour le projet CampusSave (ESSECT 2026).

---

## 🎯 Rôles Pris en Charge
- **Étudiant :** Exploration géolocalisée des offres de Montfleury, réservation, paiement Konnect via WebView, affichage du ticket sécurisé avec QR code dynamique 30 s et cagnotte EcoPoints.
- **Commerçant :** Gestion du catalogue d'offres, pré-remplissage assisté et scanner de tickets avec retour haptique et confirmation sonore.
- *(L'espace Administrateur est réservé à l'application Web conformément au cahier des charges).*

---

## 🚀 Démarrage & Exécution

### 1. Prérequis
- Flutter SDK >= 3.x (`flutter doctor`)
- Un smartphone Android configuré en mode débogage USB ou un émulateur Android Studio

### 2. Installation des dépendances
```bash
flutter pub get
```

### 3. Exécution
```bash
# Sur émulateur Android (l'API pointe sur 10.0.2.2:4000)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1

# Sur smartphone physique (remplacer par l'IP locale de votre machine de dev)
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:4000/api/v1
```
