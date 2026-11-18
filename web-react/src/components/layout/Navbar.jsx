// 💡 Concept & Analogie : Comme la capsule de commande suspendue d'un marché gourmand, cette barre de navigation flottante en forme de pilule offre une ergonomie moderne et tactile.
// 🔄 Comparaison React / Flutter : En React, la navbar est une capsule flottante adaptative avec un commutateur direct de rôles ; en Flutter, nous combinons une AppBar stylisée et la barre basse tactile.
// 🎯 À retenir pour la soutenance : "La barre intègre un commutateur de rôle 1-clic ultra-rapide (Étudiant · Commerçant · Admin) accessible directement pour une démonstration fluide et sans latence devant le jury."

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sparkles,
  ShoppingBag,
  MapPin,
  Ticket,
  Award,
  BarChart3,
  Store,
  QrCode,
  ShieldCheck,
  Globe,
  User,
  LogOut,
  ChevronDown,
  GraduationCap,
  Flame,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';

export default function Navbar() {
  const { user, profile, role, logout, loginDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Fermeture automatique au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDemoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (targetRole) => {
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);
    await loginDemo(targetRole);
    if (targetRole === ROLES.STUDENT) navigate('/app/explore');
    else if (targetRole === ROLES.MERCHANT) navigate('/merchant/dashboard');
    else if (targetRole === ROLES.ADMIN) navigate('/admin/dashboard');
  };

  const isActive = (path) => {
    if (path === '/app' && (location.pathname === '/app' || location.pathname === '/app/explore')) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  // Liens par rôle
  const studentLinks = [
    { label: 'Offres', path: '/app', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { label: 'Radar 3D', path: '/app/radar', icon: <MapPin className="w-3.5 h-3.5" /> },
    { label: 'Tickets', path: '/app/orders', icon: <Ticket className="w-3.5 h-3.5" /> },
    { label: 'Fidélité', path: '/app/loyalty', icon: <Award className="w-3.5 h-3.5" /> },
    { label: 'Stats', path: '/app/dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const merchantLinks = [
    { label: 'Dashboard', path: '/merchant/dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: 'Mes Offres', path: '/merchant/offers', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { label: '+ Publier', path: '/merchant/offers/new', icon: <Sparkles className="w-3.5 h-3.5 text-[#E51C23]" /> },
    { label: 'Commandes', path: '/merchant/orders', icon: <Ticket className="w-3.5 h-3.5" /> },
    { label: 'Scanner', path: '/merchant/scan', icon: <QrCode className="w-3.5 h-3.5" /> },
    { label: 'Boutique', path: '/merchant/store', icon: <Store className="w-3.5 h-3.5" /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: 'Commerces', path: '/admin/merchants', icon: <Store className="w-3.5 h-3.5" /> },
    { label: 'Utilisateurs', path: '/admin/users', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  let currentNavLinks = studentLinks;
  if (role === ROLES.MERCHANT) currentNavLinks = merchantLinks;
  else if (role === ROLES.ADMIN) currentNavLinks = adminLinks;

  return (
    <header className="sticky top-3 z-40 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="h-14 sm:h-16 px-3 sm:px-5 rounded-full bg-[#FAF6EE] border-2 border-[#141210] shadow-[4px_4px_0px_#141210] flex items-center justify-between gap-2 sm:gap-4 text-[#141210]">
          {/* Logo & Marque Flottante */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E51C23] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-anton uppercase font-black text-[#141210] text-base sm:text-lg tracking-wider">
                    Campus<span className="text-[#E51C23]">Save</span>
                  </span>
                  <span className="hidden md:inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-[#FFD000] text-[#141210] border border-[#141210] tracking-widest shadow-[1px_1px_0px_#141210]">
                    ESSECT
                  </span>
                </div>
                <span className="text-[9px] text-[#666] font-bold tracking-tight">Montfleury · Anti-Gaspi</span>
              </div>
            </Link>

            {/* Séparateur vertical discret */}
            <div className="hidden lg:block h-6 w-px bg-[#141210]/20" />

            {/* Navigation Pills Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {currentNavLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#E51C23] text-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210]'
                        : 'text-[#141210] hover:bg-[#F4EFE6] border-2 border-transparent'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centre / Droite : Segmented 1-Click Role Switcher (Etudiant · Commerçant · Admin) */}
          <div className="hidden xl:flex items-center p-1 rounded-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[11px] font-bold">
            <span className="px-2 text-[10px] uppercase font-black tracking-widest text-[#777]">
              Rôle :
            </span>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.STUDENT)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                role === ROLES.STUDENT
                  ? 'bg-[#E51C23] text-white border border-[#141210] shadow-sm font-black'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Étudiant</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                role === ROLES.MERCHANT
                  ? 'bg-[#FFD000] text-[#141210] border border-[#141210] shadow-sm font-black'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Commerçant</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.ADMIN)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                role === ROLES.ADMIN
                  ? 'bg-[#15803D] text-white border border-[#141210] shadow-sm font-black'
                  : 'text-[#141210] hover:bg-[#F4EFE6]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Actions Droite : Impact Campus, Menu Démo Compact (si écran moyen), Profil */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Bouton Impact Campus */}
            <Link
              to="/impact"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F4EFE6] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-xs font-bold text-[#141210] transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#E51C23]" />
              <span className="hidden md:inline">Impact</span>
            </Link>

            {/* Commutateur Dropdown compact pour les écrans < xl */}
            <div className="relative xl:hidden" ref={menuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-xs font-bold text-[#141210] hover:bg-[#F4EFE6] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#E51C23] animate-pulse" />
                <span className="text-[11px] font-black uppercase">
                  {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#141210]" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#FAF6EE] border-2 border-[#141210] p-2 shadow-[6px_6px_0px_#141210] z-50 animate-fadeIn space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-black tracking-widest text-[#777] border-b-2 border-[#141210]/15 mb-1">
                    1-Click Switcher (Jury)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.STUDENT ? 'bg-[#E51C23] text-white border border-[#141210]' : 'text-[#141210] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Étudiant (Yassine)</span>
                    </div>
                    {role === ROLES.STUDENT && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.MERCHANT ? 'bg-[#FFD000] text-[#141210] border border-[#141210] font-black' : 'text-[#141210] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Commerçant (Baguette)</span>
                    </div>
                    {role === ROLES.MERCHANT && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.ADMIN)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.ADMIN ? 'bg-[#15803D] text-white border border-[#141210]' : 'text-[#141210] hover:bg-[#F4EFE6]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin ESSECT</span>
                    </div>
                    {role === ROLES.ADMIN && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Profil Utilisateur / Connexion */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] hover:bg-[#F4EFE6] transition-all"
                  title="Mon Profil"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFD000] border border-[#141210] flex items-center justify-center text-[#141210] font-black text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {profile?.ecoPoints !== undefined && role === ROLES.STUDENT && (
                    <span className="hidden sm:inline text-xs font-mono font-bold text-[#141210] pr-1">
                      {profile.ecoPoints} <span className="text-[10px] font-sans font-normal text-[#666]">pts</span>
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Déconnexion"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-[#141210] hover:bg-[#FEE2E2] hover:text-[#E51C23] border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Quitter</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-[#E51C23] text-white font-black text-xs border-2 border-[#141210] shadow-[3px_3px_0px_#141210] hover:bg-[#d1141b] transition-all"
              >
                Connexion
              </Link>
            )}

            {/* Hamburger Button Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#141210] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-[#FAF6EE] border-2 border-[#141210] p-4 shadow-[6px_6px_0px_#141210] space-y-3 animate-fadeIn text-[#141210]">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#666] flex items-center justify-between border-b-2 border-[#141210]/15 pb-2">
              <span className="font-bold">Espace {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}</span>
              {user && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-[#E51C23] text-xs flex items-center gap-1 font-black cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>

            {/* Liens de l'espace */}
            <div className="grid grid-cols-2 gap-2">
              {currentNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                    isActive(link.path)
                      ? 'bg-[#E51C23] text-white border-[#141210] shadow-[2px_2px_0px_#141210]'
                      : 'bg-white text-[#141210] border-[#141210] hover:bg-[#F4EFE6]'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Sélecteur de rôle 1-clic mobile */}
            <div className="pt-2 border-t-2 border-[#141210]/15">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] block mb-2 px-1 font-bold">
                Changer de rôle (Démo Jury) :
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                  className={`p-2 rounded-lg text-[11px] font-bold text-center border-2 border-[#141210] cursor-pointer ${
                    role === ROLES.STUDENT ? 'bg-[#E51C23] text-white shadow-[2px_2px_0px_#141210]' : 'bg-white text-[#141210]'
                  }`}
                >
                  Étudiant
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
                  className={`p-2 rounded-lg text-[11px] font-bold text-center border-2 border-[#141210] cursor-pointer ${
                    role === ROLES.MERCHANT ? 'bg-[#FFD000] text-[#141210] shadow-[2px_2px_0px_#141210]' : 'bg-white text-[#141210]'
                  }`}
                >
                  Commerçant
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.ADMIN)}
                  className={`p-2 rounded-lg text-[11px] font-bold text-center border-2 border-[#141210] cursor-pointer ${
                    role === ROLES.ADMIN ? 'bg-[#15803D] text-white shadow-[2px_2px_0px_#141210]' : 'bg-white text-[#141210]'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Lien Impact */}
            <Link
              to="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border-2 border-[#141210] shadow-[2px_2px_0px_#141210] text-[#E51C23] text-xs font-black uppercase"
            >
              <Globe className="w-4 h-4" />
              <span>Voir l'Impact Public Campus</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
