// 💡 Concept & Analogie : Comme la rangée de boutons d'un comptoir de street-food, la barre basse met les 5 actions clés sous le pouce.
// 🔄 Comparaison React / Flutter : Équivalent React du `BottomNavigationBar` du `Scaffold` Flutter, partagé par les layouts étudiant et commerçant.
// 🎯 À retenir pour la soutenance : "Une seule barre tactile réutilisée, cibles de 48px minimum, état actif en rouge Griddle."

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * @param {{ items: { label: string, path: string, icon: React.ReactNode, match?: (pathname: string) => boolean }[] }} props
 */
export default function MobileTabBar({ items }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF3E6] border-t-2 border-[#111111] px-1 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation rapide"
    >
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-h-[64px] flex flex-col items-center justify-center gap-1 font-semibold uppercase text-[0.8125rem] tracking-wide transition-colors ${
                active ? 'text-[#DA0711]' : 'text-[#111111]'
              }`}
            >
              <span className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${active ? 'bg-[#DA0711] text-white' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
