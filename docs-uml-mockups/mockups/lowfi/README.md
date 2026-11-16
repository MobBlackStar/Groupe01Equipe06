# CampusSave — Wireframes Basse Fidélité (Dossier d'Ergonomie UX) 📐

> **Livrable Académique :** T-D1-B-04  
> **Auteure :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT 2026)  
> **Périmètre :** Wireframes structurants des 3 espaces applicatifs (Étudiant, Commerçant, Administrateur)  

---

## 🎯 1. Philosophie & Principes Ergonomiques

Pour concevoir les interfaces de **CampusSave**, nous avons suivi les principes fondamentaux de l'ergonomie cognitive et du design d'interaction pour le public étudiant et commerçant :

1. **Loi de Fitts & Accessibilité Mobile :**
   - Les boutons d'action clés (*CTA* comme "Réserver 10 min", "Payer" ou "Scanner le QR") sont situés dans la zone naturelle d'atteinte du pouce en bas d'écran.
   - Les cibles tactiles respectent une dimension minimale de 44x44 px pour éviter les clics erronés.

2. **Loi de Hick & Clarté Cognitive :**
   - Réduction du temps de décision grâce à des filtres thématiques par pilules (`Tout`, `Sandwich`, `Plat Chaud`, `Pâtisserie`) et une barre de recherche fluide avec **debounce de 300 ms** (préservant les lectures Firestore gratuites).
   - Les informations critiques sont mises en avant immédiatement : prix barré, nouveau prix en gros caractères lime, distance à pied calculée depuis l'ESSECT et compte à rebours d'urgence.

3. **Technologie de Confiance & Gamification Positive :**
   - **Enchère Dégressive (Smart Decay) :** Visualisation claire de la courbe de baisse de prix par palier horaire.
   - **Living Ticket (Boarding Pass) :** Écran de retrait inspiré des cartes d'embarquement aériennes, avec QR code tournant toutes les 30 secondes pour une sécurité anti-rejeu absolue.
   - **Carte de Fidélité ÉcoPoints :** Jauge de métamorphose naturelle (Graine ➔ Pousse ➔ Arbre ➔ Forêt) et grille de tampons 10 cases motivante.

---

## 📂 2. Répertoire des Wireframes SVG Réalisés

### A. Espace Étudiant (`01-student-wireframes.svg`)
*Fichier vectoriel haute résolution :* [01-student-wireframes.svg](file:///c:/wamp64/www/CampusSave-Workspace/campussave/docs-uml-mockups/mockups/lowfi/01-student-wireframes.svg)

1. **BrowsePage (Catalogue & Recherche) :** Barre de recherche avec temporisateur de frappe, filtre horizontal par catégories, cartes d'offres dynamiques et badges de rareté.
2. **RadarView (Holo-Radar 3D) :** Cartographie circulaire concentrique (500m, 1000m, 1500m) centrée sur l'ESSECT Montfleury avec calcul de temps de marche à pied.
3. **OfferDetailPage (Fiche Offre & Enchère Dégressive) :** Affichage de la courbe prédictive de prix, compte à rebours de prochaine baisse et bouton de réservation avec verrouillage atomique de 10 minutes.
4. **CheckoutPage (Paiement Konnect) :** Décomposition monétaire stricte en millimes entiers, calcul de l'impact écologique immédiat (CO2 évité, grammes sauvés) et redirection sécurisée Konnect Sandbox.
5. **LivingTicketPage (Billet de Retrait Dynamique) :** QR code dynamique tournant avec signature HMAC-SHA256, jauge circulaire de 30 secondes et code de secours manuel à 6 chiffres.
6. **LoyaltyCardPage (Fidélité ÉcoPoints) :** Visualisation des paliers environnementaux et grille de tampons 7/10 débloquant un panier mystère gratuit.
7. **UnboxingReveal (Déballage Panier Surprise) :** Boîte mystère interactive avec effet de rareté lumineuse et révélation détaillée des produits reçus.
8. **ImpactDashboard (Tableau de Bord Étudiant) :** Compteurs de repas sauvés, dinars économisés, équivalents CO2 en kilomètres voiture et classement inter-filières ESSECT.

---

### B. Espace Commerçant Partenaire (`02-merchant-wireframes.svg`)
*Fichier vectoriel haute résolution :* [02-merchant-wireframes.svg](file:///c:/wamp64/www/CampusSave-Workspace/campussave/docs-uml-mockups/mockups/lowfi/02-merchant-wireframes.svg)

1. **MerchantOnboarding :** Formulaire d'adhésion avec placement de repère cartographique et vérification automatique du rayon d'éligibilité ≤ 3 km de l'ESSECT via la formule de Haversine.
2. **PendingApproval :** Bandeau d'attente connecté à un écouteur Firestore temps réel (`onSnapshot`) affichant l'état d'instruction du dossier.
3. **OfferFormPage :** Formulaire de publication d'offre avec bascule Enchère Dégressive / Panier Surprise et assistance magique IA (génération automatique des descriptions et tags selon la gastronomie tunisienne).
4. **MerchantOffers :** Gestionnaire de catalogue avec suivi des stocks restants en direct et bascule d'activation.
5. **QrScanner :** Viseur de caméra pour le scan des billets étudiants et clavier numérique de secours pour saisie du code à 6 chiffres avec protection anti-rejeu.
6. **MerchantDashboard :** Statistiques de chiffre d'affaires, paniers détournés de la poubelle, note moyenne des étudiants et graphique des heures de pointe.

---

### C. Espace Administration & Régulation (`03-admin-wireframes.svg`)
*Fichier vectoriel haute résolution :* [03-admin-wireframes.svg](file:///c:/wamp64/www/CampusSave-Workspace/campussave/docs-uml-mockups/mockups/lowfi/03-admin-wireframes.svg)

1. **AdminDashboard :** Supervision de la santé globale de l'écosystème, volume brut d'économies générées pour les étudiants et suivi de la charge serveur.
2. **AdminMerchants :** Table de filtrage des établissements par statut (`PENDING`, `APPROVED`, `REJECTED`) avec vérification immédiate de la distance piétonne de l'ESSECT.
3. **ApprovalModal :** Modale de décision administrative avec saisie obligatoire d'un motif motivé en cas de refus et notification push instantanée vers le gérant.
4. **AdminUsers :** Gestion des comptes, consultation des filières universitaires, suspension conservatoire et journal immuable des pistes d'audit.

---

## 🎓 3. Argumentaire Clé pour la Soutenance

> "Nos wireframes basse fidélité ont été pensés dès la première phase pour éliminer toute friction utilisateur. Sur le volet étudiant, nous avons privilégié la rapidité d'accès aux offres avec un radar piéton autour de l'ESSECT et un ticket dynamique inspiré des standards aéroportuaires. Sur le volet commerçant, la création d'offres est accélérée par notre module d'IA tandis que la validation au comptoir prend moins de 3 secondes grâce au QR scanner sécurisé."
