// 💡 Concept & Analogie : Comme le comptoir complet d'une boutique avec sa caisse et son arrière-boutique, ce layout rassemble tous les outils de gestion du commerçant.
// 🔄 Comparaison React / Flutter : En React, `MerchantLayout` offre un cadre responsive adapté aux écrans larges et mobiles de comptoir ; en Flutter, c'est `MerchantShell`.
// 🎯 À retenir pour la soutenance : "Accès direct au Scanner QR et à la publication d'offres IA dès le premier clic."

import React from 'react';
import { BarChart3, ShoppingBag, PlusCircle, QrCode, Ticket } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import MobileTabBar from './MobileTabBar.jsx';

const NAV_ITEMS = [
  { label: 'Stats', path: '/merchant/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Offres', path: '/merchant/offers', icon: <ShoppingBag className="w-5 h-5" />, match: (p) => p.startsWith('/merchant/offers') && !p.endsWith('/new') },
  { label: 'Publier', path: '/merchant/offers/new', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'Scanner', path: '/merchant/scan', icon: <QrCode className="w-5 h-5" /> },
  { label: 'Retraits', path: '/merchant/orders', icon: <Ticket className="w-5 h-5" /> },
];

export default function MerchantLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF3E6] text-[#111111] flex flex-col pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
