# MÉMO D'ARCHITECTURE & GUIDE DE SURVIE POUR LA SOUTENANCE 🎓
## Répétition Générale & Démonstration Technique Live — Binôme Fedi & Ritej (ESSECT 2026)

> **Document confidentiel pour Fedi Touati & Ritej Bejaoui**  
> Ce mémo résume exactement **comment lancer la plateforme**, **ce qu'il faut dire avec des mots simples (Technique Feynman)** et **les 5 fichiers de code précis à ouvrir dans VS Code** si le jury d'enseignants demande à inspecter le code source.

---

## ⚡ 1. Démarrage Express de la Démonstration (Checklist 2 minutes)

Ouvrir 3 terminaux distincts avant d'entrer dans la salle de soutenance :

```bash
# TERMINAL 1 : Backend Node.js
cd campussave/backend-node
npm run dev
# -> Le serveur démarre sur http://localhost:4000
# -> En cas de besoin de tunnel pour smartphone physique : cloudflared tunnel --url http://localhost:4000

# TERMINAL 2 : Application Web React
cd campussave/web-react
npm run dev
# -> L'application Web s'ouvre sur http://localhost:5173

# TERMINAL 3 : Application Mobile Flutter
cd campussave/mobile-flutter
flutter run -d chrome    # Ou sélectionner votre smartphone physique Android connecté en USB
```

### 🔄 Le Bouton Magique de Réinitialisation
Si vous faites une répétition avant le passage du jury et que vous souhaitez remettre la base de données à zéro avec des données parfaites :

```bash
cd campussave/backend-node
npm run reset-demo
```
> **Ce que fait cette commande en 3 secondes :** Elle purge les commandes de test et recrée proprement les 6 commerces de Montfleury (dont 1 en attente pour la démo admin), les 20 offres (avec enchères actives), les 3 paniers surprises et le compte étudiant Yassine calé à 90 EcoPoints (à 1 réservation du palier 100 pts !).

---

## ⏱️ 2. Répartition du Temps de Parole (15 minutes au total)

* **00:00 – 03:00 (Ritej) : Introduction, Problématique & Démonstration Étudiant**
  * Contexte du gaspillage à Montfleury et contraintes budgétaires des étudiants.
  * Connexion 1-clic sur le compte étudiant de démo *Yassine Trabelsi*.
  * Navigation sur le catalogue d'offres et le **Holo-Radar 3D WebGL** montrant les restaurants autour de l'ESSECT.
* **03:00 – 07:00 (Fedi) : Architecture 3-Tiers, Réservation Concurrente & Paiement Konnect**
  * Explication du pattern CQRS-lite (écritures via l'API Node.js, lectures réactives Firestore).
  * Réservation en direct d'un *Makloub Escalope* à prix dégressif dynamique.
  * Démonstration du paiement électronique simulé via Konnect Network Sandbox.
* **07:00 – 10:00 (Ritej & Fedi en tandem) : Retrait au Comptoir & Living Ticket Cryptographique**
  * Ritej affiche le **Living Ticket** sur l'écran étudiant : montre le compte à rebours de 30 secondes et le changement de code QR en direct (anti-capture d'écran).
  * Fedi ouvre l'espace commerçant sur l'application mobile Flutter (*Chez Chaker*), active le scanner caméra et flashe le ticket de Ritej.
  * **Effet "Whaou" :** Vibration haptique sur le téléphone, le panier surprise s'ouvre avec animation gamifiée, et le solde d'EcoPoints passe de 90 à 110 (déblocage du coupon de fidélité en direct !).
* **10:00 – 12:00 (Ritej) : Espace Commerçant, Publication par IA & Tableaux de Bord**
  * Saisie vocale/textuelle d'une offre en dialecte tunisien avec pré-remplissage automatique par l'IA.
  * Tableaux de bord d'impact écologique du campus et classement inter-filières (E-Business en tête !).
* **12:00 – 15:00 (Fedi) : Validation Technique, Banc de Tests (137 tests) & Conclusion**
  * Preuve de la robustesse : 107 tests backend, 26 tests partagés, zéro warning Flutter.
  * Conclusion et ouverture aux questions du jury.

---

## 🔍 3. Les 5 Fichiers de Code Clés à Montrer dans VS Code

Si un enseignant vous dit : *"Montrez-moi où est codée telle fonctionnalité"*, voici les 5 joyaux du projet à ouvrir immédiatement :

---

### Fichier 1 : `campussave/shared/pricing.js`
> **Question typique du jury :** *"Comment faites-vous baisser le prix de l'offre au cours du temps sans surcharger la base de données ?"*

