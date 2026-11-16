# RAPPORT DE PROJET PÉDAGOGIQUE INTÉGRATEUR

```text
========================================================================================
                      UNIVERSITÉ DE TUNIS
  ÉCOLE SUPÉRIEURE DES SCIENCES ÉCONOMIQUES ET COMMERCIALES DE TUNIS
                           (ESSECT MONTFLEURY)
              Département Informatique & Décisionnelle
        Licence en Sciences Économiques et de Gestion — Mention E-Business
                       Année Universitaire : 2026-2027
========================================================================================

                                CAMPUSSAVE
     Plateforme Intelligente Anti-Gaspillage Alimentaire & Solidarité Étudiante
                      en Milieu Universitaire (Montfleury)

             Projet Pédagogique : Intégration Web & Développement Mobile

                             RÉALISÉ PAR LE BINÔME :
                   • Ritej BEJAOUI (Lead UI/UX & Frontend)
                   • Fedi TOUATI (Lead Backend, Sécurité & Architecture)

                     Enseignant Référent / Responsable de Module :
                     Commission Pédagogique E-Business & Mobile — ESSECT

                               Date de Soumission :
                             Lundi 23 Novembre 2026
========================================================================================
```

---

## 📑 TABLE DES MATIÈRES

- [Remerciements](#remerciements)
- [Résumé Exécutif (Français & Anglais)](#résumé-exécutif)
- [Chapitre 1 : Introduction, Contexte & Objectifs Pédagogiques](#chapitre-1--introduction-contexte--objectifs-pédagogiques)
  - 1.1 Contexte Universitaire & Problématique du Gaspillage Alimentaire à Montfleury
  - 1.2 La Vision CampusSave : Triple Impact Économique, Écologique et Social
  - 1.3 Objectifs Académiques et Techniques du Projet
- [Chapitre 2 : Analyse Fonctionnelle & Spécification des Besoins](#chapitre-2--analyse-fonctionnelle--spécification-des-besoins)
  - 2.1 Cartographie des Acteurs (Étudiant, Commerçant, Administrateur)
  - 2.2 Couverture Exhaustive des 8 Fonctionnalités Obligatoires (M1 à M8)
  - 2.3 Description Détaillée des 4 Fonctionnalités Innovantes Bonus (B1 à B4)
  - 2.4 Matrice des Cas d'Utilisation UML (Diagrammes 01 à 04)
- [Chapitre 3 : Architecture Technique & Synchronisation Temps Réel](#chapitre-3--architecture-technique--synchronisation-temps-réel)
  - 3.1 Architecture Monorepo 3-Tiers à Haute Intégrité
  - 3.2 Le Choix Hybride : Lectures Temps Réel Firestore vs Écritures Sécurisées REST Node.js
  - 3.3 Domaine Mathématique & Métier Partagé (`/shared`)
  - 3.4 Passerelle de Paiement Électronique Konnect Network & Stockage Médias Cloudinary
- [Chapitre 4 : Modélisation UML & Conception de la Base de Données NoSQL](#chapitre-4--modélisation-uml--conception-de-la-base-de-données-nosql)
  - 4.1 Modèle de Données Firestore NoSQL Dénormalisé & Index Composites
  - 4.2 Machine à États Finis du Cycle de Vie des Commandes (Diagramme 09)
  - 4.3 Sécurité Granulaire Firestore par Rôle & Revocation List
  - 4.4 Diagrammes de Séquence de Référence (Paiement Konnect 06 & Living Ticket 07)
  - 4.5 Architecture Physique de Déploiement Cloud (Diagramme 10)
- [Chapitre 5 : Algorithmes & Mécaniques Intelligentes](#chapitre-5--algorithmes--mécaniques-intelligentes)
  - 5.1 Enchère Dégressive Temporelle (Smart Decay) sans Écriture Base de Données
  - 5.2 Cryptographie HMAC-SHA256 du Living Ticket Rotatif (30s) & Code 6 Chiffres
  - 5.3 Moteur de Rareté Gacha du Panier Surprise (Mystery Box)
  - 5.4 Parseur d'Offres IA Multimodal Gemini & Fallback Culinaire Tunisien
  - 5.5 Facteurs d'Équivalences Carbone Officiels FAO 2013 & US EPA
- [Chapitre 6 : Réalisation, Interfaces & Expérience Utilisateur (Web & Mobile)](#chapitre-6--réalisation-interfaces--expérience-utilisateur-web--mobile)
  - 6.1 Design System Dark Obsidian & Electric Lime
  - 6.2 Parcours Étudiant : Catalogue, Holo-Radar 3D WebGL & Living Ticket
  - 6.3 Espace Commerçant : Publication IA, Courbe Smart Decay & Scanner Caméra
  - 6.4 Console d'Administration & Supervision Universitaire
  - 6.5 Tableaux de Bord par Rôle, Gamification & Défi Inter-Filières
- [Chapitre 7 : Tests, Déploiement & Bilan Qualité](#chapitre-7--tests-déploiement--bilan-qualité)
  - 7.1 Stratégie de Test Automatisé (Banc de Test 91 Tests Unitaires & Concurrence 20 Acheteurs)
  - 7.2 Audit de Sécurité, Absence de Secrets & Variables d'Environnement
- [Conclusion Générale, Limites & Perspectives d'Évolution](#conclusion-générale-limites--perspectives-dévolution)
- [Bibliographie & Références Scientifiques](#bibliographie--références-scientifiques)

---

## Remerciements

Nous tenons à exprimer notre profonde gratitude au corps professoral et à l'équipe pédagogique de l'**ESSECT Montfleury**, notamment aux enseignants des modules d'*Intégration Web* et de *Développement d'Applications Mobiles*, pour la rigueur méthodologique et technique qu'ils nous ont inculquée tout au long de cette 3ème année de Licence E-Business.

Nos remerciements s'adressent également aux commerçants et restaurateurs du quartier de Montfleury ayant accepté de répondre à notre enquête terrain préliminaire, nous permettant ainsi de concevoir une solution fidèle à leurs contraintes opérationnelles réelles.

---

## Résumé Exécutif

### Résumé (Français)
**CampusSave** est une plateforme omnicanale innovante (Web React.js 18 et Mobile Flutter 3) dédiée à l'éradication du gaspillage alimentaire autour du campus de l'ESSECT Montfleury (Université de Tunis). En reliant les étudiants aux commerces de proximité dans un rayon strict de 3 km, CampusSave permet aux restaurateurs de commercialiser leurs surplus quotidiens à prix fortement remisé grâce à un algorithme d'enchère dégressive dynamique calculé en temps réel (*Smart Decay*).

La solution garantit une sécurité transactionnelle de niveau bancaire : réservations atomiques à concurrence stricte (banc de test à 20 acheteurs simultanés), intégration du bac à sable de paiement électronique *Konnect Network*, et validation physique au comptoir par un *Living Ticket* cryptographique rotatif toutes les 30 secondes basé sur HMAC-SHA256, immunisé contre les captures d'écran. La plateforme intègre en outre un radar cartographique 3D WebGL (MapLibre), un générateur d'offres par Intelligence Artificielle générative avec analyseur dialectal tunisien, une carte de fidélité éco-digitale à 5 tampons et une vitrine d'impact environnemental public certifiée selon les standards officiels de la FAO et de l'US EPA.

### Executive Summary (English)
**CampusSave** is an innovative omnichannel platform (React.js 18 Web and Flutter 3 Mobile) engineered to eradicate food waste around the ESSECT Montfleury university campus in Tunis. By bridging university students with local neighborhood food vendors within a strict 3 km radius, CampusSave empowers merchants to rescue daily unsold meals at discounted rates via a real-time temporal Dutch auction algorithm (*Smart Decay*).

The platform guarantees institutional-grade transactional integrity: atomic stock reservations under extreme concurrency (20 simultaneous buyers benchmark), secure digital payments powered by the *Konnect Network* sandbox, and counter redemption secured by a dynamic 30-second HMAC-SHA256 rotating *Living Ticket* QR code that entirely defeats screenshot fraud. Additional smart mechanics include a WebGL 3D urban radar (MapLibre), an AI-driven multimodal offer generator featuring a Tunisian culinary fallback parser, a 5-stamp digital eco-loyalty passport, and a public campus impact dashboard certified against official FAO and US EPA environmental conversion standards.

---

## Chapitre 1 : Introduction, Contexte & Objectifs Pédagogiques

### 1.1 Contexte Universitaire & Problématique du Gaspillage Alimentaire à Montfleury
Le quartier universitaire de Montfleury à Tunis accueille chaque jour des milliers d'étudiants fréquentant l'ESSECT et les facultés avoisinantes. Malgré cette forte concentration démographique, deux paradoxes économiques et environnementaux majeurs coexistent :
1. **Précarité étudiante et pouvoir d'achat :** Une proportion substantielle d'étudiants fait face à un budget quotidien d'alimentation restreint, les contraignant souvent à des choix nutritionnels de faible qualité.
2. **Gaspillage alimentaire structurel :** Les cafétérias, boulangeries, sandwicheries et restaurants de Montfleury préparent quotidiennement des repas et viennoiseries dont une fraction non négligeable (estimée entre 10% et 20% des volumes produits) reste invendue à l'heure de fermeture et finit irrémédiablement dans les bennes à ordures, faute de canal de distribution rapide et sécurisé.

### 1.2 La Vision CampusSave : Triple Impact Économique, Écologique et Social
CampusSave a été imaginé pour transformer cette perte sèche en une opportunité tripartite :
- **Pour l'Étudiant :** Accès à des repas complets, chauds ou surprenants à des prix défiant toute concurrence (remises de -40% à -70%), valorisant leur engagement civique grâce à un programme de fidélité ludique.
- **Pour le Commerçant :** Monétisation de denrées périssables vouées à la destruction, acquisition d'une nouvelle clientèle étudiante fidèle et affirmation d'une démarche RSE de quartier.
- **Pour l'Environnement et l'Université :** Réduction mesurable de l'empreinte carbone universitaire, chaque gramme de nourriture sauvé évitant l'émission de gaz à effet de serre liés à la décomposition organique.

### 1.3 Objectifs Académiques et Techniques du Projet
Dans le cadre du cursus Licence E-Business 3ème année, ce projet intégrateur répond à un ensemble d'objectifs académiques et techniques ambitieux :
- Concevoir et implémenter une **architecture monorepo propre** séparant la logique de domaine partagée, l'API backend et les clients frontend.
- Maîtriser le développement web moderne sous **React 18 / Tailwind CSS** et le développement mobile natif sous **Flutter 3 / Dart**.
- Implémenter des transactions atomiques robustes sous **Google Cloud Firestore** et sécuriser les échanges via des jetons JWT enrichis de Custom Claims.
- Intégrer des tiers de confiance réels : passerelle de paiement **Konnect Sandbox**, stockage de médias **Cloudinary**, et moteur d'IA **Google Gemini**.

---

## Chapitre 2 : Analyse Fonctionnelle & Spécification des Besoins

### 2.1 Cartographie des Acteurs
Le système identifie trois rôles stricts et hermétiques, modélisés dans l'énuméré immuable `ROLES` de `@shared/constants.js` :
- **L'Étudiant (`STUDENT`) :** Acteur consommateur. Il explore les offres géolocalisées, visualise la dégressivité des prix, procède au paiement Konnect, présente son Living Ticket rotatif au comptoir, accumule des tampons éco-responsables et note ses repas.
- **Le Commerçant (`MERCHANT`) :** Acteur partenaire. Il soumet sa boutique pour validation dans un rayon de 3 km, publie ses invendus via l'éditeur magique IA, prévisualise sa courbe Smart Decay, et valide les retraits en scannant le QR code étudiant via sa caméra ou par saisie manuelle d'un code de secours.
- **L'Administrateur (`ADMIN`) :** Acteur régulateur. Il supervise la plateforme depuis un tableau de bord global, étudie les pièces justificatives des boutiques candidates, approuve ou suspend les commerçants et utilisateurs malveillants.

### 2.2 Couverture Exhaustive des 8 Fonctionnalités Obligatoires (M1 à M8)
L'intégralité des 8 fonctionnalités requises par le cahier des charges académique est opérationnelle :
- **M1 — Authentification, Rôles & Profils :** Inscription avec sélection de la filière ESSECT, contrôle d'accès par rôle (RBAC) vérifié à la fois dans les middlewares Node.js et les règles de sécurité Firestore.
- **M2 — Enrôlement Commerce & Modération Admin :** Formulaire d'onboarding géolocalisé avec sélecteur cartographique MapPicker, vérification du rayon campus $\le 3\text{ km}$, et console administrative de validation.
- **M3 — Publication d'Offres (Prix Fixe & Dégressif) :** Formulaire de création complet, sélection du créneau horaire $\le 6\text{ h}$, et choix entre prix remisé fixe ou Smart Decay.
- **M4 — Catalogue, Moteur de Recherche & Filtrage :** Barre de recherche avec debounce personnalisé (300 ms), filtres par catégorie, prix plafond, panier surprise et tri croissant par distance.
- **M5 — Réservation 10-Min & Concurrence Extrême :** Verrouillage de stock atomique dans une transaction Firestore, attribution d'un compte à rebours de 10 minutes (`reservationExpiresAt`) et libération immédiate en cas d'annulation ou d'expiration.
- **M6 — Passerelle de Paiement Électronique Konnect :** Initialisation de session de paiement, redirection vers le guichet de paiement sandbox, et confirmation dual-path (webhook asynchrone + vérification manuelle idempotente).
- **M7 — Living Ticket QR & Scanner de Retrait :** QR code dynamique calculé via HMAC-SHA256, actualisé toutes les 30 secondes, et compostage atomique au comptoir par scan caméra ou code à 6 chiffres.
- **M8 — Tableaux de Bord par Rôle :** Dashboards dédiés pour l'Étudiant (économies, repas sauvés, CO₂), le Commerçant (recettes 7j/30j, taux de no-show, top ventes) et l'Admin (GMV consolidé, répartition des comptes).

### 2.3 Description Détaillée des 4 Fonctionnalités Innovantes Bonus (B1 à B4)
- **B1 — Montfleury Holo-Radar 3D WebGL :** Projection cartographique inclinée à 60° sous MapLibre GL, extrudant en 3D les bâtiments du quartier, matérialisant l'ESSECT par un repère néon vert et les boutiques par des prismes hexagonaux dont la hauteur dépend du stock et la couleur reflète l'urgence horaire.
- **B2 — Carte de Fidélité Éco-Digitale (5 Tampons) :** Pass virtuel inspiré d'Apple Wallet. 1 tampon = 20 EcoPoints = 1 repas sauvé. Un cycle de 5 tampons (100 points) génère un coupon `-20%`, tandis que les paliers majeurs (300 et 600 points) offrent un panier surprise 100% gratuit.
- **B3 — Panier Surprise Gacha & Animation Unboxing :** Boîtes mystères avec 3 tiers de rareté (Commun, Rare, Légendaire). À la validation du retrait, une cinématique en 5 étapes (secousse, explosion de particules lumineuses, révélation en cascade des articles et attribution des points) s'exécute avec retour haptique sur mobile.
- **B4 — Magic Offer Publisher IA + Parseur Tunisien :** Moteur d'extraction automatique utilisant l'API Google Gemini, secondé par un parseur de secours déterministe (`fallbackParser`) capable d'interpréter le vocabulaire culinaire tunisien (*makloub, chapati, baguette farcie, ojja, lablabi, kafteji*).

---

## Chapitre 3 : Architecture Technique & Synchronisation Temps Réel

### 3.1 Architecture Monorepo 3-Tiers à Haute Intégrité
Le projet adopte une organisation monorepo garantissant le partage strict des algorithmes métier :
```text
[ Client Web React 18 ]       [ Client Mobile Flutter 3 ]
         │                                  │
         │ (Lecture temps réel onSnapshot)  │ (Lecture temps réel snapshots)
         ▼                                  ▼
 ┌─────────────────────────────────────────────────────────┐
 │               Google Cloud Firestore                    │
 │               Base NoSQL Temps Réel                     │
 └─────────────────────────────────────────────────────────┘
         ▲
         │ (Mutations transactionnelles sécurisées Admin SDK)
         │
 ┌─────────────────────────────────────────────────────────┐
 │           API REST Node.js 20 / Express                 │
 │      Middlewares Auth, Zod Validation, Cryptographie    │
 └─────────────────────────────────────────────────────────┘
         ▲                                  ▲
         │                                  │
 [ Passerelle Konnect ]           [ Cloudinary / IA Gemini ]
```

### 3.2 Le Choix Hybride : Lectures Temps Réel vs Écritures Sécurisées REST
L'une des décisions architecturales les plus déterminantes pour la soutenance réside dans le découpage strict des responsabilités :
- **Lectures Directes dans Firestore :** Les interfaces clientes (React et Flutter) s'abonnent aux flux d'offres, de commandes et de notifications via les écouteurs réactifs (`onSnapshot` en Web, `StreamBuilder` / `snapshots()` en Flutter). Cela garantit une actualisation instantanée sans surcharger le serveur d'appels répétés de sondage (polling).
- **Écritures Exclusivement via l'API REST :** Aucune mutation financière ou modification de stock n'est autorisée directement depuis les clients. Toutes les créations de commande, validations de paiement et scans de Living Ticket passent obligatoirement par l'API Node.js, qui exécute des transactions Firestore atomiques avec le SDK Admin.

### 3.3 Domaine Mathématique & Métier Partagé (`/shared`)
Le module partagé contient la logique pure du projet, écrite en JavaScript ES Modules universel :
- `pricing.js` : Implémente la fonction pure `computeUnitPrice(offer, timestamp)` calculant le prix dégressif au millime près.
- `loyalty.js` : Calcule les 4 grades végétaux (`GRAINE`, `POUSSE`, `ARBRE`, `FORET`) et la distribution des récompenses.
- `impact.js` : Traduit les grammes d'aliments sauvés en CO₂e évité, charges de smartphone et kilomètres de voiture.
- `money.js` : Centralise la conversion monétaire en Dinars Tunisiens (`formatTND`, ex: `3,800 DT`).

---

## Chapitre 4 : Modélisation UML & Conception de la Base de Données NoSQL

### 4.1 Modèle de Données Firestore NoSQL Dénormalisé
Pour garantir des performances de lecture maximales, les documents Firestore intègrent des instantanés dénormalisés :
1. **Collection `users` :** `uid`, `email`, `role`, `displayName`, `filiereId`, `phone`, `ecoPoints`, `totalMoneySavedMillimes`, `totalCo2SavedGrams`.
2. **Collection `merchants` :** `id`, `name`, `phone`, `type`, `status` (`APPROVED`/`PENDING`), `address`, `location` (`lat`, `lng`), `distanceFromEssectM`, `ratingAvg`, `ratingCount`.
3. **Collection `offers` :** `id`, `merchantId`, `title`, `category`, `pricingType` (`FIXED`/`DUTCH`), `originalPriceMillimes`, `targetPriceMillimes`, `quantityAvailable`, `pickupStartAt`, `pickupEndAt`, `isSurpriseBasket`.
4. **Collection `orders` :** `id`, `orderCode` (Crockford Base32 `CS-XXXXX`), `studentId`, `merchantId`, `offerId`, `status` (`RESERVED`, `PAID`, `COMPLETED`, `CANCELLED`), `lockedUnitPriceMillimes`, `reservationExpiresAt`, `ticketNonce`.

### 4.2 Machine à États Finis du Cycle de Vie des Commandes
Le cycle d'une commande suit une machine à états stricte (Diagramme UML 09) :
```text
[ PANIER ] ──▶ (POST /orders) ──▶ [ RESERVED ] (Compte à rebours 10 min)
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
            (Expiration/Annulation)              (Paiement Konnect validé)
                  ▼                                         ▼
            [ CANCELLED ]                             [ PAID ] (Living Ticket actif)
            (Stock restauré)                                │
                                                            ▼
                                                  (Scan QR au comptoir)
                                                            ▼
                                                      [ COMPLETED ]
                                                (Attribution EcoPoints)
```

### 4.3 Sécurité Granulaire Firestore & Transactions Atomiques
Les règles de sécurité Firestore (`firestore.rules`) appliquent le principe du moindre privilège :
- Les documents de la collection `offers` sont consultables publiquement si le commerce est approuvé.
- Les documents `orders` ne sont accessibles en lecture que par l'étudiant acquéreur ou le commerçant vendeur.
- Les écritures clientes directes sont formellement bloquées (`allow write: if false;`), obligeant le passage par l'API REST.

---

## Chapitre 5 : Algorithmes & Mécaniques Intelligentes

### 5.1 Enchère Dégressive Temporelle (Smart Decay) sans Écriture BDD
L'algorithme Smart Decay résout le problème de scalabilité : faire varier le prix de centaines d'offres chaque seconde sans déclencher des millions d'écritures en base de données.
Le prix unitaire à un instant $t$ est déterminé par la formule :
$$P(t) = P_{plancher} + \lfloor (P_{depart} - P_{plancher}) \times \left(1 - \frac{t - t_{start}}{t_{end} - t_{start}}\right)^\gamma \rfloor$$
- Si $t < t_{start}$, $P(t) = P_{depart}$.
- Si $t \ge t_{end}$, $P(t) = P_{plancher}$.
- Le facteur de décroissance $\gamma$ (par défaut 1.0 pour une décroissance linéaire) peut être ajusté pour accentuer la baisse en fin de créneau. Le prix est arrondi au multiple du pas (`stepMillimes`, par défaut 100 millimes).

### 5.2 Cryptographie HMAC-SHA256 du Living Ticket Rotatif (30s)
Pour interdire la revente illicite ou les captures d'écran transmises entre étudiants, le ticket de retrait génère un code QR rotatif :
1. Chaque fenêtre temporelle de 30 secondes correspond à un index entier :
   $$W(t) = \lfloor \frac{t}{30} \rfloor$$
2. Une signature HMAC-SHA256 est calculée sur le payload `{ orderId, window: W(t) }` avec le secret partagé de la commande.
3. Lors du scan, le serveur vérifie la signature pour la fenêtre courante $W(t)$ ainsi qu'avec une tolérance d'horloge de $\pm 1$ fenêtre ($W(t) \pm 1$).
4. La comparaison est exécutée en temps constant (`crypto.timingSafeEqual`) pour prévenir toute attaque par canal auxiliaire (timing attack).
5. En cas de panne de réseau mobile sur le terminal de l'étudiant, un code numérique de secours à 6 chiffres dérivé de la même signature est accepté au comptoir.

### 5.3 Moteur de Rareté Gacha du Panier Surprise
La composition des paniers surprise est régie par un tirage aléatoire pondéré selon trois classes de rareté :
- **Commun (70% des paniers) :** 2 à 3 articles basiques du jour (ex: viennoiseries, sandwichs standard).
- **Rare (25% des paniers) :** 3 à 4 spécialités gourmandes avec un surplus de 10 EcoPoints bonus.
- **Légendaire (5% des paniers) :** Festin complet surprise avec un bonus de 30 EcoPoints.

### 5.4 Parseur d'Offres IA Multimodal Gemini & Fallback Culinaire Tunisien
Le commerçant peut dicter ou taper une phrase en langage naturel. Le module IA extrait les attributs structurés. Si l'API externe est inaccessible, notre parseur déterministe prend le relais grâce à une base de connaissances culinaires tunisiennes :
- Détection des spécialités : *Makloub, Chapati, Baguette farcie, Ojja, Lablabi, Kafteji, Pizza, Viennoiseries*.
- Extraction des horaires par expressions régulières (*"avant 17h30"*, *"fermeture 21h"*).
- Détection des quantités multiples entraînant la création automatique d'un Panier Surprise.

### 5.5 Facteurs d'Équivalences Carbone Officiels FAO 2013 & US EPA
Pour conférer une rigueur académique irréprochable à notre vitrine d'impact public, nous appliquons les coefficients officiels :
- **Ratio d'empreinte carbone alimentaire :** $1\text{ kg de nourriture sauvée} = 2,5\text{ kg de CO}_2\text{e évités}$ (*FAO, Food Wastage Footprint, 2013*).
- **Recharge de smartphone :** $8,22\text{ g de CO}_2\text{ par charge complète}$ (*US EPA Greenhouse Gas Equivalencies Calculator*).
- **Véhicule thermique particulier moyen :** $244\text{ g de CO}_2\text{ par kilomètre urbain}$ (*US EPA*).

---

## Chapitre 6 : Réalisation, Interfaces & Expérience Utilisateur (Web & Mobile)

### 6.1 Design System Dark Obsidian & Electric Lime
La charte graphique a été minutieusement élaborée pour conjuguer modernité technologique et accessibilité :
- **Dark Obsidian (`#0D0F12`) :** Fond sombre profond réduisant la consommation énergétique des écrans OLED des smartphones étudiants.
- **Surface Card (`#161920`) :** Relief subtil pour isoler les composants interactifs.
- **Electric Lime (`#CCFF00`) :** Couleur d'accentuation haute visibilité symbolisant l'énergie verte et l'action positive.
- **Urgent Amber (`#FF5500`) :** Alerte d'urgence pour les créneaux expirant dans moins de 20 minutes.

### 6.2 Parcours Étudiant : Catalogue, Holo-Radar 3D WebGL & Living Ticket
- **Catalogue & Debounce 300 ms :** Recherche instantanée sur le titre, le commerce ou la description sans ralentissement de saisie.
- **Holo-Radar 3D :** Navigation spatiale autour de l'ESSECT permettant de visualiser en un coup d'œil où se situent les meilleures affaires.
- **Boarding Pass Living Ticket :** Billet numérique inspiré des cartes d'embarquement aériennes, avec encoches latérales découpées, horloge en temps réel, QR tournant et pastille animée *LIVE*.

### 6.3 Espace Commerçant : Publication IA, Courbe Smart Decay & Scanner Caméra
- **Onboarding Géolocalisé :** Sélection de l'emplacement précis sur la carte avec validation automatique du rayon campus $\le 3\text{ km}$.
- **Formulaire d'Offres & Visualisation SVG :** Tracé dynamique de la courbe d'enchère dégressive permettant au commerçant d'anticiper l'évolution exacte de ses prix.
- **Scanner Commerçant :** Interface de scan plein écran exploitant la caméra du smartphone ou de la webcam avec confirmation sonore et haptique.

### 6.4 Console d'Administration & Supervision Universitaire
- Tableau de bord décisionnel synthétisant le Volume d'Affaires global (GMV en TND).
- Modération des boutiques partenaires en attente d'approbation avec examen des registres de commerce.
- Supervision des comptes étudiants et commerçants.

### 6.5 Tableaux de Bord par Rôle, Gamification & Défi Inter-Filières
- **Tableau de Bord Étudiant :** Visualisation Recharts de l'accumulation des économies semaine après semaine et bouton de notation 1 à 5 étoiles.
- **Tableau de Bord Commerçant :** Bascule interactive 7j / 30j et palmarès des meilleures ventes.
- **Vitrine Publique d'Impact (`/impact`) :** Page libre d'accès sans compte, affichant le classement des 5 filières de l'ESSECT (*3A E-Business*, *Finance*, *Marketing*, *Gestion*, *Comptabilité*).

---

## Chapitre 7 : Tests, Déploiement & Bilan Qualité

### 7.1 Stratégie de Test Automatisé (Banc de Test 91 Tests Unitaires & Concurrence)
L'ensemble de la logique métier fait l'objet d'une couverture de tests automatisés rigoureuse :
- **Parseur de Secours Tunisien :** 11 tests validant l'extraction dialectale.
- **Authentification & Rôles :** 13 tests vérifiant l'étanchéité des middlewares et schémas Zod.
- **Commerces & Smart Decay :** 25 vecteurs de non-régression validant la formule mathématique.
- **Concurrence Extrême (20 Acheteurs Simultanés) :** Simulation de 20 requêtes concurrentes sur un stock de 5 : exactement 5 succès, 15 rejets 409 et stock final à 0.
- **Cryptographie Living Ticket :** 5 vecteurs officiels cross-runtime testant la tolérance $\pm 1$ fenêtre et le verrouillage après 5 échecs.
- **Total général :** **91/91 tests passés avec succès (0 échec, 0 régression)**.

### 7.2 Audit de Sécurité, Absence de Secrets & Variables d'Environnement
Conformément aux normes professionnelles les plus strictes :
- Zéro secret, token ou mot de passe n'est commité dans l'historique Git (`.gitignore` exhaustif, utilisation exclusive de fichiers `.env.example`).
- Protection contre les injections SQL/NoSQL et validation systématique de toutes les entrées via des schémas Zod stricts.
- En-têtes de sécurité HTTP Helmet et limitation de débit (Rate Limiting).

---

## Conclusion Générale, Limites & Perspectives d'Évolution

Le projet **CampusSave** démontre avec succès la faisabilité technique, l'utilité sociale et la pertinence économique d'une plateforme anti-gaspillage alimentaire dédiée à une communauté universitaire. En combinant des technologies de pointe (React 18, Flutter 3, Node.js 20, Firestore, MapLibre GL 3D, Intelligence Artificielle), notre binôme a livré une solution complète, robuste et immédiatement déployable.

### Perspectives d'Évolution Future :
1. **Paiement NFC sans contact :** Intégration de la validation de retrait par simple contact sans fil entre le smartphone étudiant et le terminal commerçant.
2. **Expansion Inter-Universitaire :** Extension du modèle aux campus universitaires voisins de Tunis (Le Belvédère, La Manouba, El Manar).
3. **Prédiction des Invendus par Machine Learning :** Entraînement d'un modèle prédictif anticipant les surplus des commerçants selon les conditions météorologiques et les calendriers d'examens étudiants.

---

## Bibliographie & Références Scientifiques

1. **Food and Agriculture Organization (FAO)**, *Food Wastage Footprint: Impacts on Natural Resources (Technical Report)*, Rome, Nations Unies, 2013.
2. **United States Environmental Protection Agency (US EPA)**, *Greenhouse Gas Equivalencies Calculator*, Office of Atmospheric Programs, Washington D.C., 2024.
3. **Konnect Network**, *Documentation Officielle de l'API de Paiement en Ligne (Sandbox & Webhooks)*, Tunis, 2026.
4. **Google Firebase**, *Firestore Security Rules & Custom Claims Documentation*, Mountain View, 2026.
5. **MapLibre GL**, *3D Vector Tile Specification & Fill-Extrusion Rendering*, 2026.
6. **React.js & Flutter Documentation**, *Modern State Management & Declarative Routing*, Meta Platforms & Google LLC, 2026.
