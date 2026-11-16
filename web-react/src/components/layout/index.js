// 💡 Concept & Analogie : Comme l'annuaire d'un bâtiment administratif répertoriant chaque aile et couloir d'accès.
// 🔄 Comparaison React / Flutter : Fichier barrel exportant les composants de mise en page pour simplifier les imports dans le routeur.
// 🎯 À retenir pour la soutenance : "Architecture modulaire permettant d'envelopper n'importe quelle vue dans le layout approprié."

export { default as Navbar } from './Navbar.jsx';
export { default as Footer } from './Footer.jsx';
export { default as StudentLayout } from './StudentLayout.jsx';
export { default as MerchantLayout } from './MerchantLayout.jsx';
export { default as AdminLayout } from './AdminLayout.jsx';