* **Lignes à montrer :** Lignes 20 à 75 (fonction `computeUnitPrice`).
* **L'explication Feynman à donner :**
  > « Monsieur / Madame le Professeur, plutôt que d'écrire en base de données chaque seconde pour mettre à jour les prix de centaines de sandwichs, nous utilisons une **fonction mathématique pure**.
  > Cette fonction prend deux paramètres : l'offre et l'horodatage actuel. 
  > - Avant l'heure de début, le prix est au maximum.
  > - Entre le début et la fin du créneau, le prix décroît de manière linéaire par paliers de 100 millimes.
  > - Après l'heure de fin, il est garanti au prix plancher.
  > Le client Web React et le client Mobile Flutter calculent ce prix toutes les secondes en mémoire locale pour animer l'interface, et le serveur Node.js recalcule exactement la même valeur au moment où l'étudiant clique sur Réserver pour sceller le montant dans la transaction. Zéro écriture inutile en base de données ! »
* **Détail technique à souligner :** Tous les calculs sont en **millimes entiers** pour éviter les bugs d'arrondi des nombres à virgule flottante.

---

### Fichier 2 : `campussave/backend-node/src/modules/orders/orders.service.js`
> **Question typique du jury :** *"Que se passe-t-il si deux étudiants cliquent en même temps sur le dernier repas disponible ?"*

* **Lignes à montrer :** Lignes 35 à 95 (méthode `createOrder` avec `db.runTransaction`).
* **L'explication Feynman à donner :**
  > « Nous avons implémenté une **transaction atomique Firestore** avec contrôle de concurrence optimiste.
  > Dans le même bloc transactionnel, le serveur effectue une lecture du stock courant, vérifie que le stock est strictement supérieur à zéro, décrémente le stock de 1 et crée la commande à l'état RESERVED avec un compte à rebours de 10 minutes.
  > Si 20 étudiants cliquent à la même milliseconde, Firestore isole les écritures : le premier remporte le plat, et les 19 autres sont immédiatement rejetés avec un code d'erreur HTTP 409 et le message clair 'Stock épuisé'.
  > Nous avons d'ailleurs écrit un test automatisé simulant 20 requêtes simultanées (`reservation.concurrency.test.js`) qui prouve mathématiquement qu'il n'y a jamais de survente. »

---

### Fichier 3 : `campussave/backend-node/src/modules/payments/payments.service.js`
> **Question typique du jury :** *"Comment gérez-vous le paiement en ligne et que se passe-t-il si l'étudiant ferme son navigateur avant la confirmation ?"*

* **Lignes à montrer :** Lignes 80 à 140 (méthodes `verifyPayment` et `handleWebhook`).
* **L'explication Feynman à donner :**
  > « Nous avons mis en place une architecture à **double canal de confirmation idempotent** avec l'API Konnect Network Sandbox :
  > 1. Un canal asynchrone : les serveurs de Konnect envoient un Webhook direct à notre serveur Node.js.
  > 2. Un canal synchrone : lorsque l'étudiant est redirigé vers l'application, celle-ci demande une vérification.
  > Les deux canaux convergent vers la même fonction transactionnelle. Si la commande a déjà été marquée comme payée par le webhook une fraction de seconde plus tôt, le second appel constate que le statut est déjà PAID et renvoie un succès immédiat sans réattribuer d'EcoPoints en double. C'est le principe d'**idempotence** : une action répétée plusieurs fois produit exactement le même résultat qu'une action unique. »

---

### Fichier 4 : `campussave/backend-node/src/modules/tickets/tickets.service.js`
> **Question typique du jury :** *"Comment empêchez-vous un étudiant de faire une capture d'écran de son QR code et de l'envoyer à un ami ?"*

* **Lignes à montrer :** Lignes 25 à 80 (méthodes `generateTicketPayload` et `validateTicket`).
* **L'explication Feynman à donner :**
  > « C'est notre fonctionnalité phare : le **Living Ticket anti-fraude**.
  > Le QR code n'est pas une image statique, c'est une signature cryptographique **HMAC-SHA256** calculée à partir de la clé secrète de la commande et d'une fenêtre de temps de 30 secondes : $W = \lfloor t / 30 \rfloor$.
  > Toutes les 30 secondes, le code QR change automatiquement. Si un étudiant envoie une capture d'écran sur WhatsApp, le temps que son ami arrive au restaurant, le code a déjà expiré et le scanner le refuse !
  > Pour absorber les petits décalages d'horloge entre smartphones, notre serveur tolère une marge de $\pm 30$ secondes. Et pour empêcher les attaques par devinette, après 5 scans erronés, le ticket est automatiquement verrouillé. »
