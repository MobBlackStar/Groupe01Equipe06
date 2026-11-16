# Scénario Déroulé de Démonstration (Soutenance ESSECT 2026) 🎤

> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT Montfleury)  
> **Binôme :** Ritej Bejaoui & Fedi Touati  
> **Format de l'Épreuve :** Démonstration chronométrée de **7 minutes chrono** (suivie de 5 minutes de questions/réponses).  
> **Dispositif Matériel :** 1 Ordinateur Portable (Web React 18 projeté sur grand écran) + 1 Smartphone (Application Mobile Flutter 3).  

---

## ⏱️ Grille de Passage Minute par Minute (7 Minutes Chrono)

| Minute | Intervenant | Rôle & Dispositif | Actions & Parcours Présenté | Ce que Voit le Jury (Effet Démo / Climax) |
| :---: | :--- | :--- | :--- | :--- |
| **00:00 - 01:00** | **Ritej** | Introduction générale (Web PC) | • Accueil chaleureux du jury et accroche : la problématique du gaspillage à Montfleury face au budget étudiant.<br>• Présentation de l'identité de marque **Dark Obsidian & Electric Lime**.<br>• Ouverture directe sur la page publique `/impact` : les compteurs consolidés de l'ESSECT et le podium des 5 filières. | Projection des compteurs géants : 1 680 repas sauvés et équivalences EPA (smartphones et km voiture). |
| **01:00 - 02:00** | **Fedi** | Architecture & Sécurité (Slide / Schéma) | • Synthèse de l'architecture monorepo 3-tiers : Node.js 20, Firestore NoSQL temps réel et module partagé `@shared`.<br>• Justification de la décision d'ingénierie clé : **Lectures temps réel directes vs Écritures strictement centralisées sur l'API REST**.<br>• Présentation rapide de la conformité du modèle de données aux 8 exigences obligatoires (M1 à M8). | Diagramme de déploiement et d'architecture 3-tiers projeté au tableau. |
| **02:00 - 03:15** | **Ritej** | Espace Commerçant & IA (Web PC) | • Clic sur le **commutateur de rôle 1-clic** de la barre de navigation pour passer sur le compte de *Baguette & Baguette Montfleury*.<br>• Démonstration de l'onboarding géolocalisé (validation du rayon $\le$ 3 km).<br>• Démonstration du **Magic Publisher IA** : saisie brute en dialecte tunisien (*"Il me reste 4 baguettes farcies escalope..."*), extraction instantanée et affichage de la courbe d'enchère dégressive **Smart Decay** en SVG.<br>• Publication immédiate de l'offre. | En 3 secondes, l'offre passe de la phrase brute à une offre calibrée avec prix plancher à 3,800 DT ! |
| **03:15 - 04:30** | **Fedi** | Espace Étudiant & Holo-Radar 3D (Mobile Flutter) | • Prise en main du smartphone Flutter sous les yeux du jury.<br>• Lancement du **Holo-Radar 3D** : survol immersif du campus, balises colorées selon l'urgence temporelle.<br>• Sélection de la baguette farcie tout juste publiée par Ritej sur le PC.<br>• Clic sur Réserver : **Le stock sur le PC commerçant passe instantanément de 4 à 3 sans rechargement de page !** | Synchronisation temps réel Firestore instantanée entre le PC et le téléphone devant témoins. |
| **04:30 - 05:30** | **Ritej** | Paiement Konnect & Living Ticket (Mobile Flutter) | • Présentation du compte à rebours de réservation de 10 minutes.<br>• Application d'un bon de réduction de 20% débloqué via la **Carte de Fidélité Éco-Digitale**.<br>• Validation du paiement sur le bac à sable Konnect.<br>• Affichage du **Living Ticket Boarding Pass** : démonstration de la rotation automatique du QR code toutes les 30 secondes et du code manuel à 6 chiffres. | Le jury constate le rafraîchissement automatique de la jauge circulaire de 30 secondes anti-capture. |
| **05:30 - 06:15** | **Binôme (Fedi & Ritej)** | **Le Grand Climax : Scan au Comptoir & Unboxing** | • Ritej (Étudiante) tend son smartphone.<br>• Fedi (Commerçant sur le Web) active le **Scanner Caméra QR** et flashe le billet de Ritej.<br>• Validation atomique instantanée : la commande passe à `COMPLETED` sur les deux écrans.<br>• **Déclenchement automatique de l'Unboxing Framer Motion** sur le téléphone avec vibration haptique et attribution de +20 EcoPoints ! | Double confirmation sonore et cinématique d'éclatement du couvercle de boîte surprise. |
| **06:15 - 07:00** | **Ritej & Fedi** | Analytics, Notations & Conclusion | • Ritej montre la modale de notation 5 étoiles sur la commande clôturée et le nouveau tampon sur la carte de fidélité.<br>• Fedi affiche la console d'administration (`/admin/dashboard`) avec le GMV total consolidé et la modération des commerces.<br>• Mot de clôture et invitation du jury aux questions. | Respect parfait des 7 minutes chrono. |

---

## 💡 Conseils Stratégiques pour le Binôme
1. **Zéro Temps Mort :** Ne rechargez jamais manuellement la page du navigateur ; laissez le websocket Firestore mettre à jour l'écran sous les yeux ébahis du jury.
2. **Répartition de la Parole :** Ritej incarne l'expérience utilisateur, le design system et l'ergonomie ; Fedi explicite la sécurité cryptographique, les transactions atomiques et l'architecture backend.
3. **Plan B Hors-Ligne :** Si la connexion Wi-Fi de la salle flanche, la plateforme bascule automatiquement sur les données de secours locales de Montfleury et le code manuel à 6 chiffres.
