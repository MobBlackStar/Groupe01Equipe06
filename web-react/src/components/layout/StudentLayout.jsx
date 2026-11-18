// 💡 Concept & Analogie : Comme l'écrin complet d'une application native, ce layout enveloppe chaque écran étudiant de la navigation supérieure, de la barre tactile inférieure et du pied de page.
// 🔄 Comparaison React / Flutter : En React, `StudentLayout` utilise un conteneur Flexbox avec une barre basse fixe sur mobile ; en Flutter, c'est l'équivalent du widget `Scaffold` avec `bottomNavigationBar`.
// 🎯 À retenir pour la soutenance : "Ce layout assure une ergonomie responsive sans faille sur fond warm cream #FAF3E6."

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
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
  const { pathname } = useLocation();
  const { refreshProfile } = useAuth();

  // EcoPoints et palier suivent les retraits validés : on relit le profil à chaque changement de page
  useEffect(() => {
    refreshProfile?.();
  }, [pathname, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex flex-col pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