* **Détail technique à pointer :** Montrer la ligne utilisant `crypto.timingSafeEqual` pour contrer les attaques temporelles par canal auxiliaire.

---

### Fichier 5 : `campussave/web-react/src/features/radar/HoloRadarPage.jsx`
> **Question typique du jury :** *"Comment fonctionne votre carte interactive en 3D ?"*

* **Lignes à montrer :** Lignes 45 à 110 (initialisation de MapLibre avec `pitch: 60`, `bearing: -20` et extrusion 3D des bâtiments).
* **L'explication Feynman à donner :**
  > « Plutôt qu'une simple carte 2D Google Maps classique, nous avons développé un **radar immersif en 3D WebGL** utilisant le moteur MapLibre.
  > La caméra est inclinée à 60 degrés pour offrir une vue en perspective aérienne sur le quartier de Montfleury. 
  > Les bâtiments autour de l'ESSECT sont extrudés en volume 3D d'après les données cadastrales réelles d'OpenStreetMap.
  > Chaque restaurant partenaire est représenté par une balise lumineuse pulsante aux couleurs de notre charte graphique. L'étudiant peut ajuster son rayon de marche (300 m, 500 m, 1 km) et repérer les offres les plus urgentes en un coup d'œil avant de quitter le campus. »

---

## 🛡️ 4. Les 5 Réponses Imparables aux Questions Pièges

1. **« Pourquoi avoir utilisé Firebase au lieu d'une base relationnelle MySQL / PostgreSQL classique ? »**
   > *Réponse :* « Pour une application mobile de sauvetage alimentaire, la synchronisation réactive en temps réel est primordiale. Les écouteurs natifs Firestore (`onSnapshot` / `snapshots()`) permettent aux étudiants de voir les repas disparaître ou changer de prix à la seconde près sans recharger la page et sans saturer le serveur de requêtes de polling HTTP. En revanche, pour préserver l'intégrité relationnelle, nous avons interdit les écritures clientes directes et centralisé toutes les mutations derrière des transactions atomiques sur notre serveur Node.js. »

2. **« Votre application fonctionne-t-elle si la connexion Internet coupe au moment du retrait ? »**
   > *Réponse :* « Côté étudiant, le Living Ticket continue de générer son code cryptographique et affiche un code PIN de secours à 6 chiffres même sans réseau grâce aux données mises en cache localement. Côté commerçant, la vérification finale nécessite une connexion brève pour valider la transaction dans Firestore et éviter qu'un ticket ne soit utilisé deux fois. »

3. **« D'où sortent vos chiffres d'économies de CO₂ ? »**
   > *Réponse :* « Nous ne les avons pas inventés : ils reposent sur le ratio officiel de la **FAO (Food and Agriculture Organization, 2013)** qui établit que chaque gramme de nourriture gaspillée équivaut à 2,5 grammes de CO₂e émis tout au long de sa chaîne de production. Pour rendre ces données concrètes aux yeux des étudiants de l'ESSECT, nous appliquons les facteurs d'équivalence de l'**US EPA** : 10 grammes de CO₂ par charge de smartphone et 244 grammes de CO₂ par kilomètre parcouru en voiture thermique. »

4. **« Comment garantissez-vous que le commerçant est bien situé à Montfleury ? »**
   > *Réponse :* « Notre schéma de validation Zod applique la formule mathématique de la distance orthodromique de Haversine (`shared/geo.js`). Tout commerce dont les coordonnées GPS dépassent le rayon réglementaire strict de **3 000 mètres (3 km)** par rapport au point central du campus de l'ESSECT est automatiquement refusé lors de son inscription. »

5. **« Comment s'est passée la répartition du travail entre vous deux ? »**
   > *Réponse :* « Nous avons appliqué une séparation des responsabilités stricte : **Fedi** a conçu l'architecture backend, les règles de sécurité Firestore, les transactions atomiques, la cryptographie HMAC et l'intégration Konnect. **Ritej** a réalisé l'expérience utilisateur complète sur Web (React) et Mobile (Flutter), le design system Dark Obsidian, la carte de fidélité et les tableaux de bord. Grâce au module `/shared` et au contrat d'interface documenté dans OpenAPI, nous avons pu développer en parallèle sans jamais nous bloquer ni créer de conflit Git ! »
