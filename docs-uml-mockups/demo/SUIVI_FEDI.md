# CampusSave — Journal de Suivi & Handoff de Fedi Touati (Partenaire A)

> **Étudiant :** Fedi Touati  
> **Rôle :** Lead Backend, Sécurité & Architecture (Node.js / Express / Firebase Admin)  
> **Binôme :** Ritej Bejaoui (Lead UI/UX & Frontend)  
> **Projet :** CampusSave — Plateforme Anti-Gaspillage & Solidarité Étudiante (ESSECT E-Business 2026)  

---

## 📊 1. Statut d'Avancement Global par Jour

| Jour | Thématique Principale | Statut | Responsable A | Livrables Clés |
| :--- | :--- | :---: | :---: | :--- |
| **Jour 1** | **Fondations, Squelette & Scaffolding** | 🟢 **100% Terminé** | Fedi | Arborescence complète, bootstrap Node.js, `GET /health`, module `shared/`, squelettes React & Flutter |
| **Jour 2** | **Authentification, Profils & Sécurité** | ⏳ *En cours* | Fedi | Middlewares auth/rôles, `POST /auth/register-profile`, règles Firestore, `createAdmin.js` |
| **Jour 3** | **Gestion des Commerces & Publication d'Offres** | ⏳ *À venir* | Fedi | API commerces, upload Cloudinary, moteur de rareté et prix dégressifs |
| **Jour 4** | **Catalogue, Recherche & Moteur de Réservation** | ⏳ *À venir* | Fedi | Algorithme de recherche, réservation avec verrouillage 10 min |
| **Jour 5** | **Paiement Konnect & Ticket Dynamique HMAC** | ⏳ *À venir* | Fedi | Intégration Konnect webhook, génération et vérification QR HMAC-SHA256 |
| **Jour 6** | **Fonctionnalités Bonus : Radar, Surprise & Fidélité** | ⏳ *À venir* | Fedi | API radar géospatial, algorithme d'ouverture de boîte surprise, points fidélité |
| **Jour 7** | **Tableaux de Bord, Impact & Notifications FCM** | ⏳ *À venir* | Fedi | Agrégations statistiques, calculs d'empreinte carbone et notifications push |
| **Jour 8** | **Durcissement, Tests & Déploiement Cloud** | ⏳ *À venir* | Fedi | Tests d'intégration Jest, émulateurs Firebase, déploiement Cloud Run / Functions |
| **Jour 9** | **Rapport Technique & Démonstration** | ⏳ *À venir* | Fedi | Chapitres III, IV, V du rapport, validation globale |
| **Jour 10** | **Répétition de la Soutenance** | ⏳ *À venir* | Fedi | Support de présentation technique, répétition générale |

---

## 🤝 2. Handoffs Reçus de Ritej (Frontend)
- `backend-node/scripts/seed-data/merchants.json` : 6 commerces réels et 24 articles types prêts pour le script d'injection `seed.js`.
- `docs-uml-mockups/mockups/lowfi/` : Wireframes basse fidélité des 3 espaces utilisateurs.
