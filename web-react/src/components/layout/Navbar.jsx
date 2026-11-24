// 💡 Concept & Analogie : Comme l'enseigne néon épurée et le comptoir d'accueil d'un restaurant moderne, cette barre de navigation assure une orientation instantanée sans surcharge visuelle.
// 🔄 Comparaison React / Flutter : En React, la navbar est une barre intégrée en pilule douce (#EDE6D7) avec sélecteur direct de rôles ; en Flutter, nous combinons une AppBar stylisée et la navigation basse tactile.
// 🎯 À retenir pour la soutenance : "La barre intègre un commutateur de rôle 1-clic ultra-rapide (Étudiant · Commerçant · Admin) accessible directement pour une démonstration fluide devant le jury."

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Plus,
  Globe,
  LogOut,
  ChevronDown,
  GraduationCap,
  Store,
  ShieldCheck,
  Check,
  Zap,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '@shared/constants.js';

const STUDENT_LINKS = [
  { label: 'Offres', path: '/app' },
  { label: 'Radar 3D', path: '/app/radar' },
  { label: 'Tickets', path: '/app/orders' },
  { label: 'Fidélité', path: '/app/loyalty' },
  { label: 'Mon bilan', path: '/app/dashboard' },
];

const MERCHANT_LINKS = [
  { label: 'Dashboard', path: '/merchant/dashboard' },
  { label: 'Mes offres', path: '/merchant/offers', exact: true },
  { label: 'Commandes', path: '/merchant/orders' },
  { label: 'Scanner', path: '/merchant/scan' },
  { label: 'Boutique', path: '/merchant/store' },
];

const ADMIN_LINKS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Commerces', path: '/admin/merchants' },
  { label: 'Utilisateurs', path: '/admin/users' },
];

const DEMO_ROLES = [
  { role: ROLES.STUDENT, label: 'Étudiant ESSECT', short: 'Étudiant', icon: GraduationCap },
  { role: ROLES.MERCHANT, label: 'Commerçant Montfleury', short: 'Commerçant', icon: Store },
  { role: ROLES.ADMIN, label: 'Administrateur', short: 'Admin', icon: ShieldCheck },
];

