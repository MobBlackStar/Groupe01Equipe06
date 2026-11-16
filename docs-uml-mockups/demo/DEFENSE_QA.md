# Guide Complet des Questions & Réponses de Soutenance (25 Q&A) 🎯

> **Épreuve :** Soutenance du Projet Pédagogique Intégrateur (Web React & Mobile Flutter)  
> **Établissement :** ESSECT Montfleury — Université de Tunis (Licence E-Business 2026)  
> **Binôme :** Ritej Bejaoui & Fedi Touati  

---

## 🏛️ BLOC 1 : ARCHITECTURE SYSTÈME & BASE DE DONNÉES (Questions 1 à 6)

### Q1 : Pourquoi avoir interdit les écritures directes dans Firestore depuis React et Flutter ?
**Réponse (Fedi) :**  
Dans une application manipulant de l'argent réel et des stocks alimentaires périssables, autoriser les écritures clientes directes exposerait la base à des modifications malveillantes ou des contournements de logique financière. En centralisant toutes les mutations dans l'API Node.js via le SDK Firebase Admin, nous garantissons l'exécution de transactions atomiques strictes (`runTransaction`), la validation Zod préalable et la signature cryptographique des commandes.

### Q2 : Quelle est la différence entre votre modèle de données et une base relationnelle SQL ?
**Réponse (Ritej) :**  
Nous avons privilégié Cloud Firestore (NoSQL orienté documents) pour exploiter ses flux d'écoute temps réel natifs (`onSnapshot` en React et `snapshots()` en Flutter). Pour éliminer les jointures coûteuses inexistantes en NoSQL, nous avons appliqué une dénormalisation contrôlée : les documents `orders` embarquent un instantané immuable du commerce et de l'offre au moment de l'achat.

### Q3 : Comment gérez-vous les conflits de concurrence si 20 étudiants réservent le dernier panier au même instant ?
**Réponse (Fedi) :**  
Nous utilisons une transaction Firestore atomique avec verrouillage optimiste. La transaction lit le document de l'offre, vérifie que `quantityAvailable >= requestedQuantity`, décrémente le stock et crée la commande. Si plusieurs requêtes arrivent simultanément, Firestore retente automatiquement les transactions en conflit. Notre banc de test automatisé simulant 20 acheteurs concurrents prouve formellement qu'exactement 5 commandes sont créées pour un stock de 5, et que les 15 autres reçoivent un code HTTP 409 `OFFER_SOLD_OUT`.

