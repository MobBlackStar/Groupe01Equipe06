// 💡 Concept & Analogie : Comme le comptoir complet d'une boutique avec sa caisse et son arrière-boutique, ce layout rassemble tous les outils de gestion du commerçant.
// 🔄 Comparaison React / Flutter : En React, `MerchantLayout` offre un cadre responsive adapté aux écrans larges et mobiles de comptoir ; en Flutter, c'est `MerchantShell`.
// 🎯 À retenir pour la soutenance : "Accès direct au Scanner QR et à la publication d'offres IA dès le premier clic."

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ShoppingBag, PlusCircle, QrCode, Ticket } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function MerchantLayout({ children }) {
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  const merchantItems = [
    { label: 'Stats', path: '/merchant/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Offres', path: '/merchant/offers', icon: <ShoppingBag className="w-5 h-5" /> },
    { label: '+ Publier', path: '/merchant/offers/new', icon: <PlusCircle className="w-5 h-5" /> },
    { label: 'Scanner', path: '/merchant/scan', icon: <QrCode className="w-5 h-5" /> },
    { label: 'Retraits', path: '/merchant/orders', icon: <Ticket className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-8">{children}</main>
      <Footer />

      {/* Barre basse mobile commerçant */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EDE6D7]/95 backdrop-blur-md border-t border-[#111111]/8 px-2 py-2 flex items-center justify-around shadow-lg">
        {merchantItems.map((item) => {
          const active = isCurrent(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-full transition-all ${
                active ? 'text-[#DA0711] font-bold' : 'text-[#666] hover:text-[#111111]'
              }`}
            >
              <div className={active ? 'scale-110 transition-transform text-[#DA0711]' : ''}>
                {item.icon}
              </div>
              <span className="text-[10px] font-anton uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