export default function Navbar() {
  const { user, profile, role, authMode, switchToRealMode, switchToDemoMode, logout, loginDemo } = useAuth();
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

  // Ferme le tiroir mobile à chaque changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleRoleSwitch = async (targetRole) => {
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);
    await loginDemo(targetRole);
    if (targetRole === ROLES.STUDENT) navigate('/app/explore');
    else if (targetRole === ROLES.MERCHANT) navigate('/merchant/dashboard');
    else if (targetRole === ROLES.ADMIN) navigate('/admin/dashboard');
  };

  const isActive = (link) => {
    const { pathname } = location;
    if (link.path === '/app') {
      return pathname === '/app' || pathname === '/app/explore' || pathname.startsWith('/app/offers') || pathname.startsWith('/app/checkout');
    }
    if (link.exact) return pathname === link.path || pathname.startsWith(`${link.path}/`) && !pathname.endsWith('/new');
    return pathname.startsWith(link.path);
  };

  let links = STUDENT_LINKS;
  if (role === ROLES.MERCHANT) links = MERCHANT_LINKS;
  else if (role === ROLES.ADMIN) links = ADMIN_LINKS;

  const currentDemo = DEMO_ROLES.find((d) => d.role === role) || DEMO_ROLES[0];
  const rawPoints = Number(profile?.ecoPoints ?? profile?.ecoPointsBalance);
  const ecoPoints = Number.isFinite(rawPoints) ? rawPoints : 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF3E6] border-b-2 border-[#111111]">
      <div className="cs-container h-20 flex items-center justify-between gap-6">
        {/* Wordmark */}
        <Link to="/" className="shrink-0 flex items-baseline gap-2 group" aria-label="CampusSave — accueil">
          <span className="font-title text-[1.75rem] sm:text-[2rem] leading-none tracking-[-0.04em] text-[#DA0711] group-hover:-rotate-2 transition-transform">
            CampusSave
          </span>
          <span className="hidden sm:inline font-sticker text-sm text-[#111111] -rotate-6">ESSECT</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Navigation principale">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3.5 py-2 whitespace-nowrap font-semibold uppercase text-[1.0625rem] tracking-[0.01em] transition-colors ${
                  active ? 'text-[#DA0711]' : 'text-[#111111] hover:text-[#DA0711]'
                }`}
              >
                {link.label}
                <span
                  className={`absolute left-3.5 right-3.5 -bottom-0.5 h-[3px] rounded-full bg-[#DA0711] origin-left transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {role === ROLES.MERCHANT && (
            <Link to="/merchant/offers/new" className="cs-btn cs-btn-red cs-btn-sm hidden md:inline-flex">
              <Plus className="w-4 h-4" strokeWidth={3} />
              Publier
            </Link>
          )}

          {role === ROLES.STUDENT && (
            <Link
              to="/app/loyalty"
              className="hidden md:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#FFD000] border-2 border-[#111111] font-semibold uppercase text-[0.95rem] hover:-translate-y-0.5 transition-transform"
              title="Mes EcoPoints"
            >
              <span className="font-display text-[1.45rem] leading-none tabular-nums">{ecoPoints}</span>
              <span>pts</span>
            </Link>
          )}

          <Link
            to="/impact"
            className="hidden lg:inline-flex items-center gap-1.5 h-10 px-3 font-semibold uppercase text-[0.95rem] hover:text-[#DA0711] transition-colors"
          >
            <Globe className="w-4 h-4" />
            Impact
          </Link>

          {/* Sélecteur de mode : Démo Jury 1-Clic vs Compte Réel */}
          {authMode === 'DEMO' ? (
            <>
              {/* Commutateur de rôle 1-clic (démo jury) */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setDemoMenuOpen((o) => !o)}
                  aria-expanded={demoMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-full border-2 border-[#111111] bg-[#FAF3E6] hover:bg-white font-semibold uppercase text-[0.95rem] transition-colors"
                >
                  <currentDemo.icon className="w-4 h-4 text-[#DA0711]" />
                  <span className="hidden sm:inline font-bold text-xs bg-[#FFD000]/25 px-1.5 py-0.5 rounded border border-[#FFD000]">DÉMO</span>
                  <span className="hidden sm:inline">{currentDemo.short}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${demoMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {demoMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-72 rounded-[1.25rem] bg-[#FAF3E6] border-2 border-[#111111] p-2 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)] z-50 animate-fadeIn"
                  >
                    <p className="cs-label px-3 pt-2 pb-2.5">⚡ Changer de rôle · Démo Jury</p>
                    {DEMO_ROLES.map((d) => {
                      const selected = d.role === role;
                      return (
                        <button
                          key={d.role}
                          role="menuitem"
                          type="button"
                          onClick={() => handleRoleSwitch(d.role)}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left font-semibold uppercase text-base transition-colors ${
                            selected ? 'bg-[#111111] text-[#FAF3E6]' : 'hover:bg-[#EDE6D7]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <d.icon className="w-[18px] h-[18px]" />
                            {d.label}
                          </span>
                          {selected && <Check className="w-[18px] h-[18px] text-[#FFD000]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bouton pour basculer vers un vrai compte */}
              <button
                type="button"
                onClick={async () => {
                  await switchToRealMode();
                  navigate('/login');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border-2 border-[#111111] bg-white hover:bg-[#EDE6D7] font-semibold text-xs uppercase tracking-wider transition-all"
                title="Basculer en Mode Compte Réel pour tester l'inscription ou la connexion"
              >
                <Lock className="w-3.5 h-3.5 text-[#DA0711]" />
                <span>Tester Vrai Compte</span>
              </button>
            </>
          ) : (
            <>
              {/* Badge Compte Réel connecté */}
              <div
                className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-full border-2 border-[#00875A] bg-[#00875A]/10 text-xs font-bold uppercase tracking-wider text-[#00875A]"
                title={user?.email || 'Compte Réel'}
              >
                <span className="w-2 h-2 rounded-full bg-[#00875A] animate-pulse" />
                <span className="truncate max-w-[120px]">{user?.email?.split('@')[0] || 'Utilisateur'}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#111111] text-[#FAF3E6] text-[10px]">
                  {role === ROLES.ADMIN ? 'Admin' : (role === ROLES.MERCHANT ? 'Commerçant' : 'Étudiant')}
                </span>
              </div>

              {/* Bouton pour revenir au Mode Démo 1-Clic Jury */}
              <button
                type="button"
                onClick={async () => {
                  await switchToDemoMode('student');
                  navigate('/app/explore');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border-2 border-[#111111] bg-[#FFD000] hover:bg-[#FFD000]/80 font-bold text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0_#111111]"
                title="Revenir au Mode Démo 1-Clic pour le jury"
              >
                <Zap className="w-3.5 h-3.5 fill-[#111111]" />
                <span>Démo Jury</span>
              </button>
            </>
          )}

          {user ? (
            <button type="button" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter" className="cs-icon-btn hidden sm:inline-flex">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <Link to="/login" className="cs-btn cs-btn-red cs-btn-sm">
              Connexion
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            className="cs-icon-btn xl:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tiroir mobile / tablette */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t-2 border-[#111111] bg-[#FAF3E6] animate-fadeIn">
          <nav className="cs-container py-6 flex flex-col" aria-label="Navigation mobile">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-display uppercase text-[2.75rem] leading-[1.05] py-1 transition-colors ${
                  isActive(link) ? 'text-[#DA0711]' : 'text-[#111111] hover:text-[#DA0711]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/impact" className="font-display uppercase text-[2.75rem] leading-[1.05] py-1 hover:text-[#DA0711]">
              Impact campus
            </Link>

            <div className="mt-6 pt-6 border-t-2 border-[#111111] flex flex-col gap-3">
              {authMode === 'DEMO' ? (
                <>
                  <p className="cs-label">⚡ Mode Démo Jury actif</p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_ROLES.map((d) => (
                      <button
                        key={d.role}
                        type="button"
                        onClick={() => handleRoleSwitch(d.role)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border-2 border-[#111111] ${d.role === role ? 'bg-[#111111] text-[#FAF3E6]' : 'bg-white text-[#111111]'}`}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await switchToRealMode();
                      navigate('/login');
                    }}
                    className="cs-btn cs-btn-cream text-xs"
                  >
                    <Lock className="w-4 h-4 text-[#DA0711]" /> 🔐 Tester un Vrai Compte
                  </button>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase text-[#00875A] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00875A]" />
                    <span>🟢 Compte Réel : {user?.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await switchToDemoMode('student');
                      navigate('/app/explore');
                    }}
                    className="cs-btn cs-btn-mustard text-xs"
                  >
                    <Zap className="w-4 h-4" /> ⚡ Revenir en Démo Jury
                  </button>
                </>
              )}

              {role === ROLES.MERCHANT && (
                <Link to="/merchant/offers/new" className="cs-btn cs-btn-red">
                  <Plus className="w-4 h-4" strokeWidth={3} /> Publier une offre
                </Link>
              )}
              {user && (
                <button type="button" onClick={logout} className="cs-btn cs-btn-cream">
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