### Q4 : Pourquoi avoir isolé un module `@shared` à la racine du monorepo ?
**Réponse (Ritej) :**  
Le principe DRY (*Don't Repeat Yourself*). L'algorithme d'enchère dégressive Smart Decay, les conversions monétaires en millimes tunisiens et le calcul des 5 tampons de fidélité doivent produire un résultat rigoureusement identique côté serveur et sur les deux applications clientes. Isoler ce code dans `/shared` garantit une cohérence absolue et évite toute dérive de code.

### Q5 : Que se passe-t-il si un étudiant réserve un panier mais ne procède jamais au paiement ?
**Réponse (Fedi) :**  
Dès la création, la commande reçoit le statut `RESERVED` avec un horodatage d'expiration `reservationExpiresAt` fixé à $T + 10\text{ minutes}$. L'étudiant peut annuler manuellement ce qui libère le stock immédiatement. En parallèle, notre tâche d'arrière-plan Node.js (`noShowSweeper`) scrute les réservations périmées et restaure atomiquement les stocks non payés.

### Q6 : Comment assurez-vous l'étanchéité des rôles entre Étudiant, Commerçant et Administrateur ?
**Réponse (Ritej) :**  
La sécurité est assurée en double barrière : d'une part, les *Custom Claims* injectés dans le jeton JWT Firebase Auth sont validés par notre middleware Node.js `requireRole(allowedRoles)` ; d'autre part, les règles de sécurité Firestore (`firestore.rules`) comparent `request.auth.token.role` pour interdire toute lecture ou écriture non autorisée.

---

## ⚡ BLOC 2 : ALGORITHMES, SMART DECAY & CRYPTOGRAPHIE (Questions 7 à 12)

### Q7 : Comment fonctionne le Smart Decay sans surcharger la base de données de milliers d'écritures ?
**Réponse (Fedi) :**  
C'est une fonction pure déterministe basée sur l'horloge ! L'offre stocke uniquement son prix initial, son prix plancher, et les heures de début et fin de créneau. À chaque seconde, le composant `PriceTicker` calcule le prix courant mathématiquement selon la formule :
$$P(t) = P_{plancher} + (P_{depart} - P_{plancher}) \times (1 - \text{progression})^\gamma$$
Il n'y a donc strictement zéro écriture en base de données pendant toute la durée de l'enchère.

### Q8 : Comment empêchez-vous un étudiant de frauder avec une capture d'écran de son QR code ?
**Réponse (Fedi) :**  
Grâce à notre *Living Ticket*. Le QR code est dynamique et se regénère toutes les 30 secondes en signant un horodatage avec HMAC-SHA256. Lors du scan au comptoir, le commerçant valide la signature pour la fenêtre courante $\pm 30\text{ secondes}$. Une capture d'écran transmise sur WhatsApp sera déjà expirée et rejetée par le scanner. De plus, une commande scannée bascule immédiatement à `COMPLETED`, interdisant tout second compostage.

### Q9 : Pourquoi utiliser des entiers en millimes plutôt que des nombres flottants pour les prix ?
**Réponse (Ritej) :**  
En informatique, les nombres à virgule flottante (norme IEEE 754) souffrent d'imprécisions d'arrondi bien connues (ex: $0.1 + 0.2 = 0.30000000000000004$). Dans un système financier tunisien où 1 Dinar équivaut à 1000 millimes, compter exclusivement en millimes entiers ($3800\text{ millimes} = 3,800\text{ DT}$) élimine définitivement tout risque d'erreur d'arrondi monétaire.

### Q10 : Pourquoi avoir prévu un code de secours manuel à 6 chiffres sur le Living Ticket ?
**Réponse (Ritej) :**  
L'expérience utilisateur en conditions réelles : dans les sous-sols de certaines cafétérias de Montfleury, le réseau 4G peut être défaillant ou la luminosité insuffisante pour la caméra. Le code à 6 chiffres, dérivé cryptographiquement de la même signature HMAC, permet au commerçant de valider le retrait en le tapant sur son clavier numérique.

### Q11 : Comment garantissez-vous que les commerces sont bien situés autour de l'ESSECT ?
**Réponse (Fedi) :**  
Lors de l'onboarding, les coordonnées GPS de la boutique sont géocodées. L'API calcule la distance orthodromique exacte par la formule de Haversine par rapport au point d'ancrage de l'ESSECT (`lat: 36.7871, lng: 10.1748`). Si la distance dépasse 3000 mètres, la requête est rejetée avec l'erreur `TOO_FAR`.

### Q12 : Sur quoi vous basez-vous pour calculer les équivalences écologiques (smartphones et voitures) ?
**Réponse (Ritej) :**  
Nous avons rejeté les chiffres arbitraires pour adopter les deux références scientifiques mondiales : le rapport officiel de la FAO de 2013 (*Food Wastage Footprint*) fixant qu'un gramme de nourriture évite 2,5 g d'équivalent CO₂, et le calculateur d'équivalences de l'EPA américaine établissant qu'une charge complète de smartphone correspond à 8,22 g de CO₂ et un kilomètre en voiture urbaine à 244 g de CO₂.

---

## 🎨 BLOC 3 : DÉVELOPPEMENT WEB REACT & ERGONOMIE (Questions 13 à 18)

### Q13 : Comment avez-vous évité les requêtes excessives dans la barre de recherche du catalogue ?
**Réponse (Ritej) :**  
Nous avons implémenté un hook de *debounce* temporisé à 300 millisecondes. Lorsque l'étudiant tape *"makloub"*, le filtre ne s'applique que 300 ms après la dernière frappe de touche, ce qui évite 7 calculs de filtrage inutiles et garantit une interface à 60 images par seconde.

### Q14 : Comment fonctionne l'affichage 3D sur le Holo-Radar WebGL ?
**Réponse (Fedi) :**  
Nous utilisons la bibliothèque open-source **MapLibre GL** avec une projection inclinée (`pitch: 60°`). Nous injectons une couche d'extrusion polygonale 3D (`fill-extrusion`) qui donne du relief aux bâtiments réels de Montfleury. Les boutiques sont matérialisées par des balises hexagonales interactives dont la couleur change selon l'urgence de fermeture.

### Q15 : Pourquoi avoir opté pour la charte graphique "Dark Obsidian & Electric Lime" ?
**Réponse (Ritej) :**  
Ce choix répond à un double impératif : ergonomique et écologique. Le fond sombre profond (`#0D0F12`) réduit significativement la consommation électrique sur les écrans OLED des smartphones étudiants, tandis que le vert néon (`#CCFF00`) apporte une lisibilité maximale et véhicule l'identité moderne de l'économie circulaire.

### Q16 : Comment avez-vous structuré vos composants de data visualisation Recharts ?
**Réponse (Ritej) :**  
Nous avons conçu trois composants réutilisables dans `src/components/charts/` : `KpiCard` pour les indicateurs clés avec badges de tendance, `LineChartCard` pour les courbes cumulatives avec dégradés SVG semi-transparents, et `BarChartCard` pour les distributions journalières avec infobulles sombres personnalisées.

### Q17 : Comment gérez-vous la réactivité de la navigation entre 360 px, 768 px et 1440 px ?
**Réponse (Ritej) :**  
Grâce à nos layouts dédiés (`StudentLayout`, `MerchantLayout`) couplés aux classes utilitaires de Tailwind CSS. Sur grand écran (1440 px), la navigation s'effectue via une barre supérieure exhaustive ; sur smartphone (360 px), une barre tactile basse à 5 onglets prend automatiquement le relais pour une utilisation à une seule main, sans aucun défilement horizontal.

### Q18 : À quoi sert le bouton "Commutateur de Rôle Démo" dans la barre de navigation ?
**Réponse (Ritej) :**  
C'est un outil d'ingénierie conçu spécialement pour la soutenance universitaire : il permet d'injecter instantanément la session d'authentification de Ritej (Étudiante), de Baguette & Baguette (Commerçant) ou de l'Administration ESSECT en 1 seconde chrono sans devoir se déconnecter et retaper des identifiants devant le jury.

---

## 📱 BLOC 4 : DÉVELOPPEMENT MOBILE FLUTTER & INTÉGRATIONS TIERCES (Questions 19 à 25)

### Q19 : Pourquoi avoir choisi Flutter plutôt qu'une solution hybride comme React Native ou PWA ?
**Réponse (Fedi) :**  
Flutter compile directement en code machine natif via le moteur graphique Skia/Impeller, ce qui procure des animations à 60 fps constantes sans pont JavaScript. Pour des fonctionnalités critiques comme le scanner caméra QR en direct, le retour haptique de l'unboxing et la cartographie géospatiale, Flutter offre des performances et un contrôle matériel incomparables.

### Q20 : Comment le paiement Konnect est-il exécuté sur l'application mobile Flutter ?
**Réponse (Ritej) :**  
L'application appelle notre endpoint `POST /payments/konnect/init`. En réponse, le serveur renvoie l'URL de paiement sandbox et le `payUrl`. L'application Flutter ouvre un écran sécurisé `PaymentWebViewScreen` encapsulant le composant officiel `webview_flutter`. Dès que l'étudiant valide sa carte bancaire fictive, la WebView intercepte la redirection vers `/payment/return` et redirige automatiquement vers le Living Ticket.

### Q21 : Comment fonctionne l'animation de l'Unboxing Reveal du Panier Surprise sur mobile ?
**Réponse (Ritej) :**  
Dans `unboxing_overlay.dart`, nous utilisons un `AnimationController` pilotant une courbe élastique `Curves.elasticOut`. La boîte subit d'abord une rotation oscillatoire rapide avec `Transform.rotate` simulant une secousse, puis le couvercle éclate via `ScaleTransition` tandis que le vibreur du téléphone déclenche un choc tactile lourd (`HapticFeedback.heavyImpact()`). Les articles découverts jaillissent ensuite en cascade avec un fondu d'opacité.

### Q22 : Comment le scanner commerçant Flutter traite-t-il les QR codes filmés par la caméra ?
**Réponse (Fedi) :**  
Nous exploitons le package `mobile_scanner`. Dès qu'un code QR est détecté dans le viseur, le flux vidéo s'arrête momentanément pour éviter les lectures en double, extrait la chaîne JSON signée, et expédie une requête atomique vers `POST /tickets/scan`. En cas de succès, un signal sonore et un retour haptique vert confirment la remise du repas.

### Q23 : Comment gérez-vous l'évaluation des commandes et son impact sur la réputation du commerçant ?
**Réponse (Ritej) :**  
Dès qu'une commande passe au statut `COMPLETED`, l'étudiant dispose d'un bouton "⭐ Noter" qui ouvre `RatingDialog`. Il peut attribuer de 1 à 5 étoiles et rédiger un avis de 280 caractères maximum. Le serveur vérifie que la commande n'a pas déjà été notée (`409 ALREADY_RATED`) et met à jour instantanément la moyenne d'étoiles de la boutique dans une transaction Firestore.

### Q24 : Quelles sont les notifications push configurées sur la plateforme ?
**Réponse (Fedi) :**  
Grâce à Firebase Cloud Messaging (FCM), le système gère 7 événements clés : confirmation d'approbation d'un commerce, notification de commande payée pour le commerçant, mise à disposition du Living Ticket, rappel de retrait 30 minutes avant fermeture, félicitations après récupération du repas, déblocage d'un bon de réduction de fidélité, et alerte collective de nouveau panier surprise.

### Q25 : Si vous deviez déployer CampusSave en production commerciale demain, quelles seraient vos priorités ?
**Réponse (Ritej & Fedi) :**  
Premièrement, basculer la passerelle Konnect de l'environnement Sandbox vers les clés de production réelles en partenariat avec une banque tunisienne. Deuxièmement, migrer l'API Node.js vers Google Cloud Run avec autoscaling automatique pour absorber les pics de commande entre 12h et 14h. Troisièmement, signer une convention officielle avec la direction de l'ESSECT pour intégrer les badges étudiants RFID/NFC de l'université.
