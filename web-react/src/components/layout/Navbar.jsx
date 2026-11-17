// 💡 Concept & Analogie : Comme le tableau de bord supérieur d'un navire de croisière, la barre de navigation oriente l'utilisateur et lui permet de changer d'espace en un clin d'œil.
// 🔄 Comparaison React / Flutter : En React, `Navbar` est un composant adaptatif (Desktop/Mobile) avec menu hamburger ; en Flutter, nous combinons `AppBar` et `BottomNavigationBar`.
// 🎯 À retenir pour la soutenance : "La barre intègre un commutateur de rôle 1-clic ultra-rapide pour basculer en direct devant le jury entre Étudiant, Commerçant et Administrateur sans aucune latence."

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
  RefreshCw,
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

  // Fermeture automatique du menu au clic extérieur
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

  // Liens spécifiques au rôle
  const studentLinks = [
    { label: 'Catalogue', path: '/app', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Radar 3D', path: '/app/radar', icon: <MapPin className="w-4 h-4" /> },
    { label: 'Commandes', path: '/app/orders', icon: <Ticket className="w-4 h-4" /> },
    { label: 'Fidélité', path: '/app/loyalty', icon: <Award className="w-4 h-4" /> },
    { label: 'Dashboard', path: '/app/dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const merchantLinks = [
    { label: 'Dashboard', path: '/merchant/dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Mes Offres', path: '/merchant/offers', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: '+ Publier', path: '/merchant/offers/new', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Commandes', path: '/merchant/orders', icon: <Ticket className="w-4 h-4" /> },
    { label: 'Scanner QR', path: '/merchant/scan', icon: <QrCode className="w-4 h-4" /> },
    { label: 'Boutique', path: '/merchant/store', icon: <Store className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Commerces', path: '/admin/merchants', icon: <Store className="w-4 h-4" /> },
    { label: 'Utilisateurs', path: '/admin/users', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  let currentNavLinks = [];
  if (role === ROLES.MERCHANT) currentNavLinks = merchantLinks;
  else if (role === ROLES.ADMIN) currentNavLinks = adminLinks;
  else currentNavLinks = studentLinks;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0D0F12]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Marque */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#CCFF00] to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-[#CCFF00]/10">
              <div className="w-full h-full bg-[#0D0F12] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-[#CCFF00] text-lg">CS</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tight text-white text-base leading-none">
                Campus<span className="text-[#CCFF00]">Save</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">ESSECT Montfleury</span>
            </div>
          </Link>

          {/* Liens de navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {currentNavLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Actions Droite : Impact, Commutateur Rôle Démo, Profil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lien Public Impact Campus */}
          <Link
            to="/impact"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Impact Campus</span>
          </Link>

          {/* Commutateur de Rôle Démo (Jury 1-Clic) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-[#161920] border border-white/15 text-xs font-bold text-slate-200 hover:border-[#CCFF00]/50 flex items-center gap-2 transition-all shadow-sm"
              title="Changer de rôle pour la démonstration"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#CCFF00] animate-spin-slow" />
              <span className="hidden sm:inline text-slate-400">Rôle :</span>
              <span className="text-[#CCFF00] font-black">
                {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#161920] border border-white/15 p-2 shadow-2xl z-50 animate-fadeIn space-y-1 backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-white/10 mb-1">
                  Changer de rôle (Démo Jury)
                </div>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.STUDENT)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                    role === ROLES.STUDENT ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Étudiant (Yassine)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.MERCHANT)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                    role === ROLES.MERCHANT ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Commerçant (Baguette)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch(ROLES.ADMIN)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                    role === ROLES.ADMIN ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Administrateur ESSECT</span>
                </button>
              </div>
            )}
          </div>

          {/* Profil ou Connexion */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                title="Mon Profil"
              >
                <div className="w-7 h-7 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] font-black text-xs">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
                {profile?.ecoPoints !== undefined && role === ROLES.STUDENT && (
                  <span className="hidden sm:inline text-xs font-mono font-bold text-[#CCFF00] pr-1">
                    {profile.ecoPoints} pts
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Déconnexion"
                className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sortir</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl bg-[#CCFF00] text-black font-extrabold text-xs hover:bg-[#b8e600] transition-colors"
            >
              Connexion
            </Link>
          )}

          {/* Bouton Hamburger Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant Mobile (Tablette & Mobile) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0D0F12] border-b border-white/10 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Navigation {role === ROLES.MERCHANT ? 'Commerçant' : role === ROLES.ADMIN ? 'Admin' : 'Étudiant'}</span>
            <button
              type="button"
              onClick={logout}
              className="text-rose-400 text-xs flex items-center gap-1 font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currentNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                  isActive(link.path)
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#161920] text-slate-300 hover:text-white'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          <div className="pt-2">
            <Link
              to="/impact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold"
            >
              <Globe className="w-4 h-4" />
              <span>Voir l'Impact Public Campus ESSECT</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
