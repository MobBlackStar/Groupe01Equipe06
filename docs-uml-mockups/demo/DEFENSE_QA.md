# Fiche de Préparation aux Questions du Jury (Q&A Soutenance) 🎯

Ce document recense les questions d'approfondissement technique potentielles posées par le jury d'évaluation ESSECT et les réponses argumentées.

---

### Q1 : Pourquoi avoir interdit les écritures directes dans Firestore depuis React et Flutter ?
**Réponse :**  
"Dans une application e-commerce impliquant de l'argent et des stocks limités, autoriser les écritures clientes directes expose la base à des modifications arbitraires ou des contournements de règles métier. En centralisant toutes les mutations dans l'API Node.js avec le SDK Firebase Admin, nous garantissons l'exécution de transactions atomiques, la validation Zod stricte et la vérification cryptographique des stocks et paiements."

---

### Q2 : Comment évitez-vous qu'un étudiant achète une offre avec un ticket réutilisé ou une capture d'écran ?
**Réponse :**  
"Nous avons développé un ticket dynamique cryptographique. Le QR code change toutes les 30 secondes en signant un message horodaté avec HMAC-SHA256 via une clé dérivée unique. Lors du scan, le serveur vérifie la signature en temps constant (`timingSafeEqual`) et n'accepte que la fenêtre courante ± 30 secondes. Dès qu'un ticket est validé, son statut bascule définitivement à `COMPLETED` dans une transaction Firestore, rendant tout scan ultérieur impossible."

---

### Q3 : Pourquoi avoir utilisé des entiers en millimes plutôt que des nombres à virgule flottante pour les prix ?
**Réponse :**  
"En informatique, la représentation binaire des nombres à virgule flottante (norme IEEE 754) génère des imprécisions arithmétiques bien connues (ex: 0.1 + 0.2 = 0.30000000000000004). Dans un système financier manipulant le Dinar Tunisien qui se divise en 1000 millimes, compter exclusivement en millimes entiers élimine définitivement tout risque d'erreur d'arrondi dans les transactions et les bases de données."
