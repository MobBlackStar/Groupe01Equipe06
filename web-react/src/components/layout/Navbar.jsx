// 💡 Concept & Analogie : Comme l'enseigne néon épurée et le comptoir d'accueil d'un restaurant moderne, cette barre de navigation assure une orientation instantanée sans surcharge visuelle.
// 🔄 Comparaison React / Flutter : En React, la navbar est une barre intégrée en pilule douce (#EDE6D7) avec sélecteur direct de rôles ; en Flutter, nous combinons une AppBar stylisée et la navigation basse tactile.
// 🎯 À retenir pour la soutenance : "La barre intègre un commutateur de rôle 1-clic ultra-rapide (Étudiant · Commerçant · Admin) accessible directement pour une démonstration fluide devant le jury."

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
    { label: '+ Publier', path: '/merchant/offers/new', icon: <Sparkles className="w-3.5 h-3.5 text-[#DA0711]" /> },
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
    <header className="sticky top-2 z-40 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="h-16 px-4 sm:px-6 rounded-full bg-[#EDE6D7] border border-[#111111]/8 shadow-[0_4px_24px_rgba(17,17,17,0.06)] flex items-center justify-between gap-3 text-[#111111]">
          
          {/* Logo & Marque Flottante */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-[#DA0711] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-anton uppercase text-lg tracking-wider text-[#111111]">
                    CAMPUS<span className="text-[#DA0711]">SAVE</span>
                  </span>
                  <span className="hidden md:inline-block text-[9px] uppercase font-anton px-2 py-0.5 rounded-full bg-[#FFD000] text-[#111111] tracking-widest">
                    ESSECT
                  </span>
                </div>
                <span className="text-[9px] text-[#666] font-medium tracking-tight">Montfleury · Anti-Gaspi</span>
              </div>
            </Link>

            {/* Séparateur vertical discret */}
            <div className="hidden lg:block h-6 w-px bg-[#111111]/10" />

            {/* Navigation Pills Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {currentNavLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-anton uppercase tracking-wider transition-all ${
                      active
                        ? 'bg-[#DA0711] text-white shadow-sm'
                        : 'text-[#111111] hover:bg-black/5 hover:text-[#DA0711]'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centre / Droite : Segmented 1-Click Role Switcher */}
          <div className="hidden xl:flex items-center p-1 rounded-full bg-[#FAF3E6] border border-[#111111]/8 text-[11px] font-anton uppercase tracking-wider">
            <span className="px-2 text-[10px] text-[#777]">
              Rôle :
            </span>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.STUDENT)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                role === ROLES.STUDENT
                  ? 'bg-[#DA0711] text-white shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
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
                  ? 'bg-[#FFD000] text-[#111111] shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
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
                  ? 'bg-[#15803D] text-white shadow-sm'
                  : 'text-[#111111] hover:bg-black/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Actions Droite : Impact Campus, Menu Démo Compact (si écran moyen), Profil */}
          <div className="flex items-center gap-2">
            {/* Bouton Impact Campus */}
            <Link
              to="/impact"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF3E6] hover:bg-white border border-[#111111]/8 text-xs font-anton uppercase tracking-wider text-[#111111] transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#DA0711]" />
              <span className="hidden md:inline">Impact</span>
            </Link>

            {/* Commutateur Dropdown compact pour les écrans < xl */}
            <div className="relative xl:hidden" ref={menuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-3 py-1.5 rounded-full bg-[#FAF3E6] border border-[#111111]/8 text-xs font-anton uppercase tracking-wider text-[#111111] hover:bg-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#DA0711] animate-pulse" />
                <span className="text-[11px]">
                  {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#111111]" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FAF3E6] border border-[#111111]/10 p-2 shadow-xl z-50 animate-fadeIn space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-anton tracking-widest text-[#777] border-b border-[#111111]/10 mb-1">
                    1-Click Switcher (Jury)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.STUDENT ? 'bg-[#DA0711] text-white' : 'text-[#111111] hover:bg-black/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Étudiant ESSECT</span>
                    </span>
                    {role === ROLES.STUDENT && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.MERCHANT ? 'bg-[#FFD000] text-[#111111]' : 'text-[#111111] hover:bg-black/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5" />
                      <span>Commerçant Montfleury</span>
                    </span>
                    {role === ROLES.MERCHANT && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.ADMIN)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                      role === ROLES.ADMIN ? 'bg-[#15803D] text-white' : 'text-[#111111] hover:bg-black/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Administrateur</span>
                    </span>
                    {role === ROLES.ADMIN && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* EcoPoints si rôle étudiant */}
            {role === ROLES.STUDENT && (
              <Link
                to="/app/loyalty"
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD000] text-[#111111] font-anton text-xs shadow-sm hover:scale-105 transition-transform"
              >
                <span>🪙</span>
                <span>{profile?.ecoPointsBalance || 90} pts</span>
              </Link>
            )}

            {/* Profil / Déconnexion */}
            {user ? (
              <button
                type="button"
                onClick={logout}
                title="Se déconnecter"
                className="w-9 h-9 rounded-full bg-[#FAF3E6] hover:bg-[#DA0711] hover:text-white border border-[#111111]/8 flex items-center justify-center text-[#111111] transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-griddle-primary text-xs py-1.5 px-4"
              >
                Connexion
              </Link>
            )}

            {/* Bouton Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full bg-[#FAF3E6] border border-[#111111]/8 flex items-center justify-center text-[#111111]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl bg-[#EDE6D7] border border-[#111111]/10 shadow-2xl animate-fadeIn space-y-3">
            <nav className="flex flex-col gap-1">
              {currentNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-anton uppercase tracking-wider transition-all ${
                    isActive(link.path)
                      ? 'bg-[#DA0711] text-white shadow-sm'
                      : 'text-[#111111] hover:bg-black/5'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="pt-2 border-t border-[#111111]/10 flex flex-col gap-2">
              <Link
                to="/impact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-anton uppercase text-[#111111]"
              >
                <Globe className="w-4 h-4 text-[#DA0711]" />
                <span>Impact Écologique Campus</span>
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-anton uppercase text-[#DA0711]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
