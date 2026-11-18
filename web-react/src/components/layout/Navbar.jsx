// 💡 Concept & Analogie : Comme la capsule de commande suspendue d'un marché nocturne, cette barre de navigation flottante en forme de pilule (floating pill nav) offre une ergonomie moderne et immédiate.
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
    { label: '+ Publier', path: '/merchant/offers/new', icon: <Sparkles className="w-3.5 h-3.5 text-[#F5C400]" /> },
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
        <div className="h-14 sm:h-16 px-3 sm:px-5 rounded-full bg-[#0E0D0C]/90 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Marque Flottante */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#EE3124] to-[#F5C400] p-0.5 flex items-center justify-center shadow-lg shadow-[#EE3124]/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0E0D0C] rounded-full flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#F5C400] group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-oswald uppercase font-black text-white text-base sm:text-lg tracking-wider">
                    Campus<span className="text-[#F5C400]">Save</span>
                  </span>
                  <span className="hidden md:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-[#F6F1E7]/80 tracking-widest">
                    ESSECT
                  </span>
                </div>
                <span className="text-[9px] text-[#F6F1E7]/50 font-sans tracking-tight">Montfleury · Anti-Gaspi</span>
              </div>
            </Link>

            {/* Séparateur vertical discret */}
            <div className="hidden lg:block h-6 w-px bg-white/15" />

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
                        ? 'bg-[#F5C400] text-[#0E0D0C] shadow-md shadow-[#F5C400]/20'
                        : 'text-[#F6F1E7]/80 hover:text-white hover:bg-white/10'
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
          <div className="hidden xl:flex items-center p-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-bold">
            <span className="px-2 text-[10px] uppercase font-mono tracking-widest text-[#F6F1E7]/50">
              Rôle :
            </span>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.STUDENT)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                role === ROLES.STUDENT
                  ? 'bg-[#EE3124] text-white shadow-sm'
                  : 'text-[#F6F1E7]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Étudiant</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                role === ROLES.MERCHANT
                  ? 'bg-[#F5C400] text-[#0E0D0C] shadow-sm font-extrabold'
                  : 'text-[#F6F1E7]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Commerçant</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch(ROLES.ADMIN)}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                role === ROLES.ADMIN
                  ? 'bg-[#2E6F40] text-white shadow-sm'
                  : 'text-[#F6F1E7]/70 hover:text-white hover:bg-white/5'
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#F6F1E7] transition-all hover:border-[#F5C400]/40"
            >
              <Globe className="w-3.5 h-3.5 text-[#F5C400]" />
              <span className="hidden md:inline">Impact</span>
            </Link>

            {/* Commutateur Dropdown compact pour les écrans < xl */}
            <div className="relative xl:hidden" ref={menuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 sm:px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-xs font-bold text-[#F6F1E7] hover:border-[#F5C400]/50 flex items-center gap-1.5 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-[#F5C400] animate-pulse" />
                <span className="text-[11px] font-mono text-[#F5C400] font-black">
                  {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#F6F1E7]/60" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0E0D0C]/95 border border-white/15 p-2 shadow-2xl z-50 animate-fadeIn space-y-1 backdrop-blur-2xl">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-[#F6F1E7]/50 border-b border-white/10 mb-1">
                    1-Click Switcher (Jury)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      role === ROLES.STUDENT ? 'bg-[#EE3124] text-white' : 'text-[#F6F1E7] hover:bg-white/10'
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
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      role === ROLES.MERCHANT ? 'bg-[#F5C400] text-[#0E0D0C] font-extrabold' : 'text-[#F6F1E7] hover:bg-white/10'
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
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      role === ROLES.ADMIN ? 'bg-[#2E6F40] text-white' : 'text-[#F6F1E7] hover:bg-white/10'
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
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#F5C400]/40 transition-all"
                  title="Mon Profil"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#F5C400] to-[#EE3124] flex items-center justify-center text-[#0E0D0C] font-black text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {profile?.ecoPoints !== undefined && role === ROLES.STUDENT && (
                    <span className="hidden sm:inline text-xs font-mono font-bold text-[#F5C400] pr-1">
                      {profile.ecoPoints} <span className="text-[10px] font-sans font-normal text-white/60">pts</span>
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Déconnexion"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-[#F6F1E7]/70 hover:text-[#EE3124] hover:bg-[#EE3124]/10 border border-white/10 hover:border-[#EE3124]/30 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Quitter</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-[#EE3124] text-white font-extrabold text-xs hover:bg-[#d6281c] shadow-lg shadow-[#EE3124]/20 transition-all"
              >
                Connexion
              </Link>
            )}

            {/* Hamburger Button Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full text-[#F6F1E7]/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-3xl bg-[#0E0D0C]/98 border border-white/15 p-4 shadow-2xl backdrop-blur-2xl space-y-3 animate-fadeIn">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#F6F1E7]/50 flex items-center justify-between border-b border-white/10 pb-2">
              <span>Espace {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}</span>
              {user && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-[#EE3124] text-xs flex items-center gap-1 font-bold"
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
                  className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-[#F5C400] text-[#0E0D0C]'
                      : 'bg-white/5 text-[#F6F1E7] hover:bg-white/10'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Sélecteur de rôle 1-clic mobile */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F6F1E7]/50 block mb-2 px-1">
                Changer de rôle (Démo Jury) :
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center ${
                    role === ROLES.STUDENT ? 'bg-[#EE3124] text-white' : 'bg-white/5 text-[#F6F1E7]'
                  }`}
                >
                  Étudiant
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center ${
                    role === ROLES.MERCHANT ? 'bg-[#F5C400] text-[#0E0D0C]' : 'bg-white/5 text-[#F6F1E7]'
                  }`}
                >
                  Commerçant
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.ADMIN)}
                  className={`p-2 rounded-xl text-[11px] font-bold text-center ${
                    role === ROLES.ADMIN ? 'bg-[#2E6F40] text-white' : 'bg-white/5 text-[#F6F1E7]'
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
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[#F5C400] text-xs font-bold"
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
