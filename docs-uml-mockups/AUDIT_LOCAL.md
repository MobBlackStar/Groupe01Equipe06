# Audit local : ce qui a été trouvé et corrigé

Branche locale `local-audit-polish` (jamais poussée). Tests : backend 121/121, shared 39/39, Flutter 17 (+2 ignorés, serveur requis), `qa:sweep` 169/169, build Vite OK, `flutter analyze` propre.

## Pourquoi certaines choses échouent « en vrai » alors que les tests passent

Les tests et le `qa:sweep` tournent sur le Firestore **en mémoire**, plus tolérant que le vrai Firestore.

| Cause | Effet sur le vrai Firestore | Correction |
|---|---|---|
| Champ `undefined` dans un `set()` / `update()` | Exception « Cannot use undefined as a Firestore value » | `ignoreUndefinedProperties: true` dans `config/firebase.js` |
| `resetDemo` supprimait toutes les commandes dans un seul batch | Échec au-delà de 500 documents (reset impossible après une longue répétition) | Suppression par lots de 400 |
| Économies hebdomadaires lues dans `pricing.moneySavedMillimes` alors que les commandes écrivent `pricing.savedMillimes` | Toujours 0 | Lecture du bon champ |
| Historique d'économies fabriqué (pourcentages fixes, repli à 46,5 DT) | Courbe inventée | Cumuls hebdomadaires calculés sur les vraies commandes |
| Top offres avec ventes plancher à 2 et prix de repli 4,2 DT | Chiffres inventés | Ventes réelles, offres jamais vendues exclues |
| APK de production sans `--dart-define` visait `localhost` | Toutes les requêtes échouaient sur le téléphone | Les builds *release* visent `https://campussave.onrender.com/api/v1` par défaut |

## Application mobile

- Bilan étudiant et Bilan commerçant étaient codés en dur : ils lisent maintenant `/dashboards/student` et `/dashboards/merchant`. La notation d'une commande terminée appelle réellement `POST /orders/:id/rating`.
- Modification d'une offre (champs modifiés uniquement, prix verrouillé par le serveur après réservation), en plus de l'ajout et de la suppression.
- Un seul `Timer` partagé pour tous les prix et décomptes (au lieu de deux par carte), décompte sur l'horloge serveur, cartes isolées par `RepaintBoundary`.
- Images décodées à la bonne taille avec fondu, squelettes de chargement, transition de page avec retour par balayage, clavier masqué au défilement.
- Onglet « Commandes » renommé « Retraits » (le libellé était tronqué sur 360 px) ; axes des graphiques sans chevauchement.

## Site web

- Barre de navigation : une action principale + un seul menu de compte (rôles démo, vrai compte, déconnexion) au lieu de cinq boutons côte à côte ; plus de texte sur trois lignes.

## Limites connues

- Vérifié sur le backend en mémoire, pas sur le Firebase réel : les corrections Firestore ci-dessus sont déduites du code et non rejouées en production.
- Les recettes du Bilan commerçant viennent des agrégats journaliers (`merchants/{id}/daily`) : sur le backend en mémoire ils sont vides, donc 0 DT ; avec le seed Firestore ils sont remplis.
- Le widget flottant « APK Android » du site peut recouvrir le coin bas-droit de certaines pages ; il se ferme avec la croix.
