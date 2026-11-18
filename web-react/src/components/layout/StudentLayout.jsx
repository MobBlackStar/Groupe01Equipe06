// 💡 Concept & Analogie : Comme l'écrin complet d'une application native, ce layout enveloppe chaque écran étudiant de la navigation supérieure, de la barre tactile inférieure et du pied de page.
// 🔄 Comparaison React / Flutter : En React, `StudentLayout` utilise un conteneur Flexbox avec une barre basse fixe sur mobile ; en Flutter, c'est l'équivalent du widget `Scaffold` avec `bottomNavigationBar`.
// 🎯 À retenir pour la soutenance : "Ce layout assure une ergonomie responsive sans faille sur fond warm cream #F4EFE6."

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, Ticket, Award, BarChart3 } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function StudentLayout({ children }) {
  const location = useLocation();

  const isCurrent = (path) => {
    if (path === '/app' && (location.pathname === '/app' || location.pathname === '/app/explore')) return true;
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Explorer', path: '/app', icon: <ShoppingBag className="w-5 h-5" /> },
    { label: 'Radar 3D', path: '/app/radar', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Commandes', path: '/app/orders', icon: <Ticket className="w-5 h-5" /> },
    { label: 'Fidélité', path: '/app/loyalty', icon: <Award className="w-5 h-5" /> },
    { label: 'Dashboard', path: '/app/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#141210] flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-8">{children}</main>
      <Footer />

      {/* Barre de navigation basse tactile (Mobile 360px - 768px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE] border-t-2 border-[#141210] px-2 py-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(20,18,16,0.1)]">
        {navItems.map((item) => {
          const active = isCurrent(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                active ? 'text-[#E51C23] font-black' : 'text-[#777] hover:text-[#141210]'
              }`}
            >
              <div className={active ? 'scale-110 transition-transform' : ''}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
