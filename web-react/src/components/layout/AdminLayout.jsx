// 💡 Concept & Analogie : Comme le pupitre de commandement d'un directeur d'université supervisant les flux et les autorisations.
// 🔄 Comparaison React / Flutter : En React, `AdminLayout` organise les vues d'administration en plein écran avec barre de navigation supérieure ; réservé à l'interface Web pour un confort d'audit optimal.
// 🎯 À retenir pour la soutenance : "Ce layout unifié regroupe la modération des boutiques partenaires et le suivi des comptes étudiants dans une interface sobre et sécurisée."

import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] flex flex-col">
      <Navbar />
      <main className="flex-1 pb-8">{children}</main>
      <Footer />
    </div>
  );
}
