// 💡 Concept & Analogie : Comme l'écrin complet d'une application native, ce layout enveloppe chaque écran étudiant de la navigation supérieure, de la barre tactile inférieure et du pied de page.
// 🔄 Comparaison React / Flutter : En React, `StudentLayout` utilise un conteneur Flexbox avec une barre basse fixe sur mobile ; en Flutter, c'est l'équivalent du widget `Scaffold` avec `bottomNavigationBar`.
// 🎯 À retenir pour la soutenance : "Ce layout assure une ergonomie responsive sans faille sur fond warm cream #FAF3E6."

import React from 'react';
import { ShoppingBag, MapPin, Ticket, Award, BarChart3 } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import MobileTabBar from './MobileTabBar.jsx';

const isExplore = (p) => p === '/app' || p === '/app/explore' || p.startsWith('/app/offers') || p.startsWith('/app/checkout');

const NAV_ITEMS = [
  { label: 'Offres', path: '/app/explore', icon: <ShoppingBag className="w-5 h-5" />, match: isExplore },
  { label: 'Radar', path: '/app/radar', icon: <MapPin className="w-5 h-5" /> },
  { label: 'Tickets', path: '/app/orders', icon: <Ticket className="w-5 h-5" /> },
  { label: 'Fidélité', path: '/app/loyalty', icon: <Award className="w-5 h-5" /> },
  { label: 'Bilan', path: '/app/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
];

export default function StudentLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex flex-col">
      <Navbar />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      <Footer />
      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
